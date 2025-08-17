/**
 * Fallback WASM module for environments where Rust compilation is not available
 * This provides JavaScript implementations of the Rust functions
 */

// Crypto utilities for fallback implementations
const crypto = require('crypto');

// Generate a random 6-digit file ID
export function generate_file_id() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate a random API key
export function generate_api_key() {
  return 'npt_' + crypto.randomBytes(32).toString('hex');
}

// Generate a 6-digit verification code
export function generate_verification_code() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash a string using SHA-256
export function hash_string(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// Hash a password using bcrypt-like approach (simplified)
export function hash_password(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `$pbkdf2$${salt}$${hash}`;
}

// Verify a password against a hash
export function verify_password(password, hash) {
  try {
    const parts = hash.split('$');
    if (parts.length !== 4 || parts[0] !== '' || parts[1] !== 'pbkdf2') {
      return false;
    }
    const salt = parts[2];
    const originalHash = parts[3];
    const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return testHash === originalHash;
  } catch (error) {
    return false;
  }
}

// Verify a hash
export function verify_hash(input, hash) {
  const computed = hash_string(input);
  return computed === hash;
}

// Sanitize filename
export function sanitize_filename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
}

// Format file size
export function format_file_size(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get file extension
export function get_file_extension(filename) {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.substring(lastDot);
}

// Get MIME type
export function get_mime_type(filename) {
  const ext = get_file_extension(filename).toLowerCase();
  const mimeTypes = {
    '.litematic': 'application/octet-stream',
    '.schem': 'application/octet-stream',
    '.schematic': 'application/octet-stream',
    '.nbt': 'application/octet-stream',
    '.structure': 'application/octet-stream'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Validation functions
export function validate_email(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  return {
    is_valid: () => isValid,
    message: () => isValid ? 'Valid email' : 'Invalid email format'
  };
}

export function validate_password(password) {
  const isValid = password && password.length >= 8;
  return {
    is_valid: () => isValid,
    message: () => isValid ? 'Valid password' : 'Password must be at least 8 characters'
  };
}

export function validate_file_type(filename) {
  const ext = get_file_extension(filename).toLowerCase();
  const validTypes = ['.litematic', '.schem', '.schematic', '.nbt', '.structure'];
  const isValid = validTypes.includes(ext);
  return {
    is_valid: () => isValid,
    message: () => isValid ? 'Valid file type' : 'Unsupported file type'
  };
}

export function validate_file_size(size) {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const isValid = size > 0 && size <= maxSize;
  return {
    is_valid: () => isValid,
    message: () => isValid ? 'Valid file size' : 'File size must be between 1 byte and 50MB'
  };
}

export function validate_login_credentials(email, password) {
  const emailValid = validate_email(email).is_valid();
  const passwordValid = validate_password(password).is_valid();
  const isValid = emailValid && passwordValid;
  return {
    is_valid: () => isValid,
    message: () => isValid ? 'Valid credentials' : 'Invalid email or password'
  };
}

export function validate_registration_data(email, password, confirmPassword) {
  const emailValid = validate_email(email).is_valid();
  const passwordValid = validate_password(password).is_valid();
  const passwordsMatch = password === confirmPassword;
  const isValid = emailValid && passwordValid && passwordsMatch;
  
  let message = 'Valid registration data';
  if (!emailValid) message = 'Invalid email format';
  else if (!passwordValid) message = 'Password must be at least 8 characters';
  else if (!passwordsMatch) message = 'Passwords do not match';
  
  return {
    is_valid: () => isValid,
    message: () => message
  };
}

// Token functions
export function create_token_payload(userId, email, expiresInSeconds) {
  const payload = {
    sub: userId,
    email: email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds
  };
  return JSON.stringify(payload);
}

export function is_token_expired(exp) {
  return exp < Math.floor(Date.now() / 1000);
}

// File upload preparation
export function prepare_file_upload(filename, fileSize, fileType, uploadIp, userId) {
  const fileId = generate_file_id();
  const sanitizedFilename = sanitize_filename(filename);
  const storagePath = `projections/${fileId.substring(0, 2)}/${fileId}${get_file_extension(sanitizedFilename)}`;
  
  return {
    success: () => true,
    message: () => 'File upload prepared successfully',
    file_id: () => fileId,
    storage_path: () => storagePath
  };
}

// Calculate file checksum
export function calculate_file_checksum(data) {
  return crypto.createHash('sha256').update(data).digest('base64');
}

// Verify file checksum
export function verify_file_checksum(data, expectedChecksum) {
  const computed = calculate_file_checksum(data);
  return computed === expectedChecksum;
}

// Logging functions
export function log_info(message) {
  console.log(`[Rust Core] ${message}`);
}

export function log_error(message) {
  console.error(`[Rust Core] ${message}`);
}

// Default export for initialization
export default function init() {
  console.log('🦀 Rust WASM fallback module loaded');
  return Promise.resolve();
}
