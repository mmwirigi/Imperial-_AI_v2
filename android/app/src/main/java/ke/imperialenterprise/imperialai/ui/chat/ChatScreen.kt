package ke.imperialenterprise.imperialai.ui.chat

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import ke.imperialenterprise.imperialai.domain.model.*
import ke.imperialenterprise.imperialai.ui.components.ImperialTopBar
import ke.imperialenterprise.imperialai.ui.components.SiteSelectorSheet
import ke.imperialenterprise.imperialai.ui.theme.*
import java.util.*

@Composable
fun ChatScreen(
    viewModel: ChatViewModel,
    onNavigateToSettings: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    val listState = rememberLazyListState()

    // Auto-scroll to bottom on new messages or streaming tokens
    LaunchedEffect(uiState.messages.size, uiState.streamingPartialText) {
        if (uiState.messages.isNotEmpty()) {
            listState.animateScrollToItem(uiState.messages.size)
        }
    }

    Scaffold(
        topBar = {
            ImperialTopBar(title = "AI Operations Chat")
        },
        containerColor = ObsidianSurface
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // ACTIVE SITE, MODEL & MCP CONTEXT BANNER
            ActiveSiteAndModelBanner(
                activeSite = uiState.activeSite,
                activeModel = uiState.activeAiModel,
                activeModelId = uiState.activeAiModelId,
                mcpStatus = uiState.activeMcpStatus,
                mcpToolsCount = uiState.activeSiteTools.size,
                onSiteSelectorClicked = { viewModel.openSiteSelector() },
                onModelPickerClicked = { viewModel.openModelPicker() },
                onToolsDrawerClicked = { viewModel.toggleToolsDrawer() }
            )

            // Operator Approval Dialog for MCP Tool Execution
            if (uiState.pendingDangerousApproval != null) {
                Surface(
                    color = CrimsonError.copy(alpha = 0.15f),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, CrimsonError.copy(alpha = 0.5f))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                Icons.Default.Warning,
                                contentDescription = null,
                                tint = CrimsonError,
                                modifier = Modifier.size(18.dp)
                            )
                            Text(
                                text = "OPERATOR AUTHORIZATION REQUIRED",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = CrimsonError
                            )
                        }

                        Text(
                            text = uiState.pendingDangerousApproval?.description ?: "",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextHighEmphasis
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedButton(
                                onClick = { viewModel.rejectPendingAction() },
                                shape = RoundedCornerShape(6.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = TextMediumEmphasis),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                            ) {
                                Text("Reject", style = MaterialTheme.typography.labelSmall)
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(
                                onClick = { viewModel.approvePendingAction() },
                                shape = RoundedCornerShape(6.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = CrimsonError,
                                    contentColor = ObsidianSurface
                                ),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                            ) {
                                Text("Authorize Execution", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // Active Error Notification Banner
            uiState.activeError?.let { error ->
                Surface(
                    color = StatusError.copy(alpha = 0.15f),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, StatusError.copy(alpha = 0.4f))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            modifier = Modifier.weight(1f),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Warning,
                                contentDescription = null,
                                tint = StatusError,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = error.userFriendlyMessage,
                                style = MaterialTheme.typography.bodySmall,
                                color = StatusError,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            }

            // Autonomous Agent Loop Status Banner
            if (uiState.isAgentExecuting && !uiState.agentThought.isNullOrBlank()) {
                Surface(
                    color = ImperialGold.copy(alpha = 0.08f),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, ImperialGold.copy(alpha = 0.25f))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(12.dp),
                                strokeWidth = 1.5.dp,
                                color = ImperialGold
                            )
                            Text(
                                text = uiState.agentThought ?: "Agent reasoning...",
                                style = MaterialTheme.typography.labelSmall,
                                color = ImperialGold,
                                maxLines = 1
                            )
                        }
                        Surface(
                            shape = RoundedCornerShape(4.dp),
                            color = ObsidianElevated
                        ) {
                            Text(
                                text = "Step ${uiState.currentIteration}/${uiState.maxIterations}",
                                style = MaterialTheme.typography.labelSmall,
                                color = TextMediumEmphasis,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
            }

            // Message List or Empty State
            if (uiState.activeSite == null) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Please select an active WordPress site to begin operations session.",
                        color = TextMediumEmphasis,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            } else {
                LazyColumn(
                    state = listState,
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(vertical = 12.dp)
                ) {
                    items(uiState.messages, key = { it.id }) { message ->
                        ChatMessageBubble(message = message)
                    }

                    // Live Progressive Streaming Bubble
                    if (uiState.isStreaming) {
                        item(key = "streaming_bubble") {
                            StreamingAssistantBubble(
                                partialContent = uiState.streamingPartialText,
                                modelName = uiState.activeAiModel?.name ?: uiState.activeAiModelId,
                                onStopGenerating = { viewModel.cancelGeneration() }
                            )
                        }
                    }
                }
            }

            // Chat Input Bar
            ChatInputBar(
                inputText = uiState.inputText,
                isStreaming = uiState.isStreaming,
                onTextChanged = { viewModel.onInputTextChanged(it) },
                onSend = { viewModel.sendMessage() },
                onStop = { viewModel.cancelGeneration() },
                enabled = uiState.activeSite != null && uiState.isOpenRouterConfigured
            )
        }

        // Site Selector Sheet
        if (uiState.isSiteSelectorOpen) {
            SiteSelectorSheet(
                sites = uiState.sites,
                activeSiteId = uiState.activeSite?.id ?: "",
                onSiteSelected = { viewModel.selectActiveSite(it) },
                onDismiss = { viewModel.closeSiteSelector() }
            )
        }

        // Model Picker Dialog
        if (uiState.isModelPickerOpen) {
            ChatModelPickerDialog(
                availableModels = uiState.availableModels,
                selectedModelId = uiState.activeAiModelId,
                onModelSelected = { viewModel.selectModel(it) },
                onDismiss = { viewModel.closeModelPicker() }
            )
        }

        // Discovered MCP Tools Drawer / Dialog
        if (uiState.isToolsDrawerOpen) {
            DiscoveredToolsDialog(
                site = uiState.activeSite,
                tools = uiState.activeSiteTools,
                mcpStatus = uiState.activeMcpStatus,
                onDismiss = { viewModel.toggleToolsDrawer() },
                onExecuteTool = { tool ->
                    viewModel.toggleToolsDrawer()
                    viewModel.triggerToolExecution(tool, emptyMap())
                }
            )
        }
    }
}

@Composable
fun ActiveSiteAndModelBanner(
    activeSite: Site?,
    activeModel: AIModel?,
    activeModelId: String,
    mcpStatus: McpConnectionStatus,
    mcpToolsCount: Int,
    onSiteSelectorClicked: () -> Unit,
    onModelPickerClicked: () -> Unit,
    onToolsDrawerClicked: () -> Unit
) {
    val isMcpConnected = mcpStatus == McpConnectionStatus.CONNECTED

    Surface(
        color = CardSurface,
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, BorderHairline)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            // Site Scope Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.clickable { onSiteSelectorClicked() }) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = "ACTIVE SITE SCOPE",
                            style = MaterialTheme.typography.labelSmall,
                            color = ImperialGoldPrimary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp
                        )
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .background(if (activeSite != null) StatusSuccess else TextDisabled, RoundedCornerShape(3.dp))
                        )
                    }
                    Text(
                        text = activeSite?.siteName ?: "No Site Selected",
                        style = MaterialTheme.typography.titleMedium,
                        color = TextHighEmphasis,
                        fontWeight = FontWeight.Bold
                    )
                }

                Surface(
                    color = ElevatedSurface,
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier
                        .border(1.dp, BorderSubtle, RoundedCornerShape(6.dp))
                        .clip(RoundedCornerShape(6.dp))
                        .clickable { onSiteSelectorClicked() }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = "Switch Site",
                            style = MaterialTheme.typography.labelSmall,
                            color = ImperialGoldPrimary,
                            fontSize = 11.sp
                        )
                        Icon(imageVector = Icons.Default.SwapHoriz, contentDescription = null, tint = ImperialGoldPrimary, modifier = Modifier.size(13.dp))
                    }
                }
            }

            // Model & MCP Tools Badges Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .clickable { onModelPickerClicked() }
                ) {
                    Text(
                        text = "MODEL:",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextMediumEmphasis,
                        fontWeight = FontWeight.Bold,
                        fontSize = 10.sp
                    )
                    Text(
                        text = activeModel?.name ?: activeModelId,
                        style = MaterialTheme.typography.bodySmall,
                        color = ImperialGoldPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 11.sp
                    )
                    if (activeModel?.isFree == true) {
                        Surface(
                            color = StatusSuccess.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(3.dp)
                        ) {
                            Text(
                                text = "FREE",
                                color = StatusSuccess,
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                            )
                        }
                    }
                }

                // MCP Tools Chip
                Surface(
                    color = if (isMcpConnected) EmeraldDark.copy(alpha = 0.25f) else ObsidianSurface,
                    shape = RoundedCornerShape(4.dp),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (isMcpConnected) EmeraldPrimary.copy(alpha = 0.5f) else BorderHairline
                    ),
                    modifier = Modifier.clickable { onToolsDrawerClicked() }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(5.dp)
                                .clip(RoundedCornerShape(2.5.dp))
                                .background(if (isMcpConnected) EmeraldPrimary else TextDisabled)
                        )
                        Text(
                            text = if (isMcpConnected) "MCP: $mcpToolsCount Tools" else "MCP Disconnected",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (isMcpConnected) EmeraldPrimary else TextDisabled,
                            fontSize = 10.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun DiscoveredToolsDialog(
    site: Site?,
    tools: List<McpTool>,
    mcpStatus: McpConnectionStatus,
    onDismiss: () -> Unit,
    onExecuteTool: (McpTool) -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Surface(
            color = ElevatedSurface,
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, BorderHairline, RoundedCornerShape(12.dp))
        ) {
            Column(
                modifier = Modifier
                    .padding(16.dp)
                    .fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "REMOTE MCP TOOLS",
                            style = MaterialTheme.typography.labelSmall,
                            color = ImperialGoldPrimary,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${site?.siteName ?: "Site"} · ${tools.size} Discovered Tools",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextMediumEmphasis,
                            fontSize = 11.sp
                        )
                    }
                    IconButton(onClick = onDismiss, modifier = Modifier.size(20.dp)) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = TextMediumEmphasis)
                    }
                }

                Divider(color = BorderHairline, thickness = 1.dp)

                if (tools.isEmpty()) {
                    Text(
                        text = "No tools discovered. Connect the MCP Server in Sites -> MCP Connection to register capabilities.",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextDisabled,
                        modifier = Modifier.padding(vertical = 16.dp)
                    )
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 360.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(tools, key = { it.name }) { tool ->
                            Surface(
                                color = ObsidianSurface,
                                shape = RoundedCornerShape(8.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, BorderHairline)
                            ) {
                                Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = tool.name,
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = ImperialGoldPrimary,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = FontFamily.Monospace
                                        )
                                        Surface(
                                            color = when (tool.riskLevel) {
                                                ToolRiskLevel.READ -> EmeraldDark.copy(alpha = 0.3f)
                                                ToolRiskLevel.LOW_RISK_WRITE -> AmberWarning.copy(alpha = 0.2f)
                                                ToolRiskLevel.HIGH_RISK_WRITE -> AmberWarning.copy(alpha = 0.35f)
                                                ToolRiskLevel.DESTRUCTIVE -> CrimsonError.copy(alpha = 0.3f)
                                            },
                                            shape = RoundedCornerShape(4.dp)
                                        ) {
                                            Text(
                                                text = tool.riskLevel.displayName,
                                                style = MaterialTheme.typography.labelSmall,
                                                color = when (tool.riskLevel) {
                                                    ToolRiskLevel.READ -> EmeraldPrimary
                                                    ToolRiskLevel.LOW_RISK_WRITE -> AmberWarning
                                                    ToolRiskLevel.HIGH_RISK_WRITE -> AmberWarning
                                                    ToolRiskLevel.DESTRUCTIVE -> CrimsonError
                                                },
                                                fontSize = 9.sp,
                                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                            )
                                        }
                                    }

                                    Text(
                                        text = tool.description,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TextMediumEmphasis,
                                        fontSize = 11.sp
                                    )

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.End
                                    ) {
                                        OutlinedButton(
                                            onClick = { onExecuteTool(tool) },
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                                            modifier = Modifier.height(26.dp)
                                        ) {
                                            Text("Execute Tool", style = MaterialTheme.typography.labelSmall, fontSize = 10.sp)
                                        }
                                    }
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
fun ChatMessageBubble(message: ChatMessage) {
    val isUser = message.sender == MessageRole.USER
    val isTool = message.sender == MessageRole.TOOL

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (isUser) Alignment.End else Alignment.Start
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            modifier = Modifier.padding(bottom = 2.dp)
        ) {
            Text(
                text = when (message.sender) {
                    MessageRole.USER -> "OPERATOR"
                    MessageRole.ASSISTANT -> if (!message.modelName.isNullOrBlank()) "IMPERIAL AI (${message.modelName})" else "IMPERIAL AI"
                    MessageRole.SYSTEM -> "SYSTEM GATEWAY"
                    MessageRole.TOOL -> "MCP TOOL RESULT"
                },
                style = MaterialTheme.typography.labelSmall,
                color = when (message.sender) {
                    MessageRole.USER -> ImperialGoldPrimary
                    MessageRole.TOOL -> EmeraldPrimary
                    else -> TextMediumEmphasis
                },
                fontSize = 10.sp
            )
            if (message.isInterrupted) {
                Text(text = "[Interrupted]", style = MaterialTheme.typography.labelSmall, color = StatusWarning, fontSize = 9.sp)
            }
        }

        Surface(
            color = when {
                isUser -> ElevatedSurface
                isTool -> EmeraldDark.copy(alpha = 0.2f)
                else -> CardSurface
            },
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier
                .widthIn(max = 340.dp)
                .border(
                    width = 1.dp,
                    color = when {
                        isUser -> ImperialGoldPrimary.copy(alpha = 0.4f)
                        isTool -> EmeraldPrimary.copy(alpha = 0.4f)
                        else -> BorderHairline
                    },
                    shape = RoundedCornerShape(8.dp)
                )
        ) {
            Column(
                modifier = Modifier.padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // If there's an active tool call attached
                message.toolCall?.let { toolCall ->
                    Surface(
                        color = ObsidianSurface,
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(8.dp)) {
                            Text(
                                text = "TOOL CALL: ${toolCall.toolName}",
                                style = MaterialTheme.typography.labelSmall,
                                color = ImperialGoldPrimary,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                            if (toolCall.argumentsSummary.isNotBlank()) {
                                Text(
                                    text = toolCall.argumentsSummary,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextMediumEmphasis,
                                    fontSize = 10.sp
                                )
                            }
                        }
                    }
                }

                Text(
                    text = message.content,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextHighEmphasis
                )

                // Tool result details
                message.toolResult?.let { toolResult ->
                    Divider(color = BorderHairline, thickness = 1.dp)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "${toolResult.toolName} · ${toolResult.executionDurationMs}ms",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextDisabled,
                            fontSize = 9.sp
                        )
                        Text(
                            text = if (toolResult.isError == true) "Error" else "Success",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (toolResult.isError == true) CrimsonError else EmeraldPrimary,
                            fontSize = 9.sp
                        )
                    }
                }

                // Render Usage Information if available (Tokens & Estimated Cost)
                message.usage?.let { usage ->
                    Divider(color = BorderHairline, thickness = 1.dp)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Tokens: ${usage.totalTokens} (in: ${usage.inputTokens}, out: ${usage.outputTokens})",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextDisabled,
                            fontSize = 9.sp
                        )
                        Text(
                            text = if (usage.estimatedCost != null) "Cost: $${String.format(Locale.US, "%.4f", usage.estimatedCost)}" else "Cost unavailable",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (usage.estimatedCost == 0.0) StatusSuccess else TextDisabled,
                            fontSize = 9.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun StreamingAssistantBubble(
    partialContent: String,
    modelName: String,
    onStopGenerating: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.Start
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            modifier = Modifier.padding(bottom = 2.dp)
        ) {
            Text(
                text = "IMPERIAL AI ($modelName)",
                style = MaterialTheme.typography.labelSmall,
                color = ImperialGoldPrimary,
                fontSize = 10.sp
            )
            CircularProgressIndicator(modifier = Modifier.size(10.dp), color = ImperialGoldPrimary, strokeWidth = 1.5.dp)
        }

        Surface(
            color = CardSurface,
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier
                .widthIn(max = 340.dp)
                .border(1.dp, ImperialGoldPrimary.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
        ) {
            Column(
                modifier = Modifier.padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = if (partialContent.isBlank()) "Thinking..." else partialContent,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextHighEmphasis
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    OutlinedButton(
                        onClick = onStopGenerating,
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                        modifier = Modifier.height(24.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, StatusWarning)
                    ) {
                        Text("Stop", color = StatusWarning, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun ChatInputBar(
    inputText: String,
    isStreaming: Boolean = false,
    onTextChanged: (String) -> Unit,
    onSend: () -> Unit,
    onStop: () -> Unit = {},
    enabled: Boolean
) {
    Surface(
        color = CardSurface,
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, BorderHairline)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = inputText,
                onValueChange = onTextChanged,
                placeholder = {
                    Text(
                        text = if (enabled) "Ask Imperial AI about active site..." else "Configure OpenRouter in Settings to chat...",
                        color = TextDisabled,
                        fontSize = 12.sp
                    )
                },
                enabled = enabled && !isStreaming,
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(8.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = ImperialGoldPrimary,
                    unfocusedBorderColor = BorderHairline,
                    focusedTextColor = TextHighEmphasis,
                    unfocusedTextColor = TextHighEmphasis
                ),
                maxLines = 4
            )

            if (isStreaming) {
                IconButton(
                    onClick = onStop,
                    colors = IconButtonDefaults.iconButtonColors(containerColor = StatusWarning)
                ) {
                    Icon(imageVector = Icons.Default.Stop, contentDescription = "Stop", tint = ObsidianSurface)
                }
            } else {
                IconButton(
                    onClick = onSend,
                    enabled = enabled && inputText.isNotBlank(),
                    colors = IconButtonDefaults.iconButtonColors(
                        containerColor = ImperialGoldPrimary,
                        disabledContainerColor = CardSurface
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.Send,
                        contentDescription = "Send",
                        tint = if (enabled && inputText.isNotBlank()) ObsidianSurface else TextDisabled
                    )
                }
            }
        }
    }
}

@Composable
fun ChatModelPickerDialog(
    availableModels: List<AIModel>,
    selectedModelId: String,
    onModelSelected: (String) -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Surface(
            color = ElevatedSurface,
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, BorderHairline, RoundedCornerShape(12.dp))
        ) {
            Column(
                modifier = Modifier
                    .padding(16.dp)
                    .fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "SELECT CONVERSATION MODEL",
                            style = MaterialTheme.typography.labelSmall,
                            color = ImperialGoldPrimary,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Overrides global default for this site chat",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextMediumEmphasis,
                            fontSize = 11.sp
                        )
                    }
                    IconButton(onClick = onDismiss, modifier = Modifier.size(20.dp)) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = TextMediumEmphasis)
                    }
                }

                Divider(color = BorderHairline, thickness = 1.dp)

                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 360.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(availableModels, key = { it.id }) { model ->
                        val isSelected = model.id == selectedModelId

                        Surface(
                            color = if (isSelected) ObsidianSurface else CardSurface,
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(
                                    1.dp,
                                    if (isSelected) ImperialGoldPrimary else BorderHairline,
                                    RoundedCornerShape(8.dp)
                                )
                                .clip(RoundedCornerShape(8.dp))
                                .clickable { onModelSelected(model.id) }
                        ) {
                            Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = model.name,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = if (isSelected) ImperialGoldPrimary else TextHighEmphasis,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    if (model.isFree) {
                                        Text(
                                            text = "FREE",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = StatusSuccess,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 9.sp
                                        )
                                    } else {
                                        Text(
                                            text = "$${String.format(Locale.US, "%.2f", model.inputCost)}/1M",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = StatusRunning,
                                            fontSize = 9.sp
                                        )
                                    }
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Text(
                                        text = "${model.provider} · ${model.contextLength / 1000}k Context",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TextMediumEmphasis,
                                        fontSize = 10.sp
                                    )
                                    if (model.supportsTools) {
                                        Text("• Tools", color = TextDisabled, fontSize = 10.sp)
                                    }
                                    if (model.supportsVision) {
                                        Text("• Vision", color = TextDisabled, fontSize = 10.sp)
                                    }
                                    if (model.supportsReasoning) {
                                        Text("• Reasoning", color = TextDisabled, fontSize = 10.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
