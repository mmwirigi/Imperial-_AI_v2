package ke.imperialenterprise.imperialai.domain.repository

import ke.imperialenterprise.imperialai.domain.model.ChatConversation
import ke.imperialenterprise.imperialai.domain.model.ChatMessage
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface governing isolated chat sessions per site.
 */
interface ConversationRepository {
    fun getConversationForSite(siteId: String): Flow<ChatConversation?>
    fun getMessagesForConversation(conversationId: String): Flow<List<ChatMessage>>
    suspend fun getOrCreateConversation(siteId: String, siteName: String): ChatConversation
    suspend fun appendMessage(message: ChatMessage)
    suspend fun clearMessagesForSite(siteId: String)
}
