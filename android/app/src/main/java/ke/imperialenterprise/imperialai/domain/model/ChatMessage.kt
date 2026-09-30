package ke.imperialenterprise.imperialai.domain.model

import java.util.UUID

/**
 * Message domain model supporting text, tool invocation proposals, and operator approvals.
 */
data class ChatMessage(
    val id: String = UUID.randomUUID().toString(),
    val conversationId: String,
    val siteId: String,
    val sender: MessageRole,
    val content: String,
    val timestamp: String,
    val toolCall: ToolCallData? = null,
    val toolResult: ToolResultData? = null,
    val approvalPrompt: ApprovalPromptData? = null,
    val isStreaming: Boolean = false,
    val isInterrupted: Boolean = false,
    val usage: AIUsage? = null,
    val error: AIError? = null,
    val modelName: String? = null
)

enum class MessageRole {
    USER,
    ASSISTANT,
    SYSTEM,
    TOOL
}

data class ToolCallData(
    val toolName: String,
    val callId: String,
    val argumentsSummary: String,
    val status: ToolCallStatus = ToolCallStatus.PROPOSED
)

enum class ToolCallStatus {
    PROPOSED,
    RUNNING,
    SUCCESS,
    FAILED,
    REJECTED
}

data class ToolResultData(
    val toolName: String,
    val callId: String,
    val outputSummary: String,
    val executionDurationMs: Long = 0L,
    val isError: Boolean = false
)

data class ApprovalPromptData(
    val actionType: DangerousActionType,
    val description: String,
    val targetResource: String,
    val status: ApprovalStatus = ApprovalStatus.PENDING
)

enum class ApprovalStatus {
    PENDING,
    APPROVED,
    REJECTED,
    EXPIRED,
    CANCELLED,
    EXECUTED,
    FAILED
}
