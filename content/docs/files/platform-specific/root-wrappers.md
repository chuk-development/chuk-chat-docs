---
title: Root Wrappers
weight: 1
---

Root wrappers provide the top-level app shell with platform-adaptive navigation. The conditional export pattern ensures only the relevant platform code is included in the final binary.

## Files

| File | Widget/Export | Description |
|------|---------------|-------------|
| `root_wrapper.dart` | `RootWrapper` | Conditional export: imports `root_wrapper_io.dart` on native platforms, `root_wrapper_stub.dart` on web. |
| `root_wrapper_io.dart` | `RootWrapper` | Platform detection for `dart:io` targets. Routes to `RootWrapperDesktop` or `RootWrapperMobile` based on compile-time flags or runtime detection. |
| `root_wrapper_desktop.dart` | `RootWrapperDesktop` | Desktop/tablet layout: persistent sidebar, resizable chat panel, navigation between Chat, Projects, Media, and Settings. |
| `root_wrapper_mobile.dart` | `RootWrapperMobile` | Mobile layout: bottom navigation bar, drawer sidebar, full-screen chat view. Handles Android permissions on startup. |
| `root_wrapper_stub.dart` | `RootWrapper` | Web stub: renders `RootWrapperDesktop` directly. Web is treated as a desktop-class environment and receives the full 3-panel layout (sidebar, chat content, project panel) rather than a "platform not supported" placeholder. |

## Platform Resolution

```
root_wrapper.dart
  |-- (dart:io available) --> root_wrapper_io.dart
  |     |-- PLATFORM_DESKTOP=true --> RootWrapperDesktop
  |     |-- PLATFORM_MOBILE=true  --> RootWrapperMobile
  |     +-- auto-detect           --> Desktop or Mobile based on OS
  +-- (web)                --> root_wrapper_stub.dart --> RootWrapperDesktop
```

## Props

Both desktop and mobile wrappers receive the same set of theme and preference props from `main.dart`:

- Theme: `currentThemeMode`, `currentAccentColor`, `currentIconFgColor`, `currentBgColor`, `grainEnabled`
- Theme setters: `setThemeMode`, `setAccentColor`, `setIconFgColor`, `setBgColor`, `setGrainEnabled`
- Preferences: `showReasoningTokens`, `showModelInfo`, `showTps`, `autoSendVoiceTranscription`
- Image generation: `imageGenEnabled`, `imageGenDefaultSize`, custom dimensions
