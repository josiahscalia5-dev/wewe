package com.blastcollect.game.ui

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import com.blastcollect.game.art.ArtLibrary

enum class ButtonStyle { GREEN, CYAN, DISABLED }

/** Glossy pill button in the PLAY NOW / HUD panel style. */
@Composable
fun GameButton(
    text: String,
    style: ButtonStyle,
    width: Dp,
    height: Dp,
    textSize: TextUnit,
    tag: String,
    onClick: () -> Unit,
    subtitle: String? = null,
    subtitleSize: TextUnit = textSize,
) {
    val enabled = style != ButtonStyle.DISABLED
    Box(
        Modifier.size(width, height)
            .clip(RoundedCornerShape(50))
            .then(
                if (enabled) Modifier.clickable(remember { MutableInteractionSource() }, indication = null, onClick = onClick) else Modifier,
            )
            .semantics { contentDescription = text }
            .testTag(tag),
        contentAlignment = Alignment.Center,
    ) {
        Canvas(Modifier.fillMaxSize()) {
            val r = CornerRadius(size.height / 2f)
            when (style) {
                ButtonStyle.GREEN -> {
                    drawRoundRect(Palette.playGreenRim, cornerRadius = r)
                    val inset = size.height * 0.06f
                    drawRoundRect(
                        Brush.verticalGradient(listOf(Palette.playGreenTop, Palette.playGreenMid, Palette.playGreenBottom)),
                        Offset(inset, inset), Size(size.width - inset * 2, size.height - inset * 2), CornerRadius(size.height / 2f - inset),
                    )
                    drawRoundRect(
                        Brush.verticalGradient(listOf(Color.White.copy(alpha = 0.45f), Color.Transparent)),
                        Offset(size.height * 0.3f, inset * 1.6f), Size(size.width - size.height * 0.6f, size.height * 0.34f),
                        CornerRadius(size.height * 0.2f),
                    )
                }
                ButtonStyle.CYAN, ButtonStyle.DISABLED -> {
                    val stroke = size.height * 0.05f
                    val tl = Offset(stroke, stroke)
                    val sz = Size(size.width - stroke * 2, size.height - stroke * 2)
                    drawRoundRect(Color(0xF00B1636), tl, sz, CornerRadius(sz.height / 2f))
                    val c = if (enabled) Palette.neonCyan else Color(0xFF55607A)
                    neonRoundRect(Brush.linearGradient(listOf(c, c)), tl, sz, sz.height / 2f, stroke, glowAlpha = if (enabled) 0.45f else 0f)
                }
            }
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            OutlinedText(
                text, textSize, Fonts.rounded, FontWeight.Bold,
                color = if (enabled) Color.White else Color(0xFF8A94AC),
                outline = if (style == ButtonStyle.GREEN) Color(0xFF0B4A12) else Color(0xFF071030),
                outlineWidth = if (style == ButtonStyle.GREEN) with(LocalDensity.current) { textSize.toPx() * 0.12f } else 0f,
            )
            if (subtitle != null) {
                OutlinedText(subtitle, subtitleSize, Fonts.rounded, FontWeight.Medium, color = Color(0xFF8A94AC), shadow = false)
            }
        }
    }
}

/** Centered panel used by the pause / complete / failed overlays (no reference exists). */
@Composable
private fun OverlayPanel(title: String, titleColor: Color, tag: String, content: @Composable (Dp, (Float) -> TextUnit) -> Unit) {
    BoxWithConstraints(
        Modifier.fillMaxSize()
            .background(Color(0xB3030612))
            .clickable(remember { MutableInteractionSource() }, indication = null) {}
            .windowInsetsPadding(WindowInsets.safeDrawing)
            .testTag(tag),
        contentAlignment = Alignment.Center,
    ) {
        val density = LocalDensity.current
        val wPx = constraints.maxWidth.toFloat()
        val ts: (Float) -> TextUnit = { f -> with(density) { (wPx * f).toSp() } }
        val sw = maxWidth
        val panelW = sw * 0.84f
        Box(Modifier.width(panelW), contentAlignment = Alignment.Center) {
            Canvas(Modifier.matchParentSize()) { hudPanel(radiusFraction = 0.08f) }
            Column(
                Modifier.fillMaxWidth().padding(vertical = sw * 0.07f, horizontal = sw * 0.05f),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(sw * 0.035f),
            ) {
                OutlinedText(title, ts(0.11f), Fonts.hud, FontWeight.ExtraBold, color = titleColor, outlineWidth = wPx * 0.006f)
                content(sw, ts)
            }
        }
    }
}

