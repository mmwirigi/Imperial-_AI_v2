package ke.imperialenterprise.imperialai.ui.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import ke.imperialenterprise.imperialai.domain.model.*
import ke.imperialenterprise.imperialai.domain.repository.SiteRepository
import ke.imperialenterprise.imperialai.domain.repository.TaskRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class TasksUiState(
    val tasks: List<Task> = emptyList(),
    val groupedTasks: Map<TaskCategory, List<Task>> = emptyMap(),
    val sites: List<Site> = emptyList(),
    val selectedFilterState: TaskState? = null,
    val selectedFilterCategory: TaskCategory? = null,
    val selectedSiteFilterId: String? = null,
    val selectedTaskForDetails: Task? = null,
    val pendingApprovalTask: Task? = null
)

class TasksViewModel(
    private val taskRepository: TaskRepository,
    private val siteRepository: SiteRepository
) : ViewModel() {

    private val _filterState = MutableStateFlow<TaskState?>(null)
    private val _filterCategory = MutableStateFlow<TaskCategory?>(null)
    private val _filterSiteId = MutableStateFlow<String?>(null)
    private val _selectedTaskForDetails = MutableStateFlow<Task?>(null)
    private val _pendingApprovalTask = MutableStateFlow<Task?>(null)

    val uiState: StateFlow<TasksUiState> = combine(
        taskRepository.getAllTasks(),
        siteRepository.getSites(),
        _filterState,
        _filterCategory,
        _filterSiteId
    ) { tasks, sites, stateFilter, categoryFilter, siteFilter ->
        val filtered = tasks.filter { task ->
            (stateFilter == null || task.status == stateFilter) &&
            (categoryFilter == null || task.category == categoryFilter) &&
            (siteFilter == null || task.siteId == siteFilter)
        }

        // Group tasks by category preserving a clean logical order
        val grouped = filtered.groupBy { it.category }

        TasksUiState(
            tasks = filtered,
            groupedTasks = grouped,
            sites = sites,
            selectedFilterState = stateFilter,
            selectedFilterCategory = categoryFilter,
            selectedSiteFilterId = siteFilter,
            selectedTaskForDetails = _selectedTaskForDetails.value,
            pendingApprovalTask = _pendingApprovalTask.value
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = TasksUiState()
    )

    fun setFilterState(state: TaskState?) {
        _filterState.value = state
    }

    fun setFilterCategory(category: TaskCategory?) {
        _filterCategory.value = category
    }

    fun setFilterSite(siteId: String?) {
        _filterSiteId.value = siteId
    }

    fun selectTaskForDetails(task: Task?) {
        _selectedTaskForDetails.value = task
    }

    fun promptApproval(task: Task) {
        _pendingApprovalTask.value = task
    }

    fun dismissApproval() {
        _pendingApprovalTask.value = null
    }

    fun approveTask(task: Task) {
        viewModelScope.launch {
            taskRepository.updateTask(
                task.copy(
                    status = TaskState.RUNNING,
                    approvalRequirement = ApprovalRequirement.APPROVED,
                    updatedDate = "Just now"
                )
            )
            _pendingApprovalTask.value = null
        }
    }

    fun rejectTask(task: Task) {
        viewModelScope.launch {
            taskRepository.updateTask(
                task.copy(
                    status = TaskState.CANCELLED,
                    approvalRequirement = ApprovalRequirement.REJECTED,
                    updatedDate = "Just now"
                )
            )
            _pendingApprovalTask.value = null
        }
    }

    fun createQuickTask(
        site: Site,
        title: String,
        description: String,
        actionType: DangerousActionType,
        category: TaskCategory = TaskCategory.GENERAL
    ) {
        viewModelScope.launch {
            val newTask = Task(
                title = title,
                description = description,
                siteId = site.id,
                siteName = site.siteName,
                category = category,
                createdDate = "Just now",
                updatedDate = "Just now",
                status = if (actionType == DangerousActionType.READ_ONLY_AUDIT) TaskState.PLANNED else TaskState.AWAITING_APPROVAL,
                requestedAction = actionType.name.lowercase(),
                dangerousActionType = actionType,
                approvalRequirement = if (actionType == DangerousActionType.READ_ONLY_AUDIT) ApprovalRequirement.NONE else ApprovalRequirement.REQUIRED
            )
            taskRepository.createTask(newTask)
        }
    }
}
