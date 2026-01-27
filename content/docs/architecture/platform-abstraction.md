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
| Web | Variable | Responsive |

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

## Best Practices

1. **Share business logic** - Keep services platform-agnostic
2. **Isolate UI code** - Platform-specific UI in separate files
3. **Use conditional imports** - Compile-time platform selection
4. **Test on all platforms** - Verify behavior across devices
