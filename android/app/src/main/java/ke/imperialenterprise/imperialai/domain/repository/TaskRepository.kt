package ke.imperialenterprise.imperialai.domain.repository

import ke.imperialenterprise.imperialai.domain.model.Task
import ke.imperialenterprise.imperialai.domain.model.TaskState
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface for operational tasks.
 * All tasks are scoped to their respective siteId.
 */
interface TaskRepository {
    fun getAllTasks(): Flow<List<Task>>
    fun getTasksBySite(siteId: String): Flow<List<Task>>
    suspend fun getTaskById(taskId: String): Task?
    suspend fun createTask(task: Task)
    suspend fun updateTaskStatus(taskId: String, status: TaskState)
    suspend fun updateTask(task: Task)
    suspend fun deleteTask(taskId: String)
}
