---
title: Directory Structure
weight: 1
---

The Chuk Chat codebase follows a clean, modular structure that separates concerns and promotes maintainability.

## Project Root

```
chuk_chat/
├── lib/                    # Main application code
├── android/                # Android platform files
├── ios/                    # iOS platform files
├── linux/                  # Linux platform files
├── macos/                  # macOS platform files
├── windows/                # Windows platform files
├── web/                    # Web platform files
├── test/                   # Unit and widget tests
├── assets/                 # Static assets (images, fonts)
└── pubspec.yaml            # Dependencies and metadata
```

## Library Structure

The `lib/` directory contains 114 Dart files organized into functional modules:

```
lib/
├── main.dart               # Application entry point
├── constants/              # App-wide constants and configuration
├── core/                   # Core utilities and base classes
├── models/                 # Data models and entities
├── pages/                  # Screen/page widgets
│   └── model_selector/     # AI model selection UI
│       └── models/         # Model selector data classes
├── platform_specific/      # Platform-adaptive implementations
│   └── chat/               # Chat UI implementations
│       ├── handlers/       # Chat operation handlers
│       └── widgets/        # Platform-specific widgets
├── services/               # Business logic and API services
├── utils/                  # Helper functions and utilities
└── widgets/                # Reusable UI components
```

## Directory Descriptions

### `/lib/constants/`

Application-wide constants including:
- API endpoints and URLs
- Theme colors and dimensions
- Configuration values
- String constants

### `/lib/core/`

Core infrastructure code:
- Base classes and interfaces
- Dependency injection setup
- App initialization logic

### `/lib/models/`

Data models representing:
- Chat messages and conversations
- User profiles and settings
- API request/response structures
- Database entities

### `/lib/pages/`

Full-screen page widgets:
- Home/landing pages
- Settings screens
- Model selector interface

### `/lib/platform_specific/`

Platform-adaptive code for desktop vs mobile:

| Subdirectory | Purpose |
|--------------|---------|
| `chat/` | Chat UI implementations |
| `chat/handlers/` | Message streaming, persistence, attachments |
| `chat/widgets/` | Platform-specific UI components |

### `/lib/services/`

Business logic layer with 43 service files covering:
- Authentication and user management
- Chat and messaging operations
- AI model communication
- File handling and storage
- Encryption and security

### `/lib/utils/`

Helper utilities for:
- Date/time formatting
- String manipulation
- Platform detection
- Logging and debugging

### `/lib/widgets/`

Reusable UI components:
- Custom buttons and inputs
- Message bubbles
- Loading indicators
- Dialog components

## File Naming Conventions

| Pattern | Usage | Example |
|---------|-------|---------|
| `*_service.dart` | Service classes | `chat_service.dart` |
| `*_model.dart` | Data models | `message_model.dart` |
| `*_page.dart` | Full-screen pages | `settings_page.dart` |
| `*_widget.dart` | Reusable widgets | `message_widget.dart` |
| `*_handler.dart` | Operation handlers | `streaming_handler.dart` |
| `*_desktop.dart` | Desktop-specific | `chat_ui_desktop.dart` |
| `*_mobile.dart` | Mobile-specific | `chat_ui_mobile.dart` |

## Key Files

| File | Size | Purpose |
|------|------|---------|
| `chat_ui_desktop.dart` | ~124KB | Complete desktop chat interface |
| `chat_ui_mobile.dart` | ~102KB | Complete mobile chat interface |
| `main.dart` | - | App entry point and initialization |
| `chat_service.dart` | - | Core chat business logic |
| `encryption_service.dart` | - | E2E encryption implementation |
