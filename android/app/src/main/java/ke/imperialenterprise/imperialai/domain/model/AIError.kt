package ke.imperialenterprise.imperialai.domain.model

/**
 * Structured taxonomy of AI Provider errors.
 * Guarantees that raw HTTP headers, sensitive tokens, or internal URLs
 * are never leaked to user logs or Composables.
 */
enum class AIErrorCode {
    NO_API_KEY,
    INVALID_API_KEY,
    UNAUTHORIZED,
    RATE_LIMITED,
    INSUFFICIENT_CREDITS,
    NETWORK_ERROR,
    MODEL_UNAVAILABLE,
    REQUEST_FAILED,
    STREAM_INTERRUPTED,
    UNKNOWN_ERROR
}

data class AIError(
    val code: AIErrorCode,
    val technicalMessage: String,
    val userFriendlyMessage: String,
    val httpStatusCode: Int? = null,
    val isRetryable: Boolean = false
) {
    companion object {
        fun fromHttpStatus(statusCode: Int, rawBody: String? = null): AIError {
            return when (statusCode) {
                401 -> AIError(
                    code = AIErrorCode.INVALID_API_KEY,
                    technicalMessage = "Authentication failed (HTTP 401)",
                    userFriendlyMessage = "Invalid OpenRouter API Key. Please verify or update your key in Settings → AI Models.",
                    httpStatusCode = statusCode,
                    isRetryable = false
                )
                402 -> AIError(
                    code = AIErrorCode.INSUFFICIENT_CREDITS,
                    technicalMessage = "Account balance depleted (HTTP 402)",
                    userFriendlyMessage = "Insufficient OpenRouter account credits. Add balance or switch to a free model (e.g. Gemini 2.0 Flash Free).",
                    httpStatusCode = statusCode,
                    isRetryable = false
                )
                403 -> AIError(
                    code = AIErrorCode.UNAUTHORIZED,
                    technicalMessage = "Access forbidden (HTTP 403)",
                    userFriendlyMessage = "OpenRouter access forbidden. Check model access rights or your organization permissions.",
                    httpStatusCode = statusCode,
                    isRetryable = false
                )
                404 -> AIError(
                    code = AIErrorCode.MODEL_UNAVAILABLE,
                    technicalMessage = "Model not found (HTTP 404)",
                    userFriendlyMessage = "The selected AI model is currently unavailable or deprecated. Please choose another model in the Model Center.",
                    httpStatusCode = statusCode,
                    isRetryable = false
                )
                429 -> AIError(
                    code = AIErrorCode.RATE_LIMITED,
                    technicalMessage = "Rate limited (HTTP 429)",
                    userFriendlyMessage = "OpenRouter rate limit reached. Try another model or wait a few moments before retrying.",
                    httpStatusCode = statusCode,
                    isRetryable = true
                )
                in 500..599 -> AIError(
                    code = AIErrorCode.REQUEST_FAILED,
                    technicalMessage = "Upstream provider error (HTTP $statusCode)",
                    userFriendlyMessage = "The upstream AI provider experienced a temporary server failure. Please retry shortly.",
                    httpStatusCode = statusCode,
                    isRetryable = true
                )
                else -> AIError(
                    code = AIErrorCode.REQUEST_FAILED,
                    technicalMessage = "Request failed (HTTP $statusCode)",
                    userFriendlyMessage = "Request failed with error code $statusCode. Please check connection and try again.",
                    httpStatusCode = statusCode,
                    isRetryable = false
                )
            }
        }

        fun noApiKey(): AIError = AIError(
            code = AIErrorCode.NO_API_KEY,
            technicalMessage = "No OpenRouter API key found in Keystore",
            userFriendlyMessage = "Connect OpenRouter to start using Imperial AI. Configure your API key in Settings.",
            isRetryable = false
        )

        fun networkError(cause: Throwable?): AIError = AIError(
            code = AIErrorCode.NETWORK_ERROR,
            technicalMessage = cause?.javaClass?.simpleName ?: "Network failure",
            userFriendlyMessage = "Network connection unavailable. Please check your internet connectivity.",
            isRetryable = true
        )

        fun networkError(message: String): AIError = AIError(
            code = AIErrorCode.NETWORK_ERROR,
            technicalMessage = message,
            userFriendlyMessage = message,
            isRetryable = true
        )

        fun streamInterrupted(): AIError = AIError(
            code = AIErrorCode.STREAM_INTERRUPTED,
            technicalMessage = "Stream interrupted by client cancellation or timeout",
            userFriendlyMessage = "Generation was stopped.",
            isRetryable = false
        )
    }
}

class AIProviderException(val error: AIError) : RuntimeException(error.technicalMessage)
