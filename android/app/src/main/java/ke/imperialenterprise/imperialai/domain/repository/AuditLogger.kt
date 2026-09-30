package ke.imperialenterprise.imperialai.domain.repository

import ke.imperialenterprise.imperialai.domain.model.AuditEvent
import kotlinx.coroutines.flow.Flow

/**
 * Audit Logger interface for command center operations.
 * Must enforce automatic parameter redaction so sensitive tokens never hit logs.
 */
interface AuditLogger {
    fun getRecentEvents(limit: Int = 50): Flow<List<AuditEvent>>
    fun getEventsForSite(siteId: String): Flow<List<AuditEvent>>
    suspend fun recordEvent(event: AuditEvent)
}
