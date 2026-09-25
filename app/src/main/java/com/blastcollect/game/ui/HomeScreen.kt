package com.blastcollect.game.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.BoxWithConstraintsScope
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.TextUnit
import com.blastcollect.game.art.ArtLibrary
import com.blastcollect.game.debug.DebugTools
import java.text.NumberFormat
import java.util.Locale
import kotlin.math.PI
import kotlin.math.max
import kotlin.math.sin

enum class HomeTab(val label: String, val icon: String) {
    HOME("Home", "nav_home"),
    MISSIONS("Missions", "nav_missions"),
    SHOP("Shop", "nav_shop"),
    PROFILE("Profile", "nav_profile"),
}

/** Home screen reproduced from reference/2371.png. */
@Composable
fun HomeScreen(
    art: ArtLibrary,
    wallet: Int,
    tab: HomeTab,
    onTab: (HomeTab) -> Unit,
    onPlay: () -> Unit,
    onSettings: () -> Unit,
    overlay: @Composable () -> Unit,
) {
    val time = produceState(0f) {
        val start = withFrameNanos { it }
        while (true) withFrameNanos { value = (it - start) / 1e9f }
    }
    var showReference by remember { mutableStateOf(false) }

    Box(
        Modifier.fillMaxSize()
            .background(Palette.night)
            .then(DebugTools.referenceToggle { showReference = !showReference })
            .testTag("home"),
    ) {
        val bg = art["bg_home"]
        Canvas(Modifier.fillMaxSize()) { drawArt(bg, cover = true, anchorY = 0.45f) }

        BoxWithConstraints(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing)) {
            val H = LayoutSpec.Home
            val density = LocalDensity.current
            val wPx = constraints.maxWidth.toFloat()
            fun ts(f: Float): TextUnit = with(density) { (wPx * f).toSp() }

            // Sparkles twinkle behind everything else.
            H.sparkles.forEachIndexed { i, s ->
                val sp = Spot(s[0], s[1], s[2], s[2])
                Box(
                    spot(sp).graphicsLayer {
                        val t = time.value * (1.1f + (i % 4) * 0.23f) + i * 1.37f
                        val k = 0.55f + 0.45f * ((sin(t * 2.2f) + 1f) / 2f)
                        scaleX = k
                        scaleY = k
                        alpha = 0.35f + 0.65f * k
                        rotationZ = (i * 17f) % 45f
                    },
                ) { ArtImage(art, "sparkle", Modifier.fillMaxSize()) }
            }

            Creature(art, "creature_blue", H.creatureBlue, time, 0.0f, 2.6f)
            Creature(art, "creature_yellow", H.creatureYellow, time, 1.1f, 2.2f)
            Creature(art, "creature_green", H.creatureGreen, time, 2.0f, 2.9f)
            Creature(art, "creature_red", H.creatureRed, time, 0.7f, 2.4f)
            Creature(art, "creature_purple", H.creaturePurple, time, 1.6f, 2.0f)
            Creature(art, "creature_blue", H.creatureBlueSmall, time, 2.6f, 1.8f, alpha = 0.85f)

            // Hero robot: idle bob, periodic muzzle flash.
            Box(
                spot(H.heroRobot).graphicsLayer {
                    translationY = sin(time.value * 2f * PI.toFloat() / 2.4f) * wPx * 0.008f
                },
            ) { ArtImage(art, "hero_robot", Modifier.fillMaxSize()) }
            Box(
                spot(H.heroMuzzle).graphicsLayer {
                    val cycle = (time.value % 2.2f) / 2.2f
                    val f = if (cycle < 0.14f) sin(cycle / 0.14f * PI.toFloat()) else 0f
                    alpha = 0.25f + 0.75f * f
                    scaleX = 0.8f + 0.35f * f
                    scaleY = 0.8f + 0.35f * f
                    translationY = sin(time.value * 2f * PI.toFloat() / 2.4f) * wPx * 0.008f
                    transformOrigin = androidx.compose.ui.graphics.TransformOrigin(0.35f, 0.5f)
                },
            ) { ArtImage(art, "hero_muzzle_flash", Modifier.fillMaxSize()) }

            // Logo.
            Box(spot(H.logo)) { ArtImage(art, "logo_title", Modifier.fillMaxSize()) }

            // Tagline.
            val lines = listOf("A FAST-PACED", "SHOOT, COLLECT, EARN", "ADVENTURE!")
            lines.forEachIndexed { i, line ->
                OutlinedText(
                    line, ts(H.taglineSize), Fonts.hud, FontWeight.ExtraBold,
                    modifier = Modifier.fillMaxWidth().offset(y = maxHeight * H.taglineCy[i] - maxWidth * 0.052f),
                    outline = Color(0xFF0A0B24), outlineWidth = wPx * 0.012f,
                )
            }

            // PLAY NOW (pulses).
            Box(
                spot(H.playButton).graphicsLayer {
                    val k = 1f + 0.035f * ((sin(time.value * 2f * PI.toFloat() / 1.3f) + 1f) / 2f)
                    scaleX = k
                    scaleY = k
                },
                contentAlignment = Alignment.Center,
            ) {
                PlayNowButton(ts(H.playTextSize), onPlay)
            }

            // Wallet capsule + "+" + settings.
            CoinCapsule(art, wallet, ts(0.058f)) { onTab(HomeTab.SHOP) }
            Box(
                spot(H.settingsButton)
                    .clip(RoundedCornerShape(22))
                    .clickable(remember { MutableInteractionSource() }, indication = null, onClick = onSettings)
                    .semantics { contentDescription = "Settings" }
                    .testTag("settings"),
            ) {
                Canvas(Modifier.fillMaxSize()) {
                    val stroke = size.minDimension * 0.05f
                    val tl = Offset(stroke, stroke)
                    val sz = Size(size.width - stroke * 2, size.height - stroke * 2)
                    val r = sz.minDimension * 0.22f
                    drawRoundRect(Brush.verticalGradient(listOf(Color(0xF0142352), Color(0xF00A1333))), tl, sz, CornerRadius(r))
                    neonRoundRect(Brush.linearGradient(listOf(Palette.navBorder, Palette.neonCyanSoft)), tl, sz, r, stroke, glowAlpha = 0.35f)
                }
                ArtImage(art, "gear", Modifier.fillMaxSize().insetScale(0.2f))
            }

            BottomNav(art, tab, onTab, ts(H.navLabelSize))
        }

        overlay()
        DebugTools.ReferenceOverlay(showReference, "2371")
    }
}

