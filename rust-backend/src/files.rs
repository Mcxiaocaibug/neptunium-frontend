use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use crate::{ValidationResult, ProjectionFile};

#[derive(Debug, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct FileUploadResult {
    pub success: bool,
    pub message: String,
    pub file_id: Option<String>,
    pub storage_path: Option<String>,
}

#[wasm_bindgen]
impl FileUploadResult {
    #[wasm_bindgen(constructor)]
    pub fn new(
        success: bool,
        message: String,
        file_id: Option<String>,
        storage_path: Option<String>,
    ) -> FileUploadResult {
        FileUploadResult {
            success,
            message,
            file_id,
            storage_path,
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
    pub fn file_id(&self) -> Option<String> {
        self.file_id.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn storage_path(&self) -> Option<String> {
        self.storage_path.clone()
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct FileMetadata {
    pub filename: String,
    pub file_size: i64,
    pub file_type: String,
    pub mime_type: String,
    pub checksum: Option<String>,
}

#[wasm_bindgen]
impl FileMetadata {
    #[wasm_bindgen(constructor)]
    pub fn new(
        filename: String,
        file_size: i64,
        file_type: String,
        mime_type: String,
        checksum: Option<String>,
    ) -> FileMetadata {
        FileMetadata {
            filename,
            file_size,
            file_type,
            mime_type,
            checksum,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn filename(&self) -> String {
        self.filename.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn file_size(&self) -> i64 {
        self.file_size
    }

    #[wasm_bindgen(getter)]
    pub fn file_type(&self) -> String {
        self.file_type.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn mime_type(&self) -> String {
        self.mime_type.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn checksum(&self) -> Option<String> {
        self.checksum.clone()
    }
}

#[wasm_bindgen]
pub fn validate_file_upload(metadata: &FileMetadata) -> ValidationResult {
    // 验证文件名
    if metadata.filename().is_empty() {
        return ValidationResult::new(false, "Filename is required".to_string());
    }

    // 验证文件类型
    let type_validation = crate::validate_file_type(&metadata.filename());
    if !type_validation.is_valid() {
        return type_validation;
    }

    // 验证文件大小
    let size_validation = crate::validate_file_size(metadata.file_size());
    if !size_validation.is_valid() {
        return size_validation;
    }

    ValidationResult::new(true, "Valid file upload".to_string())
}

#[wasm_bindgen]
pub fn prepare_file_upload(
    filename: &str,
    file_size: i64,
    file_type: &str,
    upload_ip: &str,
    user_id: Option<String>,
) -> FileUploadResult {
    // 清理文件名
    let sanitized_filename = crate::sanitize_filename(filename);
    
    // 验证文件
    let metadata = FileMetadata::new(
        sanitized_filename.clone(),
        file_size,
        file_type.to_string(),
        get_mime_type(&sanitized_filename),
        None,
    );

    let validation = validate_file_upload(&metadata);
    if !validation.is_valid() {
        return FileUploadResult::new(
            false,
            validation.message(),
            None,
            None,
        );
    }

    // 创建投影文件记录
    let projection_file = ProjectionFile::new(
        sanitized_filename,
        file_size,
        file_type.to_string(),
        upload_ip.to_string(),
        user_id,
    );

    FileUploadResult::new(
        true,
        "File upload prepared successfully".to_string(),
        Some(projection_file.file_id()),
        Some(projection_file.storage_path()),
    )
}

#[wasm_bindgen]
pub fn get_mime_type(filename: &str) -> String {
    let extension = crate::get_file_extension(filename);
    
    match extension.as_str() {
        ".litematic" => "application/octet-stream",
        ".schem" => "application/octet-stream",
        ".schematic" => "application/octet-stream",
        ".nbt" => "application/octet-stream",
        ".structure" => "application/octet-stream",
        _ => "application/octet-stream",
    }.to_string()
}

#[wasm_bindgen]
pub fn generate_storage_path(file_id: &str, filename: &str) -> String {
    let extension = crate::get_file_extension(filename);
    let prefix = &file_id[0..2]; // 使用前两位作为目录前缀
    format!("projections/{}/{}{}", prefix, file_id, extension)
}

#[wasm_bindgen]
pub fn calculate_file_checksum(data: &[u8]) -> String {
    use sha2::{Sha256, Digest};
    use base64::{Engine as _, engine::general_purpose};
    
    let mut hasher = Sha256::new();
    hasher.update(data);
    let result = hasher.finalize();
    general_purpose::STANDARD.encode(result)
}

#[wasm_bindgen]
pub fn verify_file_checksum(data: &[u8], expected_checksum: &str) -> bool {
    let computed_checksum = calculate_file_checksum(data);
    computed_checksum == expected_checksum
}

// 文件搜索和过滤
#[derive(Debug, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct FileFilter {
    pub file_type: Option<String>,
    pub min_size: Option<i64>,
    pub max_size: Option<i64>,
    pub date_from: Option<String>,
    pub date_to: Option<String>,
    pub search_term: Option<String>,
}

#[wasm_bindgen]
impl FileFilter {
    #[wasm_bindgen(constructor)]
    pub fn new() -> FileFilter {
        FileFilter {
            file_type: None,
            min_size: None,
            max_size: None,
            date_from: None,
            date_to: None,
            search_term: None,
        }
    }

    #[wasm_bindgen(setter)]
    pub fn set_file_type(&mut self, file_type: Option<String>) {
        self.file_type = file_type;
    }

    #[wasm_bindgen(setter)]
    pub fn set_size_range(&mut self, min_size: Option<i64>, max_size: Option<i64>) {
        self.min_size = min_size;
        self.max_size = max_size;
    }

    #[wasm_bindgen(setter)]
    pub fn set_date_range(&mut self, date_from: Option<String>, date_to: Option<String>) {
        self.date_from = date_from;
        self.date_to = date_to;
    }

    #[wasm_bindgen(setter)]
    pub fn set_search_term(&mut self, search_term: Option<String>) {
        self.search_term = search_term;
    }
}

#[wasm_bindgen]
pub fn matches_file_filter(file: &ProjectionFile, filter: &FileFilter) -> bool {
    // 检查文件类型
    if let Some(ref file_type) = filter.file_type {
        if !file.file_type.eq_ignore_ascii_case(file_type) {
            return false;
        }
    }

    // 检查文件大小
    if let Some(min_size) = filter.min_size {
        if file.file_size < min_size {
            return false;
        }
    }

    if let Some(max_size) = filter.max_size {
        if file.file_size > max_size {
            return false;
        }
    }

    // 检查搜索词
    if let Some(ref search_term) = filter.search_term {
        let search_lower = search_term.to_lowercase();
        if !file.filename.to_lowercase().contains(&search_lower) {
            return false;
        }
    }

    true
}

// 文件统计
#[derive(Debug, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct FileStats {
    pub total_files: i32,
    pub total_size: i64,
    pub by_type: String, // JSON 字符串
}

#[wasm_bindgen]
impl FileStats {
    #[wasm_bindgen(constructor)]
    pub fn new(total_files: i32, total_size: i64, by_type: String) -> FileStats {
        FileStats {
            total_files,
            total_size,
            by_type,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn total_files(&self) -> i32 {
        self.total_files
    }

    #[wasm_bindgen(getter)]
    pub fn total_size(&self) -> i64 {
        self.total_size
    }

    #[wasm_bindgen(getter)]
    pub fn by_type(&self) -> String {
        self.by_type.clone()
    }
}

#[wasm_bindgen]
pub fn file_metadata_to_json(metadata: &FileMetadata) -> String {
    serde_json::to_string(metadata).unwrap_or_default()
}

#[wasm_bindgen]
pub fn file_filter_to_json(filter: &FileFilter) -> String {
    serde_json::to_string(filter).unwrap_or_default()
}
