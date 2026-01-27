/**
 * LAYER 0: Regex Patterns
 *
 * Pre-compiled regex patterns for common validations.
 * All patterns are pre-compiled for maximum performance.
 *
 * PERFORMANCE NOTE: These patterns are intentionally simple.
 * Complex regex can be a performance bottleneck.
 */

// ============================================================================
// EMAIL PATTERNS
// ============================================================================

/**
 * Simple email pattern (fast, covers 99% of cases).
 * For strict RFC 5322 compliance, use a specialized library.
 */
export const EMAIL_SIMPLE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * More comprehensive email pattern.
 * Still not RFC 5322 complete, but covers more edge cases.
 */
export const EMAIL_STANDARD =
  /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;

// ============================================================================
// URL PATTERNS
// ============================================================================

/**
 * URL pattern supporting http, https, ftp.
 */
export const URL_PATTERN =
  /^(https?|ftp):\/\/(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;

/**
 * Simple URL pattern (faster, less strict).
 */
export const URL_SIMPLE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

// ============================================================================
// UUID PATTERNS
// ============================================================================

/**
 * UUID v4 pattern.
 */
export const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Any UUID version pattern.
 */
export const UUID_ANY = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================================================
// CUID PATTERNS
// ============================================================================

/**
 * CUID pattern.
 */
export const CUID = /^c[^\s-]{8,}$/i;

/**
 * CUID2 pattern.
 */
export const CUID2 = /^[0-9a-z]+$/;

// ============================================================================
// IP ADDRESS PATTERNS
// ============================================================================

/**
 * IPv4 pattern.
 */
export const IPV4 =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * IPv6 pattern (simplified).
 */
export const IPV6 = /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i;

/**
 * IPv4 or IPv6.
 */
export const IP =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i;

// ============================================================================
// DATE/TIME PATTERNS
// ============================================================================

/**
 * ISO 8601 date (YYYY-MM-DD).
 */
export const DATE_ISO = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

/**
 * ISO 8601 datetime with timezone.
 */
export const DATETIME_ISO =
  /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/;

/**
 * Time (HH:MM:SS).
 */
export const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

// ============================================================================
// NUMERIC STRING PATTERNS
// ============================================================================

/**
 * Integer string.
 */
export const INTEGER_STRING = /^-?\d+$/;

/**
 * Positive integer string.
 */
export const POSITIVE_INTEGER_STRING = /^\d+$/;

/**
 * Decimal/float string.
 */
export const DECIMAL_STRING = /^-?\d+(?:\.\d+)?$/;

// ============================================================================
// OTHER COMMON PATTERNS
// ============================================================================

/**
 * Alphanumeric only.
 */
export const ALPHANUMERIC = /^[a-zA-Z0-9]+$/;

/**
 * Alphanumeric with underscores and hyphens.
 */
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Hex color (#RGB or #RRGGBB).
 */
export const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

/**
 * Base64 string.
 */
export const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

/**
 * Semantic version (semver).
 */
export const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * JWT token format (header.payload.signature).
 */
export const JWT = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
