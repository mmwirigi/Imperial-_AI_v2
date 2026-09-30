package ke.imperialenterprise.imperialai.data.repository

import ke.imperialenterprise.imperialai.data.sample.SampleData
import ke.imperialenterprise.imperialai.domain.model.McpStatus
import ke.imperialenterprise.imperialai.domain.model.Site
import ke.imperialenterprise.imperialai.domain.repository.SiteRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map

/**
 * In-memory implementation of SiteRepository preloaded with Imperial Enterprise Kenya sample sites.
 * Designed to be swapped seamlessly for Room database or EncryptedDataStore in future phases.
 */
class InMemorySiteRepository : SiteRepository {

    private val _sites = MutableStateFlow<List<Site>>(SampleData.demoSites)

    override fun getSites(): Flow<List<Site>> = _sites.asStateFlow()

    override suspend fun getSiteById(siteId: String): Site? {
        return _sites.value.find { it.id == siteId }
    }

    override suspend fun insertSite(site: Site) {
        _sites.value = _sites.value + site
    }

    override suspend fun updateSite(site: Site) {
        _sites.value = _sites.value.map { if (it.id == site.id) site else it }
    }

    override suspend fun deleteSite(siteId: String) {
        _sites.value = _sites.value.filterNot { it.id == siteId }
    }

    override suspend fun updateMcpStatus(siteId: String, status: McpStatus) {
        _sites.value = _sites.value.map {
            if (it.id == siteId) {
                it.copy(
                    mcpStatus = status,
                    lastConnection = if (status == McpStatus.CONNECTED) "Just now" else it.lastConnection
                )
            } else it
        }
    }
}
