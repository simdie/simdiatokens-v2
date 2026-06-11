use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

use crate::graph_client::GraphClient;

// === Calendar Request/Response Types ===

#[derive(Debug, Deserialize)]
pub struct CalendarQuery {
    pub token_id: String,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CalendarEventsResponse {
    pub status: String,
    pub events: Vec<GraphEvent>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GraphEvent {
    pub id: String,
    pub subject: String,
    pub body: Option<EventBody>,
    pub start: Option<EventDateTime>,
    pub end: Option<EventDateTime>,
    pub location: Option<EventLocation>,
    pub attendees: Option<Vec<EventAttendee>>,
    pub isAllDay: Option<bool>,
    pub isCancelled: Option<bool>,
    pub organizer: Option<EventOrganizer>,
    pub createdDateTime: Option<String>,
    pub lastModifiedDateTime: Option<String>,
    pub recurrence: Option<serde_json::Value>,
    pub responseStatus: Option<EventResponseStatus>,
    pub showAs: Option<String>,
    pub sensitivity: Option<String>,
    pub categories: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EventBody {
    pub content: Option<String>,
    pub contentType: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EventDateTime {
    pub dateTime: String,
    pub timeZone: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EventLocation {
    pub displayName: Option<String>,
    pub address: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EventAttendee {
    pub emailAddress: Option<EventEmailAddress>,
    #[serde(rename = "type")]
    pub attendee_type: Option<String>,
    pub status: Option<EventResponseStatus>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EventOrganizer {
    pub emailAddress: Option<EventEmailAddress>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EventEmailAddress {
    pub name: Option<String>,
    pub address: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EventResponseStatus {
    pub response: Option<String>,
    pub time: Option<String>,
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

// === Calendar Events Handlers ===

pub async fn list_calendar_events_handler(
    query: web::Query<CalendarQuery>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let access_token = match get_access_token(&query.token_id, &state).await {
        Ok(t) => t,
        Err(resp) => return resp,
    };

    let client = GraphClient::new();
    
    // Build URL with optional date range
    let mut url = client.url(
        "/v1.0/me/events?$top=50&$orderby=start/dateTime DESC&$select=id,subject,body,start,end,location,attendees,isAllDay,isCancelled,organizer,createdDateTime,lastModifiedDateTime,recurrence,responseStatus,showAs,sensitivity,categories"
    );
    
    // If date range provided, use calendarView instead
    if let (Some(start), Some(end)) = (&query.start_date, &query.end_date) {
        url = client.url(&format!(
            "/v1.0/me/calendar/calendarView?startDateTime={}&endDateTime={}&$top=50&$select=id,subject,body,start,end,location,attendees,isAllDay,isCancelled,organizer,createdDateTime,lastModifiedDateTime,recurrence,responseStatus,showAs,sensitivity,categories",
            urlencoding::encode(start),
            urlencoding::encode(end)
        ));
    }

    match client.client()
        .get(&url)
        .header("Authorization", format!("Bearer {}", access_token))
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                let data: serde_json::Value = response.json().await.unwrap_or_default();
                let events: Vec<GraphEvent> = serde_json::from_value(
                    data.get("value").cloned().unwrap_or(serde_json::Value::Array(vec![]))
                ).unwrap_or_default();
                
                HttpResponse::Ok().json(CalendarEventsResponse {
                    status: "success".to_string(),
                    events,
                })
            } else if response.status() == 403 {
                // Consumer accounts get 403 for Calendar
                let body_text = response.text().await.unwrap_or_default();
                HttpResponse::Forbidden().json(serde_json::json!({
                    "error": "calendar_access_denied",
                    "message": "Calendar access requires a Microsoft 365 work or school account.",
                    "details": body_text
                }))
            } else {
                let body_text = response.text().await.unwrap_or_default();
                eprintln!("[calendar] Failed to fetch events: {}", body_text);
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "fetch_events_failed",
                    "details": body_text
                }))
            }
        }
        Err(e) => {
            eprintln!("[calendar] Fetch events request failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "fetch_events_failed",
                "details": format!("{}", e)
            }))
        }
    }
}
