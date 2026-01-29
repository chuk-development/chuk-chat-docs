---
title: Platform Abstraction
weight: 3
---

Chuk Chat uses a platform abstraction layer to provide optimized experiences for desktop and mobile platforms.

## Platform Detection

The app detects the platform at runtime using conditional imports:

```dart
// root_wrapper.dart
export 'root_wrapper_stub.dart'
    if (dart.library.io) 'root_wrapper_io.dart';
```

### Platform Categories

| Platform | Category | Layout |
|----------|----------|--------|
| Windows | Desktop | 3-panel |
| macOS | Desktop | 3-panel |
| Linux | Desktop | 3-panel |
| iOS | Mobile | Single-panel |
| Android | Mobile | Single-panel |
| Web | Desktop | 3-panel |

## Abstraction Pattern

### Root Wrapper System

```
root_wrapper.dart (conditional export)
    ├── root_wrapper_io.dart (platform detection)
    │   ├── root_wrapper_desktop.dart (3-panel layout)
    │   └── root_wrapper_mobile.dart (slide-out layout)
    └── root_wrapper_stub.dart (web fallback)
```

### Implementation Example

```dart
// root_wrapper_io.dart
import 'dart:io';

Widget buildRootWrapper() {
  if (Platform.isWindows || Platform.isMacOS || Platform.isLinux) {
    return const DesktopRootWrapper();
  } else {
    return const MobileRootWrapper();
  }
}
```

## Desktop Implementation

Desktop uses a fixed 3-panel layout:

```
┌──────────┬─────────────────────┬───────────┐
│          │                     │           │
│ Sidebar  │    Chat Content     │  Project  │
│          │                     │   Panel   │
│  (fixed) │    (scrollable)     │ (optional)│
│          │                     │           │
├──────────┴─────────────────────┴───────────┤
│              Input Area                     │
└─────────────────────────────────────────────┘
```

**Key files:**
- `root_wrapper_desktop.dart` - Layout container
- `sidebar_desktop.dart` - Fixed navigation
- `chat_ui_desktop.dart` - Chat interface (~124KB)

## Mobile Implementation

Mobile uses a single-panel with slide-out navigation:

```
┌─────────────────────────────────────────────┐
│  ☰  Chat Title                    ⚙️        │
├─────────────────────────────────────────────┤
│                                             │
│              Chat Content                   │
│             (scrollable)                    │
│                                             │
├─────────────────────────────────────────────┤
│  📎  Message input...              🎤  ➤   │
└─────────────────────────────────────────────┘

┌─────────┐
│ Drawer  │  ← Slide-out sidebar
│ (hidden)│
└─────────┘
```

**Key files:**
- `root_wrapper_mobile.dart` - Layout container
- `sidebar_mobile.dart` - Slide-out drawer
- `chat_ui_mobile.dart` - Chat interface (~102KB)

## Shared Components

Components shared between platforms:

| Component | Location | Purpose |
|-----------|----------|---------|
| `ChatApiService` | `chat/chat_api_service.dart` | API abstraction |
| Message handlers | `chat/handlers/` | Business logic |
| Data models | `lib/models/` | Shared data structures |

## Platform-Specific Widgets

```
platform_specific/
├── chat/
│   ├── widgets/
│   │   ├── desktop_chat_widgets.dart
│   │   └── mobile_chat_widgets.dart
```

### Desktop Widgets
- Fixed-width message bubbles
- Hover interactions
- Keyboard shortcuts

### Mobile Widgets
- Full-width message bubbles
- Touch gestures
- Bottom sheet menus

## Web Platform Support

Chuk Chat supports web as a first-class platform by using conditional exports and stub files to replace native-only (`dart:io`) dependencies at compile time. On the web, the app renders the desktop 3-panel layout.

### Conditional Exports Pattern

Dart's conditional exports select the correct implementation file at compile time based on library availability:

```dart
// io_helper.dart
export 'io_helper_stub.dart'
    if (dart.library.io) 'io_helper_io.dart';
```

When `dart:io` is available (native platforms), `io_helper_io.dart` re-exports real `File`, `Directory`, and `Platform` classes. On web, `io_helper_stub.dart` is selected instead, providing lightweight stubs so that `dart:io`-dependent code compiles without changes.

