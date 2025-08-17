use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use crate::{hash_string, verify_hash, ValidationResult};

#[derive(Debug, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct AuthResult {
    pub success: bool,
    pub message: String,
    pub token: Option<String>,
    pub user_id: Option<String>,
}

#[wasm_bindgen]
impl AuthResult {
    #[wasm_bindgen(constructor)]
    pub fn new(success: bool, message: String, token: Option<String>, user_id: Option<String>) -> AuthResult {
        AuthResult {
            success,
            message,
            token,
            user_id,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn success(&self) -> bool {
        self.success
    }

    #[wasm_bindgen(getter)]
    pub fn message(&self) -> String {
        self.message.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn token(&self) -> Option<String> {
        self.token.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn user_id(&self) -> Option<String> {
        self.user_id.clone()
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct TokenClaims {
    pub user_id: String,
    pub email: String,
    pub exp: i64,
    pub iat: i64,
}

#[wasm_bindgen]
impl TokenClaims {
    #[wasm_bindgen(constructor)]
    pub fn new(user_id: String, email: String, exp: i64, iat: i64) -> TokenClaims {
        TokenClaims {
            user_id,
            email,
            exp,
            iat,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn user_id(&self) -> String {
        self.user_id.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn email(&self) -> String {
        self.email.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn exp(&self) -> i64 {
        self.exp
    }

    #[wasm_bindgen(getter)]
    pub fn iat(&self) -> i64 {
        self.iat
    }
}

#[wasm_bindgen]
pub fn hash_password(password: &str) -> String {
    // 使用简单的哈希 + 盐值
    let salt = "neptunium_salt_2024";
    let salted_password = format!("{}{}", password, salt);
    hash_string(&salted_password)
}

#[wasm_bindgen]
pub fn verify_password(password: &str, hash: &str) -> bool {
    let computed_hash = hash_password(password);
    computed_hash == hash
}

#[wasm_bindgen]
pub fn validate_login_credentials(email: &str, password: &str) -> ValidationResult {
    if email.is_empty() {
        return ValidationResult::new(false, "Email is required".to_string());
    }
    
    if password.is_empty() {
        return ValidationResult::new(false, "Password is required".to_string());
    }
    
    ValidationResult::new(true, "Valid credentials".to_string())
}

#[wasm_bindgen]
pub fn validate_registration_data(email: &str, password: &str, confirm_password: &str) -> ValidationResult {
    // 验证邮箱
    let email_validation = crate::validate_email(email);
    if !email_validation.is_valid() {
        return email_validation;
    }
    
    // 验证密码
    let password_validation = crate::validate_password(password);
    if !password_validation.is_valid() {
        return password_validation;
    }
    
    // 验证密码确认
    if password != confirm_password {
        return ValidationResult::new(false, "Passwords do not match".to_string());
    }
    
    ValidationResult::new(true, "Valid registration data".to_string())
}

// JWT 相关函数（简化版本，实际 JWT 生成在 TypeScript 层处理）
#[wasm_bindgen]
pub fn create_token_payload(user_id: &str, email: &str, expires_in_seconds: i64) -> String {
    use chrono::Utc;
    
    let now = Utc::now().timestamp();
    let exp = now + expires_in_seconds;
    
    let claims = TokenClaims::new(
        user_id.to_string(),
        email.to_string(),
        exp,
        now,
    );
    
    serde_json::to_string(&claims).unwrap_or_default()
}

#[wasm_bindgen]
pub fn is_token_expired(exp: i64) -> bool {
    use chrono::Utc;
    let now = Utc::now().timestamp();
    now > exp
}

// API 密钥验证
#[wasm_bindgen]
pub fn validate_api_key_name(name: &str) -> ValidationResult {
    if name.is_empty() {
        return ValidationResult::new(false, "API key name is required".to_string());
    }
    
    if name.len() > 100 {
        return ValidationResult::new(false, "API key name must be less than 100 characters".to_string());
    }
    
    // 检查是否包含特殊字符
    let allowed_chars = name.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '-' || c == ' ');
    if !allowed_chars {
        return ValidationResult::new(false, "API key name can only contain letters, numbers, spaces, hyphens, and underscores".to_string());
    }
    
    ValidationResult::new(true, "Valid API key name".to_string())
}

// 验证码相关
#[wasm_bindgen]
pub fn is_verification_code_valid(code: &str) -> ValidationResult {
    if code.len() != 6 {
        return ValidationResult::new(false, "Verification code must be 6 digits".to_string());
    }
    
    if !code.chars().all(|c| c.is_digit(10)) {
        return ValidationResult::new(false, "Verification code must contain only digits".to_string());
    }
    
    ValidationResult::new(true, "Valid verification code".to_string())
}

// 权限检查
#[wasm_bindgen]
pub fn check_user_permissions(user_id: &str, resource: &str, action: &str) -> bool {
    // 简单的权限检查逻辑
    // 在实际应用中，这里会查询数据库中的用户权限
    
    match action {
        "read" => true, // 所有用户都可以读取自己的资源
        "write" | "delete" => {
            // 只有资源所有者可以写入或删除
            // 这里需要在 TypeScript 层传入资源所有者信息进行比较
            true // 简化处理
        }
        _ => false,
    }
}

// 会话管理
#[derive(Debug, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct SessionInfo {
    pub user_id: String,
    pub email: String,
    pub is_verified: bool,
    pub created_at: String,
    pub expires_at: String,
}

#[wasm_bindgen]
impl SessionInfo {
    #[wasm_bindgen(constructor)]
    pub fn new(
        user_id: String,
        email: String,
        is_verified: bool,
        created_at: String,
        expires_at: String,
    ) -> SessionInfo {
        SessionInfo {
            user_id,
            email,
            is_verified,
            created_at,
            expires_at,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn user_id(&self) -> String {
        self.user_id.clone()
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

#[wasm_bindgen]
pub fn session_info_to_json(session: &SessionInfo) -> String {
    serde_json::to_string(session).unwrap_or_default()
}
