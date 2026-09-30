package ke.imperialenterprise.imperialai.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import ke.imperialenterprise.imperialai.domain.model.McpStatus
import ke.imperialenterprise.imperialai.domain.model.Site
import ke.imperialenterprise.imperialai.ui.theme.*

/**
 * Bottom Sheet modal for selecting active WordPress site context.
 * Clearly shows that switching sites changes the conversation and task scope.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SiteSelectorSheet(
    sites: List<Site>,
    activeSiteId: String,
    onSiteSelected: (Site) -> Unit,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = CardSurface,
        dragHandle = { BottomSheetDefaults.DragHandle(color = TextDisabled) }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "SELECT ACTIVE SITE",
                        style = MaterialTheme.typography.labelSmall,
                        color = ImperialGoldPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Client Isolation Scope",
                        style = MaterialTheme.typography.titleMedium,
                        color = TextHighEmphasis
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = "Isolated",
                        tint = StatusSuccess,
                        modifier = Modifier.size(14.dp)
                    )
                    Text(
                        text = "STRICT ISOLATION",
                        style = MaterialTheme.typography.labelSmall,
                        color = StatusSuccess
                    )
                }
            }

            Text(
                text = "Changing the active site instantly rotates the AI context, chat history, and MCP tool credentials. Actions can only execute against the selected site.",
                style = MaterialTheme.typography.bodySmall,
                color = TextMediumEmphasis
            )

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp)
            ) {
                items(sites) { site ->
                    val isSelected = site.id == activeSiteId
                    Surface(
                        color = if (isSelected) ElevatedSurface else ObsidianSurface,
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(
                                width = 1.dp,
                                color = if (isSelected) ImperialGoldPrimary else BorderHairline,
                                shape = RoundedCornerShape(8.dp)
                            )
                            .clip(RoundedCornerShape(8.dp))
                            .clickable {
                                onSiteSelected(site)
                                onDismiss()
                            }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = site.siteName,
                                    style = MaterialTheme.typography.titleMedium,
                                    color = if (isSelected) ImperialGoldPrimary else TextHighEmphasis,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = site.websiteUrl,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextMediumEmphasis
                                )
                                Text(
                                    text = "${site.clientCompanyName} · ${site.wordPressType.displayName}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TextDisabled
                                )
                            }

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .background(
                                            if (site.mcpStatus == McpStatus.CONNECTED) StatusSuccess else TextDisabled,
                                            RoundedCornerShape(4.dp)
                                        )
                                )
                                if (isSelected) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = "Selected",
                                        tint = ImperialGoldPrimary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
