pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "blast-and-collect"

// Pure-Kotlin game rules (no Android dependencies). It is a standalone build so
// it can be compiled and unit-tested without the Android SDK:
//   ./gradlew -p core test
includeBuild("core")

include(":app")
