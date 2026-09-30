package ke.imperialenterprise.imperialai.domain.repository

import ke.imperialenterprise.imperialai.domain.model.McpStatus
import ke.imperialenterprise.imperialai.domain.model.Site
import kotlinx.coroutines.flow.Flow

/**
 * Repository abstraction for WordPress client sites.
 * Decouples storage (Room / in-memory / encrypted datastore) from UI screens.
 */
interface SiteRepository {
    fun getSites(): Flow<List<Site>>
    suspend fun getSiteById(siteId: String): Site?
    suspend fun insertSite(site: Site)
    suspend fun updateSite(site: Site)
    suspend fun deleteSite(siteId: String)
    suspend fun updateMcpStatus(siteId: String, status: McpStatus)
}
