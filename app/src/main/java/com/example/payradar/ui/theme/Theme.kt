package com.example.payradar.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat
import com.example.payradar.model.AppTheme

private val DarkColorScheme = darkColorScheme(
    primary = IndigoPrimary,
    onPrimary = LightSurface,
    primaryContainer = IndigoSoftDark,
    onPrimaryContainer = DarkText,
    secondary = IndigoPrimary,
    onSecondary = LightSurface,
    background = DarkBackground,
    onBackground = DarkText,
    surface = DarkSurface,
    onSurface = DarkText,
    surfaceVariant = DarkBorder,
    onSurfaceVariant = DarkTextSoft,
    outline = DarkBorder,
    error = DangerDark,
    onError = LightSurface
)

private val LightColorScheme = lightColorScheme(
    primary = IndigoPrimaryDark,
    onPrimary = LightSurface,
    primaryContainer = IndigoSoft,
    onPrimaryContainer = IndigoPrimaryDark,
    secondary = IndigoPrimary,
    onSecondary = LightSurface,
    background = LightBackground,
    onBackground = LightText,
    surface = LightSurface,
    onSurface = LightText,
    surfaceVariant = LightBorder,
    onSurfaceVariant = LightTextSoft,
    outline = LightBorder,
    error = Danger,
    onError = LightSurface
)

@Composable
fun PayRadarTheme(
    appTheme: AppTheme = AppTheme.AUTO,
    content: @Composable () -> Unit
) {
    val darkTheme = when (appTheme) {
        AppTheme.AUTO -> isSystemInDarkTheme()
        AppTheme.LIGHT -> false
        AppTheme.DARK -> true
    }

    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window
            if (window != null) {
                window.statusBarColor = colorScheme.surface.toArgb()
                window.navigationBarColor = colorScheme.surface.toArgb()
                WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
                WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
