/* tslint:disable */
/* eslint-disable */
export function validate_file_upload(metadata: FileMetadata): ValidationResult;
export function prepare_file_upload(filename: string, file_size: bigint, file_type: string, upload_ip: string, user_id?: string | null): FileUploadResult;
export function get_mime_type(filename: string): string;
export function generate_storage_path(file_id: string, filename: string): string;
export function calculate_file_checksum(data: Uint8Array): string;
export function verify_file_checksum(data: Uint8Array, expected_checksum: string): boolean;
export function matches_file_filter(file: ProjectionFile, filter: FileFilter): boolean;
export function file_metadata_to_json(metadata: FileMetadata): string;
export function file_filter_to_json(filter: FileFilter): string;
export function main(): void;
export function generate_file_id(): string;
export function hash_string(input: string): string;
export function verify_hash(input: string, hash: string): boolean;
export function generate_verification_code(): string;
export function user_to_json(user: User): string;
export function projection_file_to_json(file: ProjectionFile): string;
export function api_key_to_json(key: ApiKey): string;
export function log_info(message: string): void;
export function log_error(message: string): void;
export function validate_email(email: string): ValidationResult;
export function validate_password(password: string): ValidationResult;
export function validate_file_type(filename: string): ValidationResult;
export function validate_file_size(size: bigint): ValidationResult;
export function sanitize_filename(filename: string): string;
export function generate_api_key(): string;
export function is_valid_api_key_format(key: string): boolean;
export function format_file_size(size: bigint): string;
export function get_file_extension(filename: string): string;
export function is_anonymous_upload(user_id?: string | null): boolean;
export function validate_ip_address(ip: string): ValidationResult;
export function format_timestamp(timestamp: string): string;
export function hash_password(password: string): string;
export function verify_password(password: string, hash: string): boolean;
export function validate_login_credentials(email: string, password: string): ValidationResult;
export function validate_registration_data(email: string, password: string, confirm_password: string): ValidationResult;
export function create_token_payload(user_id: string, email: string, expires_in_seconds: bigint): string;
export function is_token_expired(exp: bigint): boolean;
export function validate_api_key_name(name: string): ValidationResult;
export function is_verification_code_valid(code: string): ValidationResult;
export function check_user_permissions(user_id: string, resource: string, action: string): boolean;
export function session_info_to_json(session: SessionInfo): string;
export class ApiKey {
  free(): void;
  constructor(user_id: string, name: string, raw_key: string);
  readonly id: string;
  readonly key_hash: string;
  readonly user_id: string;
  readonly name: string;
  readonly is_active: boolean;
  readonly last_used_at: string | undefined;
  readonly created_at: string;
}
export class AuthResult {
  free(): void;
  constructor(success: boolean, message: string, token?: string | null, user_id?: string | null);
  readonly success: boolean;
  readonly message: string;
  readonly token: string | undefined;
  readonly user_id: string | undefined;
}
export class FileFilter {
  free(): void;
  constructor();
  get min_size(): bigint | undefined;
  set min_size(value: bigint | null | undefined);
  get max_size(): bigint | undefined;
  set max_size(value: bigint | null | undefined);
  set file_type(value: string | null | undefined);
  set size_range(value: bigint | null);
  set date_range(value: string | null);
  set search_term(value: string | null | undefined);
}
export class FileMetadata {
  free(): void;
  constructor(filename: string, file_size: bigint, file_type: string, mime_type: string, checksum?: string | null);
  readonly filename: string;
  readonly file_size: bigint;
  readonly file_type: string;
  readonly mime_type: string;
  readonly checksum: string | undefined;
}
export class FileStats {
  free(): void;
  constructor(total_files: number, total_size: bigint, by_type: string);
  readonly total_files: number;
  readonly total_size: bigint;
  readonly by_type: string;
}
export class FileUploadResult {
  free(): void;
  constructor(success: boolean, message: string, file_id?: string | null, storage_path?: string | null);
  readonly success: boolean;
  readonly message: string;
  readonly file_id: string | undefined;
  readonly storage_path: string | undefined;
}
export class NeptuniumError {
  free(): void;
  constructor(message: string, code: string);
  readonly message: string;
  readonly code: string;
}
export class ProjectionFile {
  free(): void;
  constructor(filename: string, file_size: bigint, file_type: string, upload_ip: string, user_id?: string | null);
  readonly file_id: string;
  readonly storage_path: string;
  readonly filename: string;
  readonly file_size: bigint;
  readonly file_type: string;
  readonly upload_ip: string;
  readonly created_at: string;
  readonly user_id: string | undefined;
}
export class SessionInfo {
  free(): void;
  constructor(user_id: string, email: string, is_verified: boolean, created_at: string, expires_at: string);
  readonly user_id: string;
  readonly email: string;
  readonly is_verified: boolean;
}
export class TokenClaims {
  free(): void;
  constructor(user_id: string, email: string, exp: bigint, iat: bigint);
  readonly user_id: string;
  readonly email: string;
  readonly exp: bigint;
  readonly iat: bigint;
}
export class User {
  free(): void;
  constructor(email: string, password_hash: string);
  readonly id: string;
  readonly email: string;
  readonly is_verified: boolean;
  readonly password_hash: string;
  readonly created_at: string;
  readonly updated_at: string;
}
export class ValidationResult {
  free(): void;
  constructor(is_valid: boolean, message: string);
  readonly is_valid: boolean;
  readonly message: string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_fileuploadresult_free: (a: number, b: number) => void;
  readonly fileuploadresult_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly fileuploadresult_success: (a: number) => number;
  readonly fileuploadresult_message: (a: number) => [number, number];
  readonly fileuploadresult_file_id: (a: number) => [number, number];
  readonly fileuploadresult_storage_path: (a: number) => [number, number];
  readonly __wbg_filemetadata_free: (a: number, b: number) => void;
  readonly filemetadata_new: (a: number, b: number, c: bigint, d: number, e: number, f: number, g: number, h: number, i: number) => number;
  readonly filemetadata_filename: (a: number) => [number, number];
  readonly filemetadata_file_size: (a: number) => bigint;
  readonly filemetadata_file_type: (a: number) => [number, number];
  readonly filemetadata_mime_type: (a: number) => [number, number];
  readonly filemetadata_checksum: (a: number) => [number, number];
  readonly validate_file_upload: (a: number) => number;
  readonly prepare_file_upload: (a: number, b: number, c: bigint, d: number, e: number, f: number, g: number, h: number, i: number) => number;
  readonly get_mime_type: (a: number, b: number) => [number, number];
  readonly generate_storage_path: (a: number, b: number, c: number, d: number) => [number, number];
  readonly calculate_file_checksum: (a: number, b: number) => [number, number];
  readonly verify_file_checksum: (a: number, b: number, c: number, d: number) => number;
  readonly __wbg_filefilter_free: (a: number, b: number) => void;
  readonly __wbg_get_filefilter_min_size: (a: number) => [number, bigint];
  readonly __wbg_set_filefilter_min_size: (a: number, b: number, c: bigint) => void;
  readonly __wbg_get_filefilter_max_size: (a: number) => [number, bigint];
  readonly __wbg_set_filefilter_max_size: (a: number, b: number, c: bigint) => void;
  readonly filefilter_new: () => number;
  readonly filefilter_set_file_type: (a: number, b: number, c: number) => void;
  readonly filefilter_set_size_range: (a: number, b: number, c: bigint, d: number, e: bigint) => void;
  readonly filefilter_set_date_range: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly filefilter_set_search_term: (a: number, b: number, c: number) => void;
  readonly matches_file_filter: (a: number, b: number) => number;
  readonly __wbg_filestats_free: (a: number, b: number) => void;
  readonly filestats_new: (a: number, b: bigint, c: number, d: number) => number;
  readonly filestats_total_files: (a: number) => number;
  readonly filestats_by_type: (a: number) => [number, number];
  readonly file_metadata_to_json: (a: number) => [number, number];
  readonly file_filter_to_json: (a: number) => [number, number];
  readonly filestats_total_size: (a: number) => bigint;
  readonly main: () => void;
  readonly __wbg_user_free: (a: number, b: number) => void;
  readonly user_new: (a: number, b: number, c: number, d: number) => number;
  readonly user_id: (a: number) => [number, number];
  readonly user_email: (a: number) => [number, number];
  readonly user_is_verified: (a: number) => number;
  readonly user_password_hash: (a: number) => [number, number];
  readonly user_created_at: (a: number) => [number, number];
  readonly user_updated_at: (a: number) => [number, number];
  readonly __wbg_projectionfile_free: (a: number, b: number) => void;
  readonly projectionfile_new: (a: number, b: number, c: bigint, d: number, e: number, f: number, g: number, h: number, i: number) => number;
  readonly projectionfile_file_id: (a: number) => [number, number];
  readonly projectionfile_storage_path: (a: number) => [number, number];
  readonly projectionfile_filename: (a: number) => [number, number];
  readonly projectionfile_file_size: (a: number) => bigint;
  readonly projectionfile_file_type: (a: number) => [number, number];
  readonly projectionfile_upload_ip: (a: number) => [number, number];
  readonly projectionfile_created_at: (a: number) => [number, number];
  readonly projectionfile_user_id: (a: number) => [number, number];
  readonly __wbg_apikey_free: (a: number, b: number) => void;
  readonly apikey_new: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly apikey_id: (a: number) => [number, number];
  readonly apikey_key_hash: (a: number) => [number, number];
  readonly apikey_user_id: (a: number) => [number, number];
  readonly apikey_name: (a: number) => [number, number];
  readonly apikey_is_active: (a: number) => number;
  readonly apikey_last_used_at: (a: number) => [number, number];
  readonly apikey_created_at: (a: number) => [number, number];
  readonly generate_file_id: () => [number, number];
  readonly hash_string: (a: number, b: number) => [number, number];
  readonly verify_hash: (a: number, b: number, c: number, d: number) => number;
  readonly generate_verification_code: () => [number, number];
  readonly user_to_json: (a: number) => [number, number];
  readonly projection_file_to_json: (a: number) => [number, number];
  readonly api_key_to_json: (a: number) => [number, number];
  readonly __wbg_neptuniumerror_free: (a: number, b: number) => void;
  readonly neptuniumerror_new: (a: number, b: number, c: number, d: number) => number;
  readonly neptuniumerror_message: (a: number) => [number, number];
  readonly neptuniumerror_code: (a: number) => [number, number];
  readonly log_info: (a: number, b: number) => void;
  readonly log_error: (a: number, b: number) => void;
  readonly __wbg_validationresult_free: (a: number, b: number) => void;
  readonly validationresult_new: (a: number, b: number, c: number) => number;
  readonly validationresult_is_valid: (a: number) => number;
  readonly validationresult_message: (a: number) => [number, number];
  readonly validate_email: (a: number, b: number) => number;
  readonly validate_password: (a: number, b: number) => number;
  readonly validate_file_type: (a: number, b: number) => number;
  readonly validate_file_size: (a: bigint) => number;
  readonly sanitize_filename: (a: number, b: number) => [number, number];
  readonly generate_api_key: () => [number, number];
  readonly is_valid_api_key_format: (a: number, b: number) => number;
  readonly format_file_size: (a: bigint) => [number, number];
  readonly get_file_extension: (a: number, b: number) => [number, number];
  readonly is_anonymous_upload: (a: number, b: number) => number;
  readonly validate_ip_address: (a: number, b: number) => number;
  readonly format_timestamp: (a: number, b: number) => [number, number];
  readonly __wbg_authresult_free: (a: number, b: number) => void;
  readonly authresult_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly authresult_success: (a: number) => number;
  readonly authresult_message: (a: number) => [number, number];
  readonly authresult_token: (a: number) => [number, number];
  readonly authresult_user_id: (a: number) => [number, number];
  readonly __wbg_tokenclaims_free: (a: number, b: number) => void;
  readonly tokenclaims_new: (a: number, b: number, c: number, d: number, e: bigint, f: bigint) => number;
  readonly tokenclaims_user_id: (a: number) => [number, number];
  readonly tokenclaims_email: (a: number) => [number, number];
  readonly tokenclaims_exp: (a: number) => bigint;
  readonly tokenclaims_iat: (a: number) => bigint;
  readonly hash_password: (a: number, b: number) => [number, number];
  readonly verify_password: (a: number, b: number, c: number, d: number) => number;
  readonly validate_login_credentials: (a: number, b: number, c: number, d: number) => number;
  readonly validate_registration_data: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly create_token_payload: (a: number, b: number, c: number, d: number, e: bigint) => [number, number];
  readonly is_token_expired: (a: bigint) => number;
  readonly validate_api_key_name: (a: number, b: number) => number;
  readonly is_verification_code_valid: (a: number, b: number) => number;
  readonly check_user_permissions: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly __wbg_sessioninfo_free: (a: number, b: number) => void;
  readonly sessioninfo_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => number;
  readonly sessioninfo_user_id: (a: number) => [number, number];
  readonly sessioninfo_email: (a: number) => [number, number];
  readonly sessioninfo_is_verified: (a: number) => number;
  readonly session_info_to_json: (a: number) => [number, number];
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
