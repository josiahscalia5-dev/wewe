package com.blastcollect.game

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.blastcollect.game.art.ArtLibrary
import com.blastcollect.game.art.ArtScales
import com.blastcollect.game.audio.Feedback
import com.blastcollect.game.data.GameStore
import com.blastcollect.game.data.Profile
import com.blastcollect.game.ui.ComingSoonPanel
import com.blastcollect.game.ui.HomeScreen
import com.blastcollect.game.ui.HomeTab
import com.blastcollect.game.ui.Level3Screen
import com.blastcollect.game.ui.LoadingScreen
import com.blastcollect.game.ui.SettingsPanel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : ComponentActivity() {
    private lateinit var feedback: Feedback

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        val app = application as BlastCollectApplication
        feedback = Feedback(applicationContext)
        setContent { BlastCollectApp(app.art, app.store, feedback) }
    }

    override fun onResume() {
        super.onResume()
        feedback.startMusic()
    }

    override fun onPause() {
        feedback.pauseMusic()
        super.onPause()
    }

    override fun onDestroy() {
        feedback.release()
        super.onDestroy()
    }
}

@Composable
fun BlastCollectApp(art: ArtLibrary, store: GameStore, feedback: Feedback) {
    val scope = rememberCoroutineScope()
    val profile by store.profile.collectAsStateWithLifecycle(Profile())
    var screen by rememberSaveable { mutableStateOf("home") }
    var tab by rememberSaveable { mutableStateOf(HomeTab.HOME) }
    var settingsOpen by rememberSaveable { mutableStateOf(false) }
    var homeReady by remember { mutableStateOf(false) }
    var levelReady by remember { mutableStateOf(false) }

    val config = LocalConfiguration.current
    val density = LocalDensity.current
    val scales = remember(config) {
        with(density) { ArtScales(config.screenWidthDp.dp.toPx(), config.screenHeightDp.dp.toPx()) }
    }

    LaunchedEffect(Unit) { store.seedIfNeeded() }
    LaunchedEffect(profile) {
        feedback.soundOn = profile.sound
        feedback.vibrationOn = profile.vibration
        feedback.musicOn = profile.music
        ActiveGame.wallet = profile.wallet
    }
    LaunchedEffect(scales) {
        withContext(Dispatchers.IO) { scales.loadHome(art) }
        homeReady = true
        // Warm up Level 3 so PLAY NOW is instant.
        withContext(Dispatchers.IO) { scales.loadLevel3(art) }
        levelReady = true
    }
    ActiveGame.screen = screen

    when {
        screen == "level3" && levelReady -> Level3Screen(
            art = art,
            feedback = feedback,
            onHome = {
                screen = "home"
                tab = HomeTab.HOME
            },
            onCoinsEarned = { n -> scope.launch { store.addCoins(n) } },
        )
        screen == "level3" -> LoadingScreen("LOADING LEVEL 3…")
        !homeReady -> LoadingScreen("BLAST & COLLECT")
        else -> HomeScreen(
            art = art,
            wallet = profile.wallet,
            tab = tab,
            onTab = {
                feedback.click()
                tab = it
            },
            onPlay = {
                feedback.click()
                screen = "level3"
            },
            onSettings = {
                feedback.click()
                settingsOpen = true
            },
        ) {
            if (tab != HomeTab.HOME) {
                ComingSoonPanel(tab, art) {
                    feedback.click()
                    tab = HomeTab.HOME
                }
            }
            if (settingsOpen) {
                SettingsPanel(
                    sound = profile.sound,
                    music = profile.music,
                    vibration = profile.vibration,
                    onSound = { v -> scope.launch { store.setSound(v) } },
                    onMusic = { v -> scope.launch { store.setMusic(v) } },
                    onVibration = { v -> scope.launch { store.setVibration(v) } },
                    onClose = {
                        feedback.click()
                        settingsOpen = false
                    },
                )
            }
        }
    }
}
