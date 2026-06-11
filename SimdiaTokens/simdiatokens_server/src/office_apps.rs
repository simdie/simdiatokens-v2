use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

use crate::graph_client::GraphClient;

// === Office Apps Types ===

#[derive(Debug, Deserialize)]
pub struct OfficeAppsQuery {
    pub token_id: String,
    pub doc_type: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct OfficeDocsResponse {
    pub status: String,
    pub documents: Vec<OfficeDocument>,
    pub count: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OfficeDocument {
    pub id: String,
    pub name: String,
    pub size: Option<i64>,
    pub mime_type: String,
    pub doc_type: String,
    pub web_url: String,
    pub download_url: Option<String>,
    pub embed_url: Option<String>,
    pub thumbnail_url: Option<String>,
    pub created_date_time: Option<String>,
    pub last_modified_date_time: Option<String>,
    pub created_by: Option<String>,
    pub last_modified_by: Option<String>,
}

// === Helper ===

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

fn detect_doc_type(mime_type: &str, name: &str) -> String {
    let name_lower = name.to_lowercase();
    if mime_type.contains("word") || name_lower.ends_with(".docx") || name_lower.ends_with(".doc") {
        "word".to_string()
    } else if mime_type.contains("excel") || mime_type.contains("spreadsheet") || name_lower.ends_with(".xlsx") || name_lower.ends_with(".xls") || name_lower.ends_with(".csv") {
        "excel".to_string()
    } else if mime_type.contains("powerpoint") || mime_type.contains("presentation") || name_lower.ends_with(".pptx") || name_lower.ends_with(".ppt") {
        "powerpoint".to_string()
    } else if mime_type.contains("pdf") || name_lower.ends_with(".pdf") {
        "pdf".to_string()
    } else {
        "other".to_string()
    }
}

fn generate_embed_url(download_url: &str, doc_type: &str) -> String {
    let encoded_url = urlencoding::encode(download_url);
    match doc_type {
        "word" => format!(
            "https://view.officeapps.live.com/op/embed.aspx?src={}",
            encoded_url
        ),
        "excel" => format!(
            "https://view.officeapps.live.com/op/embed.aspx?src={}",
            encoded_url
        ),
        "powerpoint" => format!(
            "https://view.officeapps.live.com/op/embed.aspx?src={}",
            encoded_url
        ),
        "pdf" => format!(
            "https://view.officeapps.live.com/op/embed.aspx?src={}",
            encoded_url
        ),
        _ => format!(
            "https://view.officeapps.live.com/op/embed.aspx?src={}",
            encoded_url
        ),
    }
}

fn generate_office_online_url(web_url: &str) -> String {
    // webUrl from Graph API already opens in Office Online
    web_url.to_string()
}

// === Handlers ===

pub async fn list_office_docs_handler(
    query: web::Query<OfficeAppsQuery>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let access_token = match get_access_token(&query.token_id, &state).await {
        Ok(t) => t,
        Err(resp) => return resp,
    };

    let client = GraphClient::new();
    
    // Search for Office documents in OneDrive
    // We'll use the recent items endpoint and filter by mime type
    let url = client.url(
        "/v1.0/me/drive/recent?$select=id,name,size,file,webUrl,createdDateTime,lastModifiedDateTime,createdBy,lastModifiedBy,@microsoft.graph.downloadUrl&$top=50"
    );

    match client.client()
        .get(&url)
        .header("Authorization", format!("Bearer {}", access_token))
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                let data: serde_json::Value = response.json().await.unwrap_or_default();
                let mut documents: Vec<OfficeDocument> = Vec::new();
                
                if let Some(values) = data.get("value").and_then(|v| v.as_array()) {
                    for value in values {
                        let id = value.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
                        let name = value.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string();
                        let size = value.get("size").and_then(|v| v.as_i64());
                        let web_url = value.get("webUrl").and_then(|v| v.as_str()).unwrap_or("").to_string();
                        let download_url = value.get("@microsoft.graph.downloadUrl").and_then(|v| v.as_str()).map(|s| s.to_string());
                        let created_date = value.get("createdDateTime").and_then(|v| v.as_str()).map(|s| s.to_string());
                        let modified_date = value.get("lastModifiedDateTime").and_then(|v| v.as_str()).map(|s| s.to_string());
                        
                        let created_by = value.get("createdBy")
                            .and_then(|v| v.get("user"))
                            .and_then(|v| v.get("displayName"))
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string());
                        
                        let modified_by = value.get("lastModifiedBy")
                            .and_then(|v| v.get("user"))
                            .and_then(|v| v.get("displayName"))
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string());
                        
                        let mime_type = value
                            .get("file")
                            .and_then(|f| f.get("mimeType"))
                            .and_then(|m| m.as_str())
                            .unwrap_or("")
                            .to_string();
                        
                        let doc_type = detect_doc_type(&mime_type, &name);
                        
                        // Skip non-office documents if filtering
                        if let Some(filter_type) = &query.doc_type {
                            if doc_type != *filter_type && filter_type != "all" {
                                continue;
                            }
                        }
                        
                        // Only include office documents
                        if doc_type == "other" && query.doc_type.is_none() {
                            continue;
                        }
                        
                        let embed_url = download_url.as_ref().map(|url| generate_embed_url(url, &doc_type));
                        
                        documents.push(OfficeDocument {
                            id,
                            name,
                            size,
                            mime_type,
                            doc_type,
                            web_url,
                            download_url,
                            embed_url,
                            thumbnail_url: None,
                            created_date_time: created_date,
                            last_modified_date_time: modified_date,
                            created_by,
                            last_modified_by: modified_by,
                        });
                    }
                }

