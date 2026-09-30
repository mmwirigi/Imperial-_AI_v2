package ke.imperialenterprise.imperialai.domain.agent

import ke.imperialenterprise.imperialai.domain.model.*
import kotlinx.coroutines.flow.Flow

/**
 * Autonomous executive agent engine coordinating OpenRouter reasoning,
 * MCP tool discovery, strict site isolation, operator approvals, and execution loops.
 * 
 * Flow:
 * User -> Chat -> ChatViewModel -> AgentEngine -> AIProvider -> OpenRouter ->
 * Tool Call? -> ToolRegistry -> ActiveSiteContext validation -> Permission/Approval check ->
 * MCP tool execution -> Tool result -> OpenRouter -> Final response.
 */
interface AgentEngine {

    /**
     * Executes a complete agent turn in response to a user request.
     * Emits progressive execution events (thinking, streaming deltas, tool calls, approvals, completions).
     */
    fun runTurn(
        context: ActiveSiteContext,
        prompt: String,
        history: List<ChatMessage>,
        modelId: String,
        maxIterations: Int = 10
    ): Flow<AgentExecutionEvent>

    /**
     * Resumes an agent execution loop that was paused waiting for operator approval.
     */
    suspend fun resolveApproval(
        approvalId: String,
        approved: Boolean,
        operatorNotes: String = ""
    ): Boolean

    /**
     * Cancels any active agent turn execution and any executing tool.
     */
    fun cancel()
}

/**
 * Structured execution events emitted by the AgentEngine.
 */
sealed class AgentExecutionEvent {
    data class Started(
        val siteId: String,
        val siteName: String,
        val conversationId: String,
        val userPrompt: String
    ) : AgentExecutionEvent()

    data class IterationStarted(
        val iteration: Int,
        val maxIterations: Int
    ) : AgentExecutionEvent()

    data class Thinking(
        val thought: String
    ) : AgentExecutionEvent()

    data class StreamingDelta(
        val delta: String,
        val accumulatedText: String
    ) : AgentExecutionEvent()

    data class ToolCallDetected(
        val toolCall: AIToolCall,
        val tool: McpTool
    ) : AgentExecutionEvent()

    data class ToolApprovalRequired(
        val approvalId: String,
        val toolCall: AIToolCall,
        val tool: McpTool,
        val request: ToolExecutionRequest,
        val promptData: ApprovalPromptData
    ) : AgentExecutionEvent()

    data class ToolExecuting(
        val toolCall: AIToolCall,
        val tool: McpTool
    ) : AgentExecutionEvent()

    data class ToolExecutionFinished(
        val toolCall: AIToolCall,
        val tool: McpTool,
        val result: AIToolResult
    ) : AgentExecutionEvent()

    data class ToolExecutionRejected(
        val toolCall: AIToolCall,
        val reason: String
    ) : AgentExecutionEvent()

    data class MaxIterationsReached(
        val iterationsRun: Int
    ) : AgentExecutionEvent()

    data class TurnCompleted(
        val finalResponse: String,
        val totalIterations: Int,
        val usage: AIUsage?,
        val executedToolsCount: Int
    ) : AgentExecutionEvent()

    data class Error(
        val error: AIError
    ) : AgentExecutionEvent()

    object Cancelled : AgentExecutionEvent()
}
