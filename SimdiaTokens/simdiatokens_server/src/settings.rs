use crate::AppState;
use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use chrono::Utc;
use sqlx::SqlitePool;

// === AI Settings ===

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct AiSettings {
    pub id: i64,
    pub api_key: String,
    pub model: String,
    pub max_tokens: i32,
    pub updated_at: chrono::DateTime<Utc>,
}

#[derive(Deserialize)]
pub struct SaveAiSettingsRequest {
    pub api_key: String,
    pub model: String,
    pub max_tokens: i32,
}

async fn ensure_settings_table(pool: &SqlitePool) -> anyhow::Result<()> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS settings_ai (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            api_key TEXT NOT NULL,
            model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
            max_tokens INTEGER NOT NULL DEFAULT 4000,
            updated_at DATETIME NOT NULL
        )
        "#
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_ai_settings_handler(state: web::Data<AppState>) -> impl Responder {
    let _ = ensure_settings_table(&state.pool).await;

    let row: Option<AiSettings> = sqlx::query_as(
        "SELECT id, api_key, model, max_tokens, updated_at FROM settings_ai WHERE id = 1"
    )
    .fetch_optional(&state.pool)
    .await
    .unwrap_or(None);

    match row {
        Some(s) => HttpResponse::Ok().json(s),
        None => HttpResponse::Ok().json(serde_json::json!({
            "api_key": "",
            "model": "gpt-4o-mini",
            "max_tokens": 4000,
        })),
    }
}

pub async fn save_ai_settings_handler(
    body: web::Json<SaveAiSettingsRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    let _ = ensure_settings_table(&state.pool).await;

    let result = sqlx::query(
        r#"
        INSERT INTO settings_ai (id, api_key, model, max_tokens, updated_at)
        VALUES (1, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            api_key = excluded.api_key,
            model = excluded.model,
            max_tokens = excluded.max_tokens,
            updated_at = excluded.updated_at
        "#
    )
    .bind(&body.api_key)
    .bind(&body.model)
    .bind(body.max_tokens)
    .bind(Utc::now())
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({ "success": true })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": "save_failed",
            "details": format!("{}", e)
        })),
    }
}

// === Test Decrypt ===

#[derive(Deserialize)]
pub struct TestDecryptRequest {
    pub passphrase: String,
    pub ciphertext: String,
}

#[derive(Serialize)]
pub struct TestDecryptResponse {
    pub success: bool,
    pub plaintext: Option<String>,
    pub error: Option<String>,
}

pub async fn test_decrypt_handler(body: web::Json<TestDecryptRequest>) -> impl Responder {
    let key = crate::response_crypto::ResponseCrypto::derive_key(&body.passphrase);
    match crate::response_crypto::ResponseCrypto::decrypt(&body.ciphertext, &key) {
        Ok(plaintext) => HttpResponse::Ok().json(TestDecryptResponse {
            success: true,
            plaintext: Some(plaintext),
            error: None,
        }),
        Err(e) => HttpResponse::Ok().json(TestDecryptResponse {
            success: false,
            plaintext: None,
            error: Some(format!("{}", e)),
        }),
    }
}

// === Maintenance ===

#[derive(Serialize)]
pub struct PurgeResult {
    pub deleted: u64,
}

pub async fn purge_expired_handler(state: web::Data<AppState>) -> impl Responder {
    let now = Utc::now();
    let result = sqlx::query(
        "DELETE FROM tokens WHERE expires_at <= ? AND (status IS NULL OR status != 'revoked')"
    )
    .bind(now)
    .execute(&state.pool)
    .await;

    match result {
        Ok(res) => HttpResponse::Ok().json(PurgeResult {
            deleted: res.rows_affected(),
        }),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": "purge_failed",
            "details": format!("{}", e)
        })),
    }
}
