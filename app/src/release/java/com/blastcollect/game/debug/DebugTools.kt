package com.blastcollect.game.debug

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

/** Release build: the reference overlay and its images are stripped. */
object DebugTools {
    const val ENABLED = false

    @Suppress("UNUSED_PARAMETER")
    fun referenceToggle(onToggle: () -> Unit): Modifier = Modifier

    @Suppress("UNUSED_PARAMETER")
    @Composable
    fun ReferenceOverlay(visible: Boolean, name: String) = Unit
}
