use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

use crate::graph_client::{GraphClient, MailFoldersResponse};

#[derive(Debug, Serialize)]
pub struct InboxFolderResponse {
    pub folder: crate::graph_client::MailFolder,
    pub messages: Vec<crate::graph_client::GraphMessage>,
}

pub async fn list_folders_handler(
    query: web::Query<crate::InboxApiQuery>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let token_id = &query.token_id;

    let token = match crate::retrieve_any_token(&state, token_id).await {
        Ok(t) => t,
        Err(_) => return HttpResponse::NotFound().json(serde_json::json!({"error": "token_not_found"})),
    };

    let access_token = match crate::refresh_access_token(&state, &token.refresh_token).await {
        Some(t) => t,
        None => token.access_token,
    };

    let client = GraphClient::new();

    let folders = match client.get_mail_folders(&access_token, "me").await {
        Ok(f) => f.value,
        Err(e) => {
            eprintln!("[inbox] Failed to fetch folders: {}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({"error": "graph_api_failed"}));
        }
    };

    HttpResponse::Ok().json(MailFoldersResponse { value: folders, next_link: None })
}

pub async fn folder_messages_handler(
    query: web::Query<crate::InboxApiQuery>,
    path: web::Path<String>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let token_id = &query.token_id;
    let folder_id = path.into_inner();

    let token = match crate::retrieve_any_token(&state, token_id).await {
        Ok(t) => t,
        Err(_) => return HttpResponse::NotFound().json(serde_json::json!({"error": "token_not_found"})),
    };

    let access_token = match crate::refresh_access_token(&state, &token.refresh_token).await {
        Some(t) => t,
        None => token.access_token,
    };

    let client = GraphClient::new();

    let messages = match client.get_folder_messages(&access_token, &folder_id, 50).await {
        Ok(m) => m.value,
        Err(e) => {
            eprintln!("[inbox] Failed to fetch folder messages: {}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({"error": "graph_api_failed"}));
        }
    };

    HttpResponse::Ok().json(crate::graph_client::InboxResponse { value: messages, next_link: None })
}

#[derive(Debug, Deserialize)]
pub struct CreateFolderRequest {
    pub display_name: String,
}

pub async fn create_folder_handler(
    query: web::Query<crate::InboxApiQuery>,
    body: web::Json<CreateFolderRequest>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let token_id = &query.token_id;
    let token = match crate::retrieve_any_token(&state, token_id).await {
        Ok(t) => t,
        Err(_) => return HttpResponse::NotFound().json(serde_json::json!({"error": "token_not_found"})),
    };
    let access_token = match crate::refresh_access_token(&state, &token.refresh_token).await {
        Some(t) => t,
        None => token.access_token,
    };
    let client = GraphClient::new();
    match client.create_mail_folder(&access_token, &body.display_name).await {
        Ok(folder) => HttpResponse::Ok().json(folder),
        Err(e) => {
            eprintln!("[inbox] Failed to create folder: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "graph_api_failed"}))
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct SendMailRequest {
    pub subject: String,
    pub body: String,
    pub to: Vec<String>,
    pub content_type: Option<String>,
}

pub async fn send_mail_handler(
    query: web::Query<crate::InboxApiQuery>,
    body: web::Json<SendMailRequest>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let token_id = &query.token_id;
    let token = match crate::retrieve_any_token(&state, token_id).await {
        Ok(t) => t,
        Err(_) => return HttpResponse::NotFound().json(serde_json::json!({"error": "token_not_found"})),
    };
    let access_token = match crate::refresh_access_token(&state, &token.refresh_token).await {
        Some(t) => t,
        None => token.access_token,
    };

    let recipients: Vec<serde_json::Value> = body.to.iter().map(|email| serde_json::json!({
        "emailAddress": { "address": email }
    })).collect();

    let payload = serde_json::json!({
        "message": {
            "subject": body.subject,
            "body": {
                "contentType": body.content_type.as_deref().unwrap_or("HTML"),
                "content": body.body,
            },
            "toRecipients": recipients,
        },
        "saveToSentItems": true,
    });

    let client = GraphClient::new();
    match client.send_mail(&access_token, payload).await {
        Ok(()) => HttpResponse::Ok().json(serde_json::json!({"success": true})),
        Err(e) => {
            eprintln!("[inbox] Failed to send mail: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "send_failed", "message": format!("{}", e)}))
        }
    }
}

pub async fn delete_message_handler(
    query: web::Query<crate::InboxApiQuery>,
    path: web::Path<String>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let token_id = &query.token_id;
    let message_id = path.into_inner();
    let token = match crate::retrieve_any_token(&state, token_id).await {
        Ok(t) => t,
        Err(_) => return HttpResponse::NotFound().json(serde_json::json!({"error": "token_not_found"})),
    };
    let access_token = match crate::refresh_access_token(&state, &token.refresh_token).await {
        Some(t) => t,
        None => token.access_token,
    };
    let client = GraphClient::new();
    match client.delete_message(&access_token, &message_id).await {
        Ok(()) => HttpResponse::Ok().json(serde_json::json!({"success": true})),
        Err(e) => {
            eprintln!("[inbox] Failed to delete message: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "delete_failed", "message": format!("{}", e)}))
        }
    }
}
