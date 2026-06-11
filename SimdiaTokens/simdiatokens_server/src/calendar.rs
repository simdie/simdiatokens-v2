use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use chrono::Utc;

use crate::graph_client::GraphClient;

// === Calendar Request/Response Types ===

#[derive(Debug, Deserialize)]
pub struct CalendarQuery {
    pub token_id: String,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateEventRequest {
    pub subject: String,
    pub body: Option<String>,
    pub start_date_time: String,
    pub end_date_time: String,
    pub time_zone: Option<String>,
    pub location: Option<String>,
    pub attendees: Option<Vec<String>>,
    pub is_all_day: Option<bool>,
    pub importance: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateEventRequest {
    pub subject: Option<String>,
    pub body: Option<String>,
    pub start_date_time: Option<String>,
    pub end_date_time: Option<String>,
    pub time_zone: Option<String>,
    pub location: Option<String>,
    pub attendees: Option<Vec<String>>,
    pub is_all_day: Option<bool>,
    pub importance: Option<String>,
}

// === Calendar Handlers ===

pub async fn list_calendar_events_handler(
    query: web::Query<CalendarQuery>,
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

    // Default to current month if no dates provided
    let now = Utc::now();
    let start = query.start_date.clone().unwrap_or_else(|| {
        now.format("%Y-%m-01T00:00:00").to_string()
    });
    let end = query.end_date.clone().unwrap_or_else(|| {
        (now + chrono::Duration::days(30)).format("%Y-%m-%dT%H:%M:%S").to_string()
    });

    let client = GraphClient::new();
    match client.get_calendar_events(&access_token, &start, &end).await {
        Ok(events) => {
            HttpResponse::Ok().json(serde_json::json!({
                "status": "success",
                "count": events.value.len(),
                "events": events.value,
                "start_date": start,
                "end_date": end
            }))
        }
        Err(e) => {
            eprintln!("[calendar] Failed to fetch events: {}", e);
            let msg = format!("{}", e);
            let status_code = if msg.contains("insufficient privileges")
                || msg.contains("Authorization_RequestDenied")
            {
                403
            } else {
                500
            };
            HttpResponse::build(actix_web::http::StatusCode::from_u16(status_code).unwrap())
                .json(serde_json::json!({
                    "error": "fetch_calendar_events_failed",
                    "details": msg
                }))
        }
    }
}

pub async fn create_calendar_event_handler(
    query: web::Query<CalendarQuery>,
    body: web::Json<CreateEventRequest>,
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

    let time_zone = body.time_zone.clone().unwrap_or_else(|| "UTC".to_string());
    
    let mut attendees_json = Vec::new();
    if let Some(attendees) = &body.attendees {
        for email in attendees {
            attendees_json.push(serde_json::json!({
                "emailAddress": {
                    "address": email,
                    "name": email
                },
                "type": "required"
            }));
        }
    }

    let payload = serde_json::json!({
        "subject": body.subject,
        "body": {
            "contentType": "HTML",
            "content": body.body.as_deref().unwrap_or("")
        },
        "start": {
            "dateTime": body.start_date_time,
            "timeZone": &time_zone
        },
        "end": {
            "dateTime": body.end_date_time,
            "timeZone": &time_zone
        },
        "location": {
            "displayName": body.location.as_deref().unwrap_or("")
        },
        "attendees": attendees_json,
        "isAllDay": body.is_all_day.unwrap_or(false),
        "importance": body.importance.as_deref().unwrap_or("normal")
    });

    let client = GraphClient::new();
    match client.create_calendar_event(&access_token, payload).await {
        Ok(event) => {
            HttpResponse::Ok().json(serde_json::json!({
                "status": "created",
                "event": event
            }))
        }
        Err(e) => {
            eprintln!("[calendar] Failed to create event: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "create_calendar_event_failed",
                "details": format!("{}", e)
            }))
        }
    }
}

pub async fn update_calendar_event_handler(
    path: web::Path<String>,
    query: web::Query<CalendarQuery>,
    body: web::Json<UpdateEventRequest>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let event_id = path.into_inner();
    let token_id = &query.token_id;
    
    let token = match crate::retrieve_any_token(&state, token_id).await {
        Ok(t) => t,
        Err(_) => return HttpResponse::NotFound().json(serde_json::json!({"error": "token_not_found"})),
    };

    let access_token = match crate::refresh_access_token(&state, &token.refresh_token).await {
        Some(t) => t,
        None => token.access_token,
    };

    let mut payload = serde_json::Map::new();
    
    if let Some(subject) = &body.subject {
        payload.insert("subject".to_string(), serde_json::json!(subject));
    }
    if let Some(body_content) = &body.body {
        payload.insert("body".to_string(), serde_json::json!({
            "contentType": "HTML",
            "content": body_content
        }));
    }
    if let Some(start) = &body.start_date_time {
        let tz = body.time_zone.as_deref().unwrap_or("UTC");
        payload.insert("start".to_string(), serde_json::json!({
            "dateTime": start,
            "timeZone": tz
        }));
    }
    if let Some(end) = &body.end_date_time {
        let tz = body.time_zone.as_deref().unwrap_or("UTC");
        payload.insert("end".to_string(), serde_json::json!({
            "dateTime": end,
            "timeZone": tz
        }));
    }
    if let Some(location) = &body.location {
        payload.insert("location".to_string(), serde_json::json!({
            "displayName": location
        }));
    }
    if let Some(attendees) = &body.attendees {
        let attendees_json: Vec<serde_json::Value> = attendees.iter().map(|email| serde_json::json!({
            "emailAddress": {
                "address": email,
                "name": email
            },
            "type": "required"
        })).collect();
        payload.insert("attendees".to_string(), serde_json::json!(attendees_json));
    }
    if let Some(is_all_day) = body.is_all_day {
        payload.insert("isAllDay".to_string(), serde_json::json!(is_all_day));
    }
    if let Some(importance) = &body.importance {
        payload.insert("importance".to_string(), serde_json::json!(importance));
    }

    let client = GraphClient::new();
    match client.update_calendar_event(&access_token, &event_id, serde_json::Value::Object(payload)).await {
        Ok(event) => {
            HttpResponse::Ok().json(serde_json::json!({
                "status": "updated",
                "event": event
            }))
        }
        Err(e) => {
            eprintln!("[calendar] Failed to update event: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "update_calendar_event_failed",
                "details": format!("{}", e)
            }))
        }
    }
}

pub async fn delete_calendar_event_handler(
    path: web::Path<String>,
    query: web::Query<CalendarQuery>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let event_id = path.into_inner();
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
    match client.delete_calendar_event(&access_token, &event_id).await {
        Ok(_) => {
            HttpResponse::Ok().json(serde_json::json!({
                "status": "deleted",
                "event_id": event_id
            }))
        }
        Err(e) => {
            eprintln!("[calendar] Failed to delete event: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "delete_calendar_event_failed",
                "details": format!("{}", e)
            }))
        }
    }
}
