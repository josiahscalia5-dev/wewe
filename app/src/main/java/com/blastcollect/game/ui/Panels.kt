package com.blastcollect.game.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import com.blastcollect.game.art.ArtLibrary

/** Modal panel in the Home style; the bottom area stays clear so the nav bar is usable. */
@Composable
private fun HomePanel(
    tag: String,
    onDismiss: () -> Unit,
    blockNav: Boolean,
    content: @Composable (Dp, (Float) -> TextUnit) -> Unit,
) {
    BoxWithConstraints(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing)) {
        val density = LocalDensity.current
        val wPx = constraints.maxWidth.toFloat()
        val ts: (Float) -> TextUnit = { f -> with(density) { (wPx * f).toSp() } }
        val sw = maxWidth
        val sh = maxHeight
        val navTop = sh * (LayoutSpec.Home.navBar.cy) - sw * (LayoutSpec.Home.navBar.h / 2f)
        Box(
            Modifier.fillMaxWidth()
                .size(sw, if (blockNav) sh else navTop)
                .background(Color(0xB3030612))
                .clickable(remember { MutableInteractionSource() }, indication = null, onClick = onDismiss)
                .testTag(tag),
            contentAlignment = Alignment.Center,
        ) {
            Box(
                Modifier.width(sw * 0.84f)
                    .clickable(remember { MutableInteractionSource() }, indication = null) {},
                contentAlignment = Alignment.Center,
            ) {
                Canvas(Modifier.matchParentSize()) { hudPanel(radiusFraction = 0.08f) }
                Column(
                    Modifier.fillMaxWidth().padding(vertical = sw * 0.06f, horizontal = sw * 0.06f),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(sw * 0.04f),
                ) { content(sw, ts) }
            }
        }
    }
}

@Composable
fun SettingsPanel(
    sound: Boolean,
    music: Boolean,
    vibration: Boolean,
    onSound: (Boolean) -> Unit,
    onMusic: (Boolean) -> Unit,
    onVibration: (Boolean) -> Unit,
    onClose: () -> Unit,
) {
    HomePanel("settings_panel", onClose, blockNav = true) { w, ts ->
        OutlinedText("SETTINGS", ts(0.1f), Fonts.hud, FontWeight.ExtraBold, outlineWidth = 4f)
        ToggleRow("Sound", sound, w, ts(0.062f), "toggle_sound", onSound)
        ToggleRow("Music", music, w, ts(0.062f), "toggle_music", onMusic)
        ToggleRow("Vibration", vibration, w, ts(0.062f), "toggle_vibration", onVibration)
        GameButton("CLOSE", ButtonStyle.GREEN, w * 0.5f, w * 0.13f, ts(0.06f), "close_settings", onClose)
    }
}

@Composable
private fun ToggleRow(label: String, on: Boolean, w: Dp, textSize: TextUnit, tag: String, onChange: (Boolean) -> Unit) {
    Row(
        Modifier.fillMaxWidth()
            .clip(RoundedCornerShape(30))
            .clickable(remember { MutableInteractionSource() }, indication = null) { onChange(!on) }
            .semantics {
                role = Role.Switch
                contentDescription = label
                stateDescription = if (on) "on" else "off"
            }
            .testTag(tag)
            .padding(horizontal = w * 0.02f, vertical = w * 0.012f),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        OutlinedText(label, textSize, Fonts.rounded, FontWeight.SemiBold, align = TextAlign.Start)
        Canvas(Modifier.size(w * 0.2f, w * 0.1f)) {
            val r = CornerRadius(size.height / 2f)
            val track = if (on) Brush.horizontalGradient(listOf(Palette.segmentLitDeep, Palette.segmentLit)) else Brush.horizontalGradient(listOf(Palette.segmentOff, Palette.segmentOff))
            drawRoundRect(track, cornerRadius = r)
            if (on) neonRoundRect(Brush.linearGradient(listOf(Palette.neonCyan, Palette.neonCyan)), Offset.Zero, size, size.height / 2f, size.height * 0.05f, glowAlpha = 0.4f)
            val kr = size.height * 0.4f
            val cx = if (on) size.width - size.height / 2f else size.height / 2f
            drawCircle(Color.Black.copy(alpha = 0.3f), kr, Offset(cx, size.height / 2f + kr * 0.12f))
            drawCircle(Brush.verticalGradient(listOf(Color.White, Color(0xFFCFD8E8))), kr, Offset(cx, size.height / 2f))
        }
    }
}

@Composable
fun ComingSoonPanel(tab: HomeTab, art: ArtLibrary, onBack: () -> Unit) {
    HomePanel("coming_soon_${tab.name.lowercase()}", onBack, blockNav = false) { w, ts ->
        ArtImage(art, tab.icon, Modifier.size(w * 0.22f))
        OutlinedText(tab.label.uppercase(), ts(0.1f), Fonts.hud, FontWeight.ExtraBold, outlineWidth = 4f)
        OutlinedText("Coming soon", ts(0.06f), Fonts.rounded, FontWeight.SemiBold, color = Color(0xFFBFE9FF))
        GameButton("BACK TO HOME", ButtonStyle.CYAN, w * 0.62f, w * 0.13f, ts(0.052f), "back_home", onBack)
    }
}
