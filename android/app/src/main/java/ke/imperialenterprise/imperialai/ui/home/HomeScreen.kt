package ke.imperialenterprise.imperialai.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ke.imperialenterprise.imperialai.domain.model.AuditEvent
import ke.imperialenterprise.imperialai.ui.components.ImperialTopBar
import ke.imperialenterprise.imperialai.ui.theme.*

@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onNavigateToSites: () -> Unit,
    onNavigateToTasks: () -> Unit,
    onNavigateToChat: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onTriggerAuditAction: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            ImperialTopBar(title = "Command Center")
        },
        containerColor = ObsidianSurface
    ) { paddingValues ->
        if (uiState.isEmpty) {
            // Graceful Empty State
            EmptyDashboardView(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                onAddSiteClicked = onNavigateToSites
            )
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(vertical = 16.dp)
            ) {
                // Section: Metric Cards Grid
                item {
                    Text(
                        text = "OPERATIONAL OVERVIEW",
                        style = MaterialTheme.typography.labelSmall,
                        color = ImperialGoldPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        MetricCard(
                            label = "CONNECTED SITES",
                            value = "${uiState.totalConnectedSites}/${uiState.totalSitesCount}",
                            subtext = "Active MCP links",
                            modifier = Modifier.weight(1f)
                        )
                        MetricCard(
                            label = "ACTIVE TASKS",
                            value = "${uiState.activeTasksCount}",
                            subtext = "Running / Approval",
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                // Section: System Status Strip (AI Provider & Model Status)
                item {
                    Surface(
                        color = CardSurface,
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, BorderHairline, RoundedCornerShape(8.dp))
                    ) {
                        Column(
                            modifier = Modifier.padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            // AI Provider Row
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.SmartToy,
                                        contentDescription = null,
                                        tint = ImperialGoldPrimary,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Text(
                                        text = "AI PROVIDER",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TextMediumEmphasis,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Text(
                                    text = uiState.aiProviderName,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = TextHighEmphasis,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }

                            Divider(color = BorderHairline, thickness = 1.dp)

                            // AI Provider Status Row
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "STATUS",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TextMediumEmphasis,
                                    fontWeight = FontWeight.Bold
                                )
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .background(
                                                if (uiState.isOpenRouterConfigured) StatusSuccess else StatusWarning,
                                                RoundedCornerShape(4.dp)
                                            )
                                    )
                                    Text(
                                        text = if (uiState.isOpenRouterConfigured) "Connected" else "Not Connected",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = if (uiState.isOpenRouterConfigured) StatusSuccess else StatusWarning,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }

                            Divider(color = BorderHairline, thickness = 1.dp)

                            // Model Row or Configure CTA
                            if (uiState.isOpenRouterConfigured) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "MODEL",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TextMediumEmphasis,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = uiState.currentAiModelName,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = ImperialGoldPrimary,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            } else {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "OpenRouter not configured",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TextDisabled
                                    )
                                    Button(
                                        onClick = onNavigateToSettings,
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = ImperialGoldPrimary,
                                            contentColor = ObsidianSurface
                                        ),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                                        modifier = Modifier.height(28.dp)
                                    ) {
                                        Text("CONFIGURE", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }

                            Divider(color = BorderHairline, thickness = 1.dp)

                            // MCP Status Row
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "MCP REMOTE STATUS",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TextMediumEmphasis,
                                    fontWeight = FontWeight.Bold
                                )
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .background(StatusSuccess, RoundedCornerShape(4.dp))
                                    )
                                    Text(
                                        text = uiState.overallMcpStatus,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = TextHighEmphasis
                                    )
                                }
                            }
                        }
                    }
                }

                // Section: Quick Actions
                item {
                    Text(
                        text = "QUICK ACTIONS",
                        style = MaterialTheme.typography.labelSmall,
                        color = ImperialGoldPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            QuickActionButton(
                                title = "AUDIT SITE",
                                icon = Icons.Default.Search,
                                onClick = onTriggerAuditAction,
                                modifier = Modifier.weight(1f)
                            )
                            QuickActionButton(
                                title = "NEW TASK",
                                icon = Icons.Default.Add,
                                onClick = onNavigateToTasks,
                                modifier = Modifier.weight(1f)
                            )
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            QuickActionButton(
                                title = "OPEN CHAT",
                                icon = Icons.Default.Chat,
                                onClick = onNavigateToChat,
                                modifier = Modifier.weight(1f)
                            )
                            QuickActionButton(
                                title = "MANAGE SITES",
                                icon = Icons.Default.Layers,
                                onClick = onNavigateToSites,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }

                // Section: Recent Activity / Audit Trail
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "RECENT OPERATIONS AUDIT",
                            style = MaterialTheme.typography.labelSmall,
                            color = ImperialGoldPrimary,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Non-secret logs",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextDisabled
                        )
                    }
                }

                items(uiState.recentActivity) { event ->
                    AuditActivityItem(event = event)
                }
            }
        }
    }
}

