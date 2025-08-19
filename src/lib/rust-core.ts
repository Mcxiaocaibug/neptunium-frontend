/**
 * Neptunium Rust Core - TypeScript 包装器
 * 
 * 这个模块提供了对 Rust WASM 核心功能的 TypeScript 接口
 */

// 类型定义
export interface User {
  id: string;
  email: string;
  password_hash: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectionFile {
  id: string;
  file_id: string;
  user_id?: string;
  filename: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  upload_ip: string;
  created_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  key_hash: string;
  name: string;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
}

export interface ValidationResult {
  is_valid: boolean;
  message: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  token?: string;
  user_id?: string;
}

export interface FileUploadResult {
  success: boolean;
  message: string;
  file_id?: string;
  storage_path?: string;
}

export interface FileMetadata {
  filename: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  checksum?: string;
}

// WASM 模块引用
let wasmModule: any = null;
let isInitialized = false;

/**
 * 初始化 Rust WASM 模块
 */
export async function initRustCore(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    // 尝试动态导入 WASM 模块（兼容无类型的占位 .d.ts）
    const wasmInit: any = await import('@/lib/wasm/neptunium_core');
    if (wasmInit && typeof wasmInit.default === 'function') {
      await wasmInit.default();
    }
    wasmModule = wasmInit;
    isInitialized = true;
    console.log('✅ Rust WASM module initialized');
  } catch (error) {
    console.warn('⚠️ Rust WASM module not available, using fallback:', error);

    try {
      // 使用 JavaScript 后备实现
      const fallbackModule: any = await import('@/lib/wasm-fallback');
      if (fallbackModule && typeof fallbackModule.default === 'function') {
        await fallbackModule.default();
      }
      wasmModule = fallbackModule;
      isInitialized = true;
      console.log('✅ Rust fallback module initialized');
    } catch (fallbackError) {
      console.error('❌ Failed to initialize fallback module:', fallbackError);
      throw new Error('Failed to initialize Rust core and fallback');
    }
  }
}

/**
 * 确保 WASM 模块已初始化
 */
function ensureInitialized(): void {
  if (!isInitialized || !wasmModule) {
    throw new Error('Rust WASM module not initialized. Call initRustCore() first.');
  }
}

// 工具函数
export function generateFileId(): string {
  ensureInitialized();
  return wasmModule.generate_file_id();
}

export function hashString(input: string): string {
  ensureInitialized();
  return wasmModule.hash_string(input);
}

export function verifyHash(input: string, hash: string): boolean {
  ensureInitialized();
  return wasmModule.verify_hash(input, hash);
}

export function generateVerificationCode(): string {
  ensureInitialized();
  return wasmModule.generate_verification_code();
}

export function generateApiKey(): string {
  ensureInitialized();
  return wasmModule.generate_api_key();
}

export function sanitizeFilename(filename: string): string {
  ensureInitialized();
  return wasmModule.sanitize_filename(filename);
}

export function formatFileSize(size: number): string {
  ensureInitialized();
  return wasmModule.format_file_size(size);
}

// 验证函数
export function validateEmail(email: string): ValidationResult {
  ensureInitialized();
  const result = wasmModule.validate_email(email);
  return {
    is_valid: result.is_valid(),
    message: result.message(),
  };
}

export function validatePassword(password: string): ValidationResult {
  ensureInitialized();
  const result = wasmModule.validate_password(password);
  return {
    is_valid: result.is_valid(),
    message: result.message(),
  };
}

export function validateFileType(filename: string): ValidationResult {
  ensureInitialized();
  const result = wasmModule.validate_file_type(filename);
  return {
    is_valid: result.is_valid(),
    message: result.message(),
  };
}

export function validateFileSize(size: number): ValidationResult {
  ensureInitialized();
  const result = wasmModule.validate_file_size(size);
  return {
    is_valid: result.is_valid(),
    message: result.message(),
  };
}

// 认证函数
export function hashPassword(password: string): string {
  ensureInitialized();
  return wasmModule.hash_password(password);
}