private fun Modifier.insetScale(fraction: Float): Modifier = this.then(
    Modifier.graphicsLayer {
        scaleX = 1f - fraction * 2f
        scaleY = 1f - fraction * 2f
    },
)

@Composable
private fun BoxWithConstraintsScope.Creature(
    art: ArtLibrary,
    name: String,
    s: Spot,
    time: State<Float>,
    phase: Float,
    period: Float,
    alpha: Float = 1f,
) {
    val wPx = with(LocalDensity.current) { maxWidth.toPx() }
    Box(
        spot(s).graphicsLayer {
            val t = time.value * 2f * PI.toFloat() / period + phase
            translationY = sin(t) * wPx * 0.014f
            rotationZ = sin(t * 0.5f + 1f) * 5f
            val k = 1f + 0.03f * sin(t * 2f)
            scaleX = k
            scaleY = 2f - k
            this.alpha = alpha
        },
    ) { ArtImage(art, name, Modifier.fillMaxSize()) }
}

@Composable
private fun PlayNowButton(textSize: TextUnit, onPlay: () -> Unit) {
    Box(
        Modifier.fillMaxSize()
            .clip(RoundedCornerShape(50))
            .clickable(remember { MutableInteractionSource() }, indication = null, onClick = onPlay)
            .semantics { contentDescription = "PLAY NOW" }
            .testTag("play_now"),
        contentAlignment = Alignment.Center,
    ) {
        Canvas(Modifier.fillMaxSize()) {
            val h = size.height
            val r = CornerRadius(h / 2f)
            // Dark rim + outer glow.
            drawRoundRect(Color(0x552CFF4A), Offset(-h * 0.04f, -h * 0.02f), Size(size.width + h * 0.08f, h * 1.06f), CornerRadius(h / 2f))
            drawRoundRect(Color(0xFF0A3E10), cornerRadius = r)
            val inset = h * 0.055f
            drawRoundRect(
                Brush.verticalGradient(listOf(Palette.playGreenTop, Palette.playGreenMid, Color(0xFF1BB524), Palette.playGreenBottom)),
                Offset(inset, inset), Size(size.width - inset * 2, h - inset * 2.6f), CornerRadius(h / 2f - inset),
            )
            // Bottom lip.
            drawRoundRect(
                Color(0xFF0E7A16), Offset(inset * 1.5f, h * 0.62f), Size(size.width - inset * 3f, h * 0.3f),
                CornerRadius(h * 0.3f), alpha = 0.55f,
            )
            // Glossy top highlight.
            drawRoundRect(
                Brush.verticalGradient(listOf(Color.White.copy(alpha = 0.6f), Color.White.copy(alpha = 0.05f)), startY = inset * 1.4f, endY = h * 0.45f),
                Offset(h * 0.28f, inset * 1.4f), Size(size.width - h * 0.56f, h * 0.3f), CornerRadius(h * 0.16f),
            )
            drawRoundRect(Color(0xFF063008), cornerRadius = r, style = Stroke(h * 0.035f))
        }
        OutlinedText(
            "PLAY NOW", textSize, Fonts.rounded, FontWeight.Bold,
            brush = Brush.verticalGradient(listOf(Color.White, Color(0xFFE6F2E6))),
            outline = Color(0xFF0B3F10),
            outlineWidth = with(LocalDensity.current) { textSize.toPx() * 0.16f },
        )
    }
}

