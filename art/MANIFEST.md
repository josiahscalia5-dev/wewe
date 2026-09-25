# Art layers

Production art drop folder. Every PNG here is packaged into the APK as `assets/art/<name>.png`
(see `SyncArtTask` in `app/build.gradle.kts`); replace a file with production art of the same
name and rebuild. Missing layers render as magenta "MISSING ART" placeholders in the app.
