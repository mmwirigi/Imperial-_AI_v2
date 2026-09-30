package ke.imperialenterprise.imperialai

import ke.imperialenterprise.imperialai.data.openrouter.OpenRouterNormalizer
import ke.imperialenterprise.imperialai.domain.model.AIError
import ke.imperialenterprise.imperialai.domain.model.AIErrorCode
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

/**
 * Unit tests for OpenRouter model normalization, free model detection,
 * capability detection, and HTTP error mapping.
 */
class OpenRouterNormalizerAndErrorTest {

    @Test
    fun `test free model detection from zero-cost pricing`() {
        val json = """
        {
            "id": "google/gemini-2.0-flash-exp:free",
            "name": "Google: Gemini 2.0 Flash Experimental (free)",
            "description": "Experimental fast multimodal model.",
            "context_length": 1048576,
            "architecture": {
                "modality": "text+image->text",
                "instruct_type": "gemini"
            },
            "pricing": {
                "prompt": "0",
                "completion": "0"
            },
            "supported_parameters": ["tools", "temperature"]
        }
        """.trimIndent()

        val item = JSONObject(json)
        val model = OpenRouterNormalizer.parseSingleModel(item)

        assertNotNull("Model should not be null", model)
        assertEquals("google/gemini-2.0-flash-exp:free", model!!.id)
        assertEquals("Gemini 2.0 Flash Experimental (free)", model.name)
        assertEquals("Google", model.provider)
        assertTrue("Model must be identified as free", model.isFree)
        assertEquals(0.0, model.inputCost, 0.0001)
        assertEquals(0.0, model.outputCost, 0.0001)
        assertEquals(1048576, model.contextLength)
        assertTrue("Should detect vision from image modality", model.supportsVision)
        assertTrue("Should detect tools from supported_parameters", model.supportsTools)
        assertFalse("Should not have reasoning if not specified", model.supportsReasoning)
    }

    @Test
    fun `test paid model with non-zero pricing calculation`() {
        val json = """
        {
            "id": "anthropic/claude-3.5-sonnet",
            "name": "Anthropic: Claude 3.5 Sonnet",
            "description": "Frontier intelligent agent model.",
            "context_length": 200000,
            "architecture": {
                "modality": "text+image->text"
            },
            "pricing": {
                "prompt": "0.000003",
                "completion": "0.000015"
            },
            "supported_parameters": ["tools"]
        }
        """.trimIndent()

        val item = JSONObject(json)
        val model = OpenRouterNormalizer.parseSingleModel(item)

        assertNotNull(model)
        assertFalse("Paid model must not be free", model!!.isFree)
        assertEquals(3.0, model.inputCost, 0.01)   // 0.000003 * 1,000,000 = $3.00/1M
        assertEquals(15.0, model.outputCost, 0.01) // 0.000015 * 1,000,000 = $15.00/1M
        assertTrue(model.supportsTools)
        assertTrue(model.supportsVision)
        assertFalse(model.supportsReasoning)
    }

    @Test
    fun `test reasoning capability detection for deepseek-r1`() {
        val json = """
        {
            "id": "deepseek/deepseek-r1:free",
            "name": "DeepSeek R1 (free)",
            "description": "Chain of thought reasoning model.",
            "context_length": 65536,
            "architecture": {
                "modality": "text->text"
            },
            "pricing": {
                "prompt": "0",
                "completion": "0"
            }
        }
        """.trimIndent()

        val item = JSONObject(json)
        val model = OpenRouterNormalizer.parseSingleModel(item)

        assertNotNull(model)
        assertTrue("DeepSeek R1 must be marked as supporting reasoning", model!!.supportsReasoning)
        assertFalse("DeepSeek R1 does not support vision", model.supportsVision)
        assertTrue(model.isFree)
    }

    @Test
    fun `test error mapping for HTTP status codes without leaking headers`() {
        val error401 = AIError.fromHttpStatus(401)
        assertEquals(AIErrorCode.INVALID_API_KEY, error401.code)
        assertTrue(error401.userFriendlyMessage.contains("Invalid OpenRouter API Key"))

        val error402 = AIError.fromHttpStatus(402)
        assertEquals(AIErrorCode.INSUFFICIENT_CREDITS, error402.code)
        assertTrue(error402.userFriendlyMessage.contains("Insufficient OpenRouter account credits"))

        val error429 = AIError.fromHttpStatus(429)
        assertEquals(AIErrorCode.RATE_LIMITED, error429.code)
        assertTrue(error429.isRetryable)
        assertTrue(error429.userFriendlyMessage.contains("OpenRouter rate limit reached"))

        val error404 = AIError.fromHttpStatus(404)
        assertEquals(AIErrorCode.MODEL_UNAVAILABLE, error404.code)

        val noKey = AIError.noApiKey()
        assertEquals(AIErrorCode.NO_API_KEY, noKey.code)
        assertFalse(noKey.isRetryable)
    }
}
