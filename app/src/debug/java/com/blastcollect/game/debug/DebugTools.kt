package com.blastcollect.game.debug

import android.graphics.BitmapFactory
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.FilterQuality
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import kotlin.math.max
import kotlin.math.roundToInt

/**
 * Debug-only tools (this file exists only in src/debug; src/release has no-op stubs and
 * no reference images). A three-finger tap toggles the matching reference screenshot at
 * 50% opacity over the live screen for alignment checks.
 */
object DebugTools {
    const val ENABLED = true

    /** Screen rectangle inside the phone bezel of each reference (px in the PNG). */
    private val screenRects = mapOf(
        "2371" to intArrayOf(27, 34, 830, 1804),
        "2376" to intArrayOf(32, 26, 825, 1803),
    )

    fun referenceToggle(onToggle: () -> Unit): Modifier = Modifier.pointerInput(Unit) {
        awaitPointerEventScope {
            var armed = true
            while (true) {
                val e = awaitPointerEvent(PointerEventPass.Initial)
                val down = e.changes.count { it.pressed }
                if (down >= 3 && armed) {
                    armed = false
                    onToggle()
                }
                if (down == 0) armed = true
            }
        }
    }

    @Composable
    fun ReferenceOverlay(visible: Boolean, name: String) {
        if (!visible) return
        val context = LocalContext.current
        val image = remember(name) {
            context.assets.open("reference/$name.png").use { BitmapFactory.decodeStream(it) }?.asImageBitmap()
        } ?: return
        val r = screenRects.getValue(name)
        Canvas(Modifier.fillMaxSize()) {
            val srcW = r[2] - r[0]
            val srcH = r[3] - r[1]
            // Same scale-to-cover as the backgrounds.
            val k = max(size.width / srcW, size.height / srcH)
            val dw = srcW * k
            val dh = srcH * k
            val dst = Size(dw, dh)
            drawImage(
                image,
                srcOffset = IntOffset(r[0], r[1]),
                srcSize = IntSize(srcW, srcH),
                dstOffset = IntOffset(((size.width - dw) / 2f).roundToInt(), ((size.height - dh) / 2f).roundToInt()),
                dstSize = IntSize(dst.width.roundToInt(), dst.height.roundToInt()),
                alpha = 0.5f,
                filterQuality = FilterQuality.High,
            )
        }
    }
}
