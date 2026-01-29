---
title: Configuration Files
weight: 4
---

Configuration files in the Chuk Chat project root control build settings, analysis rules, CI/CD, and runtime behavior.

## Project Configuration

| File | Description |
|------|-------------|
| `pubspec.yaml` | Flutter project manifest: dependencies, assets, app metadata |
| `pubspec.lock` | Locked dependency versions for reproducible builds |
| `analysis_options.yaml` | Dart analyzer rules and lint configuration |
| `devtools_options.yaml` | Flutter DevTools configuration |

## Build & CI/CD

| File | Description |
|------|-------------|
| `codemagic.yaml` | Codemagic CI/CD pipeline configuration (build, test, deploy) |
| `coderabbit.yaml` | CodeRabbit AI code review configuration |
| `build.sh` | Shell script for building release artifacts |
| `build_flatpak.sh` | Shell script for building Linux Flatpak packages |

## Platform Packaging

| File | Description |
|------|-------------|
| `dev.chuk.chat.yml` | Flatpak manifest for Linux distribution |
| `generate_icons.py` | Python script to generate app icons for all platforms |

## Runtime Configuration

| File | Description |
|------|-------------|
| `lib/supabase_config.dart` | Supabase URL and anon key, loaded from `--dart-define` or `.env` file |
| `lib/platform_config.dart` | Compile-time platform detection flags (`PLATFORM_MOBILE`, `PLATFORM_DESKTOP`) for tree-shaking |
| `lib/env_loader.dart` | Runtime `.env` file loader for desktop local development |
| `lib/constants.dart` | App-wide default values: colors, theme mode, grain settings |
| `lib/constants/file_constants.dart` | File handling constants: max size (10 MB), allowed extensions, MIME types |

## Supabase Configuration

Credentials are resolved in priority order:

1. Compile-time `--dart-define` flags (production)
2. Runtime `.env` file (desktop development only)

```bash
# Production build
flutter build apk \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key

# Local development (create .env in project root)
cp .env.example .env
flutter run -d linux
```

## Platform Config & Tree-Shaking

`platform_config.dart` defines compile-time constants that enable the Dart compiler to eliminate unused platform code:

```bash
# Desktop-only build (excludes mobile code)
flutter build linux --dart-define=PLATFORM_DESKTOP=true --tree-shake-icons

# Mobile-only build (excludes desktop code)
flutter build apk --dart-define=PLATFORM_MOBILE=true --tree-shake-icons
```

When neither flag is set, platform is auto-detected at runtime.
