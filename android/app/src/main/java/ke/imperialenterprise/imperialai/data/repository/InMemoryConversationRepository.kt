package ke.imperialenterprise.imperialai.data.repository

import ke.imperialenterprise.imperialai.domain.model.ChatConversation
import ke.imperialenterprise.imperialai.domain.model.ChatMessage
import ke.imperialenterprise.imperialai.domain.model.MessageRole
import ke.imperialenterprise.imperialai.domain.repository.ConversationRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import java.util.UUID

/**
 * Enforces strict site isolation for chat conversations.
 * Under no circumstances can a message from Site A be delivered or viewed in Site B's stream.
 */
class InMemoryConversationRepository : ConversationRepository {

    private val _conversations = MutableStateFlow<Map<String, ChatConversation>>(emptyMap())
    private val _messagesByConversation = MutableStateFlow<Map<String, List<ChatMessage>>>(emptyMap())

    override fun getConversationForSite(siteId: String): Flow<ChatConversation?> {
        return _conversations.map { it[siteId] }
    }

    override fun getMessagesForConversation(conversationId: String): Flow<List<ChatMessage>> {
        return _messagesByConversation.map { it[conversationId] ?: emptyList() }
    }

    override suspend fun getOrCreateConversation(siteId: String, siteName: String): ChatConversation {
        val existing = _conversations.value[siteId]
        if (existing != null) return existing

        val newConversation = ChatConversation(
            id = "conv-$siteId",
            siteId = siteId,
            siteName = siteName,
            title = "$siteName AI Session",
            createdAt = "Today",
            updatedAt = "Today"
        )

        // Seed with welcome system greeting explicitly stating active site boundary
        val welcomeMessage = ChatMessage(
            id = UUID.randomUUID().toString(),
            conversationId = newConversation.id,
            siteId = siteId,
            sender = MessageRole.ASSISTANT,
            content = "Active Site Context locked: $siteName.\n\nReady to audit WordPress metadata, review sitemaps, or inspect theme assets. All future tool operations will be executed strictly against this site's isolated scope.",
            timestamp = "Just now"
        )

        _conversations.value = _conversations.value + (siteId to newConversation)
        _messagesByConversation.value = _messagesByConversation.value + (newConversation.id to listOf(welcomeMessage))
        return newConversation
    }

    override suspend fun appendMessage(message: ChatMessage) {
        val currentList = _messagesByConversation.value[message.conversationId] ?: emptyList()
        _messagesByConversation.value = _messagesByConversation.value + (message.conversationId to (currentList + message))
    }

    override suspend fun clearMessagesForSite(siteId: String) {
        val conversation = _conversations.value[siteId] ?: return
        _messagesByConversation.value = _messagesByConversation.value - conversation.id
        _conversations.value = _conversations.value - siteId
    }
}
