package ke.imperialenterprise.imperialai.ui.sites

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import ke.imperialenterprise.imperialai.domain.model.*
import ke.imperialenterprise.imperialai.ui.components.ImperialTopBar
import ke.imperialenterprise.imperialai.ui.theme.*

@Composable
fun SitesScreen(
    viewModel: SitesViewModel,
    onSiteSelectedForChat: (Site) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            ImperialTopBar(title = "WordPress Sites & MCP")
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { viewModel.openAddEditSiteDialog() },
                containerColor = ImperialGoldPrimary,
                contentColor = ObsidianSurface
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add WordPress Site")
            }
        },
        containerColor = ObsidianSurface
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "CLIENT SITES & REMOTE MCP ENGINES",
                            style = MaterialTheme.typography.labelSmall,
                            color = ImperialGoldPrimary,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${uiState.sites.size} Monitored Client Sites · Streamable HTTP Transport",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextMediumEmphasis
                        )
                    }

                    Surface(
                        color = ImperialGoldDark.copy(alpha = 0.15f),
                        shape = RoundedCornerShape(4.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, ImperialGoldPrimary.copy(alpha = 0.3f))
                    ) {
                        Text(
                            text = "Phase 3: Remote MCP",
                            style = MaterialTheme.typography.labelSmall,
                            color = ImperialGoldPrimary,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
            }

            items(uiState.sites, key = { it.id }) { site ->
                SiteCard(
                    site = site,
                    onConfigureMcp = { viewModel.openMcpSetupModal(site) },
                    onEdit = { viewModel.openAddEditSiteDialog(site) },
                    onDelete = { viewModel.deleteSite(site.id) },
                    onOpenChat = { onSiteSelectedForChat(site) }
                )
            }
        }

        // Add/Edit Site Dialog
        if (uiState.isAddEditSheetOpen) {
            AddEditSiteDialog(
                site = uiState.selectedSiteForEdit,
                onDismiss = { viewModel.closeAddEditDialog() },
                onSave = { updatedSite -> viewModel.saveSite(updatedSite) }
            )
        }

        // MCP Server Configuration & Connection Modal
        if (uiState.isMcpSetupModalOpen && uiState.selectedSiteForMcp != null) {
            McpConnectionModal(
                site = uiState.selectedSiteForMcp!!,
                existingServer = uiState.activeMcpServer,
                maskedToken = uiState.maskedBearerToken,
                discoveredTools = uiState.mcpDiscoveredTools,
                isTesting = uiState.isTestingConnection,
                testReport = uiState.testConnectionReport,
                isConnecting = uiState.isConnectingMcp,
                actionMessage = uiState.mcpActionMessage,
                onDismiss = { viewModel.closeMcpSetupModal() },
                onSave = { name, endpoint, authType, token ->
                    viewModel.saveMcpServer(uiState.selectedSiteForMcp!!.id, name, endpoint, authType, token)
                },
                onTest = { name, endpoint, authType, token ->
                    viewModel.testConnection(uiState.selectedSiteForMcp!!.id, name, endpoint, authType, token)
                },
                onConnect = { server ->
                    viewModel.connectMcp(server)
                },
                onDisconnect = { serverId ->
                    viewModel.disconnectMcp(uiState.selectedSiteForMcp!!.id, serverId)
                },
                onRefreshTools = { serverId ->
                    viewModel.refreshTools(uiState.selectedSiteForMcp!!.id, serverId)
                }
            )
        }
    }
}

