package ke.imperialenterprise.imperialai.domain.agent

import ke.imperialenterprise.imperialai.domain.model.AIToolCall
import ke.imperialenterprise.imperialai.domain.model.McpTool
import org.json.JSONArray
import org.json.JSONObject

/**
 * Validates tool calls emitted by AI models against target MCP tool schemas.
 * 
 * Safety Rules:
 * 1. Safely parses argument JSON without throwing unhandled exceptions.
 * 2. Validates that mandatory required fields are present and non-null.
 * 3. Never blindly executes arbitrary untrusted JSON returned by the model.
 * 4. Produces structured diagnostics when validation fails.
 */
object ToolCallValidator {

    sealed class ValidationResult {
        data class Valid(val parsedArguments: Map<String, Any?>) : ValidationResult()
        data class Invalid(val technicalReason: String, val structuredErrorMessage: String) : ValidationResult()
    }

    fun validateArguments(toolCall: AIToolCall, tool: McpTool): ValidationResult {
        val rawJson = toolCall.argumentsJson.trim()

        val parsedMap: Map<String, Any?> = try {
            if (rawJson.isBlank() || rawJson == "{}") {
                emptyMap()
            } else {
                val jsonObject = JSONObject(rawJson)
                jsonObjectToMap(jsonObject)
            }
        } catch (e: Exception) {
            return ValidationResult.Invalid(
                technicalReason = "Malformed JSON arguments: ${e.message}",
                structuredErrorMessage = "Error: Invalid JSON payload supplied for tool '${tool.name}'. Parameters must be a valid JSON object."
            )
        }

        // Verify required fields from schema
        val requiredFields = extractRequiredFields(tool.inputSchema)
        val missingFields = requiredFields.filter { !parsedMap.containsKey(it) || parsedMap[it] == null }
        if (missingFields.isNotEmpty()) {
            return ValidationResult.Invalid(
                technicalReason = "Missing required parameters: ${missingFields.joinToString(", ")}",
                structuredErrorMessage = "Error: Tool '${tool.name}' requires parameter(s) [${missingFields.joinToString(", ")}], but they were not provided."
            )
        }

        return ValidationResult.Valid(parsedMap)
    }

    @Suppress("UNCHECKED_CAST")
    private fun extractRequiredFields(schema: Map<String, Any?>): List<String> {
        val req = schema["required"] ?: return emptyList()
        return when (req) {
            is List<*> -> req.filterIsInstance<String>()
            is Array<*> -> req.filterIsInstance<String>()
            is JSONArray -> {
                val list = mutableListOf<String>()
                for (i in 0 until req.length()) {
                    req.optString(i)?.let { list.add(it) }
                }
                list
            }
            else -> emptyList()
        }
    }

    fun jsonObjectToMap(json: JSONObject): Map<String, Any?> {
        val map = mutableMapOf<String, Any?>()
        val keys = json.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            val value = json.opt(key)
            map[key] = when (value) {
                is JSONObject -> jsonObjectToMap(value)
                is JSONArray -> jsonArrayToList(value)
                JSONObject.NULL -> null
                else -> value
            }
        }
        return map
    }

    private fun jsonArrayToList(array: JSONArray): List<Any?> {
        val list = mutableListOf<Any?>()
        for (i in 0 until array.length()) {
            val value = array.opt(i)
            list.add(when (value) {
                is JSONObject -> jsonObjectToMap(value)
                is JSONArray -> jsonArrayToList(value)
                JSONObject.NULL -> null
                else -> value
            })
        }
        return list
    }
}
