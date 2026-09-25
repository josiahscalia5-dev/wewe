package com.blastcollect.game.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "blast_collect")

data class Profile(
    val wallet: Int = GameStore.STARTING_WALLET,
    val sound: Boolean = true,
    val music: Boolean = true,
    val vibration: Boolean = true,
)

/** Saved player data: the coin wallet and the settings toggles (DataStore). */
class GameStore(private val context: Context) {

    val profile: Flow<Profile> = context.dataStore.data.map { p ->
        Profile(
            wallet = p[WALLET] ?: STARTING_WALLET,
            sound = p[SOUND] ?: true,
            music = p[MUSIC] ?: true,
            vibration = p[VIBRATION] ?: true,
        )
    }

    /** Writes the 2,350 starting balance on first launch so it is real saved data. */
    suspend fun seedIfNeeded() {
        context.dataStore.edit { p -> if (p[WALLET] == null) p[WALLET] = STARTING_WALLET }
    }

    suspend fun addCoins(amount: Int) {
        if (amount <= 0) return
        context.dataStore.edit { p -> p[WALLET] = (p[WALLET] ?: STARTING_WALLET) + amount }
    }

    suspend fun setSound(on: Boolean) = context.dataStore.edit { it[SOUND] = on }
    suspend fun setMusic(on: Boolean) = context.dataStore.edit { it[MUSIC] = on }
    suspend fun setVibration(on: Boolean) = context.dataStore.edit { it[VIBRATION] = on }

    companion object {
        const val STARTING_WALLET = 2350
        private val WALLET = intPreferencesKey("wallet")
        private val SOUND = booleanPreferencesKey("sound")
        private val MUSIC = booleanPreferencesKey("music")
        private val VIBRATION = booleanPreferencesKey("vibration")
    }
}
