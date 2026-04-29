use rand::Rng;
use serde::Serialize;
use std::time::Duration;

// === User-Agent Pool ===

#[derive(Clone)]
pub struct UserAgentPool {
    uas: Vec<String>,
}

impl Default for UserAgentPool {
    fn default() -> Self {
        Self::new()
    }
}

impl UserAgentPool {
    pub fn new() -> Self {
        match Self::from_file("config/ua_list.txt") {
            Ok(pool) if !pool.is_empty() => pool,
            _ => Self::default_pool(),
        }
    }

    pub fn from_file(path: &str) -> anyhow::Result<Self> {
        let content = std::fs::read_to_string(path)?;
        let uas: Vec<String> = content
            .lines()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();
        Ok(Self { uas })
    }

    fn default_pool() -> Self {
        let uas = vec![
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0".to_string(),
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36".to_string(),
            "Outlook-Android/2.0".to_string(),
            "Microsoft Office/16.0 (Windows NT 10.0; Microsoft Outlook 16.0.17425; Pro)".to_string(),
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1".to_string(),
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0".to_string(),
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Teams/1.6.00.27573 Chrome/120.0.0.0 Electron/28.0.0 Safari/537.36".to_string(),
        ];
        Self { uas }
    }

    pub fn get_random(&self) -> &str {
        if self.uas.is_empty() {
            return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
        }
        let idx = rand::thread_rng().gen_range(0..self.uas.len());
        &self.uas[idx]
    }

    pub fn len(&self) -> usize {
        self.uas.len()
    }

    pub fn is_empty(&self) -> bool {
        self.uas.is_empty()
    }

    pub fn all(&self) -> Vec<String> {
        self.uas.clone()
    }
}

// === Jitter Config ===

#[derive(Clone)]
pub struct JitterConfig {
    pub min_ms: u64,
    pub max_ms: u64,
}

impl Default for JitterConfig {
    fn default() -> Self {
        Self::from_env()
    }
}

impl JitterConfig {
    pub fn new(min_ms: u64, max_ms: u64) -> Self {
        Self { min_ms, max_ms }
    }

    pub fn from_env() -> Self {
        let min = std::env::var("JITTER_MIN_MS")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(500);
        let max = std::env::var("JITTER_MAX_MS")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(3000);
        Self { min_ms: min, max_ms: max }
    }

    pub async fn apply(&self) {
        if self.min_ms >= self.max_ms {
            return;
        }
        let ms = rand::thread_rng().gen_range(self.min_ms..=self.max_ms);
        tokio::time::sleep(Duration::from_millis(ms)).await;
    }
}

// === Proxy Config ===

#[derive(Clone)]
pub struct ProxyConfig {
    pub url: String,
}

impl ProxyConfig {
    pub fn from_env() -> Option<Self> {
        std::env::var("PROXY_URL").ok().map(|url| Self { url })
    }

    pub fn apply(&self, builder: reqwest::ClientBuilder) -> reqwest::ClientBuilder {
        match reqwest::Proxy::all(&self.url) {
            Ok(proxy) => builder.proxy(proxy),
            Err(e) => {
                eprintln!("[stealth] Failed to set proxy: {}", e);
                builder
            }
        }
    }
}

// === Captcha Detector ===

#[derive(Debug, Clone)]
pub struct CaptchaTriggered {
    pub code: String,
    pub description: String,
}

pub struct CaptchaDetector;

impl CaptchaDetector {
    const CODES: &[&str] = &[
        "AADSTS50076",
        "AADSTS50079",
        "AADSTS53003",
        "AADSTS90072",
    ];

    pub fn check(error_text: &str) -> Option<CaptchaTriggered> {
        for code in Self::CODES {
            if error_text.contains(code) {
                return Some(CaptchaTriggered {
                    code: code.to_string(),
                    description: format!("CAPTCHA or conditional access triggered: {}", code),
                });
            }
        }
        None
    }
}

// === Redirect Chain Validator ===

#[derive(Debug, Clone, Serialize)]
pub struct RedirectChainInfo {
    pub hop_count: usize,
    pub hops: Vec<String>,
    pub has_known_cdn: bool,
}

pub struct RedirectValidator;

impl RedirectValidator {
    pub fn validate(headers: &actix_web::http::header::HeaderMap) -> RedirectChainInfo {
        let mut hops = Vec::new();

        if let Some(xff) = headers.get("X-Forwarded-For") {
            if let Ok(val) = xff.to_str() {
                hops.extend(val.split(',').map(|s| s.trim().to_string()));
            }
        }

        if let Some(via) = headers.get("Via") {
            if let Ok(val) = via.to_str() {
                hops.push(format!("Via: {}", val));
            }
        }

        let known_cdns = ["cloudflare", "akamai", "fastly", "cloudfront", "incapsula"];
        let has_known_cdn = hops.iter().any(|hop| {
            let lower = hop.to_lowercase();
            known_cdns.iter().any(|cdn| lower.contains(cdn))
        });

        RedirectChainInfo {
            hop_count: hops.len(),
            hops,
            has_known_cdn,
        }
    }
}

