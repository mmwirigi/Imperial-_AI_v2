package ke.imperialenterprise.imperialai.data.repository

import ke.imperialenterprise.imperialai.data.sample.SampleData
import ke.imperialenterprise.imperialai.domain.model.Task
import ke.imperialenterprise.imperialai.domain.model.TaskState
import ke.imperialenterprise.imperialai.domain.repository.TaskRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map

/**
 * In-memory implementation of TaskRepository.
 * Enforces per-site task filtering and lifecycle updates.
 */
class InMemoryTaskRepository : TaskRepository {

    private val _tasks = MutableStateFlow<List<Task>>(SampleData.demoTasks)

    override fun getAllTasks(): Flow<List<Task>> = _tasks.asStateFlow()

    override fun getTasksBySite(siteId: String): Flow<List<Task>> {
        return _tasks.map { tasks -> tasks.filter { it.siteId == siteId } }
    }

    override suspend fun getTaskById(taskId: String): Task? {
        return _tasks.value.find { it.id == taskId }
    }

    override suspend fun createTask(task: Task) {
        _tasks.value = listOf(task) + _tasks.value
    }

    override suspend fun updateTaskStatus(taskId: String, status: TaskState) {
        _tasks.value = _tasks.value.map {
            if (it.id == taskId) it.copy(status = status, updatedDate = "Just now") else it
        }
    }

    override suspend fun updateTask(task: Task) {
        _tasks.value = _tasks.value.map { if (it.id == task.id) task else it }
    }

    override suspend fun deleteTask(taskId: String) {
        _tasks.value = _tasks.value.filterNot { it.id == taskId }
    }
}
