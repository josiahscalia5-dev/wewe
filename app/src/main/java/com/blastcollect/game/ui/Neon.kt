package com.blastcollect.game.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraintsScope
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp

/** Places a [Spot] (fractions of the safe area) inside a BoxWithConstraints. */
fun BoxWithConstraintsScope.spot(s: Spot): Modifier {
    val w = maxWidth
    val h = maxHeight
    return Modifier
        .offset(x = w * (s.cx - s.w / 2f), y = h * s.cy - w * (s.h / 2f))
        .size(width = w * s.w, height = w * s.h)
}

/** Converts a fraction of the safe width to a Dp. */
fun BoxWithConstraintsScope.wf(f: Float): Dp = maxWidth * f

/**
 * A neon outline: a few widening, fading strokes under a crisp core stroke. Drawn in
 * code so it stays sharp at every density (no blur filters, works on API 26+).
 */
fun DrawScope.neonRoundRect(
    brush: Brush,
    topLeft: Offset,
    size: Size,
    radius: Float,
    stroke: Float,
    glow: Float = stroke * 3.2f,
    glowAlpha: Float = 0.55f,
) {
    val layers = 5
    for (i in layers downTo 1) {
        val t = i / layers.toFloat()
        drawRoundRect(
            brush = brush,
            topLeft = topLeft,
            size = size,
            cornerRadius = CornerRadius(radius),
            style = Stroke(width = stroke + glow * t),
            alpha = glowAlpha * (1f - t) * (1f - t) + 0.02f,
        )
    }
    drawRoundRect(brush, topLeft, size, CornerRadius(radius), style = Stroke(stroke))
    // Thin bright inner line for the "tube" highlight.
    drawRoundRect(
        Color.White.copy(alpha = 0.55f), topLeft, size, CornerRadius(radius),
        style = Stroke(stroke * 0.28f),
    )
}

fun DrawScope.neonCircle(color: Color, center: Offset, radius: Float, stroke: Float, glow: Float = stroke * 3f) {
    for (i in 5 downTo 1) {
        val t = i / 5f
        drawCircle(color, radius, center, alpha = 0.5f * (1f - t) * (1f - t) + 0.02f, style = Stroke(stroke + glow * t))
    }
    drawCircle(color, radius, center, style = Stroke(stroke))
    drawCircle(Color.White.copy(alpha = 0.6f), radius, center, style = Stroke(stroke * 0.3f))
}

/** Dark navy HUD panel with a cyan neon rim (objective / weapon / coin panels). */
fun DrawScope.hudPanel(
    rimBrush: Brush = Brush.linearGradient(
        listOf(Palette.neonMagenta, Palette.neonCyan, Palette.neonCyan),
        start = Offset(0f, size.height), end = Offset(size.width * 0.45f, 0f),
    ),
    fill: Brush = Brush.verticalGradient(listOf(Color(0xF20D1838), Color(0xF2070D22))),
    radiusFraction: Float = 0.16f,
    rimAlpha: Float = 1f,
) {
    val stroke = size.minDimension * 0.035f
    val inset = stroke * 1.2f
    val tl = Offset(inset, inset)
    val sz = Size(size.width - inset * 2, size.height - inset * 2)
    val r = size.minDimension * radiusFraction
    drawRoundRect(fill, tl, sz, CornerRadius(r))
    // Faint top sheen.
    drawRoundRect(
        Brush.verticalGradient(listOf(Color.White.copy(alpha = 0.07f), Color.Transparent), endY = size.height * 0.5f),
        tl, sz, CornerRadius(r),
    )
    if (rimAlpha > 0f) {
        neonRoundRect(rimBrush, tl, sz, r, stroke, glowAlpha = 0.5f * rimAlpha)
    }
}

/** Segmented bar (objective progress, weapon charge). [lit] may be fractional. */
fun DrawScope.segments(
    count: Int,
    lit: Float,
    left: Float,
    top: Float,
    segW: Float,
    segH: Float,
    gap: Float,
    litColors: List<Color> = listOf(Palette.segmentLit, Palette.segmentLitDeep),
    offColor: Color = Palette.segmentOff,
) {
    val r = CornerRadius(segH * 0.16f)
    for (i in 0 until count) {
        val x = left + i * (segW + gap)
        drawRoundRect(offColor, Offset(x, top), Size(segW, segH), r)
        drawRoundRect(Color.Black.copy(alpha = 0.25f), Offset(x, top + segH * 0.72f), Size(segW, segH * 0.28f), r)
        val fill = (lit - i).coerceIn(0f, 1f)
        if (fill > 0f) {
            val brush = Brush.verticalGradient(litColors, startY = top, endY = top + segH)
            drawRoundRect(brush, Offset(x, top), Size(segW * fill, segH), r)
            // Glow + highlight.
            drawRoundRect(
                litColors.first().copy(alpha = 0.35f),
                Offset(x - segW * 0.12f, top - segH * 0.12f),
                Size(segW * fill + segW * 0.24f, segH * 1.24f), CornerRadius(segH * 0.3f),
            )
            drawRoundRect(
                Color.White.copy(alpha = 0.45f), Offset(x + segW * 0.12f, top + segH * 0.1f),
                Size((segW * fill - segW * 0.24f).coerceAtLeast(0f), segH * 0.18f), r,
            )
        }
    }
}

/** Text with a dark outline and drop shadow, like the reference HUD/tagline lettering. */
@Composable
fun OutlinedText(
    text: String,
    size: TextUnit,
    family: FontFamily,
    weight: FontWeight,
    modifier: Modifier = Modifier,
    color: Color = Color.White,
    brush: Brush? = null,
    outline: Color = Palette.textOutline,
    outlineWidth: Float = 0f,
    shadow: Boolean = true,
    align: TextAlign = TextAlign.Center,
    letterSpacing: TextUnit = TextUnit.Unspecified,
    lineHeight: TextUnit = TextUnit.Unspecified,
) {
    val base = TextStyle(
        fontFamily = family,
        fontWeight = weight,
        fontSize = size,
        textAlign = align,
        letterSpacing = letterSpacing,
        lineHeight = lineHeight,
    )
    Box(modifier, contentAlignment = Alignment.Center) {
        if (outlineWidth > 0f) {
            BasicText(
                text,
                style = base.copy(
                    color = outline,
                    drawStyle = Stroke(width = outlineWidth, join = StrokeJoin.Round),
                    shadow = if (shadow) Shadow(Color.Black.copy(alpha = 0.6f), Offset(0f, outlineWidth * 0.6f), outlineWidth) else null,
                ),
                softWrap = false,
            )
        }
        BasicText(
            text,
            style = if (brush != null) {
                base.copy(brush = brush, shadow = if (!shadow || outlineWidth > 0f) null else Shadow(Color.Black.copy(alpha = 0.55f), Offset(0f, 3f), 4f))
            } else {
                base.copy(color = color, shadow = if (!shadow || outlineWidth > 0f) null else Shadow(Color.Black.copy(alpha = 0.55f), Offset(0f, 3f), 4f))
            },
            softWrap = false,
        )
    }
}

val HairlineDp = 1.dp

fun solid(c: Color) = SolidColor(c)
