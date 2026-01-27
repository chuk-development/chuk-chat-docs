---
title: File Reference
weight: 8
---

# Complete File Reference

This section provides a comprehensive reference for all 114 Dart files in the Chuk Chat codebase, organized by directory and purpose.

## Codebase Statistics

| Category | Count |
|----------|-------|
| Total Dart Files | 114 |
| Models | 6 |
| Services | 35+ |
| Pages | 13 |
| Widgets | 14 |
| Utils | 16 |
| Platform-Specific | 15+ |

## Directory Overview

### [lib/](lib/)

The main application code resides in the `lib/` directory:

- **[Root Files](lib/root-files/)** - Application entry point, constants, and configuration
- **[Models](lib/models/)** - Data models for messages, chats, projects, and more
- **[Pages](lib/pages/)** - Full-screen views and settings interfaces
- **[Widgets](lib/widgets/)** - Reusable UI components
- **[Utils](lib/utils/)** - Helper functions, validators, and utilities

### [Platform-Specific](platform-specific/)

Platform-specific implementations for adaptive UI:

- **[Root Wrappers](platform-specific/root-wrappers/)** - Conditional platform detection and layout
- **[Sidebars](platform-specific/sidebars/)** - Desktop and mobile navigation implementations
- **[Chat UI](platform-specific/chat-ui/)** - Desktop and mobile chat interfaces
- **[Chat Handlers](platform-specific/chat-handlers/)** - Mobile-specific handler pattern implementations

### [Platform Directories](platform-directories/)

Native platform configuration and build files:

- `android/` - Android build configuration and manifest
- `ios/` - iOS Xcode project and Info.plist
- `linux/` - CMake configuration for Linux builds
- `windows/` - CMake configuration for Windows builds
- `macos/` - Xcode project for macOS builds

### [Configuration Files](config-files/)

Project-level configuration:

- `pubspec.yaml` - Flutter dependencies and metadata
- `analysis_options.yaml` - Dart linter rules
- Build scripts and environment configuration

## File Organization Philosophy

The codebase follows a **feature-first** organization within a **layered architecture**:

1. **Models** define data structures
2. **Services** handle business logic and data access
3. **Pages** compose widgets into full screens
4. **Widgets** provide reusable UI components
5. **Utils** offer shared helper functionality

Platform-specific code is isolated in `platform_specific/` to allow adaptive UI without polluting the core logic.

## Navigation

Use the sidebar to navigate to specific sections, or explore:

{{< cards >}}
  {{< card link="lib" title="lib/ Directory" subtitle="Core application code" >}}
  {{< card link="platform-specific" title="Platform-Specific" subtitle="Adaptive UI implementations" >}}
  {{< card link="platform-directories" title="Platform Directories" subtitle="Native build configuration" >}}
  {{< card link="config-files" title="Configuration" subtitle="Build and lint configuration" >}}
{{< /cards >}}
