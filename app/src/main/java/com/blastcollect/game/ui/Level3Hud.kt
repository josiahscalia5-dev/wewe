package com.blastcollect.game.ui

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.TextUnit
import com.blastcollect.game.art.ArtLibrary
import com.blastcollect.game.game.HudState

/** Level 3 HUD from reference/2376.png: every panel drawn in code, icons from /art. */
@Composable
fun Level3Hud(hud: HudState, art: ArtLibrary, onPause: () -> Unit) {
    val pulse = rememberInfiniteTransition(label = "hud")
    val blink by pulse.animateFloat(
        0f, 1f,
        infiniteRepeatable(tween(420), RepeatMode.Reverse),
        label = "blink",
    )
    BoxWithConstraints(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing)) {
        val L = LayoutSpec.Level3
        val density = LocalDensity.current
        val wPx = constraints.maxWidth.toFloat()
        val sw = maxWidth
        fun ts(f: Float): TextUnit = with(density) { (wPx * f).toSp() }

        // Pause button.
        Box(
            spot(L.pause)
                .clip(CircleShape)
                .clickable(remember { MutableInteractionSource() }, indication = null, onClick = onPause)
                .semantics { contentDescription = "Pause" }
                .testTag("pause"),
        ) {
            Canvas(Modifier.fillMaxSize()) {
                val r = size.minDimension / 2f
                val c = Offset(size.width / 2f, size.height / 2f)
                drawCircle(Brush.radialGradient(listOf(Color(0xF0142A55), Color(0xF0081230)), c, r), r * 0.9f, c)
                neonCircle(Palette.neonCyan, c, r * 0.9f, r * 0.085f)
                val bw = r * 0.26f
                val bh = r * 0.78f
                val gap = r * 0.2f
                val white = Brush.verticalGradient(listOf(Color.White, Color(0xFFD8E4F4)), c.y - bh / 2, c.y + bh / 2)
                for (sx in listOf(c.x - gap / 2 - bw, c.x + gap / 2)) {
                    drawRoundRect(Color.Black.copy(alpha = 0.35f), Offset(sx, c.y - bh / 2 + r * 0.05f), Size(bw, bh), CornerRadius(bw * 0.35f))
                    drawRoundRect(white, Offset(sx, c.y - bh / 2), Size(bw, bh), CornerRadius(bw * 0.35f))
                }
            }
        }

        // "LEVEL 3" pill.
        Box(spot(L.levelPill), contentAlignment = Alignment.Center) {
            Canvas(Modifier.fillMaxSize()) {
                val r = size.height * 0.2f
                drawRoundRect(Brush.verticalGradient(listOf(Color(0x7A1B3563), Color(0x80101F45))), cornerRadius = CornerRadius(r))
                drawRoundRect(Color(0x552F5C9A), cornerRadius = CornerRadius(r), style = Stroke(size.height * 0.03f))
            }
            OutlinedText("LEVEL 3", ts(0.083f), Fonts.hud, FontWeight.ExtraBold, outlineWidth = wPx * 0.006f, outline = Color(0xFF071030))
        }

        // Timer pill.
        val lowTime = hud.secondsLeft <= 10 && hud.phase == com.blastcollect.core.Phase.PLAYING
        val warn = hud.timerFlash || lowTime
        Box(spot(L.timerPill)) {
            Canvas(Modifier.fillMaxSize()) {
                val stroke = size.height * 0.045f
                val tl = Offset(stroke, stroke)
                val sz = Size(size.width - stroke * 2, size.height - stroke * 2)
                val r = sz.height * 0.36f
                drawRoundRect(Color(0xF2050914), tl, sz, CornerRadius(r))
                val border = if (warn) Brush.linearGradient(listOf(Palette.neonRed, Palette.neonRed)) else Palette.timerBorder
                neonRoundRect(border, tl, sz, r, stroke, glowAlpha = if (warn) 0.4f + 0.5f * blink else 0.45f)
            }
            ArtImage(
                art, "icon_stopwatch",
                Modifier.offset(x = sw * (L.timerPill.w * 0.05f), y = sw * (L.timerPill.h * 0.14f))
                    .size(sw * (L.timerPill.h * 0.72f)),
            )
            val secs = hud.secondsLeft.coerceAtLeast(0)
            val label = "%02d:%02d".format(secs / 60, secs % 60)
            val scale = if (lowTime) 1f + 0.07f * blink else 1f
            OutlinedText(
                label, ts(0.07f), Fonts.hud, FontWeight.ExtraBold,
                modifier = Modifier.align(Alignment.CenterEnd)
                    .offset(x = -sw * (L.timerPill.w * 0.1f))
                    .scale(scale),
                color = if (warn) Color(0xFFFF4D4D).copy(alpha = 0.65f + 0.35f * blink) else Color.White,
                outlineWidth = wPx * 0.005f,
            )
        }

        // Objective panel.
        Box(spot(L.objectivePanel)) {
            val pw = sw * L.objectivePanel.w
            val ph = sw * L.objectivePanel.h
            val lit = hud.kills * 5f / hud.required
            Canvas(Modifier.fillMaxSize()) {
                hudPanel()
                segments(
                    count = 5, lit = lit,
                    left = size.width * L.objSegLeft, top = size.height * L.objSegTop,
                    segW = size.width * L.objSegW, segH = size.height * L.objSegH, gap = size.width * L.objSegGap,
                )
            }
            ArtImage(
                art, "icon_drone",
                Modifier.offset(x = pw * (L.objIconCx - L.objIconSize / 2f), y = ph / 2 - pw * (L.objIconSize / 2f))
                    .size(pw * L.objIconSize),
            )
            OutlinedText(
                "SHOOT THE RED DRONES", ts(L.objectivePanel.w * L.objTitleSize), Fonts.hud, FontWeight.Bold,
                modifier = Modifier.offset(x = pw * L.objTitleLeft, y = ph * L.objTitleTop),
                align = TextAlign.Start, outlineWidth = wPx * 0.004f,
            )
            OutlinedText(
                "${hud.kills}/${hud.required}", ts(L.objectivePanel.w * L.objCountSize), Fonts.hud, FontWeight.ExtraBold,
                modifier = Modifier.align(Alignment.CenterEnd).offset(x = -pw * (1f - L.objCountRight), y = ph * 0.12f)
                    .semantics { contentDescription = "objective ${hud.kills} of ${hud.required}" },
                outlineWidth = wPx * 0.005f,
            )
        }

        // Weapon panel.
        Box(spot(L.weaponPanel)) {
            val pw = sw * L.weaponPanel.w
            val ph = sw * L.weaponPanel.h
            Canvas(Modifier.fillMaxSize()) {
                val flash = hud.overheated
                hudPanel(
                    rimBrush = if (flash) Brush.linearGradient(listOf(Color(0xFFFF6A2A), Palette.neonRed))
                    else Brush.linearGradient(listOf(Palette.neonCyan, Palette.neonCyanSoft)),
                    rimAlpha = if (flash) 0.5f + 0.5f * blink else 1f,
                )
                val segW = size.width * L.wpnSegW
                segments(
                    count = hud.chargeSegments, lit = hud.charge.toFloat(),
                    left = size.width * L.wpnSegLeft, top = size.height * (0.5f - L.wpnSegH / 2f) + size.height * 0.04f,
                    segW = segW, segH = size.height * L.wpnSegH, gap = size.width * L.wpnSegGap,
                    litColors = if (flash) listOf(Color(0xFFFF8A3A), Color(0xFFE0301E)) else listOf(Color(0xFF3FD8FF), Color(0xFF1E8BEA)),
                    offColor = Color(0xFF4A5570),
                )
            }
            ArtImage(
                art, "icon_blaster",
                Modifier.offset(x = pw * 0.05f, y = ph * 0.2f)
                    .size(width = pw * 0.24f, height = ph * 0.6f),
            )
            OutlinedText(
                "∞", ts(L.weaponPanel.w * 0.155f), Fonts.rounded, FontWeight.Bold,
                modifier = Modifier.offset(x = pw * L.wpnInfLeft, y = ph * 0.12f),
                outlineWidth = 0f,
            )
        }

        // Coin panel.
        Box(spot(L.coinPanel)) {
            val pw = sw * L.coinPanel.w
            val ph = sw * L.coinPanel.h
            Canvas(Modifier.fillMaxSize()) {
                hudPanel(rimBrush = Brush.linearGradient(listOf(Palette.neonCyan, Palette.neonCyanSoft)))
            }
            ArtImage(
                art, "icon_coin_star",
                Modifier.offset(x = pw * (L.coinIconCx - L.coinIconSize / 2f), y = ph / 2 - pw * (L.coinIconSize / 2f))
                    .size(pw * L.coinIconSize),
            )
            OutlinedText(
                "+${hud.coins}", ts(L.coinPanel.w * 0.26f), Fonts.hud, FontWeight.ExtraBold,
                modifier = Modifier.align(Alignment.CenterStart).offset(x = pw * L.coinTextLeft)
                    .semantics { contentDescription = "coins ${hud.coins}" },
                align = TextAlign.Start, outlineWidth = wPx * 0.005f,
            )
        }
    }
}
