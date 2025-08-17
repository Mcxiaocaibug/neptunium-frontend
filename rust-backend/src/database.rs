use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use crate::config::get_config;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub password_hash: String,
    pub is_verified: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectionFile {
    pub id: Uuid,
    pub file_id: String, // 6位数ID
    pub user_id: Option<Uuid>, // 可为空，支持匿名上传
    pub filename: String,
    pub file_size: i64,
    pub file_type: String,
    pub storage_path: String,
    pub upload_ip: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiKey {
    pub id: Uuid,
    pub user_id: Uuid,
    pub key_hash: String,
    pub name: String,
    pub is_active: bool,
    pub last_used_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationCode {
    pub email: String,
    pub code: String,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

pub struct Database {
    // 这里我们使用 HTTP 客户端来调用 Supabase REST API
    // 因为在 WASM 环境中无法直接使用 PostgreSQL 连接
    client: reqwest::Client,
    base_url: String,
    api_key: String,
}

impl Database {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let config = get_config();
        
        // 从 Supabase URL 构建 REST API URL
        let base_url = config.database.url
            .replace("postgresql://", "https://")
            .split('@').nth(1)
            .ok_or("Invalid database URL")?
            .split('/').next()
            .ok_or("Invalid database URL")?;
        
        let rest_url = format!("https://{}/rest/v1", base_url);
        
        Ok(Database {
            client: reqwest::Client::new(),
            base_url: rest_url,
            api_key: std::env::var("SUPABASE_ANON_KEY")
                .map_err(|_| "SUPABASE_ANON_KEY not found")?,
        })
    }

    // 用户相关操作
    pub async fn create_user(&self, email: &str, password_hash: &str) -> Result<User, Box<dyn std::error::Error>> {
        let user = User {
            id: Uuid::new_v4(),
            email: email.to_string(),
            password_hash: password_hash.to_string(),
            is_verified: false,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let response = self.client
            .post(&format!("{}/users", self.base_url))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&user)
            .send()
            .await?;

        if response.status().is_success() {
            Ok(user)
        } else {
            Err(format!("Failed to create user: {}", response.status()).into())
        }
    }

    pub async fn get_user_by_email(&self, email: &str) -> Result<Option<User>, Box<dyn std::error::Error>> {
        let response = self.client
            .get(&format!("{}/users", self.base_url))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .query(&[("email", format!("eq.{}", email))])
            .send()
            .await?;

        if response.status().is_success() {
            let users: Vec<User> = response.json().await?;
            Ok(users.into_iter().next())
        } else {
            Ok(None)
        }
    }

    pub async fn verify_user(&self, user_id: Uuid) -> Result<(), Box<dyn std::error::Error>> {
        let update_data = serde_json::json!({
            "is_verified": true,
            "updated_at": Utc::now()
        });

        let response = self.client
            .patch(&format!("{}/users", self.base_url))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .query(&[("id", format!("eq.{}", user_id))])
            .json(&update_data)
            .send()
            .await?;

        if response.status().is_success() {
            Ok(())
        } else {
            Err(format!("Failed to verify user: {}", response.status()).into())
        }
    }

    // 投影文件相关操作
    pub async fn create_projection_file(&self, file: &ProjectionFile) -> Result<(), Box<dyn std::error::Error>> {
        let response = self.client
            .post(&format!("{}/projection_files", self.base_url))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(file)
            .send()
            .await?;

        if response.status().is_success() {
            Ok(())
        } else {
            Err(format!("Failed to create projection file: {}", response.status()).into())
        }
    }

    pub async fn get_projection_file_by_id(&self, file_id: &str) -> Result<Option<ProjectionFile>, Box<dyn std::error::Error>> {
        let response = self.client
            .get(&format!("{}/projection_files", self.base_url))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .query(&[("file_id", format!("eq.{}", file_id))])
            .send()
            .await?;

        if response.status().is_success() {
            let files: Vec<ProjectionFile> = response.json().await?;
            Ok(files.into_iter().next())
        } else {
            Ok(None)
        }
    }

    pub async fn get_user_files(&self, user_id: Uuid) -> Result<Vec<ProjectionFile>, Box<dyn std::error::Error>> {
        let response = self.client
            .get(&format!("{}/projection_files", self.base_url))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .query(&[("user_id", format!("eq.{}", user_id))])
            .send()
            .await?;

        if response.status().is_success() {
            let files: Vec<ProjectionFile> = response.json().await?;
            Ok(files)
        } else {
            Ok(vec![])
        }
    }

    // API 密钥相关操作
    pub async fn create_api_key(&self, api_key: &ApiKey) -> Result<(), Box<dyn std::error::Error>> {
        let response = self.client
            .post(&format!("{}/api_keys", self.base_url))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(api_key)
            .send()
            .await?;

        if response.status().is_success() {
            Ok(())
        } else {
            Err(format!("Failed to create API key: {}", response.status()).into())
        }
    }

    pub async fn get_user_api_keys(&self, user_id: Uuid) -> Result<Vec<ApiKey>, Box<dyn std::error::Error>> {
        let response = self.client
            .get(&format!("{}/api_keys", self.base_url))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .query(&[("user_id", format!("eq.{}", user_id))])
            .send()
            .await?;

        if response.status().is_success() {
            let keys: Vec<ApiKey> = response.json().await?;
            Ok(keys)
        } else {
            Ok(vec![])
        }
    }
}
