package com.blastcollect.game.art

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.os.Build
import android.util.Log
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

/**
 * One art layer from /art (packaged as assets/art/<name>.png).
 *
 * The art pipeline trims transparent margins and records the original canvas in
 * art/_layers.json; [canvasW]/[canvasH] and [offsetX]/[offsetY] restore the layer's
 * geometry so anchors from ArtMetrics still apply. [scale] is how much the stored
 * bitmap was shrunk at load time (1 = native).
 */
class ArtLayer(
    val name: String,
    val bitmap: Bitmap,
    val canvasW: Float,
    val canvasH: Float,
    val offsetX: Float,
    val offsetY: Float,
    val trimmedW: Float,
    val trimmedH: Float,
    val scale: Float,
    val missing: Boolean,
) {
    /** Destination of the trimmed bitmap when the full canvas is drawn into [dst]. */
    fun trimmedRect(dst: RectF, out: RectF): RectF {
        val sx = dst.width() / canvasW
        val sy = dst.height() / canvasH
        out.set(
            dst.left + offsetX * sx,
            dst.top + offsetY * sy,
            dst.left + (offsetX + trimmedW) * sx,
            dst.top + (offsetY + trimmedH) * sy,
        )
        return out
    }
}

/**
 * Loads and caches art layers. Missing layers become clearly labelled placeholders
 * (magenta hatch + name) so gaps in the production art are obvious on screen.
 */
class ArtLibrary(private val context: Context) {
    private val layers = ConcurrentHashMap<String, ArtLayer>()
    private val meta: JSONObject by lazy {
        try {
            context.assets.open("art/_layers.json").bufferedReader().use { JSONObject(it.readText()) }
        } catch (e: Exception) {
            JSONObject()
        }
    }

    val missingLayers: Set<String> get() = layers.values.filter { it.missing }.map { it.name }.toSet()

    operator fun get(name: String): ArtLayer? = layers[name]

    fun require(name: String): ArtLayer = layers[name] ?: load(name, 1f)

    /** Loads [names] at [maxScale] of their stored size (never upscaled). */
    fun preload(names: Collection<String>, maxScale: Float) {
        for (n in names) if (!layers.containsKey(n)) load(n, maxScale)
    }

    fun load(name: String, maxScale: Float): ArtLayer {
        layers[name]?.let { return it }
        val layer = try {
            decode(name, maxScale.coerceIn(0.05f, 1f))
        } catch (e: Exception) {
            Log.w(TAG, "Missing art layer '$name' — using labelled placeholder")
            placeholder(name)
        }
        layers[name] = layer
        return layer
    }

    private fun decode(name: String, maxScale: Float): ArtLayer {
        val opts = BitmapFactory.Options().apply {
            inPreferredConfig = Bitmap.Config.ARGB_8888
            inScaled = false
        }
        val raw = context.assets.open("art/$name.png").use { BitmapFactory.decodeStream(it, null, opts) }
            ?: error("undecodable $name")
        val rawW = raw.width
        val rawH = raw.height
        val m = meta.optJSONObject(name)
        val trimmed = m != null && m.optInt("w") == rawW && m.optInt("h") == rawH
        val canvasW = if (trimmed) m!!.getDouble("canvasW").toFloat() else rawW.toFloat()
        val canvasH = if (trimmed) m!!.getDouble("canvasH").toFloat() else rawH.toFloat()
        val ox = if (trimmed) m!!.getDouble("x").toFloat() else 0f
        val oy = if (trimmed) m!!.getDouble("y").toFloat() else 0f

        var bmp = raw
        if (maxScale < 0.98f) {
            val w = (rawW * maxScale).toInt().coerceAtLeast(1)
            val h = (rawH * maxScale).toInt().coerceAtLeast(1)
            bmp = Bitmap.createScaledBitmap(raw, w, h, true)
            if (bmp !== raw) raw.recycle()
        }
        val scale = bmp.width.toFloat() / rawW.toFloat()
        val finalBmp = toHardware(bmp)
        return ArtLayer(name, finalBmp, canvasW, canvasH, ox, oy, rawW.toFloat(), rawH.toFloat(), scale, missing = false)
    }

    private fun toHardware(b: Bitmap): Bitmap {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return b
        val hw = b.copy(Bitmap.Config.HARDWARE, false) ?: return b
        b.recycle()
        return hw
    }

    private fun placeholder(name: String): ArtLayer {
        val w = 512
        val h = 512
        val b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val c = Canvas(b)
        val p = Paint(Paint.ANTI_ALIAS_FLAG)
        p.color = Color.argb(150, 255, 0, 200)
        c.drawRect(0f, 0f, w.toFloat(), h.toFloat(), p)
        p.color = Color.argb(200, 20, 0, 30)
        p.strokeWidth = 10f
        for (i in -h until w step 48) c.drawLine(i.toFloat(), 0f, (i + h).toFloat(), h.toFloat(), p)
        p.color = Color.WHITE
        p.textSize = 40f
        p.isFakeBoldText = true
        c.drawText("MISSING ART", 24f, h / 2f - 30f, p)
        p.textSize = 34f
        c.drawText(name, 24f, h / 2f + 24f, p)
        return ArtLayer(name, b, w.toFloat(), h.toFloat(), 0f, 0f, w.toFloat(), h.toFloat(), 1f, missing = true)
    }

    companion object {
        private const val TAG = "ArtLibrary"
    }
}
