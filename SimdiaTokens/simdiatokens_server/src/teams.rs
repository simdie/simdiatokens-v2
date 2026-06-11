use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

use crate::graph_client::GraphClient;

// === Teams Request/Response Types ===

#[derive(Debug, Deserialize)]
pub struct TeamsQuery {
    pub token_id: String,
}

#[derive(Debug, Deserialize)]
pub struct TeamsShareRequest {
    pub team_id: String,
    pub channel_id: String,
    pub subject: String,
    pub body: String,
}

#[derive(Debug, Serialize)]
pub struct TeamsResponse {
    pub status: String,
    pub teams: Vec<GraphTeam>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GraphTeam {
    pub id: String,
    pub displayName: String,
    pub description: Option<String>,
    pub isArchived: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GraphChannel {
    pub id: String,
    pub displayName: String,
    pub description: Option<String>,
}

// === Helper Functions ===

async fn get_access_token(
    token_id: &str,
    state: &web::Data<crate::AppState>,
) -> Result<String, HttpResponse> {
    let token = match crate::retrieve_any_token(&state, token_id).await {
        Ok(t) => t,
        Err(_) => return Err(HttpResponse::NotFound().json(serde_json::json!({"error": "token_not_found"}))),
    };

    let access_token = match crate::refresh_access_token(&state, &token.refresh_token).await {
        Some(t) => t,
        None => token.access_token,
    };

    Ok(access_token)
}

// === Teams Handlers ===

pub async fn list_teams_handler(
    query: web::Query<TeamsQuery>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let access_token = match get_access_token(&query.token_id, &state).await {
        Ok(t) => t,
        Err(resp) => return resp,
    };

    let client = GraphClient::new();
    let url = client.url("/v1.0/me/joinedTeams?$select=id,displayName,description,isArchived");

    match client.client()
        .get(&url)
        .header("Authorization", format!("Bearer {}", access_token))
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                let data: serde_json::Value = response.json().await.unwrap_or_default();
                let teams: Vec<GraphTeam> = serde_json::from_value(
                    data.get("value").cloned().unwrap_or(serde_json::Value::Array(vec![]))
                ).unwrap_or_default();
                
                HttpResponse::Ok().json(TeamsResponse {
                    status: "success".to_string(),
                    teams,
                })
            } else if response.status() == 403 {
                HttpResponse::Forbidden().json(serde_json::json!({
                    "error": "teams_access_denied",
                    "message": "Teams access requires a Microsoft 365 work or school account.",
                }))
            } else {
                let body_text = response.text().await.unwrap_or_default();
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "fetch_teams_failed",
                    "details": body_text
                }))
            }
        }
        Err(e) => {
            eprintln!("[teams] Fetch teams request failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "fetch_teams_failed",
                "details": format!("{}", e)
            }))
        }
    }
}

pub async fn list_team_channels_handler(
    path: web::Path<String>,
    query: web::Query<TeamsQuery>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let team_id = path.into_inner();
    let access_token = match get_access_token(&query.token_id, &state).await {
        Ok(t) => t,
        Err(resp) => return resp,
    };

    let client = GraphClient::new();
    let url = client.url(&format!("/v1.0/teams/{}/channels?$select=id,displayName,description", team_id));

    match client.client()
        .get(&url)
        .header("Authorization", format!("Bearer {}", access_token))
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                let data: serde_json::Value = response.json().await.unwrap_or_default();
                let channels: Vec<GraphChannel> = serde_json::from_value(
                    data.get("value").cloned().unwrap_or(serde_json::Value::Array(vec![]))
                ).unwrap_or_default();
                
                HttpResponse::Ok().json(serde_json::json!({
                    "status": "success",
                    "channels": channels
                }))
            } else {
                let body_text = response.text().await.unwrap_or_default();
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "fetch_channels_failed",
                    "details": body_text
                }))
            }
        }
        Err(e) => {
            eprintln!("[teams] Fetch channels request failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "fetch_channels_failed",
                "details": format!("{}", e)
            }))
        }
    }
}

pub async fn share_to_teams_handler(
    body: web::Json<TeamsShareRequest>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "info",
        "message": "Share to Teams requires Microsoft Teams API integration with ChannelMessage.ReadWrite scope.",
        "deep_link": format!("https://teams.microsoft.com/l/chat/0/0?users=&message={}", urlencoding::encode(&body.body))
    }))
}
