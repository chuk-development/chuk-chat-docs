---
title: Root Files
weight: 1
---

Root-level files in `lib/` handle app initialization, configuration, and platform detection.

## Files

| File | Description |
|------|-------------|
| `main.dart` | App entry point. Initializes Supabase, loads preferences, sets up theme, and renders `RootWrapper` or `LoginPage` via `AuthGate`. |
| `constants.dart` | App-wide defaults: `kDefaultBgColor`, `kDefaultAccentColor`, `kDefaultIconFgColor`, `kDefaultThemeMode`, `kDefaultGrainEnabled`, `kDefaultShowReasoningTokens`. |
| `supabase_config.dart` | Loads Supabase URL and anon key from `--dart-define` compile-time variables or runtime `.env` file. |
| `platform_config.dart` | Compile-time platform flags (`kPlatformMobile`, `kPlatformDesktop`) for tree-shaking. Auto-detects when not explicitly set. |
| `env_loader.dart` | Reads `.env` file from project root at runtime on desktop platforms. Provides `EnvLoader` with a static map of key-value pairs. |
| `model_selector_page.dart` | Legacy full-screen model selector page. Fetches available models from the API and allows the user to pick one. |
| `progress_bar.dart` | Standalone progress bar demo widget (not used in main app flow). |

## constants/

| File | Description |
|------|-------------|
| `file_constants.dart` | `FileConstants` class with static values: `maxFileSizeBytes` (10 MB), `maxConcurrentUploads` (5), file extension classification methods (`isPlainText`, `requiresConversion`). |

## core/

| File | Description |
|------|-------------|
| `model_selection_events.dart` | `ModelSelectionEventBus` singleton. Broadcasts model selection changes and refresh events via `StreamController`, decoupling services from UI widgets. |
