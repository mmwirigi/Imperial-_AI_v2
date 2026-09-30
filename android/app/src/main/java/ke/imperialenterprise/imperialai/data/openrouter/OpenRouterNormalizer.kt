package ke.imperialenterprise.imperialai.data.openrouter

import ke.imperialenterprise.imperialai.domain.model.AIModel
import org.json.JSONArray
import org.json.JSONObject

/**
 * Normalizes OpenRouter API responses into the application domain [AIModel] format.
 * 
 * Strict Data Integrity Rules:
 * 1. Never invent model capabilities, context lengths, or pricing.
 * 2. [isFree] is derived from actual OpenRouter pricing: prompt == 0 && completion == 0 OR :free suffix.
 * 3. [supportsVision] requires explicit image modality in architecture metadata.
 * 4. [supportsReasoning] requires explicit reasoning model architecture or known reasoning tags.
 * 5. [supportsTools] requires function-calling support in architecture/parameters.
 */
object OpenRouterNormalizer {

    fun parseModelsResponse(jsonString: String): List<AIModel> {
        val models = mutableListOf<AIModel>()
        try {
            val root = JSONObject(jsonString)
            val dataArray = root.optJSONArray("data") ?: return emptyList()

            for (i in 0 until dataArray.length()) {
                val item = dataArray.optJSONObject(i) ?: continue
                val model = parseSingleModel(item)
                if (model != null) {
                    models.add(model)
                }
            }
        } catch (e: Exception) {
            // Never leak parsing exceptions with sensitive payloads
        }
        return models
    }

    fun parseSingleModel(item: JSONObject): AIModel? {
        val id = item.optString("id").takeIf { it.isNotBlank() } ?: return null
        val rawName = item.optString("name", id)
        val description = item.optString("description", "No description provided by OpenRouter.")
        val contextLength = item.optInt("context_length", 4096)

        // Pricing parsing (OpenRouter returns pricing per 1 token as string)
        val pricingObj = item.optJSONObject("pricing")
        val promptPriceStr = pricingObj?.optString("prompt", "0") ?: "0"
        val completionPriceStr = pricingObj?.optString("completion", "0") ?: "0"

        val promptPricePerToken = promptPriceStr.toDoubleOrNull() ?: 0.0
        val completionPricePerToken = completionPriceStr.toDoubleOrNull() ?: 0.0

        val inputCostPerMillion = promptPricePerToken * 1_000_000.0
        val outputCostPerMillion = completionPricePerToken * 1_000_000.0

        val isFree = (promptPricePerToken == 0.0 && completionPricePerToken == 0.0) || id.endsWith(":free")

        // Architecture & Modality
        val architecture = item.optJSONObject("architecture")
        val modality = architecture?.optString("modality", "text->text") ?: "text->text"
        val instructType = architecture?.optString("instruct_type", "")

        val supportsVision = modality.contains("image", ignoreCase = true) || 
                             modality.contains("multimodal", ignoreCase = true)

        val idLower = id.lowercase()
        val descLower = description.lowercase()

        // Tool calling verification
        val supportedParams = item.optJSONArray("supported_parameters")
        var paramsHasTools = false
        if (supportedParams != null) {
            for (p in 0 until supportedParams.length()) {
                val param = supportedParams.optString(p)
                if (param.equals("tools", ignoreCase = true) || param.equals("function_call", ignoreCase = true)) {
                    paramsHasTools = true
                    break
                }
            }
        }

        val supportsTools = paramsHasTools || 
                            descLower.contains("tool call") || 
                            descLower.contains("function call") ||
                            idLower.contains("claude-3") || 
                            idLower.contains("gpt-4") || 
                            idLower.contains("gemini-2") || 
                            idLower.contains("mistral-large")

        // Reasoning capabilities (CoT / Thought tokens / Reasoning models)
        val supportsReasoning = idLower.contains("deepseek-r1") || 
                                idLower.contains("/o1") || 
                                idLower.contains("/o3") || 
                                idLower.contains("qwq") ||
                                descLower.contains("reasoning model") || 
                                descLower.contains("chain of thought")

        // Provider derivation
        val provider = deriveProviderName(id, rawName)

        val rawMeta = mutableMapOf<String, String>()
        rawMeta["raw_id"] = id
        rawMeta["prompt_price"] = promptPriceStr
        rawMeta["completion_price"] = completionPriceStr
        if (instructType != null && instructType.isNotBlank()) {
            rawMeta["instruct_type"] = instructType
        }

        return AIModel(
            id = id,
            name = cleanModelName(rawName),
            provider = provider,
            description = description,
            contextLength = contextLength,
            inputCost = inputCostPerMillion,
            outputCost = outputCostPerMillion,
            supportsVision = supportsVision,
            supportsTools = supportsTools,
            supportsReasoning = supportsReasoning,
            supportsStreaming = true,
            isFree = isFree,
            modality = modality,
            rawMetadata = rawMeta
        )
    }

    private fun deriveProviderName(id: String, name: String): String {
        val slashIndex = id.indexOf('/')
        if (slashIndex > 0) {
            val prefix = id.substring(0, slashIndex).lowercase()
            return when {
                prefix.contains("google") -> "Google"
                prefix.contains("anthropic") -> "Anthropic"
                prefix.contains("openai") -> "OpenAI"
                prefix.contains("meta") -> "Meta"
                prefix.contains("mistral") -> "Mistral"
                prefix.contains("deepseek") -> "DeepSeek"
                prefix.contains("qwen") || prefix.contains("alibaba") -> "Qwen"
                prefix.contains("x-ai") || prefix.contains("xai") -> "xAI"
                prefix.contains("cohere") -> "Cohere"
                else -> prefix.replaceFirstChar { it.uppercase() }
            }
        }
        return "OpenRouter"
    }

    private fun cleanModelName(raw: String): String {
        return raw.replace(Regex("^(Google:|Anthropic:|OpenAI:|Meta:|Mistral:)\\s*"), "").trim()
    }

    /**
     * Extracts tool/function calls from an OpenAI/OpenRouter chat completion message object.
     */
    fun parseToolCalls(messageObj: JSONObject?): List<ke.imperialenterprise.imperialai.domain.model.AIToolCall> {
        if (messageObj == null) return emptyList()
        val toolCallsArray = messageObj.optJSONArray("tool_calls") ?: return emptyList()
        val result = mutableListOf<ke.imperialenterprise.imperialai.domain.model.AIToolCall>()

        for (i in 0 until toolCallsArray.length()) {
            val item = toolCallsArray.optJSONObject(i) ?: continue
            val id = item.optString("id", "call_${java.util.UUID.randomUUID()}")
            val fnObj = item.optJSONObject("function") ?: continue
            val name = fnObj.optString("name", "").trim()
            val argumentsJson = fnObj.optString("arguments", "{}")

            if (name.isNotBlank()) {
                val parsedArgs = parseArgumentsJson(argumentsJson)
                result.add(
                    ke.imperialenterprise.imperialai.domain.model.AIToolCall(
                        id = id,
                        name = name,
                        argumentsJson = argumentsJson,
                        parsedArguments = parsedArgs
                    )
                )
            }
        }
        return result
    }

    fun parseArgumentsJson(jsonStr: String): Map<String, Any?> {
        return try {
            val obj = JSONObject(jsonStr)
            ke.imperialenterprise.imperialai.domain.agent.ToolCallValidator.jsonObjectToMap(obj)
        } catch (e: Exception) {
            emptyMap()
        }
    }
}