                // Sort by last modified date
                documents.sort_by(|a, b| {
                    b.last_modified_date_time.as_ref().unwrap_or(&"".to_string())
                        .cmp(a.last_modified_date_time.as_ref().unwrap_or(&"".to_string()))
                });

                let count = documents.len();
                
                HttpResponse::Ok().json(OfficeDocsResponse {
                    status: "success".to_string(),
                    documents,
                    count,
                })
            } else {
                let body_text = response.text().await.unwrap_or_default();
                eprintln!("[office] Failed to list documents: {}", body_text);
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "list_documents_failed",
                    "details": body_text
                }))
            }
        }
        Err(e) => {
            eprintln!("[office] List documents request failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "list_documents_failed",
                "details": format!("{}", e)
            }))
        }
    }
}

pub async fn search_office_docs_handler(
    query: web::Query<OfficeAppsSearchQuery>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let access_token = match get_access_token(&query.token_id, &state).await {
        Ok(t) => t,
        Err(resp) => return resp,
    };

    let client = GraphClient::new();
    let url = client.url(&format!(
        "/v1.0/me/drive/search(q='{}')?$select=id,name,size,file,webUrl,createdDateTime,lastModifiedDateTime,createdBy,lastModifiedBy,@microsoft.graph.downloadUrl&$top=50",
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
                let mut documents: Vec<OfficeDocument> = Vec::new();
                
                if let Some(values) = data.get("value").and_then(|v| v.as_array()) {
                    for value in values {
                        let name = value.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string();
                        let mime_type = value
                            .get("file")
                            .and_then(|f| f.get("mimeType"))
                            .and_then(|m| m.as_str())
                            .unwrap_or("")
                            .to_string();
                        
                        let doc_type = detect_doc_type(&mime_type, &name);
                        
                        // Only include office documents
                        if doc_type == "other" {
                            continue;
                        }
                        
                        let id = value.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
                        let size = value.get("size").and_then(|v| v.as_i64());
                        let web_url = value.get("webUrl").and_then(|v| v.as_str()).unwrap_or("").to_string();
                        let download_url = value.get("@microsoft.graph.downloadUrl").and_then(|v| v.as_str()).map(|s| s.to_string());
                        let created_date = value.get("createdDateTime").and_then(|v| v.as_str()).map(|s| s.to_string());
                        let modified_date = value.get("lastModifiedDateTime").and_then(|v| v.as_str()).map(|s| s.to_string());
                        
                        let created_by = value.get("createdBy")
                            .and_then(|v| v.get("user"))
                            .and_then(|v| v.get("displayName"))
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string());
                        
                        let modified_by = value.get("lastModifiedBy")
                            .and_then(|v| v.get("user"))
                            .and_then(|v| v.get("displayName"))
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string());
                        
                        let embed_url = download_url.as_ref().map(|url| generate_embed_url(url, &doc_type));
                        
                        documents.push(OfficeDocument {
                            id,
                            name,
                            size,
                            mime_type,
                            doc_type,
                            web_url,
                            download_url,
                            embed_url,
                            thumbnail_url: None,
                            created_date_time: created_date,
                            last_modified_date_time: modified_date,
                            created_by,
                            last_modified_by: modified_by,
                        });
                    }
                }

                let count = documents.len();
                
                HttpResponse::Ok().json(OfficeDocsResponse {
                    status: "success".to_string(),
                    documents,
                    count,
                })
            } else {
                let body_text = response.text().await.unwrap_or_default();
                eprintln!("[office] Search failed: {}", body_text);
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "search_failed",
                    "details": body_text
                }))
            }
        }
        Err(e) => {
            eprintln!("[office] Search request failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "search_failed",
                "details": format!("{}", e)
            }))
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct OfficeAppsSearchQuery {
    pub token_id: String,
    pub q: String,
}

#[derive(Debug, Deserialize)]
pub struct OfficeEmbedQuery {
    pub token_id: String,
    pub item_id: String,
}

pub async fn get_office_embed_url_handler(
    query: web::Query<OfficeEmbedQuery>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let access_token = match get_access_token(&query.token_id, &state).await {
        Ok(t) => t,
        Err(resp) => return resp,
    };

    let client = GraphClient::new();
    let url = client.url(&format!(
        "/v1.0/me/drive/items/{}?$select=id,name,file,webUrl,@microsoft.graph.downloadUrl",
        query.item_id
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
                let name = data.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string();
                let mime_type = data
                    .get("file")
                    .and_then(|f| f.get("mimeType"))
                    .and_then(|m| m.as_str())
                    .unwrap_or("")
                    .to_string();
                let web_url = data.get("webUrl").and_then(|v| v.as_str()).unwrap_or("").to_string();
                let download_url = data.get("@microsoft.graph.downloadUrl").and_then(|v| v.as_str()).map(|s| s.to_string());
                
                let doc_type = detect_doc_type(&mime_type, &name);
                let embed_url = download_url.as_ref().map(|url| generate_embed_url(url, &doc_type));
                let office_online_url = generate_office_online_url(&web_url);
                
                HttpResponse::Ok().json(serde_json::json!({
                    "status": "success",
                    "document": {
                        "id": query.item_id,
                        "name": name,
                        "doc_type": doc_type,
                        "web_url": web_url,
                        "office_online_url": office_online_url,
                        "embed_url": embed_url,
                        "download_url": download_url,
                    }
                }))
            } else {
                let body_text = response.text().await.unwrap_or_default();
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "get_embed_url_failed",
                    "details": body_text
                }))
            }
        }
        Err(e) => {
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "get_embed_url_failed",
                "details": format!("{}", e)
            }))
        }
    }
}
