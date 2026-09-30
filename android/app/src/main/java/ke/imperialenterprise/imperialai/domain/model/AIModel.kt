package ke.imperialenterprise.imperialai.domain.model

/**
 * Normalized AI Model representation for Imperial AI.
 * Sourced dynamically from OpenRouter or future providers.
 * 
 * Capability & pricing rules:
 * - Capabilities (Vision, Tools, Reasoning) are only true if explicitly reported by provider metadata.
 * - [isFree] is derived from actual pricing metadata (inputCost == 0 && outputCost == 0) or official :free tier.
 */
data class AIModel(
    val id: String,
    val name: String,
    val provider: String,
    val description: String,
    val contextLength: Int,
    val inputCost: Double = 0.0,      // USD per 1,000,000 tokens
    val outputCost: Double = 0.0,     // USD per 1,000,000 tokens
    val supportsVision: Boolean = false,
    val supportsTools: Boolean = false,
    val supportsReasoning: Boolean = false,
    val supportsStreaming: Boolean = true,
    val isFree: Boolean = false,
    val modality: String = "text->text",
    val isDefault: Boolean = false,
    val rawMetadata: Map<String, String> = emptyMap()
)
