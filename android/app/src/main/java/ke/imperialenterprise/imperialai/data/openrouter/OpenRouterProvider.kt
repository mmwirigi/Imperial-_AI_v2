package ke.imperialenterprise.imperialai.data.openrouter

import ke.imperialenterprise.imperialai.domain.agent.AIProvider
import ke.imperialenterprise.imperialai.domain.agent.AIStreamChunk
import ke.imperialenterprise.imperialai.domain.agent.ConnectionTestResult
import ke.imperialenterprise.imperialai.domain.model.*
import ke.imperialenterprise.imperialai.domain.repository.CredentialStore
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.*
import javax.net.ssl.HttpsURLConnection

/**
 * Production implementation of [AIProvider] routing via OpenRouter.
 * 
 * Guarantees:
 * 1. API keys are loaded directly from [CredentialStore] and NEVER logged or leaked.
 * 2. Standardized error taxonomy mapping without revealing raw server headers.
 * 3. Progressive SSE streaming with cancellation and partial content retention.
 * 4. Captures real token usage & estimated cost when provided.
 */
class OpenRouterProvider(
    private val credentialStore: CredentialStore
) : AIProvider {

    override val providerId: String = "openrouter"
    override val providerDisplayName: String = "OpenRouter"

    private var activeStreamingJob: Job? = null
    private var activeHttpConnection: HttpURLConnection? = null

    companion object {
        private const val BASE_URL = "https://openrouter.ai/api/v1"
        private const val MODELS_ENDPOINT = "$BASE_URL/models"
        private const val CHAT_COMPLETIONS_ENDPOINT = "$BASE_URL/chat/completions"
        private const val APP_REFERER = "https://imperialenterprise.ke"
        private const val APP_TITLE = "Imperial AI"
        private const val CONNECT_TIMEOUT_MS = 15_000
        private const val READ_TIMEOUT_MS = 60_000
    }

    override suspend fun listModels(forceRefresh: Boolean): List<AIModel> = withContext(Dispatchers.IO) {
        val apiKey = credentialStore.getOpenRouterApiKey()
        // OpenRouter allows model catalog discovery even anonymously, but authenticated returns tier-specific availability
        val url = URL(MODELS_ENDPOINT)
        val conn = (url.openConnection() as HttpsURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = CONNECT_TIMEOUT_MS
            readTimeout = READ_TIMEOUT_MS
            setRequestProperty("Accept", "application/json")
            setRequestProperty("HTTP-Referer", APP_REFERER)
            setRequestProperty("X-Title", APP_TITLE)
            if (!apiKey.isNullOrBlank()) {
                setRequestProperty("Authorization", "Bearer $apiKey")
            }
        }

        try {
            val responseCode = conn.responseCode
            if (responseCode in 200..299) {
                val responseText = conn.inputStream.bufferedReader().use { it.readText() }
                OpenRouterNormalizer.parseModelsResponse(responseText)
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            emptyList()
        } finally {
            conn.disconnect()
        }
    }

    override suspend fun getModel(modelId: String): AIModel? {
        val models = listModels(forceRefresh = false)
        return models.find { it.id == modelId }
    }

    override suspend fun sendMessage(request: AIRequest): Result<AIResponse> = withContext(Dispatchers.IO) {
        val apiKey = credentialStore.getOpenRouterApiKey()
        if (apiKey.isNullOrBlank()) {
            return@withContext Result.failure(IllegalStateException(AIError.noApiKey().userFriendlyMessage))
        }

        try {
            val payload = buildChatPayload(request, stream = false)
            val url = URL(CHAT_COMPLETIONS_ENDPOINT)
            val conn = (url.openConnection() as HttpsURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = CONNECT_TIMEOUT_MS
                readTimeout = READ_TIMEOUT_MS
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Accept", "application/json")
                setRequestProperty("Authorization", "Bearer $apiKey")
                setRequestProperty("HTTP-Referer", APP_REFERER)
                setRequestProperty("X-Title", APP_TITLE)
            }

            conn.outputStream.use { os ->
                OutputStreamWriter(os, "UTF-8").use { writer ->
                    writer.write(payload.toString())
                    writer.flush()
                }
            }

            val statusCode = conn.responseCode
            if (statusCode in 200..299) {
                val responseText = conn.inputStream.bufferedReader().use { it.readText() }
                val json = JSONObject(responseText)
                val choices = json.optJSONArray("choices")
                val firstChoice = choices?.optJSONObject(0)
                val messageObj = firstChoice?.optJSONObject("message")
                val content = messageObj?.optString("content", "") ?: ""
                val finishReason = firstChoice?.optString("finish_reason", "stop")

                // Extract tool calls from assistant message
                val toolCalls = OpenRouterNormalizer.parseToolCalls(messageObj)

                val usage = parseUsage(json.optJSONObject("usage"), request.modelId)
                Result.success(
                    AIResponse(
                        content = content,
                        toolCalls = toolCalls,
                        modelUsed = json.optString("model", request.modelId),
                        usage = usage,
                        finishReason = finishReason
                    )
                )
            } else {
                val error = AIError.fromHttpStatus(statusCode)
                Result.failure(Exception(error.userFriendlyMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception(AIError.networkError(e).userFriendlyMessage))
        }
    }

    override fun streamMessage(request: AIRequest): Flow<AIStreamChunk> = flow {
        val apiKey = credentialStore.getOpenRouterApiKey()
        if (apiKey.isNullOrBlank()) {
            emit(AIStreamChunk.Error(AIError.noApiKey()))
            return@flow
        }

        var conn: HttpsURLConnection? = null
        val accumulatedText = StringBuilder()
        var finalUsage: AIUsage? = null

        try {
            val payload = buildChatPayload(request, stream = true)
            val url = URL(CHAT_COMPLETIONS_ENDPOINT)
            conn = (url.openConnection() as HttpsURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = CONNECT_TIMEOUT_MS
                readTimeout = READ_TIMEOUT_MS
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Accept", "text/event-stream")
                setRequestProperty("Authorization", "Bearer $apiKey")
                setRequestProperty("HTTP-Referer", APP_REFERER)
                setRequestProperty("X-Title", APP_TITLE)
            }

            activeHttpConnection = conn

            conn.outputStream.use { os ->
                OutputStreamWriter(os, "UTF-8").use { writer ->
                    writer.write(payload.toString())
                    writer.flush()
                }
            }

            val responseCode = conn.responseCode
            if (responseCode !in 200..299) {
                val errBody = conn.errorStream?.bufferedReader()?.use { it.readText() }
                val aiError = AIError.fromHttpStatus(responseCode, errBody)
                emit(AIStreamChunk.Error(aiError))
                return@flow
            }

            val reader = BufferedReader(InputStreamReader(conn.inputStream, "UTF-8"))
            var line: String?

            while (coroutineContext.isActive) {
                line = reader.readLine() ?: break
                val trimmed = line.trim()
                if (trimmed.isEmpty() || trimmed.startsWith(":")) continue

                if (trimmed.startsWith("data:")) {
                    val dataContent = trimmed.substring(5).trim()
                    if (dataContent == "[DONE]") {
                        break
                    }

                    try {
                        val chunkJson = JSONObject(dataContent)
                        
                        // Parse usage if attached in SSE chunk
                        val usageObj = chunkJson.optJSONObject("usage")
                        if (usageObj != null) {
                            finalUsage = parseUsage(usageObj, request.modelId)
                            emit(AIStreamChunk.Usage(finalUsage))
                        }

                        val choices = chunkJson.optJSONArray("choices")
                        if (choices != null && choices.length() > 0) {
                            val choice = choices.getJSONObject(0)
                            val delta = choice.optJSONObject("delta")
                            val contentChunk = delta?.optString("content")
                            if (!contentChunk.isNullOrEmpty()) {
                                accumulatedText.append(contentChunk)
                                emit(AIStreamChunk.Delta(contentChunk))
                            }
                        }
                    } catch (e: Exception) {
                        // Ignore malformed intermediate heartbeat chunks
                    }
                }
            }

            emit(AIStreamChunk.Completed(accumulatedText.toString(), finalUsage))

        } catch (e: CancellationException) {
            // Preservation of partial content on user stop
            emit(AIStreamChunk.Error(AIError.streamInterrupted()))
            if (accumulatedText.isNotEmpty()) {
                emit(AIStreamChunk.Completed(accumulatedText.toString(), finalUsage))
            }
        } catch (e: Exception) {
            emit(AIStreamChunk.Error(AIError.networkError(e)))
        } finally {
            try {
                conn?.disconnect()
            } catch (ignored: Exception) {}
            activeHttpConnection = null
        }
    }.flowOn(Dispatchers.IO)

    override suspend fun testConnection(apiKey: String?): ConnectionTestResult = withContext(Dispatchers.IO) {
        val key = apiKey?.takeIf { it.isNotBlank() } ?: credentialStore.getOpenRouterApiKey()
        if (key.isNullOrBlank()) {
            return@withContext ConnectionTestResult(
                isSuccessful = false,
                latencyMs = 0,
                message = "No API key configured.",
                error = AIError.noApiKey()
            )
        }

        val startTime = System.currentTimeMillis()
        var conn: HttpsURLConnection? = null
        try {
            val url = URL(MODELS_ENDPOINT)
            conn = (url.openConnection() as HttpsURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 8_000
                readTimeout = 8_000
                setRequestProperty("Accept", "application/json")
                setRequestProperty("Authorization", "Bearer $key")
                setRequestProperty("HTTP-Referer", APP_REFERER)
                setRequestProperty("X-Title", APP_TITLE)
            }

            val statusCode = conn.responseCode
            val latency = System.currentTimeMillis() - startTime

            if (statusCode in 200..299) {
                ConnectionTestResult(
                    isSuccessful = true,
                    latencyMs = latency,
                    message = "Connected successfully (${latency}ms)"
                )
            } else {
                val error = AIError.fromHttpStatus(statusCode)
                ConnectionTestResult(
                    isSuccessful = false,
                    latencyMs = latency,
                    message = error.userFriendlyMessage,
                    error = error
                )
            }
        } catch (e: Exception) {
            val latency = System.currentTimeMillis() - startTime
            val error = AIError.networkError(e)
            ConnectionTestResult(
                isSuccessful = false,
                latencyMs = latency,
                message = error.userFriendlyMessage,
                error = error
            )
        } finally {
            conn?.disconnect()
        }
    }

    override fun cancelGeneration() {
        try {
            activeHttpConnection?.disconnect()
            activeStreamingJob?.cancel()
        } catch (ignored: Exception) {}
    }

    private fun buildChatPayload(request: AIRequest, stream: Boolean): JSONObject {
        val root = JSONObject()
        root.put("model", request.modelId)
        root.put("stream", stream)

        if (request.temperature != null) {
            root.put("temperature", request.temperature)
        }
        if (request.maxTokens != null) {
            root.put("max_tokens", request.maxTokens)
        }

        val messagesArray = JSONArray()

        // System Prompt
        if (!request.systemPrompt.isNullOrBlank()) {
            val sysObj = JSONObject()
            sysObj.put("role", "system")
            sysObj.put("content", request.systemPrompt)
            messagesArray.put(sysObj)
        }

        // Conversational turns
        request.messages.forEach { msg ->
            val msgObj = JSONObject()
            val role = when (msg.sender) {
                MessageRole.USER -> "user"
                MessageRole.ASSISTANT -> "assistant"
                MessageRole.SYSTEM -> "system"
                MessageRole.TOOL -> "tool"
            }
            msgObj.put("role", role)

            if (msg.sender == MessageRole.TOOL) {
                // OpenAI / OpenRouter standard tool result message format
                val callId = msg.toolResult?.callId ?: msg.toolCall?.callId ?: "call_${msg.id}"
                msgObj.put("tool_call_id", callId)
                msgObj.put("content", msg.content)
            } else if (msg.sender == MessageRole.ASSISTANT && msg.toolCall != null) {
                // Assistant message specifying a tool call
                if (msg.content.isNotBlank()) {
                    msgObj.put("content", msg.content)
                } else {
                    msgObj.put("content", JSONObject.NULL)
                }
                val callsArr = JSONArray()
                val callObj = JSONObject()
                callObj.put("id", msg.toolCall.callId)
                callObj.put("type", "function")
                val fnObj = JSONObject()
                fnObj.put("name", msg.toolCall.toolName)
                fnObj.put("arguments", msg.toolCall.argumentsSummary)
                callObj.put("function", fnObj)
                callsArr.put(callObj)
                msgObj.put("tool_calls", callsArr)
            } else {
                msgObj.put("content", msg.content)
            }
            messagesArray.put(msgObj)
        }

        root.put("messages", messagesArray)

        // Remote MCP tool definitions for OpenRouter function calling
        if (request.tools.isNotEmpty()) {
            val toolsArray = JSONArray()
            request.tools.forEach { toolDef ->
                val toolObj = JSONObject()
                toolObj.put("type", "function")
                val fnObj = JSONObject()
                fnObj.put("name", toolDef.name)
                fnObj.put("description", toolDef.description)
                fnObj.put("parameters", JSONObject(toolDef.parameters))
                toolObj.put("function", fnObj)
                toolsArray.put(toolObj)
            }
            root.put("tools", toolsArray)
            if (request.toolChoice != null) {
                root.put("tool_choice", request.toolChoice)
            }
        }

        return root
    }

    private fun parseUsage(usageObj: JSONObject?, modelId: String): AIUsage? {
        if (usageObj == null) return null
        val promptTokens = usageObj.optInt("prompt_tokens", 0)
        val completionTokens = usageObj.optInt("completion_tokens", 0)
        val totalTokens = usageObj.optInt("total_tokens", promptTokens + completionTokens)

        val cost = if (usageObj.has("total_cost")) {
            usageObj.optDouble("total_cost", 0.0)
        } else null

        val sdf = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
        return AIUsage(
            model = modelId,
            inputTokens = promptTokens,
            outputTokens = completionTokens,
            totalTokens = totalTokens,
            estimatedCost = cost,
            timestamp = sdf.format(Date())
        )
    }
}
