---
title: Dateistruktur
weight: 8
---

# Vollständige Dateistruktur

## lib/ Verzeichnis (114 Dart-Dateien)

### Root-Dateien

| Datei | Beschreibung |
|-------|--------------|
| `main.dart` | App-Einstiegspunkt, ChukChatApp Widget |
| `constants.dart` | Theme-Konstanten, `buildAppTheme()` |
| `platform_config.dart` | Platform-Detection Flags |
| `supabase_config.dart` | Supabase URL/Key |
| `model_selector_page.dart` | Model-Auswahl UI |
| `env_loader.dart` | Environment-Variablen |
| `progress_bar.dart` | Progress-UI Widget |

---

### models/

Datenmodelle.

| Datei | Klassen |
|-------|---------|
| `chat_model.dart` | `ModelItem`, `AttachedFile` |
| `chat_message.dart` | `ChatMessage` |
| `chat_stream_event.dart` | `ChatStreamEvent` (sealed) |
| `project_model.dart` | `Project`, `ProjectFile`, `ProjectChat` |
| `stored_chat.dart` | `StoredChat` |

---

### services/

Business-Logik (38+ Dateien).

#### Auth & Security

| Datei | Beschreibung |
|-------|--------------|
| `supabase_service.dart` | Supabase-Client Singleton |
| `auth_service.dart` | Sign-in, Sign-up, Logout |
| `encryption_service.dart` | AES-256-GCM, PBKDF2 |
| `password_change_service.dart` | Passwort-Änderung |
| `password_revision_service.dart` | Passwort-Revision erkennen |

#### Chat & Storage

| Datei | Beschreibung |
|-------|--------------|
| `chat_storage_service.dart` | Haupt-Fassade |
| `chat_storage_crud.dart` | CRUD-Operationen |
| `chat_storage_mutations.dart` | Message-Mutationen |
| `chat_storage_state.dart` | State Management |
| `chat_storage_sidebar.dart` | Sidebar-Liste |
| `chat_storage_sync.dart` | Sync-Logik |
| `chat_sync_service.dart` | Background-Sync (5s Polling) |
| `chat_preload_service.dart` | Preload bei Login |
| `local_chat_cache_service.dart` | In-Memory Cache |

#### Streaming

| Datei | Beschreibung |
|-------|--------------|
| `streaming_chat_service.dart` | HTTP SSE Streaming |
| `websocket_chat_service.dart` | WebSocket Streaming |
| `streaming_manager.dart` | Concurrent Streams |
| `streaming_foreground_service.dart` | Background Keep-Alive |

#### Models & Config

| Datei | Beschreibung |
|-------|--------------|
| `model_prefetch_service.dart` | Model-Liste prefetchen |
| `model_cache_service.dart` | Model-Cache |
| `model_capabilities_service.dart` | Model-Features |
| `api_config_service.dart` | API-Endpoints |
| `api_status_service.dart` | API Health |
| `network_status_service.dart` | Connectivity |

#### Theme & Preferences

| Datei | Beschreibung |
|-------|--------------|
| `theme_settings_service.dart` | Theme-Sync |
| `customization_preferences_service.dart` | Feature-Preferences |
| `user_preferences_service.dart` | User Settings |

#### Projects & Media

| Datei | Beschreibung |
|-------|--------------|
| `project_storage_service.dart` | Project CRUD |
| `project_message_service.dart` | Project Context Injection |
| `image_storage_service.dart` | Encrypted Image Storage |
| `image_generation_service.dart` | AI Image Generation |
| `image_compression_service.dart` | JPEG Compression |
| `file_conversion_service.dart` | Document → Markdown |

#### Sonstige

| Datei | Beschreibung |
|-------|--------------|
| `message_composition_service.dart` | API Payload Builder |
| `title_generation_service.dart` | AI Chat Titles |
| `notification_service.dart` | Local Notifications |
| `profile_service.dart` | User Profile |
| `session_helper.dart` | Session Validation |
| `service_logger.dart` | Logging Utility |

---

### pages/

App-Screens (13+ Dateien).

| Datei | Beschreibung |
|-------|--------------|
| `login_page.dart` | Auth UI |
| `settings_page.dart` | Settings Hub |
| `theme_page.dart` | Theme Customization |
| `customization_page.dart` | Feature Preferences |
| `account_settings_page.dart` | Account Management |
| `system_prompt_page.dart` | System Prompt Editor |
| `about_page.dart` | App Info |
| `pricing_page.dart` | Model Pricing |
| `projects_page.dart` | Project List |
| `project_detail_page.dart` | Project Detail View |
| `project_management_page.dart` | Mobile Project Management |
| `media_manager_page.dart` | Image Management |
| `coming_soon_page.dart` | Placeholder |

---

### widgets/

Wiederverwendbare UI-Komponenten (14 Dateien).

