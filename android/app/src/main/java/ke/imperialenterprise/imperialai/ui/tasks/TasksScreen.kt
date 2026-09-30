package ke.imperialenterprise.imperialai.ui.tasks

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
import androidx.compose.ui.window.Dialog
import ke.imperialenterprise.imperialai.domain.model.*
import ke.imperialenterprise.imperialai.ui.components.ApprovalDialog
import ke.imperialenterprise.imperialai.ui.components.ImperialTopBar
import ke.imperialenterprise.imperialai.ui.theme.*

@Composable
fun TasksScreen(
    viewModel: TasksViewModel
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            ImperialTopBar(title = "Task Pipeline")
        },
        containerColor = ObsidianSurface
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Category Filter Bar
            CategoryChipsRow(
                selectedCategory = uiState.selectedFilterCategory,
                onCategorySelected = { viewModel.setFilterCategory(it) }
            )

            // State Filter Bar
            FilterChipsRow(
                selectedState = uiState.selectedFilterState,
                onStateSelected = { viewModel.setFilterState(it) }
            )

            // Grouped Task List by Category
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(vertical = 8.dp)
            ) {
                if (uiState.tasks.isEmpty()) {
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
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = "No Tasks Found",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = TextHighEmphasis,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "No operations match the selected category or lifecycle filter.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextMediumEmphasis
                                )
                            }
                        }
                    }
                } else {
                    // Iterate through each category group
                    uiState.groupedTasks.forEach { (category, tasksInCategory) ->
                        item(key = "header_${category.name}") {
                            CategoryGroupHeader(
                                category = category,
                                count = tasksInCategory.size
                            )
                        }

                        items(tasksInCategory, key = { it.id }) { task ->
                            TaskCard(
                                task = task,
                                onCardClicked = { viewModel.selectTaskForDetails(task) },
                                onReviewApproval = { viewModel.promptApproval(task) }
                            )
                        }
                    }
                }
            }
        }

        // Details Modal
        uiState.selectedTaskForDetails?.let { task ->
            TaskDetailsDialog(
                task = task,
                onDismiss = { viewModel.selectTaskForDetails(null) }
            )
        }

        // Dangerous Action Approval Modal
        uiState.pendingApprovalTask?.let { task ->
            ApprovalDialog(
                siteName = task.siteName,
                actionType = task.dangerousActionType,
                description = task.description,
                targetResource = task.title,
                onApprove = { viewModel.approveTask(task) },
                onReject = { viewModel.rejectTask(task) },
                onDismiss = { viewModel.dismissApproval() }
            )
        }
    }
}

@Composable
fun CategoryChipsRow(
    selectedCategory: TaskCategory?,
    onCategorySelected: (TaskCategory?) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        // "All Categories" chip
        Surface(
            color = if (selectedCategory == null) ImperialGoldPrimary else ElevatedSurface,
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .border(1.dp, if (selectedCategory == null) ImperialGoldPrimary else BorderHairline, RoundedCornerShape(16.dp))
                .clip(RoundedCornerShape(16.dp))
                .clickable { onCategorySelected(null) }
        ) {
            Text(
                text = "All Categories",
                style = MaterialTheme.typography.bodySmall,
                color = if (selectedCategory == null) ObsidianSurface else TextMediumEmphasis,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                fontWeight = FontWeight.Medium
            )
        }

        TaskCategory.values().forEach { category ->
            val isSelected = selectedCategory == category
            Surface(
                color = if (isSelected) ImperialGoldPrimary else ElevatedSurface,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .border(1.dp, if (isSelected) ImperialGoldPrimary else BorderHairline, RoundedCornerShape(16.dp))
                    .clip(RoundedCornerShape(16.dp))
                    .clickable { onCategorySelected(category) }
            ) {
                Text(
                    text = category.displayName,
                    style = MaterialTheme.typography.bodySmall,
                    color = if (isSelected) ObsidianSurface else TextMediumEmphasis,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

@Composable
fun FilterChipsRow(
    selectedState: TaskState?,
    onStateSelected: (TaskState?) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        // "All States" chip
        Surface(
            color = if (selectedState == null) ImperialGoldPrimary else CardSurface,
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .border(1.dp, BorderHairline, RoundedCornerShape(16.dp))
                .clip(RoundedCornerShape(16.dp))
                .clickable { onStateSelected(null) }
        ) {
            Text(
                text = "All States",
                style = MaterialTheme.typography.bodySmall,
                color = if (selectedState == null) ObsidianSurface else TextMediumEmphasis,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp),
                fontWeight = FontWeight.Medium
            )
        }

        TaskState.values().forEach { state ->
            val isSelected = selectedState == state
            Surface(
                color = if (isSelected) ImperialGoldPrimary else CardSurface,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .border(1.dp, BorderHairline, RoundedCornerShape(16.dp))
                    .clip(RoundedCornerShape(16.dp))
                    .clickable { onStateSelected(state) }
            ) {
                Text(
                    text = state.displayName,
                    style = MaterialTheme.typography.bodySmall,
                    color = if (isSelected) ObsidianSurface else TextMediumEmphasis,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp),
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

@Composable
fun CategoryGroupHeader(
    category: TaskCategory,
    count: Int
) {
    val categoryColor = getCategoryColor(category)

    Surface(
        color = CardSurface,
        shape = RoundedCornerShape(6.dp),
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 10.dp, bottom = 2.dp)
            .border(1.dp, BorderHairline, RoundedCornerShape(6.dp))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(categoryColor)
                )
                Text(
                    text = category.displayName.uppercase(),
                    style = MaterialTheme.typography.labelSmall,
                    color = TextHighEmphasis,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }

            Surface(
                color = ObsidianSurface,
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.border(1.dp, BorderHairline, RoundedCornerShape(10.dp))
            ) {
                Text(
                    text = "$count ${if (count == 1) "task" else "tasks"}",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMediumEmphasis,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                    fontSize = 10.sp
                )
            }
        }
    }
}

@Composable
fun TaskCard(
    task: Task,
    onCardClicked: () -> Unit,
    onReviewApproval: () -> Unit
) {
    Surface(
        color = CardSurface,
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, BorderHairline, RoundedCornerShape(8.dp))
            .clip(RoundedCornerShape(8.dp))
            .clickable { onCardClicked() }
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = task.siteName.uppercase(),
                        style = MaterialTheme.typography.labelSmall,
                        color = ImperialGoldPrimary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    CategoryBadge(category = task.category)
                }

                TaskStateBadge(status = task.status)
            }

            Text(
                text = task.title,
                style = MaterialTheme.typography.titleMedium,
                color = TextHighEmphasis,
                fontWeight = FontWeight.SemiBold
            )

            Text(
                text = task.description,
                style = MaterialTheme.typography.bodySmall,
                color = TextMediumEmphasis,
                maxLines = 2
            )

            Divider(color = BorderHairline, thickness = 1.dp)

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Created: ${task.createdDate}",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextDisabled,
                    fontSize = 10.sp
                )

                if (task.status == TaskState.AWAITING_APPROVAL) {
                    Button(
                        onClick = onReviewApproval,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = StatusWarning,
                            contentColor = ObsidianSurface
                        ),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        modifier = Modifier.height(28.dp)
                    ) {
                        Text("Review Approval", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                } else if (task.executionResult != null) {
                    Text(
                        text = "Result Available ✓",
                        style = MaterialTheme.typography.labelSmall,
                        color = StatusSuccess
                    )
                }
            }
        }
    }
}

