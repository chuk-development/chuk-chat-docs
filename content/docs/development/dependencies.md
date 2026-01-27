---
title: Dependencies
weight: 8
---

Managing dependencies in Chuk Chat.

## Core Dependencies

### Framework & UI

| Package | Version | Purpose |
|---------|---------|---------|
| `flutter` | SDK | UI framework |
| `cupertino_icons` | ^1.0.6 | iOS-style icons |

### State Management

| Package | Version | Purpose |
|---------|---------|---------|
| `provider` | ^6.1.1 | Dependency injection |

### Networking

| Package | Version | Purpose |
|---------|---------|---------|
| `dio` | ^5.4.0 | HTTP client |
| `web_socket_channel` | ^2.4.0 | WebSocket support |

### Storage

| Package | Version | Purpose |
|---------|---------|---------|
| `shared_preferences` | ^2.2.2 | Key-value storage |
| `path_provider` | ^2.1.2 | File paths |
| `sqflite` | ^2.3.2 | SQLite database |

### Backend

| Package | Version | Purpose |
|---------|---------|---------|
| `supabase_flutter` | ^2.3.4 | Supabase client |

### Security

| Package | Version | Purpose |
|---------|---------|---------|
| `encrypt` | ^5.0.3 | AES encryption |
| `crypto` | ^3.0.3 | Hashing utilities |

### Media

| Package | Version | Purpose |
|---------|---------|---------|
| `image_picker` | ^1.0.7 | Image selection |
| `file_picker` | ^6.1.1 | File selection |
| `record` | ^5.0.4 | Audio recording |
| `flutter_image_compress` | ^2.1.0 | Image compression |

## Adding Dependencies

```bash
# Add a package
flutter pub add package_name

# Add dev dependency
flutter pub add --dev package_name

# Add specific version
flutter pub add package_name:^1.2.3

# Update dependencies
flutter pub upgrade

# Update to latest compatible versions
flutter pub upgrade --major-versions
```

## pubspec.yaml

```yaml
name: chuk_chat
description: Privacy-first AI chat application
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # UI
  cupertino_icons: ^1.0.6

  # Networking
  dio: ^5.4.0
  web_socket_channel: ^2.4.0

  # Storage
  shared_preferences: ^2.2.2
  path_provider: ^2.1.2
  sqflite: ^2.3.2

  # Backend
  supabase_flutter: ^2.3.4

  # Security
  encrypt: ^5.0.3
  crypto: ^3.0.3

  # Media
  image_picker: ^1.0.7
  file_picker: ^6.1.1
  record: ^5.0.4

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.1
  mockito: ^5.4.4
  build_runner: ^2.4.8

flutter:
  uses-material-design: true
```

## Dependency Resolution

```bash
# Check outdated packages
flutter pub outdated

# Resolve conflicts
flutter pub upgrade --dry-run

# Force resolution
flutter pub get --enforce-lockfile
```

## Version Constraints

| Constraint | Meaning | Example |
|------------|---------|---------|
| `^1.2.3` | Compatible with 1.2.3 | 1.2.3 to <2.0.0 |
| `>=1.2.3 <2.0.0` | Range | 1.2.3 to 1.x.x |
| `any` | Any version | Not recommended |
| `1.2.3` | Exact version | Only 1.2.3 |

## Best Practices

1. **Use caret syntax** (`^`) for most dependencies
2. **Pin critical dependencies** for production stability
3. **Check changelogs** before major updates
4. **Run tests** after updating dependencies
5. **Commit pubspec.lock** for reproducible builds

## Troubleshooting

```bash
# Clear pub cache
flutter pub cache clean

# Full reset
flutter clean
flutter pub get

# Check for conflicts
flutter pub deps
```