// === Stealth Config ===

#[derive(Clone)]
pub struct StealthConfig {
    pub ua_pool: UserAgentPool,
    pub jitter: JitterConfig,
    pub proxy: Option<ProxyConfig>,
}

impl Default for StealthConfig {
    fn default() -> Self {
        Self::new()
    }
}

impl StealthConfig {
    pub fn new() -> Self {
        Self {
            ua_pool: UserAgentPool::new(),
            jitter: JitterConfig::from_env(),
            proxy: ProxyConfig::from_env(),
        }
    }

    pub fn with_jitter(min_ms: u64, max_ms: u64) -> Self {
        Self {
            ua_pool: UserAgentPool::new(),
            jitter: JitterConfig::new(min_ms, max_ms),
            proxy: None,
        }
    }
}

// === HTTP Endpoint ===

use actix_web::{web, HttpResponse, Responder};
use crate::AppState;

#[derive(Serialize)]
pub struct StealthStatus {
    pub ua_pool_size: usize,
    pub jitter_min_ms: u64,
    pub jitter_max_ms: u64,
    pub proxy_enabled: bool,
    pub proxy_url: Option<String>,
    pub user_agents: Vec<String>,
}

pub async fn stealth_config_handler(_state: web::Data<AppState>) -> impl Responder {
    let stealth = StealthConfig::new();
    HttpResponse::Ok().json(StealthStatus {
        ua_pool_size: stealth.ua_pool.len(),
        jitter_min_ms: stealth.jitter.min_ms,
        jitter_max_ms: stealth.jitter.max_ms,
        proxy_enabled: stealth.proxy.is_some(),
        proxy_url: stealth.proxy.as_ref().map(|p| p.url.clone()),
        user_agents: stealth.ua_pool.all(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::http::header::HeaderValue;

    #[test]
    fn test_ua_pool_fallback_has_entries() {
        let pool = UserAgentPool::default_pool();
        assert!(pool.len() >= 7);
        let ua = pool.get_random();
        assert!(!ua.is_empty());
    }

    #[test]
    fn test_ua_pool_from_file() {
        // The config/ua_list.txt should exist with 25+ entries
        let pool = UserAgentPool::new();
        assert!(pool.len() >= 20, "Expected at least 20 UAs, got {}", pool.len());
    }

    #[test]
    fn test_ua_rotation() {
        let pool = UserAgentPool::default_pool();
        let mut seen = std::collections::HashSet::new();
        for _ in 0..50 {
            seen.insert(pool.get_random().to_string());
        }
        // With enough draws we should see multiple distinct UAs
        assert!(seen.len() > 1, "UA rotation appears stuck");
    }

    #[tokio::test]
    async fn test_jitter_timing() {
        let jitter = JitterConfig::new(50, 150);
        let start = tokio::time::Instant::now();
        jitter.apply().await;
        let elapsed = start.elapsed();
        assert!(elapsed >= Duration::from_millis(50));
        assert!(elapsed <= Duration::from_millis(300)); // generous upper bound
    }

    #[tokio::test]
    async fn test_jitter_zero_range_skips() {
        let jitter = JitterConfig::new(0, 0);
        let start = tokio::time::Instant::now();
        jitter.apply().await;
        let elapsed = start.elapsed();
        assert!(elapsed < Duration::from_millis(10));
    }

    #[test]
    fn test_captcha_detector_hits() {
        let text = r#"{"error":"invalid_grant","error_description":"AADSTS50076: Due to a configuration change made by your administrator..."}"#;
        let result = CaptchaDetector::check(text);
        assert!(result.is_some());
        assert_eq!(result.unwrap().code, "AADSTS50076");
    }

    #[test]
    fn test_captcha_detector_misses() {
        let text = r#"{"error":"invalid_grant","error_description":"The provided grant is invalid."}"#;
        let result = CaptchaDetector::check(text);
        assert!(result.is_none());
    }

    #[test]
    fn test_redirect_validator_xff() {
        let mut headers = actix_web::http::header::HeaderMap::new();
        headers.insert(actix_web::http::header::HeaderName::from_static("x-forwarded-for"), HeaderValue::from_static("1.2.3.4, 5.6.7.8"));
        let info = RedirectValidator::validate(&headers);
        assert_eq!(info.hop_count, 2);
        assert!(info.hops.contains(&"1.2.3.4".to_string()));
        assert!(!info.has_known_cdn);
    }

    #[test]
    fn test_redirect_validator_known_cdn() {
        let mut headers = actix_web::http::header::HeaderMap::new();
        headers.insert(actix_web::http::header::HeaderName::from_static("x-forwarded-for"), HeaderValue::from_static("1.2.3.4, cloudflare"));
        let info = RedirectValidator::validate(&headers);
        assert!(info.has_known_cdn);
    }
}
