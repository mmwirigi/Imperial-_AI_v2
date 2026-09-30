package ke.imperialenterprise.imperialai.ui.components

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import ke.imperialenterprise.imperialai.domain.model.Site
import ke.imperialenterprise.imperialai.domain.model.ToolRiskLevel
import ke.imperialenterprise.imperialai.domain.wordpress.*
import ke.imperialenterprise.imperialai.ui.theme.*

/**
 * Site Intelligence & Capability Explorer Dialog (Sections 7, 8, 30).
 * Displays discovered stack profile, verified capabilities, and audit signals.
 */
@Composable
fun SiteIntelligenceDialog(
    site: Site,
    profile: SiteStackProfile?,
    capabilities: List<WordPressCapability>,
    findings: List<AuditFinding>,
    isInspecting: Boolean,
    onRunInspection: () -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = ObsidianElevated,
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.85f)
                .border(1.dp, BorderHairline, RoundedCornerShape(12.dp))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "SITE INTELLIGENCE",
                            style = MaterialTheme.typography.labelSmall,
                            color = ImperialGold,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = site.siteName,
                            style = MaterialTheme.typography.titleMedium,
                            color = TextHighEmphasis
                        )
                    }
                    IconButton(onClick = onDismiss, modifier = Modifier.size(24.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = TextMediumEmphasis)
                    }
                }

                HorizontalDivider(color = BorderHairline, thickness = 1.dp)

                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // 1. Stack Profile Overview
                    item {
                        Text(
                            text = "DISCOVERED WORDPRESS STACK",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextMediumEmphasis,
                            fontSize = 10.sp
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Surface(
                            color = ObsidianSurface,
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, BorderHairline),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                StackRow("WordPress Core", profile?.wordpressVersion ?: "Not Discovered")
                                StackRow("PHP Environment", profile?.phpVersion ?: "Unknown")
                                StackRow("Active Theme", profile?.themeName ?: "Unknown")
                                StackRow("Page Builder", profile?.pageBuilder ?: "None / Gutenberg")
                                StackRow("SEO Engine", profile?.seoPlugin ?: "Native / None")
                                StackRow("Forms System", profile?.formsPlugin ?: "None")
                                StackRow("Commerce", profile?.commercePlatform ?: "None")
                                StackRow("Learning Platform", profile?.learningPlatform ?: "None")
                                StackRow("Booking Engine", profile?.bookingPlatform ?: "None")
                                StackRow("Backup Mechanism", profile?.backupPlugin ?: "None Detected")
                            }
                        }
                    }

                    // 2. Discovered Capabilities
                    item {
                        Text(
                            text = "DISCOVERED CAPABILITIES (${capabilities.size})",
                            style = MaterialTheme.typography.labelSmall,
                            color = ImperialGold,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    if (capabilities.isEmpty()) {
                        item {
                            Text(
                                text = "No capabilities discovered yet. Tap 'Run Inspection' below to discover active MCP tools.",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextDisabled,
                                modifier = Modifier.padding(vertical = 8.dp)
                            )
                        }
                    } else {
                        items(capabilities, key = { it.id }) { cap ->
                            CapabilityCard(capability = cap)
                        }
                    }

                    // 3. Audit Findings if any
                    if (findings.isNotEmpty()) {
                        item {
                            Text(
                                text = "AUDIT FINDINGS (${findings.size})",
                                style = MaterialTheme.typography.labelSmall,
                                color = AmberWarning,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        items(findings, key = { it.id }) { finding ->
                            Surface(
                                color = ObsidianSurface,
                                shape = RoundedCornerShape(6.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, BorderHairline),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = finding.title,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = TextHighEmphasis,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Surface(
                                            shape = RoundedCornerShape(4.dp),
                                            color = when (finding.severity) {
                                                AuditSeverity.CRITICAL -> CrimsonError.copy(alpha = 0.2f)
                                                AuditSeverity.HIGH -> AmberWarning.copy(alpha = 0.2f)
                                                AuditSeverity.MEDIUM -> AmberWarning.copy(alpha = 0.15f)
                                                AuditSeverity.LOW -> EmeraldDark.copy(alpha = 0.2f)
                                                AuditSeverity.INFO -> ObsidianElevated
                                            }
                                        ) {
                                            Text(
                                                text = finding.severity.displayName,
                                                style = MaterialTheme.typography.labelSmall,
                                                fontSize = 9.sp,
                                                color = when (finding.severity) {
                                                    AuditSeverity.CRITICAL -> CrimsonError
                                                    AuditSeverity.HIGH -> AmberWarning
                                                    AuditSeverity.MEDIUM -> AmberWarning
                                                    AuditSeverity.LOW -> EmeraldPrimary
                                                    AuditSeverity.INFO -> TextMediumEmphasis
                                                },
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    }
                                    Text(
                                        text = finding.description,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TextMediumEmphasis,
                                        fontSize = 11.sp
                                    )
                                    Text(
                                        text = "Recommendation: ${finding.recommendation}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = ImperialGold,
                                        fontSize = 10.sp
                                    )
                                }
                            }
                        }
                    }
                }

                // Footer action
                Button(
                    onClick = onRunInspection,
                    enabled = !isInspecting,
                    shape = RoundedCornerShape(6.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = ImperialGold,
                        contentColor = ObsidianSurface
                    ),
                    modifier = Modifier.fillMaxWidth().height(42.dp)
                ) {
                    if (isInspecting) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = ObsidianSurface)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Executing Read-Only Inspection...", fontWeight = FontWeight.Bold)
                    } else {
                        Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Run Read-Only Site Inspection", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun CapabilityCard(capability: WordPressCapability) {
    Surface(
        color = ObsidianSurface,
        shape = RoundedCornerShape(6.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderHairline),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = if (capability.available) "✓" else "—",
                        color = if (capability.available) EmeraldPrimary else TextDisabled,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = capability.name,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextHighEmphasis,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = when {
                        !capability.available -> ObsidianElevated
                        capability.requiresApproval -> AmberWarning.copy(alpha = 0.2f)
                        else -> EmeraldDark.copy(alpha = 0.2f)
                    }
                ) {
                    Text(
                        text = when {
                            !capability.available -> "UNAVAILABLE"
                            capability.riskLevel == ToolRiskLevel.DESTRUCTIVE -> "DESTRUCTIVE"
                            capability.requiresApproval -> "REQUIRES APPROVAL"
                            else -> "AVAILABLE"
                        },
                        style = MaterialTheme.typography.labelSmall,
                        fontSize = 9.sp,
                        color = when {
                            !capability.available -> TextDisabled
                            capability.riskLevel == ToolRiskLevel.DESTRUCTIVE -> CrimsonError
                            capability.requiresApproval -> AmberWarning
                            else -> EmeraldPrimary
                        },
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Text(
                text = capability.description,
                style = MaterialTheme.typography.bodySmall,
                color = TextMediumEmphasis,
                fontSize = 11.sp
            )

            if (capability.mcpToolNames.isNotEmpty()) {
                Text(
                    text = "MCP Tools: ${capability.mcpToolNames.joinToString(", ")}",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextDisabled,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 9.sp
                )
            }
        }
    }
}

@Composable
fun CommandPaletteDialog(
    siteName: String,
    commands: List<WordPressCommand>,
    onSelectCommand: (WordPressCommand) -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = ObsidianElevated,
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.75f)
                .border(1.dp, BorderHairline, RoundedCornerShape(12.dp))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "COMMAND PALETTE",
                            style = MaterialTheme.typography.labelSmall,
                            color = ImperialGold,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = siteName,
                            style = MaterialTheme.typography.bodySmall,
                            color = TextMediumEmphasis
                        )
                    }
                    IconButton(onClick = onDismiss, modifier = Modifier.size(24.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = TextMediumEmphasis)
                    }
                }

                HorizontalDivider(color = BorderHairline, thickness = 1.dp)

                if (commands.isEmpty()) {
                    Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                        Text("No active commands available. Run inspection to discover site capabilities.", color = TextDisabled)
                    }
                } else {
                    LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(commands, key = { it.id }) { cmd ->
                            Surface(
                                color = ObsidianSurface,
                                shape = RoundedCornerShape(8.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, BorderHairline),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        onSelectCommand(cmd)
                                        onDismiss()
                                    }
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = cmd.title,
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = ImperialGold,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = cmd.description,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = TextMediumEmphasis,
                                            fontSize = 11.sp
                                        )
                                    }
                                    Icon(Icons.Default.ArrowForward, contentDescription = null, tint = TextMediumEmphasis, modifier = Modifier.size(16.dp))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StackRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = label, style = MaterialTheme.typography.bodySmall, color = TextMediumEmphasis, fontSize = 11.sp)
        Text(text = value, style = MaterialTheme.typography.bodySmall, color = TextHighEmphasis, fontWeight = FontWeight.SemiBold, fontSize = 11.sp)
    }
}
