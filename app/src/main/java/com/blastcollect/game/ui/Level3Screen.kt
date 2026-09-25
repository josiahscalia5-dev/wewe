package com.blastcollect.game.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.blastcollect.core.Level3
import com.blastcollect.core.Phase
import com.blastcollect.game.ActiveGame
import com.blastcollect.game.art.ArtLibrary
import com.blastcollect.game.audio.Feedback
import com.blastcollect.game.debug.DebugTools
import com.blastcollect.game.game.GameView
import com.blastcollect.game.game.HudState

@Composable
fun Level3Screen(
    art: ArtLibrary,
    feedback: Feedback,
    onHome: () -> Unit,
    onCoinsEarned: (Int) -> Unit,
) {
    var generation by remember { mutableIntStateOf(0) }
    val level = remember(generation) {
        Level3(seed = System.nanoTime()).also { ActiveGame.level = it }
    }
    var hud by remember(generation) { mutableStateOf(HudState.of(level)) }
    var awarded by remember(generation) { mutableStateOf(false) }
    var showReference by remember { mutableStateOf(false) }

    LaunchedEffect(hud.phase, generation) {
        if (hud.phase == Phase.COMPLETE && !awarded) {
            awarded = true
            onCoinsEarned(level.coinsEarned)
        }
    }

    // Auto-pause when the app goes to the background.
    val owner = LocalLifecycleOwner.current
    DisposableEffect(owner, level) {
        val obs = LifecycleEventObserver { _, e ->
            if (e == Lifecycle.Event.ON_PAUSE && !level.finished) level.pause()
        }
        owner.lifecycle.addObserver(obs)
        onDispose { owner.lifecycle.removeObserver(obs) }
    }

    BackHandler {
        if (level.finished || level.paused) onHome() else level.pause()
    }

    Box(
        Modifier.fillMaxSize()
            .background(Palette.night)
            .then(DebugTools.referenceToggle { showReference = !showReference }),
    ) {
        AndroidView(
            factory = { ctx -> GameView(ctx, art).also { ActiveGame.view = it } },
            update = { v ->
                v.level = level
                v.onHud = { hud = it }
                v.onEvents = feedback::onEvents
            },
            modifier = Modifier.fillMaxSize().testTag("playfield"),
        )
        Level3Hud(hud, art) {
            feedback.click()
            level.pause()
        }
        if (hud.phase == Phase.INTRO && !hud.paused) OpeningBanner()
        if (hud.paused && !level.finished) {
            PauseOverlay(
                onResume = {
                    feedback.click()
                    level.resume()
                },
                onRestart = {
                    feedback.click()
                    generation++
                },
                onHome = {
                    feedback.click()
                    onHome()
                },
            )
        }
        if (hud.phase == Phase.COMPLETE) {
            CompleteOverlay(
                hud.kills, hud.required, level.coinsEarned, art,
                onReplay = { generation++ },
                onHome = onHome,
            )
        }
        if (hud.phase == Phase.FAILED) {
            FailedOverlay(hud.kills, hud.required, onRetry = { generation++ }, onHome = onHome)
        }
        DebugTools.ReferenceOverlay(showReference, "2376")
    }
}
