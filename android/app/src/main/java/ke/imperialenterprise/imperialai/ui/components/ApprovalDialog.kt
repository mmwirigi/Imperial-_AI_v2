package ke.imperialenterprise.imperialai.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import ke.imperialenterprise.imperialai.domain.model.DangerousActionType
import ke.imperialenterprise.imperialai.ui.theme.*

/**
 * High-security approval dialog for dangerous operations.
 * Enforces explicit human-in-the-loop authorization before dangerous WordPress modifications occur.
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
    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = CardSurface,
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, BorderHairline, RoundedCornerShape(12.dp))
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header with warning icon
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(StatusWarning.copy(alpha = 0.15f), RoundedCornerShape(8.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = "Security Alert",
                            tint = StatusWarning,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Column {
                        Text(
                            text = "OPERATOR APPROVAL REQUIRED",
                            style = MaterialTheme.typography.labelSmall,
                            color = StatusWarning,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = actionType.displayName,
                            style = MaterialTheme.typography.titleMedium,
                            color = TextHighEmphasis
                        )
                    }
                }

                Divider(color = BorderHairline, thickness = 1.dp)

                // Site boundary verification
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "Target Site Scope",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextMediumEmphasis
                    )
                    Text(
                        text = siteName,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextHighEmphasis,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                // Action description
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "Action Details",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextMediumEmphasis
                    )
                    Text(
                        text = description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextHighEmphasis
                    )
                    Text(
                        text = "Target: $targetResource",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextMediumEmphasis
                    )
                }

                Text(
                    text = "This action will directly modify live WordPress client data. Review carefully before granting execution privilege.",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextMediumEmphasis
                )

                // Action buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = onReject,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = StatusError)
                    ) {
                        Text("Reject Action")
                    }

                    Button(
                        onClick = onApprove,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = ImperialGoldPrimary,
                            contentColor = ObsidianSurface
                        )
                    ) {
                        Text("Authorize Execution")
                    }
                }
            }
        }
    }
}
