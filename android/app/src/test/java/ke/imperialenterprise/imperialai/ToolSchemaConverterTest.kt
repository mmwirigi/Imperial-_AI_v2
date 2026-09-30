package ke.imperialenterprise.imperialai

import ke.imperialenterprise.imperialai.domain.agent.ToolCallValidator
import ke.imperialenterprise.imperialai.domain.agent.ToolSchemaConverter
import ke.imperialenterprise.imperialai.domain.model.*
import org.junit.Assert.*
import org.junit.Test

class ToolSchemaConverterTest {

    @Test
    fun `test valid McpTool converts to OpenRouter OpenAI schema correctly`() {
        val tool = McpTool(
            name = "wp_list_posts",
            title = "List Posts",
            description = "Retrieves recent WordPress posts",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "status" to mapOf("type" to "string", "description" to "publish, draft"),
                    "per_page" to mapOf("type" to "integer", "description" to "limit")
                ),
                "required" to listOf("status")
            ),
            serverId = "server_001",
            siteId = "site_001",
            riskLevel = ToolRiskLevel.READ,
            requiresApproval = false
        )

        val result = ToolSchemaConverter.convert(tool)
        assertTrue(result.isSuccess)
        assertNotNull(result.toolDefinition)

        val def = result.toolDefinition!!
        assertEquals("wp_list_posts", def.name)
        assertEquals("Retrieves recent WordPress posts", def.description)
        assertEquals("server_001", def.serverId)
        assertEquals("site_001", def.siteId)
        assertEquals(ToolRiskLevel.READ, def.riskLevel)
        assertFalse(def.requiresApproval)

        // Check OpenRouter OpenAI function mapping
        val map = def.toOpenAIFunctionMap()
        assertEquals("function", map["type"])
        val fn = map["function"] as Map<*, *>
        assertEquals("wp_list_posts", fn["name"])
        assertEquals("Retrieves recent WordPress posts", fn["description"])
        val params = fn["parameters"] as Map<*, *>
        assertEquals("object", params["type"])
        assertNotNull(params["properties"])
        assertEquals(listOf("status"), params["required"])
    }

    @Test
    fun `test malformed tool names are rejected with diagnostics without crashing`() {
        val invalidTool = McpTool(
            name = "invalid tool with spaces and @!#$",
            description = "Malformed tool",
            inputSchema = emptyMap(),
            serverId = "server_001",
            siteId = "site_001"
        )

        val result = ToolSchemaConverter.convert(invalidTool)
        assertFalse(result.isSuccess)
        assertNull(result.toolDefinition)
        assertNotNull(result.diagnostic)
        assertTrue(result.diagnostic!!.contains("violates function calling identifier conventions"))
    }

    @Test
    fun `test convertAll skips invalid tools and retains valid tools`() {
        val validTool1 = McpTool(
            name = "wp_get_site_health",
            description = "Health check",
            serverId = "s1",
            siteId = "site_1",
            riskLevel = ToolRiskLevel.READ
        )
        val invalidTool = McpTool(
            name = "bad name with spaces",
            description = "Bad",
            serverId = "s1",
            siteId = "site_1"
        )
        val validTool2 = McpTool(
            name = "wp_list_plugins",
            description = "List plugins",
            serverId = "s1",
            siteId = "site_1",
            riskLevel = ToolRiskLevel.READ
        )

        val (validDefs, diagnostics) = ToolSchemaConverter.convertAll(listOf(validTool1, invalidTool, validTool2))
        assertEquals(2, validDefs.size)
        assertEquals(1, diagnostics.size)
        assertEquals("wp_get_site_health", validDefs[0].name)
        assertEquals("wp_list_plugins", validDefs[1].name)
    }

    @Test
    fun `test ToolCallValidator validates required arguments`() {
        val tool = McpTool(
            name = "wp_create_post",
            description = "Creates post",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "title" to mapOf("type" to "string"),
                    "content" to mapOf("type" to "string")
                ),
                "required" to listOf("title", "content")
            ),
            serverId = "s1",
            siteId = "site_1"
        )

        // Valid arguments
        val validCall = AIToolCall(
            id = "call_1",
            name = "wp_create_post",
            argumentsJson = """{"title": "New Post", "content": "Hello World"}"""
        )
        val validResult = ToolCallValidator.validateArguments(validCall, tool)
        assertTrue(validResult is ToolCallValidator.ValidationResult.Valid)
        val args = (validResult as ToolCallValidator.ValidationResult.Valid).parsedArguments
        assertEquals("New Post", args["title"])
        assertEquals("Hello World", args["content"])

        // Missing required field
        val invalidCall = AIToolCall(
            id = "call_2",
            name = "wp_create_post",
            argumentsJson = """{"title": "Only Title"}"""
        )
        val invalidResult = ToolCallValidator.validateArguments(invalidCall, tool)
        assertTrue(invalidResult is ToolCallValidator.ValidationResult.Invalid)
        val err = invalidResult as ToolCallValidator.ValidationResult.Invalid
        assertTrue(err.structuredErrorMessage.contains("requires parameter(s) [content]"))

        // Malformed JSON
        val malformedCall = AIToolCall(
            id = "call_3",
            name = "wp_create_post",
            argumentsJson = "{ malformed json string "
        )
        val malformedResult = ToolCallValidator.validateArguments(malformedCall, tool)
        assertTrue(malformedResult is ToolCallValidator.ValidationResult.Invalid)
    }
}
