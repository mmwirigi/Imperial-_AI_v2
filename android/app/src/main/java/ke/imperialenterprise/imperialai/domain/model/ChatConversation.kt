package ke.imperialenterprise.imperialai.domain.model

import java.util.UUID

/**
 * Isolated chat conversation bound exclusively to one WordPress site.
 */
data class ChatConversation(
    val id: String = UUID.randomUUID().toString(),
    val siteId: String,
    val siteName: String,
    val title: String = "Operations Session",
    val createdAt: String,
    val updatedAt: String
)
