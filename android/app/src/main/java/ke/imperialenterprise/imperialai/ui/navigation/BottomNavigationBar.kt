package ke.imperialenterprise.imperialai.ui.navigation

import androidx.compose.foundation.border
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import ke.imperialenterprise.imperialai.ui.theme.BorderHairline
import ke.imperialenterprise.imperialai.ui.theme.ImperialGoldPrimary
import ke.imperialenterprise.imperialai.ui.theme.ObsidianSurface
import ke.imperialenterprise.imperialai.ui.theme.TextMediumEmphasis

@Composable
fun ImperialBottomNavigationBar(
    currentRoute: String,
    onNavigateToRoute: (String) -> Unit
) {
    NavigationBar(
        containerColor = ObsidianSurface,
        modifier = Modifier.border(width = 1.dp, color = BorderHairline),
        tonalElevation = 0.dp
    ) {
        Screen.items.forEach { screen ->
            val isSelected = currentRoute == screen.route
            NavigationBarItem(
                selected = isSelected,
                onClick = { onNavigateToRoute(screen.route) },
                icon = {
                    Icon(
                        imageVector = screen.icon,
                        contentDescription = screen.title
                    )
                },
                label = {
                    Text(
                        text = screen.title,
                        style = MaterialTheme.typography.bodyMedium
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = ImperialGoldPrimary,
                    selectedTextColor = ImperialGoldPrimary,
                    unselectedIconColor = TextMediumEmphasis,
                    unselectedTextColor = TextMediumEmphasis,
                    indicatorColor = ObsidianSurface
                )
            )
        }
    }
}
