---
title: Platform-Specific Code
weight: 2
---

The `platform_specific/` directory contains implementations that adapt the UI for different platforms (desktop vs mobile).

## Overview

Chuk Chat uses a platform-adaptive architecture to provide optimized experiences:

| Platform | Layout | Navigation | Chat UI |
|----------|--------|------------|---------|
| Desktop | 3-panel fixed | Fixed sidebar | `chat_ui_desktop.dart` |
| Mobile | Single panel | Slide-out drawer | `chat_ui_mobile.dart` |

## Directory Structure

```
platform_specific/
├── root_wrapper.dart              # Conditional export
├── root_wrapper_io.dart           # IO platform detection
├── root_wrapper_desktop.dart      # Desktop 3-panel layout
├── root_wrapper_mobile.dart       # Mobile slide-out layout
├── root_wrapper_stub.dart         # Web stub
├── sidebar_desktop.dart           # Fixed desktop navigation
├── sidebar_mobile.dart            # Slide-out mobile drawer
└── chat/
    ├── chat_ui_desktop.dart       # Desktop chat interface (~124KB)
    ├── chat_ui_mobile.dart        # Mobile chat interface (~102KB)
    ├── chat_api_service.dart      # Chat API abstraction
    ├── widgets/
    │   ├── desktop_chat_widgets.dart
    │   └── mobile_chat_widgets.dart
    └── handlers/
        ├── streaming_message_handler.dart
        ├── chat_persistence_handler.dart
        ├── file_attachment_handler.dart
        ├── audio_recording_handler.dart
        └── message_actions_handler.dart
```

## Architecture

### Platform Detection

The root wrapper system uses conditional imports to select the appropriate layout:

```dart
// root_wrapper.dart
export 'root_wrapper_stub.dart'
    if (dart.library.io) 'root_wrapper_io.dart';
```

### Desktop Layout

Desktop uses a fixed 3-panel layout:
- Left: Sidebar with chat list and navigation
- Center: Chat conversation
- Right: Optional project panel

### Mobile Layout

Mobile uses a single panel with slide-out navigation:
- Main: Chat conversation
- Drawer: Slide-out sidebar
- Bottom: Input area with toolbar

## Key Files

### Root Wrappers

Handle platform detection and layout selection:

| File | Purpose |
|------|---------|
| `root_wrapper.dart` | Conditional export based on platform |
| `root_wrapper_io.dart` | IO platform detection logic |
| `root_wrapper_desktop.dart` | 3-panel desktop layout |
| `root_wrapper_mobile.dart` | Slide-out mobile layout |
| `root_wrapper_stub.dart` | Web platform stub |

### Sidebars

Platform-specific navigation implementations:

| File | Purpose |
|------|---------|
| `sidebar_desktop.dart` | Fixed desktop navigation panel |
| `sidebar_mobile.dart` | Slide-out drawer for mobile |

### Chat UI

The largest files in the codebase, containing complete chat implementations:

| File | Size | Purpose |
|------|------|---------|
| `chat_ui_desktop.dart` | ~124KB | Full desktop chat interface |
| `chat_ui_mobile.dart` | ~102KB | Full mobile chat interface |
| `chat_api_service.dart` | - | Shared API abstraction |

### Chat Handlers (Mobile)

Mobile chat uses a handler pattern to separate concerns:

| Handler | Responsibility |
|---------|----------------|
| `streaming_message_handler.dart` | Message streaming orchestration |
| `chat_persistence_handler.dart` | Save/load chat state |
| `file_attachment_handler.dart` | File and image picking |
| `audio_recording_handler.dart` | Voice recording and transcription |
| `message_actions_handler.dart` | Copy, edit, delete operations |

## Navigation

{{< cards >}}
  {{< card link="root-wrappers" title="Root Wrappers" subtitle="Platform detection and layout" >}}
  {{< card link="sidebars" title="Sidebars" subtitle="Navigation implementations" >}}
  {{< card link="chat-ui" title="Chat UI" subtitle="Desktop and mobile interfaces" >}}
  {{< card link="chat-handlers" title="Chat Handlers" subtitle="Mobile handler pattern" >}}
{{< /cards >}}