| Datei | Beschreibung |
|-------|--------------|
| `auth_gate.dart` | Auth Guard/Wrapper |
| `message_bubble.dart` | Message Display |
| `markdown_message.dart` | Markdown + Syntax Highlighting |
| `image_viewer.dart` | Fullscreen Image |
| `encrypted_image_widget.dart` | Encrypted Image Display |
| `document_viewer.dart` | Document Preview |
| `attachment_preview_bar.dart` | Pre-Send Attachments |
| `model_selection_dropdown.dart` | Model Picker |
| `project_selection_dropdown.dart` | Project Picker |
| `credit_display.dart` | Credit Balance |
| `free_message_display.dart` | Free Messages Quota |
| `password_strength_meter.dart` | Password Strength UI |
| `project_file_viewer.dart` | Project File Dialog |
| `project_panel.dart` | Desktop Project Panel |

---

### platform_specific/

Platform-adaptiver Code.

#### Root Wrappers

| Datei | Beschreibung |
|-------|--------------|
| `root_wrapper.dart` | Conditional Export |
| `root_wrapper_io.dart` | Platform Detection |
| `root_wrapper_desktop.dart` | Desktop Layout |
| `root_wrapper_mobile.dart` | Mobile Layout |
| `root_wrapper_stub.dart` | Web Stub |

#### Sidebars

| Datei | Beschreibung |
|-------|--------------|
| `sidebar_desktop.dart` | Desktop Navigation |
| `sidebar_mobile.dart` | Mobile Drawer |

#### Chat UI

| Datei | Beschreibung |
|-------|--------------|
| `chat/chat_ui_desktop.dart` | Desktop Chat (≈124KB) |
| `chat/chat_ui_mobile.dart` | Mobile Chat (≈102KB) |
| `chat/chat_api_service.dart` | Chat API Layer |

#### Chat Widgets

| Datei | Beschreibung |
|-------|--------------|
| `chat/widgets/desktop_chat_widgets.dart` | Desktop-spezifisch |
| `chat/widgets/mobile_chat_widgets.dart` | Mobile-spezifisch |

#### Chat Handlers

| Datei | Beschreibung |
|-------|--------------|
| `chat/handlers/streaming_message_handler.dart` | Streaming Messages |
| `chat/handlers/chat_persistence_handler.dart` | Save/Load |
| `chat/handlers/file_attachment_handler.dart` | File Attachments |
| `chat/handlers/audio_recording_handler.dart` | Audio Recording |
| `chat/handlers/message_actions_handler.dart` | Copy, Edit, Delete |

---

### utils/

Hilfsfunktionen (16+ Dateien).

| Datei | Beschreibung |
|-------|--------------|
| `input_validator.dart` | Password/Email Validation |
| `token_estimator.dart` | Token Counting |
| `secure_token_handler.dart` | Token Masking |
| `api_rate_limiter.dart` | API Rate Limiting |
| `upload_rate_limiter.dart` | Upload Rate Limiting |
| `api_request_queue.dart` | Request Queue |
| `exponential_backoff.dart` | Retry Logic |
| `file_upload_validator.dart` | File Validation |
| `certificate_pinning.dart` | SSL Pinning |
| `grain_overlay.dart` | Film Grain Effect |
| `color_extensions.dart` | Hex ↔ Color |
| `theme_extensions.dart` | Theme Helpers |
| `service_logger.dart` | Logging |
| `service_error_handler.dart` | Error Handling |
| `privacy_logger.dart` | Privacy-aware Logging |
| `highlight_registry.dart` | Syntax Highlighting |

---

## Plattform-Verzeichnisse

### android/

```
android/
├── app/
│   ├── build.gradle.kts
│   └── src/main/
│       ├── AndroidManifest.xml
│       └── kotlin/...
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
└── key.properties.example
```

### ios/

```
ios/
├── Runner/
│   ├── Info.plist
│   └── AppDelegate.swift
├── Runner.xcodeproj/
└── Runner.xcworkspace/
```

### linux/

```
linux/
├── CMakeLists.txt
└── runner/
    └── main.cc
```

### windows/

```
windows/
├── CMakeLists.txt
└── runner/
    └── main.cpp
```

### macos/

```
macos/
├── Runner/
└── Runner.xcodeproj/
```

---

## Konfigurationsdateien

| Datei | Beschreibung |
|-------|--------------|
| `pubspec.yaml` | Flutter Dependencies |
| `pubspec.lock` | Dependency Lock |
| `analysis_options.yaml` | Dart Linter |
| `devtools_options.yaml` | DevTools Config |
| `.env.example` | Environment Template |
| `build.sh` | Build Script |
| `run.sh` | Dev Run Script |
| `docker-compose.yaml` | Docker Config |
| `coderabbit.yaml` | PR Review Automation |

---

## Dokumentation

| Datei | Beschreibung |
|-------|--------------|
| `README.md` | Haupt-Dokumentation |
| `CLAUDE.md` | Developer Quick Start |
| `SECURITY.md` | Security Policy |
| `CONTRIBUTING.md` | Contribution Guidelines |
| `CODE_OF_CONDUCT.md` | Community Standards |
| `docs/ARCHITECTURE.md` | Architektur-Details |
| `docs/FILE_MAP.md` | Datei-Übersicht |
| `docs/FEATURES.md` | Feature-Dokumentation |
| `docs/DATABASE.md` | Datenbank-Schema |
| `docs/COMMON_TASKS.md` | Development Workflows |
| `docs/GOTCHAS.md` | Wichtige Hinweise |