export function verifyPassword(password: string, hash: string): boolean {
  ensureInitialized();
  return wasmModule.verify_password(password, hash);
}

export function validateLoginCredentials(email: string, password: string): ValidationResult {
  ensureInitialized();
  const result = wasmModule.validate_login_credentials(email, password);
  return {
    is_valid: result.is_valid(),
    message: result.message(),
  };
}

export function validateRegistrationData(
  email: string,
  password: string,
  confirmPassword: string
): ValidationResult {
  ensureInitialized();
  const result = wasmModule.validate_registration_data(email, password, confirmPassword);
  return {
    is_valid: result.is_valid(),
    message: result.message(),
  };
}

export function createTokenPayload(
  userId: string,
  email: string,
  expiresInSeconds: number
): string {
  ensureInitialized();
  return wasmModule.create_token_payload(userId, email, expiresInSeconds);
}

export function isTokenExpired(exp: number): boolean {
  ensureInitialized();
  return wasmModule.is_token_expired(exp);
}

// 文件处理函数
export function prepareFileUpload(
  filename: string,
  fileSize: number,
  fileType: string,
  uploadIp: string,
  userId?: string
): FileUploadResult {
  ensureInitialized();
  const result = wasmModule.prepare_file_upload(filename, fileSize, fileType, uploadIp, userId || null);
  return {
    success: result.success(),
    message: result.message(),
    file_id: result.file_id(),
    storage_path: result.storage_path(),
  };
}

export function getMimeType(filename: string): string {
  ensureInitialized();
  return wasmModule.get_mime_type(filename);
}

export function generateStoragePath(fileId: string, filename: string): string {
  ensureInitialized();
  return wasmModule.generate_storage_path(fileId, filename);
}

export function calculateFileChecksum(data: Uint8Array): string {
  ensureInitialized();
  return wasmModule.calculate_file_checksum(data);
}

export function verifyFileChecksum(data: Uint8Array, expectedChecksum: string): boolean {
  ensureInitialized();
  return wasmModule.verify_file_checksum(data, expectedChecksum);
}

// 实体创建函数
export function createUser(email: string, passwordHash: string): User {
  ensureInitialized();
  const user = new wasmModule.User(email, passwordHash);
  return {
    id: user.id(),
    email: user.email(),
    password_hash: passwordHash,
    is_verified: user.is_verified(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function createProjectionFile(
  filename: string,
  fileSize: number,
  fileType: string,
  uploadIp: string,
  userId?: string
): ProjectionFile {
  ensureInitialized();
  const file = new wasmModule.ProjectionFile(filename, fileSize, fileType, uploadIp, userId || null);
  return {
    id: crypto.randomUUID(),
    file_id: file.file_id(),
    user_id: userId,
    filename,
    file_size: fileSize,
    file_type: fileType,
    storage_path: file.storage_path(),
    upload_ip: uploadIp,
    created_at: new Date().toISOString(),
  };
}

export function createApiKey(userId: string, name: string, rawKey: string): ApiKey {
  ensureInitialized();
  const apiKey = new wasmModule.ApiKey(userId, name, rawKey);
  return {
    id: apiKey.id(),
    user_id: userId,
    key_hash: apiKey.key_hash(),
    name,
    is_active: true,
    created_at: new Date().toISOString(),
  };
}

// 错误处理
export class RustCoreError extends Error {
  public code: string;

  constructor(message: string, code: string = 'RUST_CORE_ERROR') {
    super(message);
    this.name = 'RustCoreError';
    this.code = code;
  }
}

// 日志函数
export function logInfo(message: string): void {
  if (isInitialized && wasmModule) {
    wasmModule.log_info(message);
  } else {
    console.log(`[Rust Core] ${message}`);
  }
}

export function logError(message: string): void {
  if (isInitialized && wasmModule) {
    wasmModule.log_error(message);
  } else {
    console.error(`[Rust Core] ${message}`);
  }
}
