---
title: Platform Directories
weight: 3
---

Chuk Chat targets Android, iOS, Linux, macOS, and Flatpak. Each platform directory contains native build configuration and platform-specific resources.

## Directory Overview

| Directory | Platform | Contents |
|-----------|----------|----------|
| `android/` | Android | Gradle build, signing, Fastlane deployment |
| `ios/` | iOS | Xcode project, Runner app, test targets |
| `linux/` | Linux | CMake build, Fastlane deployment |
| `macos/` | macOS | Xcode project, Runner app, Fastlane deployment |
| `flatpak/` | Linux (Flatpak) | Desktop entry and AppStream metadata |

## android/

| File/Directory | Description |
|----------------|-------------|
| `app/` | Android app module (manifest, Kotlin source, resources) |
| `build.gradle.kts` | Root Gradle build script (Kotlin DSL) |
| `settings.gradle.kts` | Gradle settings and plugin management |
| `gradle/` | Gradle wrapper files |
| `gradle.properties` | Gradle build properties |
| `gradlew` / `gradlew.bat` | Gradle wrapper scripts |
| `key.properties` | Signing key configuration (not committed) |
| `key.properties.example` | Template for signing key setup |
| `local.properties` | Local SDK paths (auto-generated) |
| `fastlane/` | Fastlane deployment configuration |
| `Gemfile` | Ruby dependencies for Fastlane |

## ios/

| File/Directory | Description |
|----------------|-------------|
| `Runner/` | Main iOS app target |
| `RunnerTests/` | Unit test target |
| `Runner.xcodeproj/` | Xcode project file |
| `Runner.xcworkspace/` | Xcode workspace (includes CocoaPods) |
| `Flutter/` | Flutter engine integration |

## linux/

| File/Directory | Description |
|----------------|-------------|
| `CMakeLists.txt` | CMake build configuration |
| `flutter/` | Flutter engine integration |
| `runner/` | Native Linux runner code |
| `fastlane/` | Fastlane deployment configuration |
| `Gemfile` | Ruby dependencies for Fastlane |

## macos/

| File/Directory | Description |
|----------------|-------------|
| `Runner/` | Main macOS app target |
| `RunnerTests/` | Unit test target |
| `Runner.xcodeproj/` | Xcode project file |
| `Runner.xcworkspace/` | Xcode workspace |
| `Flutter/` | Flutter engine integration |
| `fastlane/` | Fastlane deployment configuration |
| `Gemfile` | Ruby dependencies for Fastlane |

## flatpak/

| File | Description |
|------|-------------|
| `dev.chuk.chat.desktop` | Desktop entry file (app name, icon, categories) |
| `dev.chuk.chat.metainfo.xml` | AppStream metadata for Linux app stores |