@Composable
fun SiteCard(
    site: Site,
    onConfigureMcp: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onOpenChat: () -> Unit
) {
    val isConnected = site.mcpStatus == McpStatus.CONNECTED

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = ObsidianCard),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = androidx.compose.ui.graphics.SolidColor(
                if (isConnected) EmeraldPrimary.copy(alpha = 0.5f) else ObsidianBorder
            )
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = site.siteName,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TextHighEmphasis
                        )
                        if (site.isDemo) {
                            Spacer(modifier = Modifier.width(6.dp))
                            Surface(
                                color = ImperialGoldDark.copy(alpha = 0.2f),
                                shape = RoundedCornerShape(4.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, ImperialGoldPrimary.copy(alpha = 0.4f))
                            ) {
                                Text(
                                    text = "DEMO",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = ImperialGoldPrimary,
                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                )
                            }
                        }
                    }
                    Text(
                        text = "${site.clientCompanyName} · ${site.websiteUrl}",
                        style = MaterialTheme.typography.bodySmall,
                        color = ImperialGoldSecondary
                    )
                }

                // Connection badge
                Surface(
                    color = if (isConnected) EmeraldDark.copy(alpha = 0.3f) else ObsidianSurface,
                    shape = RoundedCornerShape(16.dp),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (isConnected) EmeraldPrimary.copy(alpha = 0.6f) else TextDisabled
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(RoundedCornerShape(3.dp))
                                .background(if (isConnected) EmeraldPrimary else TextDisabled)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (isConnected) "MCP CONNECTED" else "MCP OFF",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (isConnected) EmeraldPrimary else TextDisabled,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Tech Specs & Endpoint summary
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = ObsidianSurface,
                shape = RoundedCornerShape(8.dp)
            ) {
                Column(modifier = Modifier.padding(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "MCP ENDPOINT",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextDisabled
                        )
                        Text(
                            text = if (site.mcpEndpoint.isNotBlank()) site.mcpEndpoint else "Not configured",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (site.mcpEndpoint.isNotBlank()) TextMediumEmphasis else AmberWarning,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "STACK",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextDisabled
                        )
                        Text(
                            text = "${site.wordPressType} · SEO: ${site.seoPlugin} · Builder: ${site.pageBuilder}",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextMediumEmphasis
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Action row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // MCP Connection Button
                Button(
                    onClick = onConfigureMcp,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isConnected) EmeraldDark.copy(alpha = 0.5f) else ImperialGoldPrimary.copy(alpha = 0.15f),
                        contentColor = if (isConnected) EmeraldPrimary else ImperialGoldPrimary
                    ),
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (isConnected) EmeraldPrimary.copy(alpha = 0.5f) else ImperialGoldPrimary.copy(alpha = 0.4f)
                    ),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Icon(
                        Icons.Default.Settings,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "MCP CONNECTION",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    IconButton(
                        onClick = onOpenChat,
                        modifier = Modifier
                            .size(36.dp)
                            .background(ObsidianSurface, RoundedCornerShape(8.dp))
                    ) {
                        Icon(
                            Icons.Default.Send,
                            contentDescription = "Open Chat in Site Context",
                            tint = ImperialGoldPrimary,
                            modifier = Modifier.size(16.dp)
                        )
                    }

                    IconButton(
                        onClick = onEdit,
                        modifier = Modifier
                            .size(36.dp)
                            .background(ObsidianSurface, RoundedCornerShape(8.dp))
                    ) {
                        Icon(
                            Icons.Default.Edit,
                            contentDescription = "Edit Site",
                            tint = TextMediumEmphasis,
                            modifier = Modifier.size(16.dp)
                        )
                    }

                    IconButton(
                        onClick = onDelete,
                        modifier = Modifier
                            .size(36.dp)
                            .background(ObsidianSurface, RoundedCornerShape(8.dp))
                    ) {
                        Icon(
                            Icons.Default.Delete,
                            contentDescription = "Delete Site",
                            tint = CrimsonError,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun McpConnectionModal(
    site: Site,
    existingServer: MCPServer?,
    maskedToken: String?,
    discoveredTools: List<McpTool>,
    isTesting: Boolean,
    testReport: ke.imperialenterprise.imperialai.domain.agent.ConnectionTestReport?,
    isConnecting: Boolean,
    actionMessage: String?,
    onDismiss: () -> Unit,
    onSave: (name: String, endpoint: String, authType: McpAuthType, token: String?) -> Unit,
    onTest: (name: String, endpoint: String, authType: McpAuthType, token: String?) -> Unit,
    onConnect: (MCPServer) -> Unit,
    onDisconnect: (serverId: String) -> Unit,
    onRefreshTools: (serverId: String) -> Unit
) {
    var serverName by remember { mutableStateOf(existingServer?.name ?: "${site.siteName} MCP Gateway") }
    var endpoint by remember { mutableStateOf(existingServer?.endpoint ?: site.mcpEndpoint) }
    var authType by remember { mutableStateOf(existingServer?.authenticationType ?: McpAuthType.BEARER_TOKEN) }
    var bearerTokenInput by remember { mutableStateOf("") }
    var isTokenVisible by remember { mutableStateOf(false) }

    val isConnected = existingServer?.connectionStatus == McpConnectionStatus.CONNECTED

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.92f),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = ObsidianCard),
            border = CardDefaults.outlinedCardBorder().copy(
                brush = androidx.compose.ui.graphics.SolidColor(ImperialGoldPrimary.copy(alpha = 0.5f))
            )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
            ) {
                // Top Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "MCP CONNECTION",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = ImperialGoldPrimary
                        )
                        Text(
                            text = "Site: ${site.siteName}",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextMediumEmphasis
                        )
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = TextMediumEmphasis)
                    }
                }

                Divider(
                    color = ObsidianBorder,
                    modifier = Modifier.padding(vertical = 12.dp)
                )

                // Scrollable Body
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Status Banner
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        color = when (existingServer?.connectionStatus) {
                            McpConnectionStatus.CONNECTED -> EmeraldDark.copy(alpha = 0.25f)
                            McpConnectionStatus.CONNECTING -> AmberWarning.copy(alpha = 0.15f)
                            McpConnectionStatus.AUTH_REQUIRED -> AmberWarning.copy(alpha = 0.25f)
                            McpConnectionStatus.ERROR -> CrimsonError.copy(alpha = 0.2f)
                            else -> ObsidianSurface
                        },
                        shape = RoundedCornerShape(8.dp),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            when (existingServer?.connectionStatus) {
                                McpConnectionStatus.CONNECTED -> EmeraldPrimary.copy(alpha = 0.5f)
                                McpConnectionStatus.ERROR -> CrimsonError.copy(alpha = 0.5f)
                                else -> ObsidianBorder
                            }
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                if (isConnected) Icons.Default.CheckCircle else Icons.Default.Info,
                                contentDescription = null,
                                tint = if (isConnected) EmeraldPrimary else TextMediumEmphasis,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = "STATUS: ${existingServer?.connectionStatus?.displayName ?: "Not Configured"}",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isConnected) EmeraldPrimary else TextHighEmphasis
                                )
                                if (existingServer?.serverInfo != null) {
                                    Text(
                                        text = "${existingServer.serverInfo.name} v${existingServer.serverInfo.version} (Protocol ${existingServer.protocolVersion ?: "2024-11-05"})",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TextMediumEmphasis
                                    )
                                }
                                if (existingServer?.lastError != null) {
                                    Text(
                                        text = "Last Error: ${existingServer.lastError}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = CrimsonError
                                    )
                                }
                            }
                        }
                    }

                    if (!actionMessage.isNullOrBlank()) {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            color = ObsidianSurface,
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, ImperialGoldPrimary.copy(alpha = 0.3f))
                        ) {
                            Text(
                                text = actionMessage,
                                style = MaterialTheme.typography.bodySmall,
                                color = ImperialGoldSecondary,
                                modifier = Modifier.padding(10.dp)
                            )
                        }
                    }

                    // Field 1: MCP Server Name
                    OutlinedTextField(
                        value = serverName,
                        onValueChange = { serverName = it },
                        label = { Text("MCP Server Name") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = ImperialGoldPrimary,
                            unfocusedBorderColor = ObsidianBorder,
                            focusedLabelColor = ImperialGoldPrimary
                        ),
                        singleLine = true
                    )

                    // Field 2: MCP Endpoint
                    OutlinedTextField(
                        value = endpoint,
                        onValueChange = { endpoint = it },
                        label = { Text("MCP Endpoint (e.g. https://example.com/mcp)") },
                        placeholder = { Text("https://your-wordpress-site.com/wp-json/mcp/v1") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = ImperialGoldPrimary,
                            unfocusedBorderColor = ObsidianBorder,
                            focusedLabelColor = ImperialGoldPrimary
                        ),
                        singleLine = true
                    )

                    // Field 3: Authentication Type
                    Text(
                        text = "AUTHENTICATION",
                        style = MaterialTheme.typography.labelSmall,
                        color = ImperialGoldPrimary,
                        fontWeight = FontWeight.Bold
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        McpAuthType.values().forEach { type ->
                            val isSelected = authType == type
                            FilterChip(
                                selected = isSelected,
                                onClick = { authType = type },
                                label = {
                                    Text(
                                        text = when (type) {
                                            McpAuthType.NONE -> "None"
                                            McpAuthType.BEARER_TOKEN -> "Bearer Token"
                                            McpAuthType.OAUTH2 -> "OAuth 2.0"
                                        },
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = ImperialGoldPrimary.copy(alpha = 0.2f),
                                    selectedLabelColor = ImperialGoldPrimary
                                )
                            )
                        }
                    }

                    // Bearer Token Entry
                    if (authType == McpAuthType.BEARER_TOKEN) {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            OutlinedTextField(
                                value = bearerTokenInput,
                                onValueChange = { bearerTokenInput = it },
                                label = { Text("Bearer Token") },
                                placeholder = {
                                    Text(if (!maskedToken.isNullOrBlank()) "Stored: $maskedToken" else "Enter remote token")
                                },
                                modifier = Modifier.fillMaxWidth(),
                                visualTransformation = if (isTokenVisible) VisualTransformation.None else PasswordVisualTransformation(),
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                                trailingIcon = {
                                    IconButton(onClick = { isTokenVisible = !isTokenVisible }) {
                                        Icon(
                                            if (isTokenVisible) Icons.Default.Info else Icons.Default.Lock,
                                            contentDescription = "Toggle token visibility",
                                            tint = TextMediumEmphasis
                                        )
                                    }
                                },
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = ImperialGoldPrimary,
                                    unfocusedBorderColor = ObsidianBorder,
                                    focusedLabelColor = ImperialGoldPrimary
                                ),
                                singleLine = true
                            )
                            if (!maskedToken.isNullOrBlank() && bearerTokenInput.isBlank()) {
                                Text(
                                    text = "Current Keyring Secret: $maskedToken (Sealed in Keystore)",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = EmeraldPrimary,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }

                    // Test Report Display
                    if (testReport != null) {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            color = if (testReport.success) EmeraldDark.copy(alpha = 0.2f) else CrimsonError.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (testReport.success) EmeraldPrimary.copy(alpha = 0.5f) else CrimsonError.copy(alpha = 0.5f)
                            )
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = if (testReport.success) "CONNECTION TEST: SUCCESS" else "CONNECTION TEST: FAILED",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = if (testReport.success) EmeraldPrimary else CrimsonError
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Roundtrip Latency: ${testReport.latencyMs} ms",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextMediumEmphasis
                                )
                                if (testReport.serverName != null) {
                                    Text(
                                        text = "Server: ${testReport.serverName} v${testReport.serverVersion} (Protocol: ${testReport.protocolVersion})",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TextMediumEmphasis
                                    )
                                }
                                if (testReport.discoveredToolsCount > 0) {
                                    Text(
                                        text = "Discovered Tools Advertised: ${testReport.discoveredToolsCount}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = EmeraldPrimary
                                    )
                                }
                                if (testReport.errorMessage != null) {
                                    Text(
                                        text = "Details: ${testReport.errorMessage}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = CrimsonError
                                    )
                                }
                            }
                        }
                    }

                    // Action Buttons: TEST, CONNECT, DISCONNECT, REFRESH TOOLS
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // TEST CONNECTION
                        OutlinedButton(
                            onClick = {
                                onTest(
                                    serverName,
                                    endpoint,
                                    authType,
                                    if (bearerTokenInput.isNotBlank()) bearerTokenInput else null
                                )
                            },
                            enabled = !isTesting && endpoint.isNotBlank(),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = ImperialGoldPrimary)
                        ) {
                            if (isTesting) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = ImperialGoldPrimary)
                            } else {
                                Text("TEST CONNECTION", style = MaterialTheme.typography.labelSmall)
                            }
                        }

                        // SAVE CONFIG
                        Button(
                            onClick = {
                                onSave(
                                    serverName,
                                    endpoint,
                                    authType,
                                    if (bearerTokenInput.isNotBlank()) bearerTokenInput else null
                                )
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = ImperialGoldPrimary,
                                contentColor = ObsidianSurface
                            )
                        ) {
                            Text("SAVE CONFIG", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // CONNECT / DISCONNECT
                        if (!isConnected) {
                            Button(
                                onClick = {
                                    val s = existingServer?.copy(
                                        name = serverName,
                                        endpoint = endpoint,
                                        authenticationType = authType
                                    ) ?: MCPServer(
                                        name = serverName,
                                        endpoint = endpoint,
                                        siteId = site.id,
                                        authenticationType = authType
                                    )
                                    onConnect(s)
                                },
                                enabled = !isConnecting && endpoint.isNotBlank(),
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = EmeraldPrimary,
                                    contentColor = ObsidianSurface
                                )
                            ) {
                                if (isConnecting) {
                                    CircularProgressIndicator(modifier = Modifier.size(16.dp), color = ObsidianSurface)
                                } else {
                                    Text("CONNECT", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                                }
                            }
                        } else {
                            OutlinedButton(
                                onClick = {
                                    if (existingServer != null) {
                                        onDisconnect(existingServer.id)
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = CrimsonError)
                            ) {
                                Text("DISCONNECT", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                            }
                        }

                        // REFRESH TOOLS
                        OutlinedButton(
                            onClick = {
                                if (existingServer != null) {
                                    onRefreshTools(existingServer.id)
                                }
                            },
                            enabled = isConnected && existingServer != null,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("REFRESH TOOLS", style = MaterialTheme.typography.labelSmall)
                        }
                    }

                    // Discovered Tools Section
                    if (discoveredTools.isNotEmpty()) {
                        Text(
                            text = "DISCOVERED MCP TOOLS (${discoveredTools.size})",
                            style = MaterialTheme.typography.labelSmall,
                            color = ImperialGoldPrimary,
                            fontWeight = FontWeight.Bold
                        )

                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            discoveredTools.forEach { tool ->
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    color = ObsidianSurface,
                                    shape = RoundedCornerShape(8.dp),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, ObsidianBorder)
                                ) {
                                    Column(modifier = Modifier.padding(10.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                text = tool.name,
                                                style = MaterialTheme.typography.labelMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = TextHighEmphasis,
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
                                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                                )
                                            }
                                        }
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = tool.description,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = TextMediumEmphasis
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
}

@Composable
fun AddEditSiteDialog(
    site: Site?,
    onDismiss: () -> Unit,
    onSave: (Site) -> Unit
) {
    var siteName by remember { mutableStateOf(site?.siteName ?: "") }
    var websiteUrl by remember { mutableStateOf(site?.websiteUrl ?: "https://") }
    var clientCompanyName by remember { mutableStateOf(site?.clientCompanyName ?: "") }
    var mcpEndpoint by remember { mutableStateOf(site?.mcpEndpoint ?: "") }
    var wordPressType by remember { mutableStateOf(site?.wordPressType ?: WordPressType.SELF_HOSTED) }
    var seoPlugin by remember { mutableStateOf(site?.seoPlugin ?: SeoPlugin.YOAST) }
    var pageBuilder by remember { mutableStateOf(site?.pageBuilder ?: PageBuilder.GUTENBERG) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight(),
            colors = CardDefaults.cardColors(containerColor = ObsidianCard),
            shape = RoundedCornerShape(16.dp),
            border = CardDefaults.outlinedCardBorder().copy(
                brush = androidx.compose.ui.graphics.SolidColor(ImperialGoldPrimary.copy(alpha = 0.5f))
            )
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = if (site != null) "Edit Site" else "Add WordPress Site",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = ImperialGoldPrimary
                )

                OutlinedTextField(
                    value = siteName,
                    onValueChange = { siteName = it },
                    label = { Text("Site Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = clientCompanyName,
                    onValueChange = { clientCompanyName = it },
                    label = { Text("Client Company Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = websiteUrl,
                    onValueChange = { websiteUrl = it },
                    label = { Text("Website URL") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = mcpEndpoint,
                    onValueChange = { mcpEndpoint = it },
                    label = { Text("MCP Endpoint (Optional)") },
                    placeholder = { Text("https://example.com/wp-json/mcp/v1") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancel", color = TextMediumEmphasis)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            if (siteName.isNotBlank()) {
                                val updated = site?.copy(
                                    siteName = siteName,
                                    websiteUrl = websiteUrl,
                                    clientCompanyName = clientCompanyName,
                                    mcpEndpoint = mcpEndpoint,
                                    wordPressType = wordPressType,
                                    seoPlugin = seoPlugin,
                                    pageBuilder = pageBuilder
                                ) ?: Site(
                                    id = "site_${System.currentTimeMillis()}",
                                    siteName = siteName,
                                    websiteUrl = websiteUrl,
                                    clientCompanyName = clientCompanyName,
                                    mcpEndpoint = mcpEndpoint,
                                    mcpStatus = McpStatus.NOT_CONFIGURED,
                                    wordPressType = wordPressType,
                                    seoPlugin = seoPlugin,
                                    pageBuilder = pageBuilder
                                )
                                onSave(updated)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = ImperialGoldPrimary,
                            contentColor = ObsidianSurface
                        )
                    ) {
                        Text("Save Site", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
