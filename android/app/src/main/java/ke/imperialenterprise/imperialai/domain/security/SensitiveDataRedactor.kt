package ke.imperialenterprise.imperialai.domain.security

import java.util.regex.Pattern

/**
 * Universal sensitive data redactor ensuring secrets are never persisted to
 * audit logs, UI displays, error messages, or telemetry.
 * 
 * Redacts:
 * - Authorization headers
 * - Bearer tokens
 * - OAuth tokens
 * - API keys (e.g. sk-or-..., sk-...)
 * - Passwords and WordPress application passwords
 * - Cookies and session tokens
 * - Private credentials
 */
object SensitiveDataRedactor {

    private val SENSITIVE_KEY_NAMES = setOf(
        "password", "pass", "pwd", "secret", "token", "auth",
        "authorization", "bearer", "apikey", "api_key", "cookie",
        "session", "credential", "private_key", "app_password"
    )

    private val BEARER_PATTERN = Pattern.compile("(?i)(bearer\\s+)[a-zA-Z0-9_\\-\\.]+")
    private val API_KEY_PATTERN = Pattern.compile("(?i)(sk-[a-zA-Z0-9_\\-]{16,})")
    private val GENERIC_KEY_VALUE_PATTERN = Pattern.compile(
        "(?i)(\"?(?:password|token|secret|api[_-]?key|auth|bearer)\"?\\s*[:=]\\s*\"?)([^\"',\\s\\}\\]]+)(\"?)",
        Pattern.CASE_INSENSITIVE
    )

    /**
     * Redacts secrets in unstructured text strings.
     */
    fun redact(input: String?): String {
        if (input.isNullOrBlank()) return ""
        var text = input

        // 1. Redact Bearer tokens
        text = BEARER_PATTERN.matcher(text).replaceAll("$1[REDACTED]")

        // 2. Redact sk- API keys
        text = API_KEY_PATTERN.matcher(text).replaceAll("[REDACTED_API_KEY]")

        // 3. Redact JSON / URL encoded key-value pairs
        text = GENERIC_KEY_VALUE_PATTERN.matcher(text).replaceAll("$1[REDACTED]$3")

        return text
    }

    /**
     * Redacts a map of key-value parameters (e.g. tool execution arguments).
     */
    fun redactMap(map: Map<String, Any?>): Map<String, Any?> {
        val result = mutableMapOf<String, Any?>()
        for ((k, v) in map) {
            val keyLower = k.lowercase()
            val isKeySensitive = SENSITIVE_KEY_NAMES.any { keyLower.contains(it) }

            result[k] = when {
                isKeySensitive -> "[REDACTED]"
                v is Map<*, *> -> {
                    @Suppress("UNCHECKED_CAST")
                    redactMap(v as Map<String, Any?>)
                }
                v is List<*> -> {
                    v.map { item ->
                        if (item is Map<*, *>) {
                            @Suppress("UNCHECKED_CAST")
                            redactMap(item as Map<String, Any?>)
                        } else if (item is String) {
                            redact(item)
                        } else item
                    }
                }
                v is String -> redact(v)
                else -> v
            }
        }
        return result
    }

    /**
     * Generates a safe one-line summary for logging or display.
     */
    fun summarizeArguments(args: Map<String, Any?>, maxChars: Int = 120): String {
        val redacted = redactMap(args)
        val formatted = redacted.entries.joinToString(", ") { "${it.key}=${it.value}" }
        return if (formatted.length > maxChars) {
            formatted.take(maxChars) + "..."
        } else formatted
    }
}
