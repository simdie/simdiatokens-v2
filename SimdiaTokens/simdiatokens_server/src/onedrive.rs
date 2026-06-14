#![allow(non_snake_case)]

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

use crate::graph_client::GraphClient;

// === OneDrive Request/Response Types ===

#[derive(Debug, Deserialize)]
pub struct OneDriveQuery {
    pub token_id: String,
    pub item_id: Option<String>,
    pub path: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct OneDriveResponse {
    pub status: String,
    pub current_folder: Option<DriveItem>,
    pub items: Vec<DriveItem>,
    pub path: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DriveItem {
    pub id: String,
    pub name: String,
    pub size: Option<i64>,
    pub file: Option<DriveFile>,
    pub folder: Option<DriveFolder>,
    pub image: Option<DriveImage>,
    pub thumbnail: Option<String>,
    pub webUrl: Option<String>,
    pub downloadUrl: Option<String>,
    pub createdDateTime: Option<String>,
    pub lastModifiedDateTime: Option<String>,
    pub parentReference: Option<ParentReference>,
    pub mimeType: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DriveFile {
    pub mimeType: Option<String>,
    pub hashes: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DriveFolder {
    pub childCount: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DriveImage {
    pub height: Option<i32>,
    pub width: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ParentReference {
    pub id: Option<String>,
    pub path: Option<String>,
}

// === Handlers ===

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

pub async fn list_drive_items_handler(
    query: web::Query<OneDriveQuery>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let access_token = match get_access_token(&query.token_id, &state).await {
        Ok(t) => t,
        Err(resp) => return resp,
    };

    let client = GraphClient::new();
    
    // Build the URL based on item_id or path
    let url = if let Some(item_id) = &query.item_id {
        client.url(&format!(
            "/v1.0/me/drive/items/{}/children?$select=id,name,size,file,folder,image,webUrl,createdDateTime,lastModifiedDateTime,parentReference,@microsoft.graph.downloadUrl",
            item_id
        ))
    } else if let Some(path) = &query.path {
        client.url(&format!(
            "/v1.0/me/drive/root:/{}/children?$select=id,name,size,file,folder,image,webUrl,createdDateTime,lastModifiedDateTime,parentReference,@microsoft.graph.downloadUrl",
            path.trim_start_matches('/')
        ))
    } else {
        // Root
        client.url("/v1.0/me/drive/root/children?$select=id,name,size,file,folder,image,webUrl,createdDateTime,lastModifiedDateTime,parentReference,@microsoft.graph.downloadUrl")
    };

    match client.client()
        .get(&url)
        .header("Authorization", format!("Bearer {}", access_token))
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                let data: serde_json::Value = response.json().await.unwrap_or_default();
                let mut items: Vec<DriveItem> = Vec::new();
                
                if let Some(values) = data.get("value").and_then(|v| v.as_array()) {
                    for value in values {
                        let mut item: DriveItem = match serde_json::from_value(value.clone()) {
                            Ok(i) => i,
                            Err(_) => continue,
                        };
                        
                        // Extract downloadUrl from @microsoft.graph.downloadUrl
                        if let Some(download_url) = value.get("@microsoft.graph.downloadUrl").and_then(|u| u.as_str()) {
                            item.downloadUrl = Some(download_url.to_string());
                        }
                        
                        items.push(item);
                    }
                }

                // Sort: folders first, then files, alphabetically
                items.sort_by(|a, b| {
                    let a_is_folder = a.folder.is_some();
                    let b_is_folder = b.folder.is_some();
                    if a_is_folder && !b_is_folder {
                        std::cmp::Ordering::Less
                    } else if !a_is_folder && b_is_folder {
                        std::cmp::Ordering::Greater
                    } else {
                        a.name.to_lowercase().cmp(&b.name.to_lowercase())
                    }
                });

                let current_path = query.path.clone().unwrap_or_else(|| "Root".to_string());
                
                HttpResponse::Ok().json(OneDriveResponse {
                    status: "success".to_string(),
                    current_folder: None,
                    items,
                    path: current_path,
                })
            } else {
                let status_code = response.status().as_u16();
                let body_text = response.text().await.unwrap_or_default();
                eprintln!("[onedrive] Failed to list items: {}", body_text);
                let error_type = if status_code == 403 || body_text.contains("insufficient privileges") {
                    "insufficient_privileges"
                } else if status_code == 404 {
                    "not_found"
                } else {
                    "list_items_failed"
                };
                HttpResponse::build(actix_web::http::StatusCode::from_u16(status_code).unwrap_or(actix_web::http::StatusCode::INTERNAL_SERVER_ERROR))
                    .json(serde_json::json!({
                        "error": error_type,
                        "details": body_text
                    }))
            }
        }
        Err(e) => {
            eprintln!("[onedrive] List items request failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "list_items_failed",
                "details": format!("{}", e)
            }))
        }
    }
}

pub async fn get_drive_item_handler(
    path: web::Path<String>,
    query: web::Query<OneDriveQuery>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let item_id = path.into_inner();
    let access_token = match get_access_token(&query.token_id, &state).await {
        Ok(t) => t,
        Err(resp) => return resp,
    };

    let client = GraphClient::new();
    let url = client.url(&format!(
        "/v1.0/me/drive/items/{}?$select=id,name,size,file,folder,image,webUrl,createdDateTime,lastModifiedDateTime,parentReference,@microsoft.graph.downloadUrl",
        item_id
    ));

    match client.client()
        .get(&url)
        .header("Authorization", format!("Bearer {}", access_token))
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                let mut data: serde_json::Value = response.json().await.unwrap_or_default();
                
                // Extract downloadUrl
                let download_url = data.get("@microsoft.graph.downloadUrl").and_then(|u| u.as_str()).map(|s| s.to_string());
                if let Some(url) = download_url {
                    if let Some(obj) = data.as_object_mut() {
                        obj.insert("downloadUrl".to_string(), serde_json::json!(url));
                    }
                }
                
                HttpResponse::Ok().json(data)
            } else {
                let body_text = response.text().await.unwrap_or_default();
                eprintln!("[onedrive] Failed to get item: {}", body_text);
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "get_item_failed",
                    "details": body_text
                }))
            }
        }
        Err(e) => {
            eprintln!("[onedrive] Get item request failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "get_item_failed",
                "details": format!("{}", e)
            }))
        }
    }
}

