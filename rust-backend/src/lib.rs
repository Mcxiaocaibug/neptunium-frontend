use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sha2::{Sha256, Digest};
use base64::{Engine as _, engine::general_purpose};

mod config;
mod utils;
mod auth;
mod files;

pub use config::*;
pub use utils::*;
pub use auth::*;
pub use files::*;

// 初始化 WASM 模块
#[wasm_bindgen(start)]
pub fn main() {
    console_log::init_with_level(log::Level::Info).expect("Failed to initialize logger");
    log::info!("Neptunium WASM module initialized");
}

// 数据结构定义
#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct User {
    pub id: String,
    pub email: String,
    pub password_hash: String,
    pub is_verified: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[wasm_bindgen]
impl User {
    #[wasm_bindgen(constructor)]
    pub fn new(email: String, password_hash: String) -> User {
        let now = Utc::now().to_rfc3339();
        User {
            id: Uuid::new_v4().to_string(),
            email,
            password_hash,
            is_verified: false,
            created_at: now.clone(),
            updated_at: now,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn id(&self) -> String {
        self.id.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn email(&self) -> String {
        self.email.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn is_verified(&self) -> bool {
        self.is_verified
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct ProjectionFile {
    pub id: String,
    pub file_id: String, // 6位数ID
    pub user_id: Option<String>,
    pub filename: String,
    pub file_size: i64,
    pub file_type: String,
    pub storage_path: String,
    pub upload_ip: String,
    pub created_at: String,
}

#[wasm_bindgen]
impl ProjectionFile {
    #[wasm_bindgen(constructor)]
    pub fn new(
        filename: String,
        file_size: i64,
        file_type: String,
        upload_ip: String,
        user_id: Option<String>,
    ) -> ProjectionFile {
        let file_id = generate_file_id();
        let storage_path = format!("projections/{}/{}", &file_id[0..2], file_id);
        
        ProjectionFile {
            id: Uuid::new_v4().to_string(),
            file_id,
            user_id,
            filename,
            file_size,
            file_type,
            storage_path,
            upload_ip,
            created_at: Utc::now().to_rfc3339(),
        }
    }

    #[wasm_bindgen(getter)]
    pub fn file_id(&self) -> String {
        self.file_id.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn storage_path(&self) -> String {
        self.storage_path.clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct ApiKey {
    pub id: String,
    pub user_id: String,
    pub key_hash: String,
    pub name: String,
    pub is_active: bool,
    pub last_used_at: Option<String>,
    pub created_at: String,
}

#[wasm_bindgen]
impl ApiKey {
    #[wasm_bindgen(constructor)]
    pub fn new(user_id: String, name: String, raw_key: String) -> ApiKey {
        let key_hash = hash_string(&raw_key);
        
        ApiKey {
            id: Uuid::new_v4().to_string(),
            user_id,
            key_hash,
            name,
            is_active: true,
            last_used_at: None,
            created_at: Utc::now().to_rfc3339(),
        }
    }

    #[wasm_bindgen(getter)]
    pub fn id(&self) -> String {
        self.id.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn key_hash(&self) -> String {
        self.key_hash.clone()
    }
}

// 导出的函数
#[wasm_bindgen]
pub fn generate_file_id() -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let mut hasher = DefaultHasher::new();
    Uuid::new_v4().hash(&mut hasher);
    let hash = hasher.finish();
    
    // 生成6位数字ID
    format!("{:06}", hash % 1000000)
}

#[wasm_bindgen]
pub fn hash_string(input: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    let result = hasher.finalize();
    general_purpose::STANDARD.encode(result)
}

#[wasm_bindgen]
pub fn verify_hash(input: &str, hash: &str) -> bool {
    let computed_hash = hash_string(input);
    computed_hash == hash
}

#[wasm_bindgen]
pub fn generate_verification_code() -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let mut hasher = DefaultHasher::new();
    Uuid::new_v4().hash(&mut hasher);
    let hash = hasher.finish();
    
    // 生成6位验证码
    format!("{:06}", hash % 1000000)
}

// JSON 序列化辅助函数
#[wasm_bindgen]
pub fn user_to_json(user: &User) -> String {
    serde_json::to_string(user).unwrap_or_default()
}

#[wasm_bindgen]
pub fn projection_file_to_json(file: &ProjectionFile) -> String {
    serde_json::to_string(file).unwrap_or_default()
}

#[wasm_bindgen]
pub fn api_key_to_json(key: &ApiKey) -> String {
    serde_json::to_string(key).unwrap_or_default()
}

// 错误处理
#[derive(Debug, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct NeptuniumError {
    pub message: String,
    pub code: String,
}

#[wasm_bindgen]
impl NeptuniumError {
    #[wasm_bindgen(constructor)]
    pub fn new(message: String, code: String) -> NeptuniumError {
        NeptuniumError { message, code }
    }

    #[wasm_bindgen(getter)]
    pub fn message(&self) -> String {
        self.message.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn code(&self) -> String {
        self.code.clone()
    }
}

// 日志函数
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn log_info(message: &str) {
    log(&format!("[INFO] {}", message));
}

#[wasm_bindgen]
pub fn log_error(message: &str) {
    log(&format!("[ERROR] {}", message));
}