@Composable
fun PauseOverlay(onResume: () -> Unit, onRestart: () -> Unit, onHome: () -> Unit) {
    OverlayPanel("PAUSED", Color.White, "pause_overlay") { w, ts ->
        GameButton("RESUME", ButtonStyle.GREEN, w * 0.62f, w * 0.15f, ts(0.07f), "resume", onResume)
        GameButton("RESTART", ButtonStyle.CYAN, w * 0.62f, w * 0.13f, ts(0.058f), "restart", onRestart)
        GameButton("HOME", ButtonStyle.CYAN, w * 0.62f, w * 0.13f, ts(0.058f), "home", onHome)
    }
}

@Composable
fun CompleteOverlay(kills: Int, required: Int, coins: Int, art: ArtLibrary, onReplay: () -> Unit, onHome: () -> Unit) {
    OverlayPanel("LEVEL COMPLETE", Color(0xFF7CF25A), "complete_overlay") { w, ts ->
        OutlinedText("$kills/$required RED DRONES DOWN", ts(0.058f), Fonts.hud, FontWeight.Bold)
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
            ArtImage(art, "icon_coin_star", Modifier.size(w * 0.14f))
            Spacer(Modifier.width(w * 0.02f))
            OutlinedText(
                "+$coins", ts(0.1f), Fonts.hud, FontWeight.ExtraBold, color = Palette.gold, outlineWidth = 3f,
                modifier = Modifier.semantics { contentDescription = "earned $coins coins" },
            )
        }
        GameButton("REPLAY", ButtonStyle.GREEN, w * 0.62f, w * 0.15f, ts(0.07f), "replay", onReplay)
        GameButton("HOME", ButtonStyle.CYAN, w * 0.62f, w * 0.13f, ts(0.058f), "home", onHome)
        GameButton("NEXT", ButtonStyle.DISABLED, w * 0.62f, w * 0.15f, ts(0.058f), "next", {}, subtitle = "Coming soon", subtitleSize = ts(0.036f))
    }
}

@Composable
fun FailedOverlay(kills: Int, required: Int, onRetry: () -> Unit, onHome: () -> Unit) {
    OverlayPanel("LEVEL FAILED", Palette.neonRed, "failed_overlay") { w, ts ->
        OutlinedText("TIME'S UP — $kills/$required DRONES", ts(0.058f), Fonts.hud, FontWeight.Bold)
        GameButton("RETRY", ButtonStyle.GREEN, w * 0.62f, w * 0.15f, ts(0.07f), "retry", onRetry)
        GameButton("HOME", ButtonStyle.CYAN, w * 0.62f, w * 0.13f, ts(0.058f), "home", onHome)
    }
}

/** 3-second opening banner (brief section 5). */
@Composable
fun OpeningBanner() {
    val pulse = rememberInfiniteTransition(label = "banner")
    val k by pulse.animateFloat(0.97f, 1.03f, infiniteRepeatable(tween(600), RepeatMode.Reverse), label = "k")
    BoxWithConstraints(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing).testTag("banner")) {
        val density = LocalDensity.current
        val wPx = constraints.maxWidth.toFloat()
        fun ts(f: Float) = with(density) { (wPx * f).toSp() }
        val sw = maxWidth
        Box(
            Modifier.align(Alignment.TopCenter)
                .padding(top = maxHeight * 0.30f)
                .width(sw * 0.9f)
                .scale(k),
            contentAlignment = Alignment.Center,
        ) {
            Canvas(Modifier.matchParentSize()) {
                hudPanel(
                    rimBrush = Brush.linearGradient(listOf(Palette.neonRed, Color(0xFFFF8A2A), Palette.neonRed)),
                    radiusFraction = 0.12f,
                )
            }
            Column(
                Modifier.padding(vertical = sw * 0.045f, horizontal = sw * 0.04f),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                OutlinedText("SHOOT THE RED DRONES —", ts(0.068f), Fonts.hud, FontWeight.ExtraBold, outlineWidth = wPx * 0.005f)
                OutlinedText("WATCH OUT FOR THE ROBOT!", ts(0.075f), Fonts.hud, FontWeight.ExtraBold, color = Color(0xFFFF5A4A), outlineWidth = wPx * 0.005f)
                Spacer(Modifier.height(sw * 0.012f))
                OutlinedText("Hide behind cover.", ts(0.05f), Fonts.rounded, FontWeight.SemiBold, color = Color(0xFFBFE9FF))
            }
        }
    }
}

@Composable
fun LoadingScreen(label: String) {
    BoxWithConstraints(Modifier.fillMaxSize().background(Palette.night), contentAlignment = Alignment.Center) {
        val density = LocalDensity.current
        val wPx = constraints.maxWidth.toFloat()
        val pulse = rememberInfiniteTransition(label = "load")
        val a by pulse.animateFloat(0.4f, 1f, infiniteRepeatable(tween(500), RepeatMode.Reverse), label = "a")
        OutlinedText(label, with(density) { (wPx * 0.07f).toSp() }, Fonts.hud, FontWeight.ExtraBold, color = Palette.neonCyan.copy(alpha = a))
    }
}
