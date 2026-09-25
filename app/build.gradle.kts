import javax.inject.Inject

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.blastcollect.game"
    // The current stable AndroidX/Compose releases (BOM 2026.09.00, core 1.19.1,
    // lifecycle 2.11.0) require compiling against API 37. Runtime behaviour follows
    // targetSdk 36, which meets the Google Play requirement.
    compileSdk = 37

    defaultConfig {
        applicationId = "com.blastcollect.game"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0-phase1"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            // Test-signed so the review APK installs; replace with the upload key for Play.
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources.excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
}

/**
 * Copies the art layers from /art (the production-art drop folder) into the APK's
 * assets/art/ so art can be replaced without touching code.
 */
abstract class SyncArtTask @Inject constructor(private val fs: FileSystemOperations) : DefaultTask() {
    @get:InputDirectory
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val artDir: DirectoryProperty

    @get:OutputDirectory
    abstract val outputDir: DirectoryProperty

    @TaskAction
    fun sync() {
        fs.sync {
            from(artDir) { include("*.png", "_layers.json") }
            into(outputDir.dir("art"))
        }
    }
}

androidComponents {
    onVariants { variant ->
        val task = tasks.register<SyncArtTask>("sync${variant.name.replaceFirstChar { it.uppercase() }}Art") {
            artDir.set(rootProject.layout.projectDirectory.dir("art"))
        }
        variant.sources.assets?.addGeneratedSourceDirectory(task, SyncArtTask::outputDir)
    }
}

dependencies {
    implementation("com.blastcollect:core")

    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.graphics)
    implementation(libs.compose.ui.text)
    implementation(libs.compose.foundation)
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.datastore.preferences)
    implementation(libs.kotlinx.coroutines.android)
    debugImplementation(libs.compose.ui.tooling)

    testImplementation(libs.junit)

    androidTestImplementation(libs.androidx.test.runner)
    androidTestImplementation(libs.androidx.test.rules)
    androidTestImplementation(libs.androidx.test.ext.junit)
    androidTestImplementation(libs.androidx.test.uiautomator)
}
