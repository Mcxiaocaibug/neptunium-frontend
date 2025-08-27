use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

// 简化的数据库查询构建器，专为 WASM 环境设计
// 生成 SQL 查询字符串，由 TypeScript 层执行

#[wasm_bindgen]
pub fn build_create_user_query(email: &str, password_hash: &str, is_verified: bool) -> String {
    serde_json::json!({
        "query": "INSERT INTO users (email, password_hash, is_verified) VALUES ($1, $2, $3) RETURNING *",
        "params": [email, password_hash, is_verified]
    }).to_string()
}

#[wasm_bindgen]
pub fn build_find_user_by_email_query(email: &str) -> String {
    serde_json::json!({
        "query": "SELECT * FROM users WHERE email = $1",
        "params": [email]
    }).to_string()
}

#[wasm_bindgen]
pub fn build_verify_user_query(user_id: &str) -> String {
    serde_json::json!({
        "query": "UPDATE users SET is_verified = true, updated_at = NOW() WHERE id = $1",
        "params": [user_id]
    }).to_string()
}

#[wasm_bindgen]
pub fn build_create_projection_file_query(
    file_id: &str,
    user_id: Option<String>,
    filename: &str,
    original_filename: &str,
    file_size: i64,
    file_type: &str,
    mime_type: &str,
    storage_path: &str,
    storage_url: &str,
    checksum: &str,
    upload_ip: &str,
) -> String {
    serde_json::json!({
        "query": "INSERT INTO projection_files (file_id, user_id, filename, original_filename, file_size, file_type, mime_type, storage_path, storage_url, checksum, upload_ip) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *",
        "params": [file_id, user_id, filename, original_filename, file_size, file_type, mime_type, storage_path, storage_url, checksum, upload_ip]
    }).to_string()
}

#[wasm_bindgen]
pub fn build_find_projection_file_query(file_id: &str) -> String {
    serde_json::json!({
        "query": "SELECT * FROM projection_files WHERE file_id = $1",
        "params": [file_id]
    }).to_string()
}

#[wasm_bindgen]
pub fn build_find_user_files_query(user_id: &str, limit: i32, offset: i32) -> String {
    serde_json::json!({
        "query": "SELECT * FROM projection_files WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
        "params": [user_id, limit, offset]
    }).to_string()
}

#[wasm_bindgen]
pub fn build_create_api_key_query(
    user_id: &str,
    key_hash: &str,
    key_prefix: &str,
    name: &str,
    description: &str,
) -> String {
    serde_json::json!({
        "query": "INSERT INTO api_keys (user_id, key_hash, key_prefix, name, description, permissions, is_active, usage_count, rate_limit) VALUES ($1, $2, $3, $4, $5, $6, true, 0, 1000) RETURNING *",
        "params": [user_id, key_hash, key_prefix, name, description, serde_json::json!(["read", "write"])]
    }).to_string()
}

#[wasm_bindgen]
pub fn build_find_user_api_keys_query(user_id: &str) -> String {
    serde_json::json!({
        "query": "SELECT * FROM api_keys WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC",
        "params": [user_id]
    }).to_string()
}

#[wasm_bindgen]
pub fn build_create_verification_code_query(email: &str, code: &str, expires_in_minutes: i32) -> String {
    serde_json::json!({
        "query": "INSERT INTO verification_codes (email, code, type, expires_at) VALUES ($1, $2, 'email_verification', NOW() + INTERVAL $3) RETURNING *",
        "params": [email, code, format!("{} minutes", expires_in_minutes)]
    }).to_string()
}

#[wasm_bindgen]
pub fn build_verify_code_query(email: &str, code: &str) -> String {
    serde_json::json!({
        "query": "SELECT * FROM verification_codes WHERE email = $1 AND code = $2 AND expires_at > NOW() AND used_at IS NULL",
        "params": [email, code]
    }).to_string()
}

#[wasm_bindgen]
pub fn build_mark_code_used_query(code_id: &str) -> String {
    serde_json::json!({
        "query": "UPDATE verification_codes SET used_at = NOW() WHERE id = $1",
        "params": [code_id]
    }).to_string()
}
