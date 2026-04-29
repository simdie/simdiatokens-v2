use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use pbkdf2::pbkdf2_hmac;
use rand::RngCore;
use sha2::Sha256;

const E2E_SALT: &[u8] = b"simdia-e2e-v1";
const E2E_PBKDF2_ITERATIONS: u32 = 100_000;
const KEY_LEN: usize = 32;
const NONCE_LEN: usize = 12;

/// Encryption scheme documentation for frontend implementers:
///
/// **Key Derivation:**
/// - Algorithm: PBKDF2-HMAC-SHA256
/// - Salt: `simdia-e2e-v1` (UTF-8 bytes, exact: `[115, 105, 109, 100, 105, 97, 45, 101, 50, 101, 45, 118, 49]`)
/// - Iterations: 100,000
/// - Key length: 32 bytes
///
/// **Cipher:**
/// - Algorithm: AES-256-GCM
/// - Nonce: 12 bytes, randomly generated per encryption
/// - Tag: 16 bytes, appended to ciphertext by aes-gcm
///
/// **Wire format:**
/// - Base64( nonce (12 bytes) || ciphertext || tag (16 bytes) )
/// - Total blob length before base64: 12 + plaintext_len + 16
///
/// **Frontend workflow:**
/// 1. User enters passphrase in Settings page
/// 2. Derive key = PBKDF2-HMAC-SHA256(passphrase, salt="simdia-e2e-v1", iterations=100000, keyLength=32)
/// 3. When receiving an encrypted field value (base64 string), decode it
/// 4. Split into nonce (first 12 bytes) and ciphertext+tag (remainder)
/// 5. Decrypt with AES-256-GCM using the derived key and nonce
/// 6. Result is the original plaintext string
pub struct ResponseCrypto;

impl ResponseCrypto {
    /// Derive a 32-byte AES key from a passphrase using PBKDF2-HMAC-SHA256.
    pub fn derive_key(passphrase: &str) -> [u8; KEY_LEN] {
        let mut key = [0u8; KEY_LEN];
        pbkdf2_hmac::<Sha256>(passphrase.as_bytes(), E2E_SALT, E2E_PBKDF2_ITERATIONS, &mut key);
        key
    }

    /// Encrypt a plaintext string. Returns base64(nonce || ciphertext || tag).
    pub fn encrypt(plaintext: &str, key: &[u8]) -> anyhow::Result<String> {
        let cipher = Aes256Gcm::new_from_slice(key)
            .map_err(|e| anyhow::anyhow!("Failed to create AES cipher: {}", e))?;

        let mut nonce_bytes = [0u8; NONCE_LEN];
        rand::thread_rng().fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = cipher
            .encrypt(nonce, plaintext.as_bytes())
            .map_err(|e| anyhow::anyhow!("Encryption failed: {}", e))?;

        let mut blob = Vec::with_capacity(NONCE_LEN + ciphertext.len());
        blob.extend_from_slice(&nonce_bytes);
        blob.extend_from_slice(&ciphertext);

        Ok(BASE64.encode(&blob))
    }

    /// Decrypt a base64(nonce || ciphertext || tag) string.
    pub fn decrypt(ciphertext_b64: &str, key: &[u8]) -> anyhow::Result<String> {
        let blob = BASE64
            .decode(ciphertext_b64)
            .map_err(|e| anyhow::anyhow!("Base64 decode failed: {}", e))?;

        if blob.len() < NONCE_LEN {
            anyhow::bail!("Ciphertext blob too short");
        }

        let cipher = Aes256Gcm::new_from_slice(key)
            .map_err(|e| anyhow::anyhow!("Failed to create AES cipher: {}", e))?;

        let nonce = Nonce::from_slice(&blob[..NONCE_LEN]);
        let ciphertext = &blob[NONCE_LEN..];

        let plaintext = cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| anyhow::anyhow!("Decryption failed: {}", e))?;

