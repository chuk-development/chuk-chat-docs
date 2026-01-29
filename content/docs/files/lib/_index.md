---
title: "lib/ Directory"
weight: 1
---

The `lib/` directory contains all Dart source code for Chuk Chat. It is organized into subdirectories by concern, with a few root-level files for app entry and configuration.

## Structure

```
lib/
├── main.dart                  # App entry point
├── constants.dart             # Default colors, theme, grain settings
├── supabase_config.dart       # Supabase credentials loader
├── platform_config.dart       # Compile-time platform detection
├── env_loader.dart            # Runtime .env loader (desktop)
├── model_selector_page.dart   # Legacy model selector page
├── progress_bar.dart          # Standalone progress bar demo
├── constants/                 # Domain-specific constants
│   └── file_constants.dart
├── core/                      # Core event infrastructure
│   └── model_selection_events.dart
├── models/                    # Data models
├── pages/                     # Full-screen page widgets
├── services/                  # Business logic and API services
├── utils/                     # Utility functions and helpers
├── widgets/                   # Reusable UI components
└── platform_specific/         # Platform-adaptive layouts and chat UI
```

## Subdirectories

| Directory | Files | Description |
|-----------|-------|-------------|
| `constants/` | 1 | File handling constants (max size, allowed extensions) |
| `core/` | 1 | Event bus for model selection changes |
| `models/` | 5 | Data classes: ChatMessage, ChatModel, ChatStreamEvent, Project, StoredChat |
| `pages/` | 16+ | Full-screen pages: login, settings, projects, pricing, etc. |
| `services/` | 48 | All business logic: auth, chat storage, encryption, streaming, etc. |
| `utils/` | 23 | Helpers: rate limiting, certificate pinning, validators, theme extensions |
| `widgets/` | 14 | Reusable components: message bubble, dropdowns, viewers |
| `platform_specific/` | 12+ | Desktop/mobile wrappers, sidebars, chat UI, handlers |