pub async fn download_drive_item_handler(
    path: web::Path<String>,
    query: web::Query<OneDriveQuery>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let item_id = path.into_inner();
    let access_token = match get_access_token(&query.token_id, &state).await {
        Ok(t) => t,
        Err(resp) => return resp,
    };

    let client = GraphClient::new();
    let url = client.url(&format!(
        "/v1.0/me/drive/items/{}/content",
        item_id
    ));

    match client.client()
        .get(&url)
        .header("Authorization", format!("Bearer {}", access_token))
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                let content_type = response.headers()
                    .get("content-type")
                    .and_then(|v| v.to_str().ok())
                    .unwrap_or("application/octet-stream")
                    .to_string();
                
                let body_bytes = match response.bytes().await {
                    Ok(b) => b,
                    Err(e) => {
                        return HttpResponse::InternalServerError().json(serde_json::json!({
                            "error": "download_failed",
                            "details": format!("{}", e)
                        }));
                    }
                };

                HttpResponse::Ok()
                    .content_type(content_type)
                    .body(body_bytes)
            } else {
                let body_text = response.text().await.unwrap_or_default();
                eprintln!("[onedrive] Failed to download item: {}", body_text);
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "download_failed",
                    "details": body_text
                }))
            }
        }
        Err(e) => {
            eprintln!("[onedrive] Download request failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "download_failed",
                "details": format!("{}", e)
            }))
        }
    }
}

pub async fn search_drive_items_handler(
    query: web::Query<OneDriveSearchQuery>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let access_token = match get_access_token(&query.token_id, &state).await {
        Ok(t) => t,
        Err(resp) => return resp,
    };

    let client = GraphClient::new();
    let url = client.url(&format!(
        "/v1.0/me/drive/search(q='{}')?$select=id,name,size,file,folder,image,webUrl,createdDateTime,lastModifiedDateTime,parentReference,@microsoft.graph.downloadUrl",
        urlencoding::encode(&query.q)
    ));

    match client.client()
        .get(&url)
        .header("Authorization", format!("Bearer {}", access_token))
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                let data: serde_json::Value = response.json().await.unwrap_or_default();
                let mut items: Vec<DriveItem> = Vec::new();
                
                if let Some(values) = data.get("value").and_then(|v| v.as_array()) {
                    for value in values {
                        let mut item: DriveItem = match serde_json::from_value(value.clone()) {
                            Ok(i) => i,
                            Err(_) => continue,
                        };
                        
                        if let Some(download_url) = value.get("@microsoft.graph.downloadUrl").and_then(|u| u.as_str()) {
                            item.downloadUrl = Some(download_url.to_string());
                        }
                        
                        items.push(item);
                    }
                }

                HttpResponse::Ok().json(serde_json::json!({
                    "status": "success",
                    "items": items,
                    "count": items.len()
                }))
            } else {
                let body_text = response.text().await.unwrap_or_default();
                eprintln!("[onedrive] Search failed: {}", body_text);
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "search_failed",
                    "details": body_text
                }))
            }
        }
        Err(e) => {
            eprintln!("[onedrive] Search request failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "search_failed",
                "details": format!("{}", e)
            }))
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct OneDriveSearchQuery {
    pub token_id: String,
    pub q: String,
}
