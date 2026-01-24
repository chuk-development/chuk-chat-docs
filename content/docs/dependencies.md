---
title: Dependencies
weight: 9
---

# Abhängigkeiten

## Übersicht

| Kategorie | Anzahl |
|-----------|--------|
| Direkte Dependencies | 25 |
| Dev Dependencies | 2 |
| Transitive Dependencies | 130+ |
| **Gesamt** | ~157 Pakete |

---

## Haupt-Dependencies

### Backend & Authentication

| Package | Version | Zweck |
|---------|---------|-------|
| `supabase_flutter` | ^2.10.3 | Backend-as-a-Service (Auth, DB, Storage) |
| `http` | ^1.5.0 | Simple HTTP Client |
| `dio` | ^5.4.0 | Advanced HTTP Client mit Interceptors |
| `web_socket_channel` | ^3.0.1 | WebSocket Support |

### Security & Encryption

| Package | Version | Zweck |
|---------|---------|-------|
| `cryptography` | ^2.7.0 | AES-256-GCM Verschlüsselung |
| `flutter_secure_storage` | ^9.2.4 | Secure Key Storage (Keychain) |

### Storage

| Package | Version | Zweck |
|---------|---------|-------|
| `shared_preferences` | ^2.5.3 | Local Key-Value Storage |
| `path_provider` | ^2.1.4 | Device Directories |

### File & Media Handling

| Package | Version | Zweck |
|---------|---------|-------|
| `file_picker` | ^10.3.3 | Native File Browser |
| `image_picker` | ^1.1.2 | Camera/Photo Library Access |
| `image` | ^4.3.0 | Image Processing |
| `pdfx` | ^2.8.0 | PDF Viewing |
| `archive` | ^4.0.7 | ZIP Compression |
| `record` | ^6.1.2 | Audio Recording |
| `desktop_drop` | ^0.7.0 | Drag-and-Drop (Desktop) |

### UI & Content Rendering

| Package | Version | Zweck |
|---------|---------|-------|
| `flutter_svg` | ^2.2.2 | SVG Rendering |
| `markdown` | ^7.3.0 | Markdown Parsing |
| `markdown_widget` | ^2.3.2+8 | Markdown Widget |
| `flutter_math_fork` | ^0.7.2 | LaTeX/Math Rendering |
| `highlight` | ^0.7.0 | Syntax Highlighting |
| `cupertino_icons` | ^1.0.8 | iOS-Style Icons |

### Device Interaction

| Package | Version | Zweck |
|---------|---------|-------|
| `permission_handler` | ^12.0.1 | Berechtigungen |
| `share_plus` | ^12.0.1 | Share to other Apps |
| `package_info_plus` | ^9.0.0 | App Version Info |
| `url_launcher` | ^6.3.0 | URLs öffnen |

### Background & Notifications

| Package | Version | Zweck |
|---------|---------|-------|
| `flutter_foreground_task` | ^8.11.0 | Background Keep-Alive |
| `flutter_local_notifications` | ^18.0.1 | Local Push Notifications |

### Utilities

| Package | Version | Zweck |
|---------|---------|-------|
| `uuid` | ^4.5.2 | UUID Generation |

---

## Dev Dependencies

| Package | Version | Zweck |
|---------|---------|-------|
| `flutter_test` | SDK | Testing Framework |
| `flutter_lints` | ^6.0.0 | Lint Rules |

---

## Wichtige Transitive Dependencies

### Supabase Ecosystem

| Package | Beschreibung |
|---------|--------------|
| `gotrue` | JWT-basierte Authentifizierung |
| `postgrest` | PostgreSQL API Client |
| `realtime_client` | Real-time Subscriptions |
| `storage_client` | File Storage |
| `functions_client` | Serverless Functions |

### Platform Implementations

Jedes Plugin hat plattformspezifische Implementierungen:

```
flutter_secure_storage_linux
flutter_secure_storage_macos
flutter_secure_storage_windows
flutter_secure_storage_web

shared_preferences_android
shared_preferences_linux
shared_preferences_windows
...
```

### Async & Streams

| Package | Beschreibung |
|---------|--------------|
| `async` | Async Utilities |
| `rxdart` | ReactiveX für Dart |
| `provider` | State Management |

---

## Version Constraints

```yaml
environment:
  sdk: ^3.9.2
  flutter: ">=3.35.0"
```

---

## Dependency Management

### Update prüfen

```bash
flutter pub outdated
```

### Aktualisieren

```bash
flutter pub upgrade
```

### Spezifisches Package aktualisieren

```bash
flutter pub upgrade package_name
```

### Lock-File regenerieren

```bash
flutter pub get
```

---

## Kategorien nach Funktion

```
┌─────────────────────────────────────────────────────────┐
│                    CHUK_CHAT                            │
├─────────────────────────────────────────────────────────┤
│  Backend (4)        │  Media (7)        │  UI (6)       │
│  - supabase_flutter │  - file_picker    │  - flutter_svg│
│  - http             │  - image_picker   │  - markdown   │
│  - dio              │  - image          │  - markdown_* │
│  - web_socket_*     │  - pdfx           │  - math_fork  │
│                     │  - archive        │  - highlight  │
│                     │  - record         │  - cupertino_*│
│                     │  - desktop_drop   │               │
├─────────────────────┼───────────────────┼───────────────┤
│  Security (2)       │  Device (5)       │  Background(2)│
│  - cryptography     │  - permission_*   │  - foreground_│
│  - secure_storage   │  - share_plus     │  - local_notif│
│                     │  - package_info   │               │
│                     │  - url_launcher   │               │
│                     │  - path_provider  │               │
├─────────────────────┼───────────────────┼───────────────┤
│  Storage (2)        │  Utils (1)        │               │
│  - shared_prefs     │  - uuid           │               │
│  - path_provider    │                   │               │
└─────────────────────┴───────────────────┴───────────────┘
```

---

## Architektur-Insights

1. **Real-time Chat**: Supabase + WebSocket für Echtzeit-Messaging
2. **Media-Rich**: Umfassende Bild-, PDF-, Audio-Unterstützung
3. **Cross-Platform**: Plattformspezifische Implementierungen für alle OS
4. **Offline Support**: Secure Storage + SharedPreferences
5. **Advanced UI**: Markdown, LaTeX, Syntax Highlighting
6. **Background Operation**: Foreground Service für Streaming
