package ke.imperialenterprise.imperialai.ui.models

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ke.imperialenterprise.imperialai.domain.model.AIModel
import ke.imperialenterprise.imperialai.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun ModelCenterScreen(
    viewModel: ModelCenterViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            Surface(
                color = CardSurface,
                modifier = Modifier
                    .fillMaxWidth()
                    .border(0.dp, BorderHairline, RoundedCornerShape(0.dp))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 8.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        IconButton(onClick = onNavigateBack) {
                            Icon(
                                imageVector = Icons.Default.ArrowBack,
                                contentDescription = "Back",
                                tint = ImperialGoldPrimary
                            )
                        }
                        Column {
                            Text(
                                text = "AI Model Center",
                                style = MaterialTheme.typography.titleMedium,
                                color = TextHighEmphasis,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "OpenRouter Dynamic Catalog",
                                style = MaterialTheme.typography.labelSmall,
                                color = TextMediumEmphasis
                            )
                        }
                    }

                    IconButton(
                        onClick = { viewModel.refreshCatalog() },
                        enabled = !uiState.isLoading
                    ) {
                        if (uiState.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                color = ImperialGoldPrimary,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Icon(
                                imageVector = Icons.Default.Refresh,
                                contentDescription = "Refresh Models",
                                tint = ImperialGoldPrimary
                            )
                        }
                    }
                }
            }
        },
        containerColor = ObsidianSurface
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Search Input
            OutlinedTextField(
                value = uiState.searchQuery,
                onValueChange = { viewModel.onSearchQueryChanged(it) },
                placeholder = {
                    Text("Search models, providers, context...", color = TextDisabled, fontSize = 12.sp)
                },
                leadingIcon = {
                    Icon(imageVector = Icons.Default.Search, contentDescription = "Search", tint = TextMediumEmphasis, modifier = Modifier.size(16.dp))
                },
                trailingIcon = {
                    if (uiState.searchQuery.isNotEmpty()) {
                        IconButton(onClick = { viewModel.onSearchQueryChanged("") }) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Clear", tint = TextMediumEmphasis, modifier = Modifier.size(16.dp))
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                shape = RoundedCornerShape(8.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = ImperialGoldPrimary,
                    unfocusedBorderColor = BorderHairline,
                    focusedTextColor = TextHighEmphasis,
                    unfocusedTextColor = TextHighEmphasis,
                    cursorColor = ImperialGoldPrimary
                ),
                singleLine = true
            )

            // Filter Chips
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                ModelFilter.values().forEach { filter ->
                    val isSelected = uiState.activeFilter == filter
                    Surface(
                        color = if (isSelected) ImperialGoldPrimary else CardSurface,
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .border(1.dp, if (isSelected) ImperialGoldPrimary else BorderHairline, RoundedCornerShape(16.dp))
                            .clip(RoundedCornerShape(16.dp))
                            .clickable { viewModel.onFilterSelected(filter) }
                    ) {
                        Text(
                            text = filter.label,
                            style = MaterialTheme.typography.bodySmall,
                            color = if (isSelected) ObsidianSurface else TextMediumEmphasis,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            // Cache Timestamp & Sort bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                val formattedTime = if (uiState.lastUpdatedTimestamp > 0) {
                    val sdf = SimpleDateFormat("MMM d, HH:mm", Locale.getDefault())
                    sdf.format(Date(uiState.lastUpdatedTimestamp))
                } else "Cached"

                Text(
                    text = "Catalog: ${uiState.models.size} models · Last updated: $formattedTime",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextDisabled,
                    fontSize = 11.sp
                )

                // Sort Dropdown
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text("Sort:", style = MaterialTheme.typography.labelSmall, color = TextMediumEmphasis)
                    ModelSort.values().forEach { sort ->
                        val isSortSelected = uiState.activeSort == sort
                        Text(
                            text = sort.label,
                            style = MaterialTheme.typography.labelSmall,
                            color = if (isSortSelected) ImperialGoldPrimary else TextDisabled,
                            fontWeight = if (isSortSelected) FontWeight.Bold else FontWeight.Normal,
                            modifier = Modifier
                                .clickable { viewModel.onSortSelected(sort) }
                                .padding(horizontal = 4.dp, vertical = 2.dp)
                        )
                    }
                }
            }

            // Model List
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(bottom = 24.dp, top = 4.dp)
            ) {
                // Free Models Banner section if filter is ALL and search is empty
                if (uiState.activeFilter == ModelFilter.ALL && uiState.searchQuery.isBlank() && uiState.freeModels.isNotEmpty()) {
                    item {
                        Surface(
                            color = CardSurface,
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, StatusSuccess.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                        ) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Box(modifier = Modifier.size(8.dp).background(StatusSuccess, RoundedCornerShape(4.dp)))
                                        Text(
                                            text = "FREE MODELS SECTION",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = StatusSuccess,
                                            fontWeight = FontWeight.Bold,
                                            letterSpacing = 0.5.sp
                                        )
                                    }
                                    Text(
                                        text = "${uiState.freeModels.size} Zero-Cost Models",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TextMediumEmphasis
                                    )
                                }
                                Text(
                                    text = "Detected directly from OpenRouter pricing metadata ($0.00 prompt & completion). Ideal for routine audits without credit usage.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextMediumEmphasis,
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }
                }

                if (uiState.models.isEmpty()) {
                    item {
                        Surface(
                            color = CardSurface,
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 32.dp)
                                .border(1.dp, BorderHairline, RoundedCornerShape(8.dp))
                        ) {
                            Column(
                                modifier = Modifier.padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = "No Models Found",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = TextHighEmphasis,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "No models match your search or capability filter. Try clearing filters or refreshing the catalog.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextMediumEmphasis
                                )
                            }
                        }
                    }
                } else {
                    items(uiState.models, key = { it.id }) { model ->
                        val isGlobalDefault = model.id == uiState.selectedGlobalModelId
                        val isConvOverride = model.id == uiState.conversationOverrideModelId

                        ModelCatalogCard(
                            model = model,
                            isGlobalDefault = isGlobalDefault,
                            isConversationOverride = isConvOverride,
                            onSelectAsDefault = { viewModel.selectModelAsGlobalDefault(model.id) },
                            onSelectForConversation = { viewModel.selectModelForConversation(model.id) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ModelCatalogCard(
    model: AIModel,
    isGlobalDefault: Boolean,
    isConversationOverride: Boolean,
    onSelectAsDefault: () -> Unit,
    onSelectForConversation: () -> Unit
) {
    Surface(
        color = CardSurface,
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(
                1.dp,
                if (isGlobalDefault || isConversationOverride) ImperialGoldPrimary else BorderHairline,
                RoundedCornerShape(8.dp)
            )
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Header row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = model.provider.uppercase(),
                        style = MaterialTheme.typography.labelSmall,
                        color = ImperialGoldPrimary,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                    if (model.isFree) {
                        Surface(
                            color = StatusSuccess.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(4.dp),
                            modifier = Modifier.border(1.dp, StatusSuccess.copy(alpha = 0.4f), RoundedCornerShape(4.dp))
                        ) {
                            Text(
                                text = "FREE",
                                style = MaterialTheme.typography.labelSmall,
                                color = StatusSuccess,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 5.dp, vertical = 1.dp)
                            )
                        }
                    } else {
                        Surface(
                            color = StatusRunning.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(4.dp),
                            modifier = Modifier.border(1.dp, StatusRunning.copy(alpha = 0.3f), RoundedCornerShape(4.dp))
                        ) {
                            Text(
                                text = "$${String.format(Locale.US, "%.2f", model.inputCost)}/1M",
                                style = MaterialTheme.typography.labelSmall,
                                color = StatusRunning,
                                fontSize = 9.sp,
                                modifier = Modifier.padding(horizontal = 5.dp, vertical = 1.dp)
                            )
                        }
                    }
                }

                if (isGlobalDefault) {
                    Surface(
                        color = ImperialGoldPrimary,
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text(
                            text = "DEFAULT",
                            style = MaterialTheme.typography.labelSmall,
                            color = ObsidianSurface,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                } else if (isConversationOverride) {
                    Surface(
                        color = StatusWarning,
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text(
                            text = "ACTIVE IN CHAT",
                            style = MaterialTheme.typography.labelSmall,
                            color = ObsidianSurface,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
            }

            // Model Name & ID
            Column {
                Text(
                    text = model.name,
                    style = MaterialTheme.typography.titleMedium,
                    color = TextHighEmphasis,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = model.id,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextDisabled,
                    fontSize = 10.sp
                )
            }

            // Description
            Text(
                text = model.description,
                style = MaterialTheme.typography.bodySmall,
                color = TextMediumEmphasis,
                maxLines = 2
            )

            // Capabilities Row (Strictly derived from metadata, no fake claims!)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Context length
                CapabilityBadge(
                    label = if (model.contextLength >= 1000) "${model.contextLength / 1000}k Context" else "${model.contextLength} Tokens",
                    isActive = true
                )

                if (model.supportsTools) {
                    CapabilityBadge(label = "Tools", isActive = true)
                }
                if (model.supportsVision) {
                    CapabilityBadge(label = "Vision", isActive = true)
                }
                if (model.supportsReasoning) {
                    CapabilityBadge(label = "Reasoning", isActive = true)
                }
            }

            Divider(color = BorderHairline, thickness = 1.dp)

            // Actions row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (model.isFree) "Cost: $0.00" else "Prompt: $${String.format(Locale.US, "%.2f", model.inputCost)} / Output: $${String.format(Locale.US, "%.2f", model.outputCost)}",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextDisabled,
                    fontSize = 10.sp
                )

                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (!isGlobalDefault) {
                        TextButton(
                            onClick = onSelectAsDefault,
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                            modifier = Modifier.height(28.dp)
                        ) {
                            Text("Set as Default", color = ImperialGoldPrimary, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CapabilityBadge(label: String, isActive: Boolean) {
    Surface(
        color = ElevatedSurface,
        shape = RoundedCornerShape(4.dp),
        modifier = Modifier.border(1.dp, BorderHairline, RoundedCornerShape(4.dp))
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = if (isActive) TextHighEmphasis else TextDisabled,
            fontSize = 9.sp,
            modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
        )
    }
}
