use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct ValidationResult {
    is_valid: bool,
    message: String,
}

#[wasm_bindgen]
impl ValidationResult {
    #[wasm_bindgen(constructor)]
    pub fn new(is_valid: bool, message: String) -> ValidationResult {
        ValidationResult { is_valid, message }
    }

    #[wasm_bindgen(getter)]
    pub fn is_valid(&self) -> bool {
        self.is_valid
    }

    #[wasm_bindgen(getter)]
    pub fn message(&self) -> String {
        self.message.clone()
    }
}

#[wasm_bindgen]
pub fn validate_email(email: &str) -> ValidationResult {
    // 简单的邮箱验证逻辑，避免使用 regex crate
    if email.is_empty() {
        return ValidationResult::new(false, "Email cannot be empty".to_string());
    }

    if !email.contains('@') {
        return ValidationResult::new(false, "Email must contain @ symbol".to_string());
    }

    let parts: Vec<&str> = email.split('@').collect();
    if parts.len() != 2 {
        return ValidationResult::new(false, "Invalid email format".to_string());
    }

    let local = parts[0];
    let domain = parts[1];

    if local.is_empty() || domain.is_empty() {
        return ValidationResult::new(false, "Invalid email format".to_string());
    }

    if !domain.contains('.') {
        return ValidationResult::new(false, "Invalid domain format".to_string());
    }

    ValidationResult::new(true, "Valid email".to_string())
}

#[wasm_bindgen]
pub fn validate_password(password: &str) -> ValidationResult {
    if password.len() < 8 {
        return ValidationResult::new(false, "Password must be at least 8 characters long".to_string());
    }
    
    let has_uppercase = password.chars().any(|c| c.is_uppercase());
    let has_lowercase = password.chars().any(|c| c.is_lowercase());
    let has_digit = password.chars().any(|c| c.is_digit(10));
    
    if !has_uppercase {
        return ValidationResult::new(false, "Password must contain at least one uppercase letter".to_string());
    }
    
    if !has_lowercase {
        return ValidationResult::new(false, "Password must contain at least one lowercase letter".to_string());
    }
    
    if !has_digit {
        return ValidationResult::new(false, "Password must contain at least one digit".to_string());
    }
    
    ValidationResult::new(true, "Valid password".to_string())
}

#[wasm_bindgen]
pub fn validate_file_type(filename: &str) -> ValidationResult {
    let allowed_extensions = vec![
        ".litematic",
        ".schem", 
        ".schematic",
        ".nbt",
        ".structure"
    ];
    
    let filename_lower = filename.to_lowercase();
    
    for ext in allowed_extensions {
        if filename_lower.ends_with(ext) {
            return ValidationResult::new(true, "Valid file type".to_string());
        }
    }
    
    ValidationResult::new(
        false, 
        "Invalid file type. Allowed: .litematic, .schem, .schematic, .nbt, .structure".to_string()
    )
}

#[wasm_bindgen]
pub fn validate_file_size(size: i64) -> ValidationResult {
    const MAX_SIZE: i64 = 50 * 1024 * 1024; // 50MB
    
    if size <= 0 {
        return ValidationResult::new(false, "File size must be greater than 0".to_string());
    }
    
    if size > MAX_SIZE {
        return ValidationResult::new(false, "File size must be less than 50MB".to_string());
    }
    
    ValidationResult::new(true, "Valid file size".to_string())
}

#[wasm_bindgen]
pub fn sanitize_filename(filename: &str) -> String {
    // 移除或替换不安全的字符
    let mut sanitized = filename
        .chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
            c if c.is_control() => '_',
            c => c,
        })
        .collect::<String>();
    
    // 限制长度
    if sanitized.len() > 255 {
        sanitized.truncate(255);
    }
    
    // 确保不为空
    if sanitized.is_empty() {
        sanitized = "unnamed_file".to_string();
    }
    
    sanitized
}

#[wasm_bindgen]
pub fn generate_api_key() -> String {
    use uuid::Uuid;
    
    // 生成格式: npt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    let uuid1 = Uuid::new_v4().simple().to_string();
    let uuid2 = Uuid::new_v4().simple().to_string();
    
    format!("npt_{}{}", &uuid1[0..16], &uuid2[0..16])
}

#[wasm_bindgen]
pub fn is_valid_api_key_format(key: &str) -> bool {
    key.starts_with("npt_") && key.len() == 36
}

#[wasm_bindgen]
pub fn format_file_size(size: i64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB"];
    let mut size_f = size as f64;
    let mut unit_index = 0;
    
    while size_f >= 1024.0 && unit_index < UNITS.len() - 1 {
        size_f /= 1024.0;
        unit_index += 1;
    }
    
    if unit_index == 0 {
        format!("{} {}", size, UNITS[unit_index])
    } else {
        format!("{:.1} {}", size_f, UNITS[unit_index])
    }
}

#[wasm_bindgen]
pub fn get_file_extension(filename: &str) -> String {
    filename
        .rfind('.')
        .map(|i| filename[i..].to_lowercase())
        .unwrap_or_default()
}

#[wasm_bindgen]
pub fn is_anonymous_upload(user_id: Option<String>) -> bool {
    user_id.is_none()
}

// IP 地址验证
#[wasm_bindgen]
pub fn validate_ip_address(ip: &str) -> ValidationResult {
    // 简单的 IP 地址格式验证
    let parts: Vec<&str> = ip.split('.').collect();
    
    if parts.len() != 4 {
        return ValidationResult::new(false, "Invalid IP address format".to_string());
    }
    
    for part in parts {
        match part.parse::<u8>() {
            Ok(_) => continue,
            Err(_) => return ValidationResult::new(false, "Invalid IP address format".to_string()),
        }
    }
    
    ValidationResult::new(true, "Valid IP address".to_string())
}

// 时间格式化
#[wasm_bindgen]
pub fn format_timestamp(timestamp: &str) -> String {
    // 这里可以添加时间格式化逻辑
    // 目前直接返回原始时间戳
    timestamp.to_string()
}
