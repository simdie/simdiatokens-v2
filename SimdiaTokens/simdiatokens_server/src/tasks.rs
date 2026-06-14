#![allow(non_snake_case)]

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

use crate::graph_client::GraphClient;

// === Tasks Request/Response Types ===

#[derive(Debug, Deserialize)]
pub struct TasksQuery {
    pub token_id: String,
    pub list_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTaskRequest {
    pub title: String,
    pub body: Option<String>,
    pub due_date_time: Option<String>,
    pub reminder_date_time: Option<String>,
    pub importance: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTaskRequest {
    pub title: Option<String>,
    pub body: Option<String>,
    pub due_date_time: Option<String>,
    pub reminder_date_time: Option<String>,
    pub importance: Option<String>,
    pub status: Option<String>,
    pub is_reminder_on: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct TaskListResponse {
    pub status: String,
    pub lists: Vec<GraphTaskList>,
}

#[derive(Debug, Serialize)]
pub struct TasksResponse {
    pub status: String,
    pub list_id: String,
    pub tasks: Vec<GraphTask>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GraphTaskList {
    pub id: String,
    pub displayName: String,
    pub isOwner: Option<bool>,
    pub isShared: Option<bool>,
    pub wellknownListName: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GraphTask {
    pub id: String,
    pub title: String,
    pub body: Option<TaskBody>,
    pub importance: Option<String>,
    pub status: Option<String>,
    pub dueDateTime: Option<TaskDateTime>,
    pub reminderDateTime: Option<TaskDateTime>,
    pub isReminderOn: Option<bool>,
    pub createdDateTime: Option<String>,
    pub lastModifiedDateTime: Option<String>,
    pub completedDateTime: Option<TaskDateTime>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TaskBody {
    pub content: Option<String>,
    pub contentType: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TaskDateTime {
    pub dateTime: Option<String>,
    pub timeZone: Option<String>,
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

// === Task Lists Handlers ===

pub async fn list_task_lists_handler(
    query: web::Query<TasksQuery>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let access_token = match get_access_token(&query.token_id, &state).await {
        Ok(t) => t,
        Err(resp) => return resp,
    };

    let client = GraphClient::new();
    let url = client.url("/v1.0/me/todo/lists?$select=id,displayName,isOwner,isShared,wellknownListName");

    match client.client()
        .get(&url)
        .header("Authorization", format!("Bearer {}", access_token))
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                let data: serde_json::Value = response.json().await.unwrap_or_default();
                let lists: Vec<GraphTaskList> = serde_json::from_value(
                    data.get("value").cloned().unwrap_or(serde_json::Value::Array(vec![]))
                ).unwrap_or_default();
                
                HttpResponse::Ok().json(TaskListResponse {
                    status: "success".to_string(),
                    lists,
                })
            } else {
                let body_text = response.text().await.unwrap_or_default();
                eprintln!("[tasks] Failed to fetch task lists: {}", body_text);
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "fetch_task_lists_failed",
                    "details": body_text
                }))
            }
        }
        Err(e) => {
            eprintln!("[tasks] Fetch task lists request failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "fetch_task_lists_failed",
                "details": format!("{}", e)
            }))
        }
    }
}

// === Task Items Handlers ===

