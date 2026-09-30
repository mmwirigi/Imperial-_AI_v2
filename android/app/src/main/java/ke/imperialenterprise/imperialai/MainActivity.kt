package ke.imperialenterprise.imperialai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import ke.imperialenterprise.imperialai.domain.model.DangerousActionType
import ke.imperialenterprise.imperialai.ui.chat.ChatScreen
import ke.imperialenterprise.imperialai.ui.chat.ChatViewModel
import ke.imperialenterprise.imperialai.ui.home.HomeScreen
import ke.imperialenterprise.imperialai.ui.home.HomeViewModel
import ke.imperialenterprise.imperialai.ui.models.ModelCenterScreen
import ke.imperialenterprise.imperialai.ui.models.ModelCenterViewModel
import ke.imperialenterprise.imperialai.ui.navigation.ImperialBottomNavigationBar
import ke.imperialenterprise.imperialai.ui.navigation.Screen
import ke.imperialenterprise.imperialai.ui.settings.SettingsScreen
import ke.imperialenterprise.imperialai.ui.settings.SettingsViewModel
import ke.imperialenterprise.imperialai.ui.sites.SitesScreen
import ke.imperialenterprise.imperialai.ui.sites.SitesViewModel
import ke.imperialenterprise.imperialai.ui.tasks.TasksScreen
import ke.imperialenterprise.imperialai.ui.tasks.TasksViewModel
import ke.imperialenterprise.imperialai.ui.theme.ImperialAITheme
import ke.imperialenterprise.imperialai.ui.theme.ObsidianSurface

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val app = application as ImperialAiApplication

        setContent {
            ImperialAITheme {
                ImperialAiApp(app)
            }
        }
    }
}

@Composable
fun ImperialAiApp(app: ImperialAiApplication) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: Screen.Home.route

    // Create or retrieve ViewModels with app repositories and Phase 2 AI providers
    val homeViewModel = viewModel {
        HomeViewModel(
            app.siteRepository,
            app.taskRepository,
            app.auditLogger,
            app.credentialStore,
            app.modelRepository
        )
    }
    val sitesViewModel = viewModel {
        SitesViewModel(
            app.siteRepository,
            app.mcpServerRepository,
            app.mcpManager,
            app.mcpCredentialManager,
            app.toolRegistry,
            app.wordPressAdapter
        )
    }
    val tasksViewModel = viewModel {
        TasksViewModel(app.taskRepository, app.siteRepository)
    }
    val chatViewModel = viewModel {
        ChatViewModel(
            app.siteRepository,
            app.conversationRepository,
            app.aiProvider,
            app.modelRepository,
            app.credentialStore,
            app.mcpManager,
            app.toolRegistry,
            app.agentEngine
        )
    }
    val settingsViewModel = viewModel {
        SettingsViewModel(
            app.credentialStore,
            app.aiProvider,
            app.modelRepository
        )
    }
    val modelCenterViewModel = viewModel {
        ModelCenterViewModel(app.modelRepository)
    }

    Scaffold(
        containerColor = ObsidianSurface,
        bottomBar = {
            ImperialBottomNavigationBar(
                currentRoute = currentRoute,
                onNavigateToRoute = { route ->
                    navController.navigate(route) {
                        popUpTo(Screen.Home.route) { saveState = true }
                        launchSingleTop = true
                        restoreState = true
                    }
                }
            )
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = innerPadding.calculateBottomPadding())
        ) {
            composable(Screen.Home.route) {
                HomeScreen(
                    viewModel = homeViewModel,
                    onNavigateToSites = { navController.navigate(Screen.Sites.route) },
                    onNavigateToTasks = { navController.navigate(Screen.Tasks.route) },
                    onNavigateToChat = { navController.navigate(Screen.Chat.route) },
                    onNavigateToSettings = { navController.navigate(Screen.Settings.route) },
                    onTriggerAuditAction = {
                        val activeSite = chatViewModel.uiState.value.activeSite
                        if (activeSite != null) {
                            tasksViewModel.createQuickTask(
                                site = activeSite,
                                title = "On-Demand Site Audit",
                                description = "Triggered from Quick Actions: inspect core vitals and schema",
                                actionType = DangerousActionType.READ_ONLY_AUDIT
                            )
                            navController.navigate(Screen.Tasks.route)
                        } else {
                            navController.navigate(Screen.Sites.route)
                        }
                    }
                )
            }

            composable(Screen.Sites.route) {
                SitesScreen(
                    viewModel = sitesViewModel,
                    onSiteSelectedForChat = { site ->
                        chatViewModel.selectActiveSite(site)
                        navController.navigate(Screen.Chat.route)
                    }
                )
            }

            composable(Screen.Tasks.route) {
                TasksScreen(
                    viewModel = tasksViewModel
                )
            }

            composable(Screen.Chat.route) {
                ChatScreen(
                    viewModel = chatViewModel,
                    onNavigateToSettings = { navController.navigate(Screen.Settings.route) }
                )
            }

            composable(Screen.Settings.route) {
                SettingsScreen(
                    viewModel = settingsViewModel,
                    onNavigateToModelCenter = { navController.navigate(Screen.ModelCenter.route) }
                )
            }

            composable(Screen.ModelCenter.route) {
                ModelCenterScreen(
                    viewModel = modelCenterViewModel,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
    }
}
