package ke.imperialenterprise.imperialai.domain.agent

import ke.imperialenterprise.imperialai.domain.model.McpStatus
import kotlinx.coroutines.flow.Flow

/**
 * Interface abstraction for Model Context Protocol (MCP) clients.
 * In future phases, this will establish JSON-RPC connections to remote MCP WordPress agents.
 * 
 * In Phase 1, this has no real network implementation.
 */
interface MCPClient {
    /**
     * Connect to remote MCP endpoint for a designated site.
     */
    suspend fun connect(siteId: String, endpointUrl: String): McpConnectionResult

    /**
     * Disconnect gracefully from remote MCP endpoint.
     */
    suspend fun disconnect(siteId: String)

    /**
     * Observe live connection health state.
     */
    fun observeStatus(siteId: String): Flow<McpStatus>

    /**
     * Discovers all available WordPress tool capabilities advertised by the MCP server.
     */
    suspend fun listTools(siteId: String): List<MCPToolDefinition>

    /**
     * Executes a tool remotely through the MCP server.
     */
    suspend fun executeTool(
        siteId: String,
        toolName: String,
        argumentsJson: String
    ): MCPToolExecutionResult
}

data class McpConnectionResult(
    val success: Boolean,
    val serverVersion: String = "",
    val advertisedToolsCount: Int = 0,
    val errorMessage: String? = null
)

data class MCPToolDefinition(
    val name: String,
    val description: String,
    val inputSchemaJson: String,
    val isDangerous: Boolean = false
)

data class MCPToolExecutionResult(
    val success: Boolean,
    val content: String,
    val isError: Boolean = false
)