@Composable
fun CategoryBadge(category: TaskCategory) {
    val categoryColor = getCategoryColor(category)
    Surface(
        color = categoryColor.copy(alpha = 0.15f),
        shape = RoundedCornerShape(4.dp),
        modifier = Modifier.border(1.dp, categoryColor.copy(alpha = 0.35f), RoundedCornerShape(4.dp))
    ) {
        Text(
            text = category.displayName.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = categoryColor,
            fontSize = 9.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 5.dp, vertical = 1.dp)
        )
    }
}

fun getCategoryColor(category: TaskCategory): Color {
    return when (category) {
        TaskCategory.SECURITY -> StatusError       // Rose
        TaskCategory.MAINTENANCE -> StatusWarning   // Amber
        TaskCategory.CONTENT -> Color(0xFFA855F7)   // Purple
        TaskCategory.SEO -> StatusRunning          // Blue
        TaskCategory.PERFORMANCE -> StatusSuccess  // Emerald
        TaskCategory.GENERAL -> TextMediumEmphasis // Gray
    }
}

@Composable
fun TaskStateBadge(status: TaskState) {
    val (color, label) = when (status) {
        TaskState.DRAFT -> TextDisabled to "Draft"
        TaskState.PLANNED -> TextMediumEmphasis to "Planned"
        TaskState.AWAITING_APPROVAL -> StatusWarning to "Awaiting Approval"
        TaskState.RUNNING -> StatusRunning to "Running"
        TaskState.COMPLETED -> StatusSuccess to "Completed"
        TaskState.FAILED -> StatusError to "Failed"
        TaskState.CANCELLED -> TextDisabled to "Cancelled"
    }

    Surface(
        color = color.copy(alpha = 0.15f),
        shape = RoundedCornerShape(4.dp),
        modifier = Modifier.border(1.dp, color.copy(alpha = 0.4f), RoundedCornerShape(4.dp))
    ) {
        Text(
            text = label.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = color,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
        )
    }
}

@Composable
fun TaskDetailsDialog(
    task: Task,
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
                    .padding(20.dp)
                    .fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "TASK INSPECTOR",
                        style = MaterialTheme.typography.labelSmall,
                        color = ImperialGoldPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    TaskStateBadge(status = task.status)
                }

                Text(
                    text = task.title,
                    style = MaterialTheme.typography.titleMedium,
                    color = TextHighEmphasis,
                    fontWeight = FontWeight.Bold
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Bound Site: ${task.siteName}",
                        style = MaterialTheme.typography.bodySmall,
                        color = ImperialGoldPrimary
                    )
                    CategoryBadge(category = task.category)
                }

                Text(
                    text = task.description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextMediumEmphasis
                )

                Divider(color = BorderHairline, thickness = 1.dp)

                if (task.executionResult != null) {
                    Text(
                        text = "EXECUTION RESULT",
                        style = MaterialTheme.typography.labelSmall,
                        color = StatusSuccess,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = task.executionResult.summary,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextHighEmphasis
                    )

                    Surface(
                        color = ObsidianSurface,
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            task.executionResult.logs.forEach { log ->
                                Text(
                                    text = "> $log",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TextMediumEmphasis,
                                    fontSize = 10.sp
                                )
                            }
                        }
                    }
                } else {
                    Text(
                        text = "No execution result recorded yet.",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextDisabled
                    )
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = onDismiss) {
                        Text("Close", color = ImperialGoldPrimary)
                    }
                }
            }
        }
    }
}
