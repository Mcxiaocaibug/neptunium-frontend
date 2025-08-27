use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub database: DatabaseConfig,
    pub redis: RedisConfig,
    pub storage: StorageConfig,
    pub email: EmailConfig,
    pub jwt: JwtConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RedisConfig {
    pub url: String,
    pub token: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageConfig {
    pub account_id: String,
    pub access_key_id: String,
    pub secret_access_key: String,
    pub bucket_name: String,
    pub endpoint: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailConfig {
    pub api_key: String,
    pub from_email: String,
    pub from_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtConfig {
    pub secret: String,
    pub expires_in: i64,
}

impl Config {
    pub fn from_env() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Config {
            database: DatabaseConfig {
                url: env::var("SUPABASE_DATABASE_URL")
                    .or_else(|_| env::var("DATABASE_URL"))
                    .map_err(|_| "DATABASE_URL not found")?,
                max_connections: env::var("DATABASE_MAX_CONNECTIONS")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse()
                    .unwrap_or(10),
            },
            redis: RedisConfig {
                url: env::var("UPSTASH_REDIS_REST_URL")
                    .map_err(|_| "UPSTASH_REDIS_REST_URL not found")?,
                token: env::var("UPSTASH_REDIS_REST_TOKEN")
                    .map_err(|_| "UPSTASH_REDIS_REST_TOKEN not found")?,
            },
            storage: StorageConfig {
                account_id: env::var("CLOUDFLARE_ACCOUNT_ID")
                    .map_err(|_| "CLOUDFLARE_ACCOUNT_ID not found")?,
                access_key_id: env::var("CLOUDFLARE_R2_ACCESS_KEY_ID")
                    .map_err(|_| "CLOUDFLARE_R2_ACCESS_KEY_ID not found")?,
                secret_access_key: env::var("CLOUDFLARE_R2_SECRET_ACCESS_KEY")
                    .map_err(|_| "CLOUDFLARE_R2_SECRET_ACCESS_KEY not found")?,
                bucket_name: env::var("CLOUDFLARE_R2_BUCKET_NAME")
                    .map_err(|_| "CLOUDFLARE_R2_BUCKET_NAME not found")?,
                endpoint: env::var("CLOUDFLARE_R2_ENDPOINT")
                    .unwrap_or_else(|_| format!("https://{}.r2.cloudflarestorage.com", 
                        env::var("CLOUDFLARE_ACCOUNT_ID").unwrap_or_default())),
            },
            email: EmailConfig {
                api_key: env::var("RESEND_API_KEY")
                    .map_err(|_| "RESEND_API_KEY not found")?,
                from_email: env::var("RESEND_FROM_EMAIL")
                    .unwrap_or_else(|_| "noreply@neptunium.app".to_string()),
                from_name: env::var("RESEND_FROM_NAME")
                    .unwrap_or_else(|_| "Neptunium".to_string()),
            },
            jwt: JwtConfig {
                secret: env::var("JWT_SECRET")
                    .map_err(|_| "JWT_SECRET not found")?,
                expires_in: env::var("JWT_EXPIRES_IN")
                    .unwrap_or_else(|_| "86400".to_string()) // 24 hours
                    .parse()
                    .unwrap_or(86400),
            },
        })
    }
}

// 全局配置实例
static mut CONFIG: Option<Config> = None;

pub fn init_config() -> Result<(), Box<dyn std::error::Error>> {
    let config = Config::from_env()?;
    unsafe {
        CONFIG = Some(config);
    }
    Ok(())
}

pub fn get_config() -> &'static Config {
    unsafe {
        CONFIG.as_ref().expect("Config not initialized")
    }
}
