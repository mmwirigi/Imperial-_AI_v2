package ke.imperialenterprise.imperialai.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import ke.imperialenterprise.imperialai.ui.components.ImperialTopBar
import ke.imperialenterprise.imperialai.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel,
    onNavigateToModelCenter: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            ImperialTopBar(title = "System Settings")
        },
        containerColor = ObsidianSurface
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            // Section 1: AI Models & OpenRouter
            item {
                SettingsSectionHeader(title = "AI MODELS (OPENROUTER ROUTING)", icon = Icons.Default.SmartToy)
                Spacer(modifier = Modifier.height(8.dp))
                Surface(
                    color = CardSurface,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, BorderHairline, RoundedCornerShape(8.dp))
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Status & Provider Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Primary AI Provider",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = TextHighEmphasis
                                )
                                Text(
                                    text = "OpenRouter Universal Model Gateway",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextMediumEmphasis
                                )
                            }
                            Surface(
                                color = if (uiState.hasApiKey) StatusSuccess.copy(alpha = 0.15f) else StatusWarning.copy(alpha = 0.15f),
                                shape = RoundedCornerShape(4.dp),
                                modifier = Modifier.border(
                                    1.dp,
                                    if (uiState.hasApiKey) StatusSuccess.copy(alpha = 0.4f) else StatusWarning.copy(alpha = 0.4f),
                                    RoundedCornerShape(4.dp)
                                )
                            ) {
                                Text(
                                    text = if (uiState.hasApiKey) "CONNECTED" else "NOT CONFIGURED",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (uiState.hasApiKey) StatusSuccess else StatusWarning,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }

                        Divider(color = BorderHairline, thickness = 1.dp)

                        // API Key Row with Masked Display & Replace/Remove
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = "OpenRouter API Key",
                                style = MaterialTheme.typography.titleMedium,
                                color = TextHighEmphasis
                            )
                            if (uiState.hasApiKey && uiState.maskedApiKey != null) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = uiState.maskedApiKey!!,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = ImperialGoldPrimary,
                                        fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                                    )
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        TextButton(
                                            onClick = { viewModel.openKeyEntryDialog() },
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                                        ) {
                                            Text("Replace", color = ImperialGoldPrimary, fontSize = 11.sp)
                                        }
                                        TextButton(
                                            onClick = { viewModel.removeApiKey() },
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                                        ) {
                                            Text("Remove", color = StatusError, fontSize = 11.sp)
                                        }
                                    }
                                }
                            } else {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "No key configured. Key is never saved in plaintext.",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TextDisabled
                                    )
                                    Button(
                                        onClick = { viewModel.openKeyEntryDialog() },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = ImperialGoldPrimary,
                                            contentColor = ObsidianSurface
                                        ),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                                        modifier = Modifier.height(30.dp)
                                    ) {
                                        Text("Configure Key", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }

                        // Connection Test Button & Feedback
                        if (uiState.hasApiKey) {
                            Divider(color = BorderHairline, thickness = 1.dp)

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "API Connectivity Test",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = TextHighEmphasis
                                    )
                                    Text(
                                        text = "Validates Keystore credentials against OpenRouter API",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TextMediumEmphasis,
                                        fontSize = 11.sp
                                    )
                                }
                                OutlinedButton(
                                    onClick = { viewModel.testConnection() },
                                    enabled = !uiState.isTestingConnection,
                                    shape = RoundedCornerShape(6.dp),
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                    modifier = Modifier.height(32.dp)
                                ) {
                                    if (uiState.isTestingConnection) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(14.dp),
                                            color = ImperialGoldPrimary,
                                            strokeWidth = 2.dp
                                        )
                                    } else {
                                        Text("Test Connection", color = ImperialGoldPrimary, fontSize = 11.sp)
                                    }
                                }
                            }

                            // Test Result Banner
                            uiState.connectionTestResult?.let { result ->
                                Surface(
                                    color = if (result.isSuccessful) StatusSuccess.copy(alpha = 0.1f) else StatusError.copy(alpha = 0.1f),
                                    shape = RoundedCornerShape(6.dp),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .border(
                                            1.dp,
                                            if (result.isSuccessful) StatusSuccess.copy(alpha = 0.3f) else StatusError.copy(alpha = 0.3f),
                                            RoundedCornerShape(6.dp)
                                        )
                                ) {
                                    Row(
                                        modifier = Modifier.padding(10.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Icon(
                                            imageVector = if (result.isSuccessful) Icons.Default.CheckCircle else Icons.Default.Error,
                                            contentDescription = null,
                                            tint = if (result.isSuccessful) StatusSuccess else StatusError,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Text(
                                            text = result.message,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = if (result.isSuccessful) StatusSuccess else StatusError,
                                            fontSize = 11.sp
                                        )
                                    }
                                }
                            }
                        }

                        Divider(color = BorderHairline, thickness = 1.dp)

                        // Default Model Selector & Model Center Button
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = "Global Default Model",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = TextHighEmphasis
                                    )
                                    Text(
                                        text = uiState.selectedModelName,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = ImperialGoldPrimary,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                                Button(
                                    onClick = onNavigateToModelCenter,
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = CardSurface,
                                        contentColor = ImperialGoldPrimary
                                    ),
                                    shape = RoundedCornerShape(6.dp),
                                    modifier = Modifier
                                        .border(1.dp, ImperialGoldPrimary, RoundedCornerShape(6.dp))
                                        .height(32.dp),
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Icon(imageVector = Icons.Default.Layers, contentDescription = null, modifier = Modifier.size(14.dp))
                                        Text("Open Model Center", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }

                            val lastUpdate = if (uiState.lastCatalogUpdateTimestamp > 0) {
                                val sdf = SimpleDateFormat("MMM d, yyyy HH:mm", Locale.getDefault())
                                sdf.format(Date(uiState.lastCatalogUpdateTimestamp))
                            } else "Never"

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Catalog Cached: ${uiState.availableModels.size} models · Last updated: $lastUpdate",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TextDisabled,
                                    fontSize = 10.sp
                                )
                                TextButton(
                                    onClick = { viewModel.refreshModels() },
                                    enabled = !uiState.isRefreshingModels,
                                    contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = if (uiState.isRefreshingModels) "Refreshing..." else "Refresh Models",
                                        color = ImperialGoldPrimary,
                                        fontSize = 10.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Section 2: MCP Connections
            item {
                SettingsSectionHeader(title = "MCP CONNECTIONS", icon = Icons.Default.Hub)
                Spacer(modifier = Modifier.height(8.dp))
                SettingsCard {
                    SettingsRow(
                        title = "Transport Protocol",
                        value = uiState.defaultMcpTransport,
                        subtext = "Server-Sent Events (SSE) stream over HTTPS"
                    )
                    Divider(color = BorderHairline, thickness = 1.dp)
                    SettingsRow(
                        title = "Tool Discovery Cache",
                        value = "Automatic On Connect",
                        subtext = "Parses tool JSON-schema capabilities"
                    )
                }
            }

            // Section 3: Security & Android Keystore
            item {
                SettingsSectionHeader(title = "SECURITY ARCHITECTURE", icon = Icons.Default.Security)
                Spacer(modifier = Modifier.height(8.dp))
                SettingsCard {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Hardware-Backed Keystore",
                                style = MaterialTheme.typography.titleMedium,
                                color = TextHighEmphasis
                            )
                            Text(
                                text = "StrongBox / TEE Cryptographic Vault",
                                style = MaterialTheme.typography.labelSmall,
                                color = StatusSuccess
                            )
                            Text(
                                text = "OpenRouter API keys, WordPress application passwords, and MCP tokens are securely sealed and never stored in plain text.",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextMediumEmphasis
                            )
                        }
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .background(StatusSuccess, RoundedCornerShape(5.dp))
                        )
                    }

                    Divider(color = BorderHairline, thickness = 1.dp)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Client Isolation Policy",
                                style = MaterialTheme.typography.titleMedium,
                                color = TextHighEmphasis
                            )
                            Text(
                                text = "Strict site-scoped key derivation prevents Site A credentials from being queried by Site B.",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextMediumEmphasis
                            )
                        }
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = "Active",
                            tint = ImperialGoldPrimary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }

            // Section 4: Appearance & Notifications
            item {
                SettingsSectionHeader(title = "APPEARANCE & NOTIFICATIONS", icon = Icons.Default.Palette)
                Spacer(modifier = Modifier.height(8.dp))
                SettingsCard {
                    SettingsRow(
                        title = "Theme",
                        value = "Imperial Obsidian (Dark-First)",
                        subtext = "Engineered for technical command center environments"
                    )
                    Divider(color = BorderHairline, thickness = 1.dp)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Dangerous Action Alerts",
                                style = MaterialTheme.typography.titleMedium,
                                color = TextHighEmphasis
                            )
                            Text(
                                text = "Notify immediately when AI requests operator approval",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextMediumEmphasis
                            )
                        }
                        Switch(
                            checked = uiState.notificationsEnabled,
                            onCheckedChange = { viewModel.toggleNotifications(it) },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = ObsidianSurface,
                                checkedTrackColor = ImperialGoldPrimary
                            )
                        )
                    }
                }
            }

            // Section 5: About
            item {
                SettingsSectionHeader(title = "ABOUT IMPERIAL AI", icon = Icons.Default.Info)
                Spacer(modifier = Modifier.height(8.dp))
                SettingsCard {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = "IMPERIAL AI",
                            style = MaterialTheme.typography.headlineMedium,
                            color = ImperialGoldPrimary,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "WordPress AI Command Center",
                            style = MaterialTheme.typography.titleMedium,
                            color = TextHighEmphasis
                        )
                        Text(
                            text = "Private internal enterprise application for Imperial Enterprise Kenya. Designed for multi-site WordPress automation via remote MCP agents and OpenRouter LLM routing.",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextMediumEmphasis
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Build: ${uiState.appVersion}",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextDisabled
                        )
                        Text(
                            text = "Phase 2: OpenRouter AI Model Center, Dynamic Catalog & Secure Keystore Integration",
                            style = MaterialTheme.typography.labelSmall,
                            color = ImperialGoldPrimary
                        )
                    }
                }
            }
        }

        // OpenRouter API Key Entry Dialog
        if (uiState.isKeyEntryDialogOpen) {
            var showPassword by remember { mutableStateOf(false) }

            Dialog(onDismissRequest = { viewModel.closeKeyEntryDialog() }) {
                Surface(
                    color = ElevatedSurface,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, BorderHairline, RoundedCornerShape(12.dp))
                ) {
                    Column(
                        modifier = Modifier
                            .padding(20.dp)
                            .fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "OPENROUTER API KEY",
                                style = MaterialTheme.typography.labelSmall,
                                color = ImperialGoldPrimary,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.5.sp
                            )
                            IconButton(onClick = { viewModel.closeKeyEntryDialog() }) {
                                Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = TextMediumEmphasis, modifier = Modifier.size(18.dp))
                            }
                        }

                        Text(
                            text = "Enter your OpenRouter secret key. Keys are encrypted via Android Keystore and never stored in plain text or logged.",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextMediumEmphasis
                        )

                        OutlinedTextField(
                            value = uiState.apiKeyInput,
                            onValueChange = { viewModel.onApiKeyInputChanged(it) },
                            placeholder = { Text("sk-or-v1-...", color = TextDisabled) },
                            visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                            trailingIcon = {
                                IconButton(onClick = { showPassword = !showPassword }) {
                                    Icon(
                                        imageVector = if (showPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                        contentDescription = "Toggle visibility",
                                        tint = TextMediumEmphasis
                                    )
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = ImperialGoldPrimary,
                                unfocusedBorderColor = BorderHairline,
                                focusedTextColor = TextHighEmphasis,
                                unfocusedTextColor = TextHighEmphasis
                            ),
                            singleLine = true
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            TextButton(onClick = { viewModel.closeKeyEntryDialog() }) {
                                Text("Cancel", color = TextMediumEmphasis)
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(
                                onClick = { viewModel.saveApiKey() },
                                enabled = uiState.apiKeyInput.isNotBlank(),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = ImperialGoldPrimary,
                                    contentColor = ObsidianSurface
                                )
                            ) {
                                Text("Save Key", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SettingsSectionHeader(title: String, icon: ImageVector) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(imageVector = icon, contentDescription = title, tint = ImperialGoldPrimary, modifier = Modifier.size(16.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.labelSmall,
            color = ImperialGoldPrimary,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp
        )
    }
}

@Composable
fun SettingsCard(content: @Composable ColumnScope.() -> Unit) {
    Surface(
        color = CardSurface,
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, BorderHairline, RoundedCornerShape(8.dp))
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            content = content
        )
    }
}

@Composable
fun SettingsRow(title: String, value: String, subtext: String) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = title, style = MaterialTheme.typography.titleMedium, color = TextHighEmphasis)
            Text(text = value, style = MaterialTheme.typography.bodyMedium, color = ImperialGoldPrimary, fontWeight = FontWeight.SemiBold)
        }
        Text(text = subtext, style = MaterialTheme.typography.bodySmall, color = TextMediumEmphasis)
    }
}
