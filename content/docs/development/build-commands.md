---
title: Build Commands
weight: 2
---

Flutter build commands for different platforms and configurations.

## Development Builds

### Run on Desktop

```bash
# macOS
flutter run -d macos

# Windows
flutter run -d windows

# Linux
flutter run -d linux
```

### Run on Mobile

```bash
# iOS Simulator
flutter run -d ios

# Android Emulator
flutter run -d android

# Specific device
flutter run -d "iPhone 15 Pro"
```

### Debug Mode Options

```bash
# With hot reload (default)
flutter run

# With verbose logging
flutter run -v

# Profile mode (performance testing)
flutter run --profile
```

## Release Builds

### Desktop Releases

```bash
# macOS
flutter build macos --release

# Windows
flutter build windows --release

# Linux
flutter build linux --release
```

### Mobile Releases

```bash
# iOS (requires Xcode)
flutter build ios --release

# Android APK
flutter build apk --release

# Android App Bundle (recommended for Play Store)
flutter build appbundle --release
```

### Web Release

```bash
# Build for web
flutter build web --release --base-href /
```

Web builds use the desktop UI layout via `root_wrapper_stub.dart`. Native-only packages (`desktop_drop`, `path_provider`, `permission_handler`, `record`) are replaced by stub implementations at compile time through conditional exports. File uploads use raw bytes instead of filesystem paths.

### Build Output Locations

| Platform | Output Path |
|----------|-------------|
| macOS | `build/macos/Build/Products/Release/` |
| Windows | `build/windows/x64/runner/Release/` |
| Linux | `build/linux/x64/release/bundle/` |
| iOS | `build/ios/iphoneos/` |
| Android APK | `build/app/outputs/flutter-apk/` |
| Android AAB | `build/app/outputs/bundle/release/` |
| Web | `build/web/` |

## Clean Build

```bash
# Clean build artifacts
flutter clean

# Get dependencies again
flutter pub get

# Full rebuild
flutter clean && flutter pub get && flutter run
```

## Code Generation

```bash
# Run build_runner (if using code generation)
flutter pub run build_runner build

# Watch mode for development
flutter pub run build_runner watch

# Delete conflicting outputs
flutter pub run build_runner build --delete-conflicting-outputs
```

## Analysis & Formatting

```bash
# Run static analysis
flutter analyze

# Format code
dart format .

# Format and fix
dart format --fix .
```

## Platform-Specific Commands

### iOS

```bash
# Open in Xcode
open ios/Runner.xcworkspace

# Install pods
cd ios && pod install && cd ..

# Clean pods
cd ios && pod deintegrate && pod install && cd ..
```

### Android

```bash
# Open in Android Studio
open -a "Android Studio" android/

# Clean Gradle
cd android && ./gradlew clean && cd ..

# Build specific ABI
flutter build apk --target-platform android-arm64
```

## Flatpak Builds

Chuk Chat supports Flatpak packaging for Linux distribution:

```bash
# Build using the Flatpak build script
./build_flatpak.sh
```

The Flatpak manifest is located at `linux/flatpak/` and defines the application's sandbox permissions, dependencies, and build instructions.

## Linux Packaging with Fastlane

Fastlane automates building multiple Linux package formats in a single command:

```bash
# Build all Linux packages (AppImage, DEB, RPM, Flatpak)
bundle exec fastlane release
```

This produces distributable packages for all major Linux package managers.

## Codemagic CI

iOS builds are automated via Codemagic using the `codemagic.yaml` configuration file at the project root. This handles code signing, provisioning profiles, and App Store submission.

## Android Signing

Android release builds use a 3-tier priority system for signing configuration:

1. **Environment variables** -- Used in CI environments (e.g., `ANDROID_KEYSTORE_PATH`, `ANDROID_KEY_ALIAS`)
2. **key.properties** -- Local file at `android/key.properties` with keystore path and credentials
3. **Debug keystore** -- Fallback for development builds when no release signing is configured

The build system checks each tier in order and uses the first available configuration.

## Local Build Script

For automated local release builds across platforms:

```bash
# Run the local build script
./scripts/build-release.sh
```

This script handles the full build pipeline including dependency resolution, code generation, and platform-specific packaging.

## Environment Variables

```bash
# Build with specific environment
flutter run --dart-define=API_URL=https://api.example.com

# Multiple defines
flutter run \
  --dart-define=API_URL=https://api.example.com \
  --dart-define=DEBUG_MODE=true
```
