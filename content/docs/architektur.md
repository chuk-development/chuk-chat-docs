---
title: Architektur
weight: 2
---

# Projektarchitektur

## Verzeichnisstruktur

```
chuk_chat/
├── lib/                          # Haupt-Dart-Code (114 Dateien)
│   ├── main.dart                 # App-Einstiegspunkt
│   ├── constants.dart            # Theme-Konstanten
│   ├── platform_config.dart      # Platform-Detection
│   ├── supabase_config.dart      # Supabase-Konfiguration
│   │
│   ├── models/                   # Datenmodelle
│   ├── services/                 # Business-Logik (38+ Dateien)
│   ├── pages/                    # App-Screens (13+ Dateien)
│   ├── widgets/                  # Wiederverwendbare UI-Komponenten
│   ├── platform_specific/        # Platform-spezifischer Code
│   └── utils/                    # Hilfsfunktionen
│
├── android/                      # Android-Plattform
├── ios/                          # iOS-Plattform
├── macos/                        # macOS-Plattform
├── windows/                      # Windows-Plattform
├── linux/                        # Linux-Plattform
├── web/                          # Web-Plattform
│
├── supabase/                     # Supabase-Konfiguration
├── migrations/                   # Datenbank-Migrationen
├── docs/                         # Projekt-Dokumentation
│
├── pubspec.yaml                  # Flutter-Abhängigkeiten
├── docker-compose.yaml           # Docker-Konfiguration
├── build.sh                      # Build-Script
└── run.sh                        # Entwicklungs-Script
```

## Schichtenarchitektur

```
┌─────────────────────────────────────────────────────────────┐
│                      ChukChatApp (main.dart)                │
│  - Theme State (Mode, Farben, Grain)                        │
│  - Auth State Listener                                      │
│  - Globales Lifecycle Management                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                  ┌────────┴────────┐
                  │                 │
         ┌────────▼────────┐  ┌─────▼──────────┐
         │  RootWrapper    │  │   LoginPage    │
         │  (Platform-     │  │  (Auth UI)     │
         │   Detection)    │  └────────────────┘
         └────────┬────────┘
                  │
         ┌────────┴──────────┐
         │                   │
    ┌────▼────────┐   ┌──────▼────────┐
    │chat_ui_     │   │chat_ui_       │
    │desktop.dart │   │mobile.dart    │
    └─────────────┘   └───────────────┘
                 │
    ┌────────────▼────────────────────────────────────────┐
    │                 SERVICE LAYER                       │
    ├─────────────────────────────────────────────────────┤
    │ Auth & Security     │ Chat & Storage                │
    │ - AuthService       │ - ChatStorageService          │
    │ - EncryptionService │ - StreamingManager            │
    │ - SupabaseService   │ - ChatSyncService             │
    ├─────────────────────┼───────────────────────────────┤
    │ Theme & Preferences │ Projects & Media              │
    │ - ThemeSettings*    │ - ProjectStorageService       │
    │ - Customization*    │ - ImageStorageService         │
    └─────────────────────┴───────────────────────────────┘
                 │
    ┌────────────▼──────────────────────┐
    │         DATA MODELS               │
    ├───────────────────────────────────┤
    │ - ChatMessage                     │
    │ - StoredChat                      │
    │ - Project / ProjectFile           │
    │ - ChatStreamEvent (sealed)        │
    └───────────────────────────────────┘
                 │
    ┌────────────▼──────────────────────┐
    │     EXTERNAL SERVICES             │
    ├───────────────────────────────────┤
    │ - Supabase (Auth, DB, Storage)    │
    │ - OpenRouter (AI Models)          │
    │ - FlutterSecureStorage (Keys)     │
    └───────────────────────────────────┘
```

## Platform-Abstraktion

Das Projekt nutzt **Conditional Imports** für plattformspezifischen Code mit Tree-Shaking:

```dart
// lib/platform_specific/root_wrapper.dart
export 'root_wrapper_stub.dart'
    if (dart.library.io) 'root_wrapper_io.dart';
```

### Plattform-Varianten

| Datei | Beschreibung |
|-------|--------------|
| `chat_ui_desktop.dart` | Desktop-Layout (Windows, macOS, Linux) |
| `chat_ui_mobile.dart` | Mobile-Layout (Android, iOS) |
| `sidebar_desktop.dart` | Desktop-Sidebar |
| `sidebar_mobile.dart` | Mobile-Drawer |

### Shared Handlers

Beide Plattformen teilen sich Handler-Logik:

- `streaming_message_handler.dart` - Streaming-Nachrichten
- `chat_persistence_handler.dart` - Speichern/Laden
- `file_attachment_handler.dart` - Dateianhänge
- `audio_recording_handler.dart` - Audio-Aufnahme
- `message_actions_handler.dart` - Copy, Edit, Delete

## State Management

### Globaler State (ChukChatApp)

```dart
_ChukChatAppState
├─ Theme: Mode, Farben, Grain  [SharedPreferences + Supabase]
├─ Auth: Session vom Supabase
└─ Lifecycle: Foreground/Background-Handling
```

### Chat State (ChatStorageService)

```dart
ChatStorageService
├─ savedChats: List<StoredChat>     [SharedPreferences + Supabase]
├─ selectedChatId: String?          [ValueNotifier]
├─ isLoadingChat: bool              [Race-Condition-Schutz]
└─ Stream<String?> changes          [Reactive Updates]
```

## Design Patterns

| Pattern | Verwendung |
|---------|------------|
| **Service Locator** | Static Singletons für Services |
| **Facade** | ChatStorageService delegiert an Module |
| **Observer** | Auth-State, Chat-Changes via Streams |
| **Sealed Classes** | ChatStreamEvent für Type-Safe Events |
| **Isolate** | Encryption/Decryption im Background |
| **Lazy Loading** | StoredChat lädt Messages on-demand |
| **Debouncing** | Theme-Sync mit 500ms Verzögerung |
