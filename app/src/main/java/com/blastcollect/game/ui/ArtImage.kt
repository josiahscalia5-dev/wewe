package com.blastcollect.game.ui

import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.FilterQuality
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import com.blastcollect.game.art.ArtLayer
import com.blastcollect.game.art.ArtLibrary
import java.util.WeakHashMap
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

private val imageCache = WeakHashMap<ArtLayer, ImageBitmap>()

fun ArtLayer.image(): ImageBitmap = synchronized(imageCache) { imageCache.getOrPut(this) { bitmap.asImageBitmap() } }

/**
 * Draws an art layer's full canvas fitted (contain) or filled (cover) into this scope,
 * restoring trimmed margins so the artwork keeps its authored framing.
 */
fun DrawScope.drawArt(layer: ArtLayer?, cover: Boolean = false, alpha: Float = 1f, anchorY: Float = 0.5f) {
    if (layer == null) return
    val k = if (cover) max(size.width / layer.canvasW, size.height / layer.canvasH)
    else min(size.width / layer.canvasW, size.height / layer.canvasH)
    val cw = layer.canvasW * k
    val ch = layer.canvasH * k
    val left = (size.width - cw) / 2f
    val top = (size.height - ch) * anchorY
    val dl = left + layer.offsetX * k
    val dt = top + layer.offsetY * k
    val img = layer.image()
    drawImage(
        img,
        srcOffset = IntOffset.Zero,
        srcSize = IntSize(img.width, img.height),
        dstOffset = IntOffset(dl.roundToInt(), dt.roundToInt()),
        dstSize = IntSize((layer.trimmedW * k).roundToInt(), (layer.trimmedH * k).roundToInt()),
        alpha = alpha,
        filterQuality = FilterQuality.High,
    )
}

@Composable
fun ArtImage(art: ArtLibrary, name: String, modifier: Modifier, alpha: Float = 1f) {
    val layer = art[name]
    Canvas(modifier) { drawArt(layer, alpha = alpha) }
}

@Suppress("unused")
private val zero = Offset.Zero