pub async fn list_tasks_handler(
    query: web::Query<TasksQuery>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let access_token = match get_access_token(&query.token_id, &state).await {
        Ok(t) => t,
        Err(resp) => return resp,
    };

    let list_id = match &query.list_id {
        Some(id) => id.clone(),
        None => {
            // Get default list
            let client = GraphClient::new();
            let url = client.url("/v1.0/me/todo/lists?$select=id,wellknownListName&$filter=wellknownListName eq 'defaultList'");
            
            match client.client()
                .get(&url)
                .header("Authorization", format!("Bearer {}", access_token))
                .send()
                .await
            {
                Ok(response) => {
                    if response.status().is_success() {
                        let data: serde_json::Value = response.json().await.unwrap_or_default();
                        if let Some(values) = data.get("value").and_then(|v| v.as_array()) {
                            if let Some(first) = values.first() {
                                if let Some(id) = first.get("id").and_then(|i| i.as_str()) {
                                    id.to_string()
                                } else {
                                    return HttpResponse::InternalServerError().json(serde_json::json!({
                                        "error": "no_default_list_found"
                                    }));
                                }
                            } else {
                                return HttpResponse::InternalServerError().json(serde_json::json!({
                                    "error": "no_default_list_found"
                                }));
                            }
                        } else {
                            return HttpResponse::InternalServerError().json(serde_json::json!({
                                "error": "no_default_list_found"
                            }));
                        }
                    } else {
                        let body_text = response.text().await.unwrap_or_default();
                        return HttpResponse::InternalServerError().json(serde_json::json!({
                            "error": "fetch_default_list_failed",
                            "details": body_text
                        }));
                    }
                }
                Err(e) => {
                    return HttpResponse::InternalServerError().json(serde_json::json!({
                        "error": "fetch_default_list_failed",
                        "details": format!("{}", e)
                    }));
                }
            }
        }
    };

    let client = GraphClient::new();
    let url = client.url(&format!(
        "/v1.0/me/todo/lists/{}/tasks?$select=id,title,body,importance,status,dueDateTime,reminderDateTime,isReminderOn,createdDateTime,lastModifiedDateTime,completedDateTime",
        list_id
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
                let tasks: Vec<GraphTask> = serde_json::from_value(
                    data.get("value").cloned().unwrap_or(serde_json::Value::Array(vec![]))
                ).unwrap_or_default();
                
                HttpResponse::Ok().json(TasksResponse {
                    status: "success".to_string(),
                    list_id,
                    tasks,
                })
            } else {
                let body_text = response.text().await.unwrap_or_default();
                eprintln!("[tasks] Failed to fetch tasks: {}", body_text);
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "fetch_tasks_failed",
                    "details": body_text
                }))
            }
        }
        Err(e) => {
            eprintln!("[tasks] Fetch tasks request failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "fetch_tasks_failed",
                "details": format!("{}", e)
            }))
        }
    }
}

pub async fn create_task_handler(
    query: web::Query<TasksQuery>,
    body: web::Json<CreateTaskRequest>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let access_token = match get_access_token(&query.token_id, &state).await {
        Ok(t) => t,
        Err(resp) => return resp,
    };

    let list_id = match &query.list_id {
        Some(id) => id.clone(),
        None => {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "error": "list_id_required"
            }));
        }
    };

    let mut payload = serde_json::Map::new();
    payload.insert("title".to_string(), serde_json::json!(body.title));
    
    if let Some(body_text) = &body.body {
        payload.insert("body".to_string(), serde_json::json!({
            "content": body_text,
            "contentType": "text"
        }));
    }
    
    if let Some(due) = &body.due_date_time {
        payload.insert("dueDateTime".to_string(), serde_json::json!({
            "dateTime": due,
            "timeZone": "UTC"
        }));
    }
    
    if let Some(reminder) = &body.reminder_date_time {
        payload.insert("reminderDateTime".to_string(), serde_json::json!({
            "dateTime": reminder,
            "timeZone": "UTC"
        }));
    }
    
    if let Some(importance) = &body.importance {
        payload.insert("importance".to_string(), serde_json::json!(importance));
    }
    
    if let Some(status) = &body.status {
        payload.insert("status".to_string(), serde_json::json!(status));
    }

    let client = GraphClient::new();
    let url = client.url(&format!("/v1.0/me/todo/lists/{}/tasks", list_id));
    
    match client.client()
        .post(&url)
        .header("Authorization", format!("Bearer {}", access_token))
        .header("Content-Type", "application/json")
        .json(&serde_json::Value::Object(payload))
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                let task: serde_json::Value = response.json().await.unwrap_or_default();
                HttpResponse::Ok().json(serde_json::json!({
                    "status": "created",
                    "task": task
                }))
            } else {
                let body_text = response.text().await.unwrap_or_default();
                eprintln!("[tasks] Failed to create task: {}", body_text);
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "create_task_failed",
                    "details": body_text
                }))
            }
        }
        Err(e) => {
            eprintln!("[tasks] Create task request failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "create_task_failed",
                "details": format!("{}", e)
            }))
        }
    }
}