### io_helper Stubs

`io_helper_stub.dart` defines stub classes that mirror the `dart:io` API surface used by Chuk Chat:

| Stub Class | Behavior |
|------------|----------|
| `File` | All read/write operations return empty values or `false` |
| `Directory` | `existsSync()` returns `false`, `create()` is a no-op |
| `Platform` | `operatingSystem` returns `'web'`; all `isX` getters return `false` |

This allows any code importing `io_helper.dart` to reference `File`, `Directory`, and `Platform` without `#if` guards or separate code paths.

### Package Stubs

Several native-only packages are replaced with stub implementations on web:

| Stub File | Real Package | Web Behavior |
|-----------|--------------|--------------|
| `desktop_drop_stub.dart` | `desktop_drop` | No-op drop target widget |
| `path_provider_stub.dart` | `path_provider` | Returns empty directory paths |
| `permission_handler_stub.dart` | `permission_handler` | All permissions granted |
| `record_stub.dart` | `record` | Recording unavailable |

Each stub follows the same conditional export pattern, keeping the import site unchanged across platforms.

### Service Splits

Services that depend on native capabilities are split into platform-specific files:

| Service | Native File | Web Stub | Web Behavior |
|---------|-------------|----------|--------------|
| `api_config_service` | `api_config_service_io.dart` | `api_config_service_stub.dart` | Returns `'web'` for platform identifier |
| `notification_service` | `notification_service_io.dart` | `notification_service_stub.dart` | All no-ops; `requestPermission()` returns `true` |
| `streaming_foreground_service` | `streaming_foreground_service_io.dart` | `streaming_foreground_service_stub.dart` | No-op (web has no foreground service concept) |
| `streaming_manager` | `streaming_manager_io.dart` | `streaming_manager_stub.dart` | Full streaming logic without notification or foreground service integration |

### Web Layout

Web uses the desktop layout. `root_wrapper_stub.dart` delegates directly to `RootWrapperDesktop`, giving web users the full 3-panel experience (sidebar, chat content, project panel).

### File Handling on Web

`chat_ui_desktop.dart` checks `kIsWeb` from `package:flutter/foundation.dart` to adjust file handling behavior:

- **Upload**: Files are sent as raw bytes instead of file paths (web has no filesystem access)
- **Download**: File save dialogs are replaced with browser-native download triggers
- **Drag and drop**: `desktop_drop` is stubbed; web uses HTML5 drop events where available

## Web Audio Recording

The `record` package natively supports web via the browser's MediaRecorder API, so no stub is needed for audio capture on web.

### How It Works

On web, `record` returns a blob URL instead of a file path. The app fetches the blob as a `Uint8List` and uploads the raw bytes directly:

```dart
// Web: blob URL → fetch as bytes → upload
final blobUrl = await recorder.stop();
final bytes = await fetchBlobAsBytes(blobUrl);
await chatApiService.transcribeAudioBytes(bytes, filename: 'recording.webm');
```

The `ChatApiService.transcribeAudioBytes()` method sends the byte data as a multipart upload, bypassing the need for filesystem access.

### Recording Format

| Property | Value |
|----------|-------|
| Container | WebM |
| Codec | Opus |
| Sample Rate | 16 kHz |
| Bit Rate | 64 kbps |

### Platform Comparison

| Platform | Recording Flow | Upload Method |
|----------|---------------|---------------|
| Desktop / Mobile | File path from `record` | `MultipartFile.fromFile()` |
| Web | Blob URL from `record` | `MultipartFile.fromBytes()` via `transcribeAudioBytes()` |

The desktop and mobile file-based recording flow is unchanged. The web-specific path only activates when `kIsWeb` is `true`.

## Best Practices

1. **Share business logic** - Keep services platform-agnostic
2. **Isolate UI code** - Platform-specific UI in separate files
3. **Use conditional imports** - Compile-time platform selection
4. **Test on all platforms** - Verify behavior across devices
5. **Use stubs for web** - Provide no-op or minimal implementations for native-only packages
6. **Check `kIsWeb` sparingly** - Prefer conditional exports over runtime checks; use `kIsWeb` only for minor behavioral tweaks within shared UI code
