package com.blastcollect.game.audio

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.SoundPool
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import com.blastcollect.core.GameEvent
import com.blastcollect.game.R

/** Sound effects, music loop and vibration, each gated by the saved settings. */
class Feedback(private val context: Context) {
    var soundOn = true
    var vibrationOn = true
    var musicOn = true
        set(value) {
            field = value
            if (!value) stopMusic() else if (musicWanted) startMusic()
        }

    private val pool: SoundPool = SoundPool.Builder()
        .setMaxStreams(8)
        .setAudioAttributes(
            AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_GAME)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build(),
        )
        .build()

    private val laser = pool.load(context, R.raw.sfx_laser, 1)
    private val boom = pool.load(context, R.raw.sfx_explosion, 1)
    private val alert = pool.load(context, R.raw.sfx_alert, 1)
    private val caught = pool.load(context, R.raw.sfx_caught, 1)
    private val tick = pool.load(context, R.raw.sfx_tick, 1)
    private val win = pool.load(context, R.raw.sfx_complete, 1)
    private val lose = pool.load(context, R.raw.sfx_fail, 1)
    private val overheat = pool.load(context, R.raw.sfx_overheat, 1)
    private val click = pool.load(context, R.raw.sfx_click, 1)
    private val thud = pool.load(context, R.raw.sfx_cover, 1)
    private val clank = pool.load(context, R.raw.sfx_clank, 1)

    private var music: MediaPlayer? = null
    private var musicWanted = false

    private val vibrator: Vibrator? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
    } else {
        @Suppress("DEPRECATION")
        context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }

    private fun play(id: Int, volume: Float = 1f, rate: Float = 1f) {
        if (soundOn) pool.play(id, volume, volume, 1, 0, rate)
    }

    fun click() = play(click, 0.8f)

    fun onEvents(events: List<GameEvent>) {
        for (e in events) when (e) {
            GameEvent.Fire -> play(laser, 0.55f)
            is GameEvent.Kill -> {
                play(boom, 0.9f)
                buzz(28, 120)
            }
            GameEvent.Miss -> Unit
            GameEvent.Blocked -> play(clank, 0.8f)
            GameEvent.Overheat -> play(overheat, 0.7f)
            GameEvent.Alert -> {
                play(alert, 1f)
                buzz(60, 200)
            }
            GameEvent.Caught -> {
                play(caught, 1f)
                buzz(260, 255)
            }
            GameEvent.EnterCover -> play(thud, 0.6f)
            GameEvent.LeaveCover -> Unit
            is GameEvent.TimerTick -> play(tick, 0.6f)
            GameEvent.Complete -> play(win, 1f)
            GameEvent.Fail -> play(lose, 1f)
        }
    }

    private fun buzz(ms: Long, amplitude: Int) {
        if (!vibrationOn) return
        val v = vibrator ?: return
        if (!v.hasVibrator()) return
        v.vibrate(VibrationEffect.createOneShot(ms, amplitude.coerceIn(1, 255)))
    }

    fun startMusic() {
        musicWanted = true
        if (!musicOn) return
        if (music == null) {
            music = MediaPlayer.create(context, R.raw.music_loop)?.apply {
                isLooping = true
                setVolume(0.35f, 0.35f)
            }
        }
        music?.takeIf { !it.isPlaying }?.start()
    }

    fun pauseMusic() {
        music?.takeIf { it.isPlaying }?.pause()
    }

    fun stopMusic() {
        music?.release()
        music = null
    }

    fun release() {
        stopMusic()
        pool.release()
    }
}
