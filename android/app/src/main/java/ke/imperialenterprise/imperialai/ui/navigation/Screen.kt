package ke.imperialenterprise.imperialai.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.SmartToy
import androidx.compose.material.icons.filled.Task
import androidx.compose.ui.graphics.vector.ImageVector

/**
 * Primary navigation routes for IMPERIAL AI WordPress Command Center.
 */
sealed class Screen(
    val route: String,
    val title: String,
    val icon: ImageVector
) {
    object Home : Screen("home", "Home", Icons.Default.Dashboard)
    object Sites : Screen("sites", "Sites", Icons.Default.Layers)
    object Tasks : Screen("tasks", "Tasks", Icons.Default.Task)
    object Chat : Screen("chat", "Chat", Icons.Default.Chat)
    object Settings : Screen("settings", "Settings", Icons.Default.Settings)
    object ModelCenter : Screen("model_center", "AI Models", Icons.Default.SmartToy)

    companion object {
        val items = listOf(Home, Sites, Tasks, Chat, Settings)
    }
}