@Composable
fun MetricCard(
    label: String,
    value: String,
    subtext: String,
    modifier: Modifier = Modifier
) {
    Surface(
        color = CardSurface,
        shape = RoundedCornerShape(8.dp),
        modifier = modifier.border(1.dp, BorderHairline, RoundedCornerShape(8.dp))
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = TextMediumEmphasis,
                letterSpacing = 0.5.sp
            )
            Text(
                text = value,
                style = MaterialTheme.typography.headlineLarge,
                color = TextHighEmphasis,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = subtext,
                style = MaterialTheme.typography.bodySmall,
                color = TextDisabled
            )
        }
    }
}

@Composable
fun QuickActionButton(
    title: String,
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        color = CardSurface,
        shape = RoundedCornerShape(8.dp),
        modifier = modifier
            .border(1.dp, BorderHairline, RoundedCornerShape(8.dp))
            .clip(RoundedCornerShape(8.dp))
            .clickable { onClick() }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = ImperialGoldPrimary,
                modifier = Modifier.size(18.dp)
            )
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = TextHighEmphasis,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
fun AuditActivityItem(event: AuditEvent) {
    Surface(
        color = CardSurface,
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, BorderHairline, RoundedCornerShape(8.dp))
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = event.siteName,
                    style = MaterialTheme.typography.titleMedium,
                    color = TextHighEmphasis,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = event.timestamp,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextDisabled
                )
            }
            Text(
                text = "${event.userAction} → ${event.tool}",
                style = MaterialTheme.typography.bodyMedium,
                color = ImperialGoldPrimary
            )
            Text(
                text = event.resultSummary,
                style = MaterialTheme.typography.bodySmall,
                color = TextMediumEmphasis
            )
        }
    }
}

@Composable
fun EmptyDashboardView(
    modifier: Modifier = Modifier,
    onAddSiteClicked: () -> Unit
) {
    Box(
        modifier = modifier.padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .background(ElevatedSurface, RoundedCornerShape(32.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Layers,
                    contentDescription = "No Sites",
                    tint = TextDisabled,
                    modifier = Modifier.size(32.dp)
                )
            }
            Text(
                text = "No WordPress Sites Configured",
                style = MaterialTheme.typography.titleLarge,
                color = TextHighEmphasis
            )
            Text(
                text = "Connect your first WordPress client site or load demo profiles to activate telemetry, MCP tooling, and AI operations.",
                style = MaterialTheme.typography.bodyMedium,
                color = TextMediumEmphasis,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
            Button(
                onClick = onAddSiteClicked,
                colors = ButtonDefaults.buttonColors(
                    containerColor = ImperialGoldPrimary,
                    contentColor = ObsidianSurface
                )
            ) {
                Text("Configure WordPress Site")
            }
        }
    }
}
