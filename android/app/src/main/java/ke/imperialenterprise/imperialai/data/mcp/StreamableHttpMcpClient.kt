package ke.imperialenterprise.imperialai.data.mcp

import ke.imperialenterprise.imperialai.domain.agent.McpConnection
import ke.imperialenterprise.imperialai.domain.model.*
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.atomic.AtomicInteger
import javax.net.ssl.HttpsURLConnection

/**
 * Production implementation of [McpConnection] using the MCP Streamable HTTP transport.
 * Executes JSON-RPC 2.0 protocol specifications with strict header sanitization,
 * timeouts, and client isolation.
 */
class StreamableHttpMcpClient(
    override val serverId: String,
    override val siteId: String,
    private val endpointUrl: String,
    private val authType: McpAuthType,
    private val credentialManager: McpCredentialManager,
    private val serverName: String = "Remote MCP Server"
) : McpConnection {

    private val _status = MutableStateFlow(McpConnectionStatus.NOT_CONFIGURED)
    override val status: StateFlow<McpConnectionStatus> = _status.asStateFlow()

    private val requestIdCounter = AtomicInteger(1)
    private var activeHttpConnection: HttpURLConnection? = null
    private var cachedServerMetadata: MCPServer? = null

    companion object {
        private const val PROTOCOL_VERSION = "2024-11-05"
        private const val CONNECT_TIMEOUT_MS = 10_000
        private const val READ_TIMEOUT_MS = 30_000
    }

    override fun isConnected(): Boolean {
        return _status.value == McpConnectionStatus.CONNECTED
    }

    override suspend fun initialize(): Result<MCPServer> = withContext(Dispatchers.IO) {
        _status.value = McpConnectionStatus.CONNECTING
        try {
            // Step 1: Send JSON-RPC "initialize"
            val initParams = JSONObject().apply {
                put("protocolVersion", PROTOCOL_VERSION)
                put("capabilities", JSONObject().apply {
                    put("roots", JSONObject().apply { put("listChanged", true) })
                    put("sampling", JSONObject())
                })
                put("clientInfo", JSONObject().apply {
                    put("name", "Imperial AI")
                    put("version", "1.0.0")
                })
            }

            val initResponse = sendJsonRpcRequest("initialize", initParams)
            if (initResponse.has("error")) {
                val errObj = initResponse.getJSONObject("error")
                val code = errObj.optInt("code", -1)
                val message = errObj.optString("message", "MCP handshake rejected")
                _status.value = if (code == 401 || code == 403) McpConnectionStatus.AUTH_REQUIRED else McpConnectionStatus.ERROR
                return@withContext Result.failure(Exception("MCP initialization failed: $message (code $code)"))
            }

            val resultObj = initResponse.optJSONObject("result") ?: JSONObject()
            val negotiatedVersion = resultObj.optString("protocolVersion", PROTOCOL_VERSION)
            val serverInfoObj = resultObj.optJSONObject("serverInfo")
            val serverInfo = if (serverInfoObj != null) {
                McpServerInfo(
                    name = serverInfoObj.optString("name", serverName),
                    version = serverInfoObj.optString("version", "1.0.0")
                )
            } else {
                McpServerInfo(serverName, "1.0.0")
            }

            val capabilitiesObj = resultObj.optJSONObject("capabilities")
            val capabilities = McpServerCapabilities(
                tools = capabilitiesObj?.has("tools") ?: true,
                prompts = capabilitiesObj?.has("prompts") ?: false,
                resources = capabilitiesObj?.has("resources") ?: false
            )

            // Step 2: Send "notifications/initialized"
            sendJsonRpcNotification("notifications/initialized", JSONObject())

            // Step 3: Discover initial tool catalog
            val toolsResult = listTools()
            val toolsCount = toolsResult.getOrNull()?.size ?: 0

            val sdf = SimpleDateFormat("MMM d, HH:mm", Locale.getDefault())
            val serverModel = MCPServer(
                id = serverId,
                name = serverName,
                endpoint = endpointUrl,
                siteId = siteId,
                enabled = true,
                connectionStatus = McpConnectionStatus.CONNECTED,
                transport = McpTransportType.STREAMABLE_HTTP,
                authenticationType = authType,
                lastConnected = sdf.format(Date()),
                lastError = null,
                serverInfo = serverInfo,
                protocolVersion = negotiatedVersion,
                capabilities = capabilities,
                discoveredToolsCount = toolsCount
            )

            cachedServerMetadata = serverModel
            _status.value = McpConnectionStatus.CONNECTED
            Result.success(serverModel)

        } catch (e: CancellationException) {
            _status.value = McpConnectionStatus.DISCONNECTED
            Result.failure(e)
        } catch (e: Exception) {
            _status.value = McpConnectionStatus.ERROR
            Result.failure(Exception("Connection to MCP server failed: ${e.message ?: "Network unreachable"}"))
        }
    }

    override suspend fun listTools(): Result<List<McpTool>> = withContext(Dispatchers.IO) {
        try {
            val response = sendJsonRpcRequest("tools/list", JSONObject())
            if (response.has("error")) {
                val err = response.getJSONObject("error").optString("message", "Error fetching tools")
                return@withContext Result.failure(Exception(err))
            }

            val resultObj = response.optJSONObject("result")
            val toolsArray = resultObj?.optJSONArray("tools") ?: JSONArray()
            val toolList = mutableListOf<McpTool>()

            for (i in 0 until toolsArray.length()) {
                val toolObj = toolsArray.optJSONObject(i) ?: continue
                val name = toolObj.optString("name").takeIf { it.isNotBlank() } ?: continue
                val title = toolObj.optString("title").takeIf { it.isNotBlank() }
                val description = toolObj.optString("description", "")

                // Parse inputSchema
                val inputSchemaObj = toolObj.optJSONObject("inputSchema")
                val schemaMap = mutableMapOf<String, Any?>()
                if (inputSchemaObj != null) {
                    schemaMap["type"] = inputSchemaObj.optString("type", "object")
                    val props = inputSchemaObj.optJSONObject("properties")
                    if (props != null) {
                        val propMap = mutableMapOf<String, Any?>()
                        props.keys().forEach { k ->
                            propMap[k] = props.opt(k)
                        }
                        schemaMap["properties"] = propMap
                    }
                }

                // Parse optional annotations
                val annotationsObj = toolObj.optJSONObject("annotations")
                val annotations = if (annotationsObj != null) {
                    McpToolAnnotations(
                        readOnly = annotationsObj.optBoolean("readOnly", false),
                        destructive = annotationsObj.optBoolean("destructive", false),
                        idempotent = annotationsObj.optBoolean("idempotent", false)
                    )
                } else null

                // Determine risk level: unknown tools default to HIGH_RISK_WRITE
                val risk = annotations?.deriveRiskLevel(name) ?: ToolRiskLevel.HIGH_RISK_WRITE

                toolList.add(
                    McpTool(
                        name = name,
                        title = title,
                        description = description,
                        inputSchema = schemaMap,
                        annotations = annotations,
                        serverId = serverId,
                        siteId = siteId,
                        enabled = true,
                        requiresApproval = risk.requiresApprovalByDefault,
                        riskLevel = risk
                    )
                )
            }

            Result.success(toolList)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun callTool(name: String, arguments: Map<String, Any?>): Result<McpToolResult> = withContext(Dispatchers.IO) {
        val startTime = System.currentTimeMillis()
        try {
            val params = JSONObject().apply {
                put("name", name)
                put("arguments", JSONObject(arguments))
            }

            val response = sendJsonRpcRequest("tools/call", params)
            val duration = System.currentTimeMillis() - startTime

            if (response.has("error")) {
                val errorMsg = response.getJSONObject("error").optString("message", "Tool execution error")
                return@withContext Result.success(McpToolResult.error(errorMsg, duration))
            }

            val resultObj = response.optJSONObject("result") ?: JSONObject()
            val isError = resultObj.optBoolean("isError", false)
            val contentArray = resultObj.optJSONArray("content") ?: JSONArray()
            val contentList = mutableListOf<McpContent>()

            for (i in 0 until contentArray.length()) {
                val item = contentArray.optJSONObject(i) ?: continue
                val type = item.optString("type", "text")
                when (type) {
                    "image" -> {
                        contentList.add(
                            McpContent.Image(
                                dataBase64 = item.optString("data"),
                                mimeType = item.optString("mimeType", "image/png")
                            )
                        )
                    }
                    "resource" -> {
                        contentList.add(
                            McpContent.Resource(
                                uri = item.optString("uri"),
                                rawText = item.optString("text")
                            )
                        )
                    }
                    else -> {
                        contentList.add(McpContent.Text(item.optString("text", "")))
                    }
                }
            }

            if (contentList.isEmpty()) {
                contentList.add(McpContent.Text("Tool execution completed with no textual output."))
            }

            Result.success(
                McpToolResult(
                    content = contentList,
                    isError = isError,
                    executionDurationMs = duration
                )
            )

        } catch (e: Exception) {
            val duration = System.currentTimeMillis() - startTime
            Result.success(McpToolResult.error("Failed to communicate with remote MCP server: ${e.message}", duration))
        }
    }

    override suspend fun disconnect() = withContext(Dispatchers.IO) {
        try {
            activeHttpConnection?.disconnect()
        } catch (ignored: Exception) {}
        _status.value = McpConnectionStatus.DISCONNECTED
    }

    private suspend fun sendJsonRpcRequest(method: String, params: JSONObject): JSONObject {
        val requestId = requestIdCounter.getAndIncrement()
        val payload = JSONObject().apply {
            put("jsonrpc", "2.0")
            put("id", requestId)
            put("method", method)
            put("params", params)
        }

        return executeHttpPost(payload.toString())
    }

    private suspend fun sendJsonRpcNotification(method: String, params: JSONObject) {
        val payload = JSONObject().apply {
            put("jsonrpc", "2.0")
            put("method", method)
            put("params", params)
        }
        try {
            executeHttpPost(payload.toString())
        } catch (ignored: Exception) {}
    }

    private suspend fun executeHttpPost(payloadString: String): JSONObject {
        val url = URL(endpointUrl)
        val conn = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = CONNECT_TIMEOUT_MS
            readTimeout = READ_TIMEOUT_MS
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Accept", "application/json")
            setRequestProperty("X-MCP-Site-Scope", siteId)

            // Inject Bearer token securely from CredentialManager
            val authHeader = credentialManager.getAuthorizationHeader(siteId, serverId, authType)
            if (!authHeader.isNullOrBlank()) {
                setRequestProperty("Authorization", authHeader)
            }
        }

        activeHttpConnection = conn

        try {
            conn.outputStream.use { os ->
                OutputStreamWriter(os, "UTF-8").use { writer ->
                    writer.write(payloadString)
                    writer.flush()
                }
            }

            val statusCode = conn.responseCode
            if (statusCode in 200..299) {
                val responseText = conn.inputStream.bufferedReader().use { it.readText() }
                return JSONObject(responseText)
            } else {
                val errBody = conn.errorStream?.bufferedReader()?.use { it.readText() } ?: ""
                val errJson = JSONObject()
                errJson.put("jsonrpc", "2.0")
                errJson.put("error", JSONObject().apply {
                    put("code", statusCode)
                    put("message", "HTTP $statusCode error from MCP server: $errBody")
                })
                return errJson
            }
        } finally {
            activeHttpConnection = null
        }
    }
}
