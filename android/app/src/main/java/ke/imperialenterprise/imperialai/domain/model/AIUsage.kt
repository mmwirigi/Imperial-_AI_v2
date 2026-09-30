package ke.imperialenterprise.imperialai.domain.model

/**
 * Captures token usage and estimated monetary cost returned by OpenRouter.
 * If cost is not reported, [estimatedCost] remains null to avoid fabricated pricing.
 */
data class AIUsage(
    val model: String,
    val inputTokens: Int,
    val outputTokens: Int,
    val totalTokens: Int,
    val estimatedCost: Double? = null,
    val timestamp: String
)