        String::from_utf8(plaintext).map_err(|e| anyhow::anyhow!("Invalid UTF-8: {}", e))
    }

    /// Check if a JSON key is considered sensitive.
    fn is_sensitive_key(key: &str) -> bool {
        const SENSITIVE: &[&str] = &[
            "access_token",
            "refresh_token",
            "email",
            "user_email",
            "userPrincipalName",
            "mail",
            "bodyPreview",
            "body",
            "content",
            "report_json",
            "analysis_json",
            "subject",
            "summary",
            "description",
            "message",
            "details",
            "address",
            "displayName",
            "givenName",
            "surname",
            "forward_to",
            "target_folder",
            "device_code",
            "user_code",
            "verification_uri",
        ];
        SENSITIVE.contains(&key)
    }

    /// Walk a JSON value and encrypt string values whose keys are in the sensitive list.
    pub fn encrypt_json_value(value: &serde_json::Value, key: &[u8]) -> anyhow::Result<serde_json::Value> {
        Self::walk(value, key)
    }

    fn walk(value: &serde_json::Value, key: &[u8]) -> anyhow::Result<serde_json::Value> {
        match value {
            serde_json::Value::Object(map) => {
                let mut new = serde_json::Map::new();
                for (k, v) in map {
                    let new_v = if Self::is_sensitive_key(k) && v.is_string() {
                        let s = v.as_str().unwrap();
                        let encrypted = Self::encrypt(s, key)?;
                        let mut wrapper = serde_json::Map::new();
                        wrapper.insert("__encrypted".to_string(), serde_json::Value::String(encrypted));
                        serde_json::Value::Object(wrapper)
                    } else {
                        Self::walk(v, key)?
                    };
                    new.insert(k.clone(), new_v);
                }
                Ok(serde_json::Value::Object(new))
            }
            serde_json::Value::Array(arr) => {
                let new_arr: Result<Vec<_>, _> = arr.iter().map(|v| Self::walk(v, key)).collect();
                Ok(serde_json::Value::Array(new_arr?))
            }
            other => Ok(other.clone()),
        }
    }

    /// Helper for Actix-web handlers: check header, encrypt if requested, return response.
    pub fn respond(
        req: &actix_web::HttpRequest,
        value: serde_json::Value,
        key: &[u8],
    ) -> actix_web::HttpResponse {
        let should_encrypt = req
            .headers()
            .get("X-Response-Encryption")
            .and_then(|v| v.to_str().ok())
            == Some("enabled");

        if should_encrypt {
            match Self::encrypt_json_value(&value, key) {
                Ok(encrypted) => actix_web::HttpResponse::Ok().json(encrypted),
                Err(e) => actix_web::HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "encryption_failed",
                    "details": format!("{}", e)
                })),
            }
        } else {
            actix_web::HttpResponse::Ok().json(value)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_derive_key_is_deterministic() {
        let k1 = ResponseCrypto::derive_key("my_passphrase_123");
        let k2 = ResponseCrypto::derive_key("my_passphrase_123");
        assert_eq!(k1, k2);
    }

    #[test]
    fn test_derive_key_different_passphrases() {
        let k1 = ResponseCrypto::derive_key("pass_one");
        let k2 = ResponseCrypto::derive_key("pass_two");
        assert_ne!(k1, k2);
    }

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let key = ResponseCrypto::derive_key("test_roundtrip_secret");
        let plaintext = "super_sensitive_access_token_xyz_!!!";

        let ciphertext = ResponseCrypto::encrypt(plaintext, &key).unwrap();
        assert!(!ciphertext.is_empty());
        assert_ne!(ciphertext, plaintext);

        let decrypted = ResponseCrypto::decrypt(&ciphertext, &key).unwrap();
        assert_eq!(plaintext, decrypted);
    }

    #[test]
    fn test_decrypt_wrong_key_fails() {
        let key1 = ResponseCrypto::derive_key("correct_horse_battery_staple");
        let key2 = ResponseCrypto::derive_key("wrong_passphrase");
        let plaintext = "secret_data";

        let ciphertext = ResponseCrypto::encrypt(plaintext, &key1).unwrap();
        assert!(ResponseCrypto::decrypt(&ciphertext, &key2).is_err());
    }

    #[test]
    fn test_encrypt_json_value() {
        let key = ResponseCrypto::derive_key("json_test_key");
        let json = serde_json::json!({
            "id": "uuid-123",
            "access_token": "secret_token_abc",
            "refresh_token": "secret_refresh_xyz",
            "email": "user@target.com",
            "nested": {
                "mail": "nested@target.com",
                "displayName": "John Doe",
                "count": 42
            },
            "items": [
                { "subject": "Invoice", "bodyPreview": "Pay me $1000" },
                { "subject": "Hello", "bodyPreview": "How are you?" }
            ]
        });

        let encrypted = ResponseCrypto::encrypt_json_value(&json, &key).unwrap();

        // id is not sensitive, should remain plaintext
        assert_eq!(encrypted["id"], "uuid-123");

        // access_token should be wrapped in __encrypted
        let at_wrapper = encrypted["access_token"].as_object().unwrap();
        assert!(at_wrapper.contains_key("__encrypted"));
        let at = at_wrapper["__encrypted"].as_str().unwrap();
        assert_ne!(at, "secret_token_abc");
        assert!(ResponseCrypto::decrypt(at, &key).is_ok());

        // refresh_token should be wrapped in __encrypted
        let rt_wrapper = encrypted["refresh_token"].as_object().unwrap();
        let rt = rt_wrapper["__encrypted"].as_str().unwrap();
        assert_ne!(rt, "secret_refresh_xyz");

        // nested.mail should be wrapped in __encrypted
        let mail_wrapper = encrypted["nested"]["mail"].as_object().unwrap();
        let mail = mail_wrapper["__encrypted"].as_str().unwrap();
        assert_ne!(mail, "nested@target.com");

        // nested.count is a number, should remain unchanged
        assert_eq!(encrypted["nested"]["count"], 42);

        // array items should have encrypted fields wrapped
        let subj_wrapper = encrypted["items"][0]["subject"].as_object().unwrap();
        let subj = subj_wrapper["__encrypted"].as_str().unwrap();
        assert_ne!(subj, "Invoice");
    }
}
