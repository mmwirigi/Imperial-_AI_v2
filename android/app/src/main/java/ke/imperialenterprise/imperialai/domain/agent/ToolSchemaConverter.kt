package ke.imperialenterprise.imperialai.domain.agent

import ke.imperialenterprise.imperialai.domain.model.AIToolDefinition
import ke.imperialenterprise.imperialai.domain.model.McpTool
import ke.imperialenterprise.imperialai.domain.model.ToolRiskLevel

/**
 * Converts MCP tools to OpenRouter / OpenAI function definitions.
 * 
 * Safety & Compatibility Requirements:
 * 1. Preserves tool name, description, and input schema.
 * 2. Does not invent parameters or alter required fields arbitrarily.
 * 3. Gracefully rejects broken/malformed tool definitions, recording a diagnostic
 *    and allowing remaining valid tools to proceed safely.
 */
object ToolSchemaConverter {

    data class ConversionResult(
        val toolDefinition: AIToolDefinition?,
        val diagnostic: String? = null
    ) {
        val isSuccess: Boolean get() = toolDefinition != null
    }

    /**
     * Converts a single McpTool to AIToolDefinition.
     */
    fun convert(tool: McpTool): ConversionResult {
        val trimmedName = tool.name.trim()
        if (trimmedName.isBlank()) {
            return ConversionResult(null, "Rejected tool with blank or missing name.")
        }

        // Standard function naming constraint (letters, digits, underscores, dashes)
        if (!trimmedName.matches(Regex("^[a-zA-Z0-9_\\-\\.:]{1,64}$"))) {
            return ConversionResult(
                null,
                "Tool name '$trimmedName' violates function calling identifier conventions (allowed: alphanumeric, _, -, :, . up to 64 chars)."
            )
        }

        val description = when {
            tool.description.isNotBlank() -> tool.description
            !tool.title.isNullOrBlank() -> tool.title
            else -> "Executes MCP tool $trimmedName"
        }

        val parameters = try {
            normalizeSchema(tool.inputSchema)
        } catch (e: Exception) {
            return ConversionResult(null, "Failed to normalize input schema for tool '$trimmedName': ${e.message}")
        }

        val definition = AIToolDefinition(
            name = trimmedName,
            description = description,
            parameters = parameters,
            riskLevel = tool.riskLevel,
            requiresApproval = tool.requiresApproval,
            serverId = tool.serverId,
            siteId = tool.siteId
        )

        return ConversionResult(definition)
    }

    /**
     * Converts a list of McpTools, filtering out invalid or disabled tools.
     */
    fun convertAll(tools: List<McpTool>): Pair<List<AIToolDefinition>, List<String>> {
        val validDefs = mutableListOf<AIToolDefinition>()
        val diagnostics = mutableListOf<String>()

        for (tool in tools) {
            if (!tool.enabled) continue
            val result = convert(tool)
            if (result.isSuccess && result.toolDefinition != null) {
                validDefs.add(result.toolDefinition)
            } else if (result.diagnostic != null) {
                diagnostics.add(result.diagnostic)
            }
        }

        return Pair(validDefs, diagnostics)
    }

    @Suppress("UNCHECKED_CAST")
    private fun normalizeSchema(rawSchema: Map<String, Any?>): Map<String, Any?> {
        val result = rawSchema.toMutableMap()

        // Ensure top-level type is "object"
        if (!result.containsKey("type") || result["type"] != "object") {
            result["type"] = "object"
        }

        // Ensure properties map exists
        if (!result.containsKey("properties") || result["properties"] !is Map<*, *>) {
            // Check if schema was a flat key-value mapping of property definitions
            val nonMetaEntries = result.filterKeys { it != "type" && it != "required" && it != "description" }
            if (nonMetaEntries.isNotEmpty()) {
                result["properties"] = nonMetaEntries
            } else {
                result["properties"] = emptyMap<String, Any?>()
            }
        }

        // Ensure required list exists
        if (!result.containsKey("required")) {
            result["required"] = emptyList<String>()
        }

        return result
    }
}
