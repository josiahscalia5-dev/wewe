package com.blastcollect.game

import android.app.Application
import com.blastcollect.game.art.ArtLibrary
import com.blastcollect.game.data.GameStore

class BlastCollectApplication : Application() {
    val art: ArtLibrary by lazy { ArtLibrary(this) }
    val store: GameStore by lazy { GameStore(this) }
}
