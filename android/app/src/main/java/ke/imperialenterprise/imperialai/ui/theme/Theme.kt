package ke.imperialenterprise.imperialai.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = ImperialGoldPrimary,
    onPrimary = ObsidianSurface,
    primaryContainer = ImperialGoldMuted,
    onPrimaryContainer = ImperialGoldLight,
    secondary = TextMediumEmphasis,
    onSecondary = ObsidianSurface,
    background = ObsidianSurface,
    onBackground = TextHighEmphasis,
    surface = CardSurface,
    onSurface = TextHighEmphasis,
    surfaceVariant = ElevatedSurface,
    onSurfaceVariant = TextMediumEmphasis,
    outline = BorderHairline,
    error = StatusError
)

@Composable
fun ImperialAITheme(
    content: @Composable () -> Unit
) {
    val colorScheme = DarkColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window
            if (window != null) {
                window.statusBarColor = ObsidianSurface.toArgb()
                window.navigationBarColor = ObsidianSurface.toArgb()
                WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
