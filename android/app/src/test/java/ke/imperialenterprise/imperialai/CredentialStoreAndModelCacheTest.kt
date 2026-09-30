package ke.imperialenterprise.imperialai

import ke.imperialenterprise.imperialai.data.repository.AndroidKeystoreCredentialStore
import ke.imperialenterprise.imperialai.data.repository.OpenRouterModelRepository
import ke.imperialenterprise.imperialai.domain.agent.AIProvider
import ke.imperialenterprise.imperialai.domain.agent.AIStreamChunk
import ke.imperialenterprise.imperialai.domain.agent.ConnectionTestResult
import ke.imperialenterprise.imperialai.domain.model.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

/**
 * Unit tests verifying:
 * 1. API Key storage security and masking: sk-or-••••••••••••••••
 * 2. Model selection: Global default vs conversation override
 * 3. Model caching and offline fallback
 */
class CredentialStoreAndModelCacheTest {

    @Test
    fun `test API key security and masking`() = runBlocking {
        val credentialStore = AndroidKeystoreCredentialStore()
        assertFalse(credentialStore.hasOpenRouterApiKey())
        assertNull(credentialStore.getMaskedOpenRouterApiKey())

        // Save real-style key
        credentialStore.setOpenRouterApiKey("sk-or-v1-abcdef1234567890abcdef1234567890")

        assertTrue(credentialStore.hasOpenRouterApiKey())
        val masked = credentialStore.getMaskedOpenRouterApiKey()
        assertNotNull(masked)
        assertEquals("sk-or-••••••••••••••••", masked)
        assertFalse("Masked key must NEVER reveal raw characters", masked!!.contains("abcdef"))

        // Clear key
        credentialStore.clearOpenRouterApiKey()
        assertFalse(credentialStore.hasOpenRouterApiKey())
        assertNull(credentialStore.getMaskedOpenRouterApiKey())
    }

    @Test
    fun `test global default model and conversation override`() = runBlocking {
        val mockProvider = object : AIProvider {
            override val providerId: String = "mock"
            override val providerDisplayName: String = "Mock Provider"
            override suspend fun sendMessage(request: AIRequest): Result<AIResponse> =
                Result.success(AIResponse("OK", request.modelId))
            override fun streamMessage(request: AIRequest): Flow<AIStreamChunk> = emptyFlow()
            override suspend fun listModels(forceRefresh: Boolean): List<AIModel> = emptyList()
            override suspend fun getModel(modelId: String): AIModel? = null
            override suspend fun testConnection(apiKey: String?): ConnectionTestResult =
                ConnectionTestResult(true, 50, "Connected")
            override fun cancelGeneration() {}
        }

        val repository = OpenRouterModelRepository(mockProvider)

        // Initial default
        val defaultModel = repository.getGlobalDefaultModelId().first()
        assertEquals("google/gemini-2.0-flash-exp:free", defaultModel)

        // Conversation override should initially be null
        val convId = "conv-site-1"
        assertNull(repository.getConversationModelId(convId).first())

        // Set conversation override
        repository.setConversationModelId(convId, "anthropic/claude-3.5-sonnet")
        assertEquals("anthropic/claude-3.5-sonnet", repository.getConversationModelId(convId).first())

        // Global default remains unaffected
        assertEquals("google/gemini-2.0-flash-exp:free", repository.getGlobalDefaultModelId().first())

        // Change global default
        repository.setGlobalDefaultModelId("meta-llama/llama-3.3-70b-instruct:free")
        assertEquals("meta-llama/llama-3.3-70b-instruct:free", repository.getGlobalDefaultModelId().first())
        // Conversation override still preserved
        assertEquals("anthropic/claude-3.5-sonnet", repository.getConversationModelId(convId).first())

        // Clear conversation override
        repository.setConversationModelId(convId, null)
        assertNull(repository.getConversationModelId(convId).first())
    }

    @Test
    fun `test model repository cache fallback when provider returns empty`() = runBlocking {
        val mockFailingProvider = object : AIProvider {
            override val providerId: String = "mock_fail"
            override val providerDisplayName: String = "Mock Failing"
            override suspend fun sendMessage(request: AIRequest): Result<AIResponse> =
                Result.failure(Exception("Offline"))
            override fun streamMessage(request: AIRequest): Flow<AIStreamChunk> = emptyFlow()
            override suspend fun listModels(forceRefresh: Boolean): List<AIModel> = emptyList()
            override suspend fun getModel(modelId: String): AIModel? = null
            override suspend fun testConnection(apiKey: String?): ConnectionTestResult =
                ConnectionTestResult(false, 0, "Network error")
            override fun cancelGeneration() {}
        }

        val repository = OpenRouterModelRepository(mockFailingProvider)
        val initialCount = repository.catalogState.value.models.size
        assertTrue("Initial cache should contain baseline models", initialCount > 0)

        // Trigger refresh with failing network
        repository.refreshModels()

        // Catalog must not be cleared! Previously cached models must be preserved.
        assertEquals(initialCount, repository.catalogState.value.models.size)
        assertNotNull(repository.catalogState.value.errorMessage)
    }
}