@Composable
private fun BoxWithConstraintsScope.CoinCapsule(art: ArtLibrary, wallet: Int, textSize: TextUnit, onPlus: () -> Unit) {
    val H = LayoutSpec.Home
    Box(spot(H.coinCapsule)) {
        Canvas(Modifier.fillMaxSize()) {
            val r = CornerRadius(size.height / 2f)
            drawRoundRect(Brush.verticalGradient(listOf(Color(0xE6182448), Color(0xE60A1230))), cornerRadius = r)
            drawRoundRect(Color(0x663A6FB8), cornerRadius = r, style = Stroke(size.height * 0.04f))
        }
    }
    Box(spot(H.coinIcon)) { ArtImage(art, "coin", Modifier.fillMaxSize()) }
    val formatted = NumberFormat.getIntegerInstance(Locale.US).format(wallet)
    OutlinedText(
        formatted, textSize, Fonts.rounded, FontWeight.SemiBold,
        modifier = Modifier
            .offset(x = maxWidth * 0.583f, y = maxHeight * H.coinCapsule.cy - maxWidth * 0.042f)
            .semantics { contentDescription = "wallet $wallet" }
            .testTag("wallet"),
        outlineWidth = 0f,
    )
    Box(
        spot(H.plusButton)
            .clip(RoundedCornerShape(20))
            .clickable(remember { MutableInteractionSource() }, indication = null, onClick = onPlus)
            .semantics { contentDescription = "Get coins" }
            .testTag("plus"),
    ) { ArtImage(art, "plus", Modifier.fillMaxSize()) }
}

@Composable
private fun BoxWithConstraintsScope.BottomNav(art: ArtLibrary, tab: HomeTab, onTab: (HomeTab) -> Unit, labelSize: TextUnit) {
    val H = LayoutSpec.Home
    Box(spot(H.navBar)) {
        Canvas(Modifier.fillMaxSize()) {
            val stroke = size.height * 0.018f
            val r = CornerRadius(size.height * 0.2f)
            drawRoundRect(Brush.verticalGradient(listOf(Color(0xE6101A3C), Color(0xF0070C22))), cornerRadius = r)
            drawRoundRect(Palette.navBorder.copy(alpha = 0.8f), cornerRadius = r, style = Stroke(stroke))
        }
        BoxWithConstraints(Modifier.fillMaxSize()) {
            val bw = maxWidth
            val bh = maxHeight
            val itemW = bw / 4
            HomeTab.entries.forEachIndexed { i, t ->
                val selected = t == tab
                Box(
                    Modifier.offset(x = itemW * i).size(itemW, bh)
                        .clickable(remember { MutableInteractionSource() }, indication = null) { onTab(t) }
                        .semantics { contentDescription = t.label }
                        .testTag("nav_${t.name.lowercase()}"),
                ) {
                    val iconSize = bw * (H.navIconSize / H.navBar.w)
                    Box(
                        Modifier.align(Alignment.TopCenter)
                            .offset(y = bh * H.navIconCy - iconSize / 2)
                            .size(iconSize),
                    ) {
                        ArtImage(art, t.icon, Modifier.fillMaxSize(), alpha = if (selected || t == HomeTab.SHOP) 1f else 0.92f)
                        if (t == HomeTab.MISSIONS) {
                            Canvas(Modifier.fillMaxSize()) {
                                val c = Offset(size.width * 0.86f, size.height * 0.12f)
                                val rr = size.width * 0.17f
                                drawCircle(Palette.badgeRed, rr, c)
                                drawCircle(Color.White, rr, c, style = Stroke(rr * 0.18f))
                                drawRoundRect(Color.White, Offset(c.x - rr * 0.12f, c.y - rr * 0.6f), Size(rr * 0.24f, rr * 0.75f), CornerRadius(rr * 0.1f))
                                drawCircle(Color.White, rr * 0.13f, Offset(c.x, c.y + rr * 0.45f))
                            }
                        }
                    }
                    OutlinedText(
                        t.label, labelSize, Fonts.rounded, FontWeight.SemiBold,
                        modifier = Modifier.align(Alignment.TopCenter).offset(y = bh * H.navLabelCy - bw * 0.045f),
                        color = if (selected) Color(0xFFBDF6FF) else Color(0xFFD7E0F0),
                        outlineWidth = 0f,
                    )
                    if (selected) {
                        Canvas(
                            Modifier.align(Alignment.BottomCenter).offset(y = -bh * 0.02f)
                                .size(itemW * 0.78f, bh * 0.06f),
                        ) {
                            val r = CornerRadius(size.height / 2f)
                            drawRoundRect(Palette.navSelected.copy(alpha = 0.25f), Offset(-size.height, -size.height), Size(size.width + size.height * 2, size.height * 3), CornerRadius(size.height * 1.5f))
                            drawRoundRect(Palette.navSelected, cornerRadius = r)
                        }
                    }
                }
            }
        }
    }
}

@Suppress("unused")
private fun lerpMax(a: Float, b: Float) = max(a, b)
