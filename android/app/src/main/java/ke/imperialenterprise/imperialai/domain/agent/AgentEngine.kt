package ke.imperialenterprise.imperialai.domain.agent

import ke.imperialenterprise.imperialai.domain.model.*
import kotlinx.coroutines.flow.Flow

/**
 * Autonomous executive agent engine coordinating OpenRouter reasoning,
 * MCP tool discovery, strict site isolation, operator approvals, and execution loops.
 * 
 * Target Flow:
 * User -> Chat -> ChatViewModel -> AgentEngine -> AIProvider -> OpenRouter ->
 * Tool Call? -> ToolRegistry -> ActiveSiteContext validation -> Permission/Approval check ->
 * MCP tool execution -> Tool result -> OpenRouter -> Final response.
 */
interface AgentEngine {

    /**
     * Returns true if an agent turn is actively executing.
     */
    fun isRunning(): Boolean

    /**
     * Returns the siteId locked to the current execution run, if active.
     */
    fun getLockedSiteId(): String?

    /**
     * Executes an autonomous agent turn with the given prompt, conversation history, site context, and mode.
     */
    fun runTurn(
        context: ActiveSiteContext,
        prompt: String,
        history: List<ChatMessage>,
        modelId: String,
        mode: AgentMode = AgentMode.READ,
        maxIterations: Int = 10
    ): Flow<AgentExecutionEvent>

    /**
     * Resumes an agent execution loop paused for operator approval.
     */
    suspend fun resolveApproval(
        approvalId: String,
        approved: Boolean,
        operatorNotes: String = "",
        suppliedArgumentsHash: String? = null
    ): Boolean

    /**
     * Cancels any active agent turn execution.
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
        val userPrompt: String,
        val mode: AgentMode
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
        val approvalRequest: ApprovalRequest,
        val toolCall: AIToolCall,
        val tool: McpTool
    ) : AgentExecutionEvent() {
        val approvalId: String get() = approvalRequest.id
        val promptData: ApprovalPromptData get() = ApprovalPromptData(
            actionType = DangerousActionType.CHANGE_SITE_SETTINGS,
            description = "Site: ${approvalRequest.siteId}\nTool: ${approvalRequest.toolName}\nReason: ${approvalRequest.reason}\n${approvalRequest.argumentsSummary}",
            targetResource = approvalRequest.siteId,
            status = approvalRequest.status
        )
    }

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