pub async fn update_task_handler(
    path: web::Path<String>,
    query: web::Query<TasksQuery>,
    body: web::Json<UpdateTaskRequest>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let task_id = path.into_inner();
    let access_token = match get_access_token(&query.token_id, &state).await {
        Ok(t) => t,
        Err(resp) => return resp,
    };

    let list_id = match &query.list_id {
        Some(id) => id.clone(),
        None => {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "error": "list_id_required"
            }));
        }
    };

    let mut payload = serde_json::Map::new();
    
    if let Some(title) = &body.title {
        payload.insert("title".to_string(), serde_json::json!(title));
    }
    
    if let Some(body_text) = &body.body {
        payload.insert("body".to_string(), serde_json::json!({
            "content": body_text,
            "contentType": "text"
        }));
    }
    
    if let Some(due) = &body.due_date_time {
        payload.insert("dueDateTime".to_string(), serde_json::json!({
            "dateTime": due,
            "timeZone": "UTC"
        }));
    }
    
    if let Some(reminder) = &body.reminder_date_time {
        payload.insert("reminderDateTime".to_string(), serde_json::json!({
            "dateTime": reminder,
            "timeZone": "UTC"
        }));
    }
    
    if let Some(importance) = &body.importance {
        payload.insert("importance".to_string(), serde_json::json!(importance));
    }
    
    if let Some(status) = &body.status {
        payload.insert("status".to_string(), serde_json::json!(status));
    }
    
    if let Some(is_reminder_on) = body.is_reminder_on {
        payload.insert("isReminderOn".to_string(), serde_json::json!(is_reminder_on));
    }

    let client = GraphClient::new();
    let url = client.url(&format!("/v1.0/me/todo/lists/{}/tasks/{}", list_id, task_id));
    
    match client.client()
        .patch(&url)
        .header("Authorization", format!("Bearer {}", access_token))
        .header("Content-Type", "application/json")
        .json(&serde_json::Value::Object(payload))
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                let task: serde_json::Value = response.json().await.unwrap_or_default();
                HttpResponse::Ok().json(serde_json::json!({
                    "status": "updated",
                    "task": task
                }))
            } else {
                let body_text = response.text().await.unwrap_or_default();
                eprintln!("[tasks] Failed to update task: {}", body_text);
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "update_task_failed",
                    "details": body_text
                }))
            }
        }
        Err(e) => {
            eprintln!("[tasks] Update task request failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "update_task_failed",
                "details": format!("{}", e)
            }))
        }
    }
}

pub async fn delete_task_handler(
    path: web::Path<String>,
    query: web::Query<TasksQuery>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let task_id = path.into_inner();
    let access_token = match get_access_token(&query.token_id, &state).await {
        Ok(t) => t,
        Err(resp) => return resp,
    };

    let list_id = match &query.list_id {
        Some(id) => id.clone(),
        None => {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "error": "list_id_required"
            }));
        }
    };

    let client = GraphClient::new();
    let url = client.url(&format!("/v1.0/me/todo/lists/{}/tasks/{}", list_id, task_id));
    
    match client.client()
        .delete(&url)
        .header("Authorization", format!("Bearer {}", access_token))
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                HttpResponse::Ok().json(serde_json::json!({
                    "status": "deleted",
                    "task_id": task_id
                }))
            } else {
                let body_text = response.text().await.unwrap_or_default();
                eprintln!("[tasks] Failed to delete task: {}", body_text);
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "delete_task_failed",
                    "details": body_text
                }))
            }
        }
        Err(e) => {
            eprintln!("[tasks] Delete task request failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "delete_task_failed",
                "details": format!("{}", e)
            }))
        }
    }
}
