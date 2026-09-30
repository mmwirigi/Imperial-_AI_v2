package ke.imperialenterprise.imperialai.data.repository

import ke.imperialenterprise.imperialai.data.sample.SampleData
import ke.imperialenterprise.imperialai.domain.model.AuditEvent
import ke.imperialenterprise.imperialai.domain.repository.AuditLogger
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map

/**
 * Audit Logger enforcing mandatory secret redaction.
 * Any occurrence of authorization bearer tokens, API keys, or WordPress application
 * passwords is stripped before writing to memory or log storage.
 */
class InMemoryAuditLogger : AuditLogger {

    private val _events = MutableStateFlow<List<AuditEvent>>(SampleData.demoAuditEvents)

    override fun getRecentEvents(limit: Int): Flow<List<AuditEvent>> {
        return _events.map { it.take(limit) }
    }

    override fun getEventsForSite(siteId: String): Flow<List<AuditEvent>> {
        return _events.map { list -> list.filter { it.siteId == siteId } }
    }

    override suspend fun recordEvent(event: AuditEvent) {
        val sanitizedEvent = event.copy(
            parametersSummary = redactSensitiveSecrets(event.parametersSummary),
            resultSummary = redactSensitiveSecrets(event.resultSummary)
        )
        _events.value = listOf(sanitizedEvent) + _events.value
    }

    private fun redactSensitiveSecrets(input: String): String {
        return input
            .replace(Regex("(?i)(sk-or-v1-[a-zA-Z0-9_-]{10,})"), "[REDACTED_API_KEY]")
            .replace(Regex("(?i)(bearer\\s+[a-zA-Z0-9_.-]{10,})"), "Bearer [REDACTED_TOKEN]")
            .replace(Regex("(?i)(password=)[^;\\s]+"), "$1[REDACTED_PASSWORD]")
            .replace(Regex("(?i)(token=)[^;\\s]+"), "$1[REDACTED_TOKEN]")
    }
}
