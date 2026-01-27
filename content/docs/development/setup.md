---
title: Setup
weight: 1
---

# Development Environment Setup

This guide walks you through setting up a complete development environment for Chuk Chat.

## Prerequisites

### Required Tools

| Tool | Version | Notes |
|------|---------|-------|
| Dart SDK | >=3.9.2 | Included with Flutter |
| Flutter SDK | >=3.35.0 | [Install Flutter](https://flutter.dev/docs/get-started/install) |
| Go | >=1.20 | For Hugo module documentation |
| Git | Latest | Version control |

### Platform-Specific Requirements

Each platform requires additional tooling for native compilation:

{{< tabs items="Linux,Windows,macOS,Android,iOS" >}}

{{< tab >}}
**Linux Requirements:**

Install the required development packages:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y \
  clang \
  cmake \
  ninja-build \
  pkg-config \
  libgtk-3-dev \
  liblzma-dev \
  libstdc++-12-dev

# Fedora
sudo dnf install -y \
  clang \
  cmake \
  ninja-build \
  pkgconfig \
  gtk3-devel \
  xz-devel \
  libstdc++-devel

# Arch Linux
sudo pacman -S --needed \
  clang \
  cmake \
  ninja \
  pkgconf \
  gtk3 \
  xz
```

Verify your setup:

```bash
flutter doctor
```
{{< /tab >}}

{{< tab >}}
**Windows Requirements:**

1. **Visual Studio 2022** with the following workloads:
   - "Desktop development with C++"
   - Windows 10 SDK (10.0.19041.0 or later)

2. **Install via Visual Studio Installer:**
   - Open Visual Studio Installer
   - Click "Modify" on Visual Studio 2022
   - Select "Desktop development with C++"
   - Ensure "Windows 10 SDK" is checked
   - Click "Modify" to install

3. **Alternative: winget installation:**
   ```powershell
   winget install Microsoft.VisualStudio.2022.Community --silent --override "--wait --quiet --add Microsoft.VisualStudio.Workload.NativeDesktop --includeRecommended"
   ```

Verify your setup:

```powershell
flutter doctor
```
{{< /tab >}}

{{< tab >}}
**macOS Requirements:**

1. **Xcode 15 or later:**
   ```bash
   # Install from App Store or:
   xcode-select --install
   ```

2. **Accept Xcode license:**
   ```bash
   sudo xcodebuild -license accept
   ```

3. **CocoaPods (for iOS development):**
   ```bash
   sudo gem install cocoapods
   # Or using Homebrew
   brew install cocoapods
   ```

Verify your setup:

```bash
flutter doctor
```
{{< /tab >}}

{{< tab >}}
**Android Requirements:**

1. **Android Studio** (latest version)
   - Download from [developer.android.com](https://developer.android.com/studio)

2. **Android SDK** (API level 21 or higher)
   - Open Android Studio > SDK Manager
   - Install Android SDK Platform 21+
   - Install Android SDK Build-Tools
   - Install Android SDK Command-line Tools

3. **Configure Flutter:**
   ```bash
   flutter config --android-sdk /path/to/android/sdk
   ```

4. **Accept licenses:**
   ```bash
   flutter doctor --android-licenses
   ```

Verify your setup:

```bash
flutter doctor
```
{{< /tab >}}

{{< tab >}}
**iOS Requirements:**

1. **macOS** (required for iOS development)

2. **Xcode 15 or later:**
   ```bash
   xcode-select --install
   sudo xcodebuild -license accept
   ```

3. **CocoaPods:**
   ```bash
   sudo gem install cocoapods
   pod setup
   ```

4. **iOS Simulator** (optional but recommended):
   - Open Xcode > Preferences > Components
   - Download iOS Simulator runtime

Verify your setup:

```bash
flutter doctor
```
{{< /tab >}}

{{< /tabs >}}

---

## Repository Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/chuk_chat.git
cd chuk_chat
```

For development with a fork:

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/chuk_chat.git
cd chuk_chat

# Add upstream remote
git remote add upstream https://github.com/your-org/chuk_chat.git

# Verify remotes
git remote -v
```

### 2. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
# Required: Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Optional: Additional Configuration
# DEBUG_MODE=true
# LOG_LEVEL=verbose
```

{{< callout type="warning" >}}
**Security Note:** Never commit your `.env` file to version control. It's already included in `.gitignore`.
{{< /callout >}}

### 3. Install Dependencies

```bash
flutter pub get
```

This command downloads all Dart/Flutter packages defined in `pubspec.yaml`.

If you encounter issues:

```bash
# Clean and reinstall
flutter clean
flutter pub get

# Update outdated packages
flutter pub upgrade
```

---

## Running the Application

### Quick Start with run.sh

The project includes a convenience script for common operations:

```bash
# Linux Desktop
./run.sh linux

# macOS Desktop
./run.sh macos

# Windows Desktop
./run.sh windows

# Android
./run.sh android

# iOS
./run.sh ios

# Web
./run.sh web
```

### Direct Flutter Commands

```bash
# Linux Desktop
flutter run -d linux

# macOS Desktop
flutter run -d macos

# Windows Desktop
flutter run -d windows

# Android (with connected device or emulator)
flutter run -d android

# iOS (macOS only, with simulator or device)
flutter run -d ios

# Web (Chrome)
flutter run -d chrome
```

### Hot Reload Development

For the best development experience with hot reload:

```bash
# Start with hot reload enabled (default in debug mode)
flutter run -d linux

# Press 'r' in terminal to hot reload
# Press 'R' to hot restart
# Press 'q' to quit
```

### Running on Specific Devices

List available devices:

```bash
flutter devices
```

Run on a specific device:

```bash
# By device name
flutter run -d "Pixel 6"

# By device ID
flutter run -d emulator-5554
```

---

## IDE Setup

### VS Code (Recommended)

1. **Install extensions:**
   - Flutter
   - Dart
   - Flutter Widget Snippets (optional)

2. **Configure launch.json:**
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "chuk_chat",
         "request": "launch",
         "type": "dart",
         "program": "lib/main.dart"
       },
       {
         "name": "chuk_chat (profile mode)",
         "request": "launch",
         "type": "dart",
         "flutterMode": "profile"
       },
       {
         "name": "chuk_chat (release mode)",
         "request": "launch",
         "type": "dart",
         "flutterMode": "release"
       }
     ]
   }
   ```

### Android Studio / IntelliJ IDEA

1. **Install plugins:**
   - Flutter plugin (includes Dart)

2. **Open project:**
   - File > Open > Select `chuk_chat` directory

3. **Configure SDK:**
   - File > Settings > Languages & Frameworks > Flutter
   - Set Flutter SDK path

### Verification

After setup, verify everything is working:

```bash
# Check Flutter installation
flutter doctor -v

# Run tests
flutter test

# Analyze code
flutter analyze
```

All checks should pass before you start development.
