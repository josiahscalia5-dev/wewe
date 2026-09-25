package com.blastcollect.game.ui

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.ExperimentalTextApi
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import com.blastcollect.game.R

/** Bundled OFL fonts, picked as the closest match to the references. */
object Fonts {
    /** Condensed bold HUD text: "LEVEL 3", "SHOOT THE RED DRONES", "6/20", "00:28". */
    val hud = FontFamily(
        Font(R.font.barlow_condensed_semibold, FontWeight.SemiBold),
        Font(R.font.barlow_condensed_bold, FontWeight.Bold),
        Font(R.font.barlow_condensed_extrabold, FontWeight.ExtraBold),
    )

    /** Heavy rounded display face of the reference's logo and "PLAY NOW" (Lilita One, OFL). */
    val display = FontFamily(Font(R.font.lilita_one, FontWeight.Normal))

    /** Rounded text: nav labels, wallet. */
    @OptIn(ExperimentalTextApi::class)
    val rounded = FontFamily(
        Font(
            R.font.fredoka_variable, FontWeight.Medium,
            variationSettings = FontVariation.Settings(FontVariation.weight(500)),
        ),
        Font(
            R.font.fredoka_variable, FontWeight.SemiBold,
            variationSettings = FontVariation.Settings(FontVariation.weight(600)),
        ),
        Font(
            R.font.fredoka_variable, FontWeight.Bold,
            variationSettings = FontVariation.Settings(FontVariation.weight(700)),
        ),
    )
}

/** Colours sampled from the reference screens. */
object Palette {
    val night = Color(0xFF070B1C)
    val panelFill = Color(0xE60A1330)
    val panelFillSoft = Color(0xB30B1633)
    val pillFill = Color(0x9914203F)
    val neonCyan = Color(0xFF1FC8FF)
    val neonCyanSoft = Color(0xFF38A8FF)
    val neonMagenta = Color(0xFFE040FB)
    val neonRed = Color(0xFFFF3B3B)
    val segmentLit = Color(0xFF2EE0FF)
    val segmentLitDeep = Color(0xFF0FA8F0)
    val segmentOff = Color(0xFF3A4868)
    val white = Color(0xFFFFFFFF)
    val textOutline = Color(0xFF0B0E24)
    val playGreenTop = Color(0xFF7CF25A)
    val playGreenMid = Color(0xFF2FD12E)
    val playGreenBottom = Color(0xFF12A01C)
    val playGreenRim = Color(0xFF0B5E14)
    val navFill = Color(0xD90A1230)
    val navBorder = Color(0xFF2B6FC4)
    val navSelected = Color(0xFF33E6FF)
    val badgeRed = Color(0xFFFF2D3A)
    val gold = Color(0xFFFFC928)

    val timerBorder = Brush.linearGradient(listOf(neonRed, Color(0xFFB04BFF), neonCyan))
}
