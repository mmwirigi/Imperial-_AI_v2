package ke.imperialenterprise.imperialai.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.WarningAmber
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import ke.imperialenterprise.imperialai.domain.model.ApprovalRequest
import ke.imperialenterprise.imperialai.domain.model.DangerousActionType
import ke.imperialenterprise.imperialai.domain.model.ToolRiskLevel
import ke.imperialenterprise.imperialai.domain.security.SensitiveDataRedactor
import ke.imperialenterprise.imperialai.ui.theme.*

/**
 * High-security operator approval dialog (Phase 5: Sections 14 & 15).
 * 
 * Supports:
 * 1. Standard Write Approval: displays SITE, ACTION, TOOL, RISK, REQUEST, WHY.
 * 2. Destructive Two-Step Confirmation: requires explicit step 2 confirmation to prevent accidental taps.
 */
@Composable
fun OperationApprovalDialog(
    request: ApprovalRequest,
    siteName: String,
    onApprove: (operatorNotes: String) -> Unit,
    onReject: (operatorNotes: String) -> Unit,
    onDismiss: () -> Unit
) {
    var isDestructiveStep2Confirmed by remember { mutableStateOf(false) }
    var operatorNotes by remember { mutableStateOf("") }

    val isDestructive = request.isDestructive || request.riskLevel == ToolRiskLevel.DESTRUCTIVE

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = ObsidianElevated,
            modifier = Modifier
                .fillMaxWidth()
                .border(
                    1.dp,
                    if (isDestructive) CrimsonError.copy(alpha = 0.8f) else AmberWarning.copy(alpha = 0.6f),
                    RoundedCornerShape(12.dp)
                )
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Header
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(
                                if (isDestructive) CrimsonError.copy(alpha = 0.2f) else AmberWarning.copy(alpha = 0.2f),
                                RoundedCornerShape(8.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (isDestructive) Icons.Default.Warning else Icons.Default.WarningAmber,
                            contentDescription = "Alert",
                            tint = if (isDestructive) CrimsonError else AmberWarning,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Column {
                        Text(
                            text = if (isDestructive) "DESTRUCTIVE ACTION REQUIRES APPROVAL" else "ACTION REQUIRES APPROVAL",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (isDestructive) CrimsonError else AmberWarning,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "WordPress Authorization Gate",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextMediumEmphasis,
                            fontSize = 11.sp
                        )
                    }
                }

                HorizontalDivider(color = BorderHairline, thickness = 1.dp)

                // SITE
                InfoField(label = "SITE", value = siteName)

                // ACTION & TOOL
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "TOOL",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextMediumEmphasis,
                            fontSize = 10.sp
                        )
                        Text(
                            text = request.toolName,
                            style = MaterialTheme.typography.bodyMedium,
                            color = ImperialGold,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "RISK LEVEL",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextMediumEmphasis,
                            fontSize = 10.sp
                        )
                        Surface(
                            shape = RoundedCornerShape(4.dp),
                            color = if (isDestructive) CrimsonError.copy(alpha = 0.2f) else AmberWarning.copy(alpha = 0.2f)
                        ) {
                            Text(
                                text = request.riskLevel.displayName,
                                style = MaterialTheme.typography.labelSmall,
                                color = if (isDestructive) CrimsonError else AmberWarning,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                // REQUEST (Sanitized arguments)
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = "REQUEST PARAMETERS",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextMediumEmphasis,
                        fontSize = 10.sp
                    )
                    Surface(
                        color = ObsidianSurface,
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier.fillMaxWidth().border(1.dp, BorderHairline, RoundedCornerShape(6.dp))
                    ) {
                        Text(
                            text = request.argumentsSummary.ifBlank { "No parameters" },
                            style = MaterialTheme.typography.bodySmall,
                            fontFamily = FontFamily.Monospace,
                            color = TextHighEmphasis,
                            fontSize = 11.sp,
                            modifier = Modifier.padding(10.dp)
                        )
                    }
                }

                // WHY
                InfoField(label = "WHY", value = request.reason)

                // Destructive Step 2 Warning
                if (isDestructive && isDestructiveStep2Confirmed) {
                    Surface(
                        color = CrimsonError.copy(alpha = 0.15f),
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier.fillMaxWidth().border(1.dp, CrimsonError.copy(alpha = 0.5f), RoundedCornerShape(6.dp))
                    ) {
                        Row(
                            modifier = Modifier.padding(10.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Warning, contentDescription = null, tint = CrimsonError, modifier = Modifier.size(16.dp))
                            Text(
                                text = "CONFIRM DESTRUCTIVE ACTION: Irreversible changes will be applied directly to production WordPress site.",
                                style = MaterialTheme.typography.bodySmall,
                                color = CrimsonError,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                // Action Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedButton(
                        onClick = { onReject(operatorNotes) },
                        shape = RoundedCornerShape(6.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = TextMediumEmphasis)
                    ) {
                        Text(if (isDestructive && isDestructiveStep2Confirmed) "CANCEL" else "REJECT")
                    }

                    Spacer(modifier = Modifier.width(10.dp))

                    if (isDestructive && !isDestructiveStep2Confirmed) {
                        Button(
                            onClick = { isDestructiveStep2Confirmed = true },
                            shape = RoundedCornerShape(6.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = AmberWarning,
                                contentColor = ObsidianSurface
                            )
                        ) {
                            Text("CONTINUE TO APPROVAL", fontWeight = FontWeight.Bold)
                        }
                    } else {
                        Button(
                            onClick = { onApprove(operatorNotes) },
                            shape = RoundedCornerShape(6.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isDestructive) CrimsonError else ImperialGold,
                                contentColor = ObsidianSurface
                            )
                        ) {
                            Text(
                                if (isDestructive) "CONFIRM DESTRUCTIVE ACTION" else "APPROVE",
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun InfoField(label: String, value: String) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = TextMediumEmphasis,
            fontSize = 10.sp
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = TextHighEmphasis
        )
    }
}

/**
 * Legacy ApprovalDialog for backwards compatibility with existing UI callers.
 */
@Composable
fun ApprovalDialog(
    siteName: String,
    actionType: DangerousActionType,
    description: String,
    targetResource: String,
    onApprove: () -> Unit,
    onReject: () -> Unit,
    onDismiss: () -> Unit
) {
    OperationApprovalDialog(
        request = ApprovalRequest(
            siteId = targetResource,
            mcpServerId = "server_default",
            toolName = actionType.name.lowercase(),
            toolCallId = "call_legacy",
            argumentsSummary = description,
            reason = "Requested operation: ${actionType.displayName}",
            riskLevel = if (actionType.riskLevel == ke.imperialenterprise.imperialai.domain.model.RiskLevel.CRITICAL) 
                ToolRiskLevel.DESTRUCTIVE else ToolRiskLevel.HIGH_RISK_WRITE
        ),
        siteName = siteName,
        onApprove = { onApprove() },
        onReject = { onReject() },
        onDismiss = onDismiss
    )
}
