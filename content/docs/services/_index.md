---
title: Services
weight: 3
---

# Service Layer Overview

The Chuk Chat application organizes its business logic into a comprehensive service layer consisting of 51 service files in `lib/services/`. This architecture separates concerns and provides clean, testable interfaces for all major application features.

## Service Categories

The services are organized into eight main categories:

### App Lifecycle & Initialization

Services extracted from `main.dart` to handle application startup, session management, theme, and lifecycle:

- **AppInitializationService** (`app_initialization_service.dart`) - App startup and per-user session initialization (chat loading, sync, theme, model prefetch)
- **SessionManagerService** (`session_manager_service.dart`) - Auth session validation, `onAuthStateChange` listener, per-user init guard to prevent re-initialization on token refresh
- **AppLifecycleService** (`app_lifecycle_service.dart`) - App lifecycle management (resume/pause/detached) for mobile and desktop
- **AppThemeService** (`app_theme_service.dart`) - Theme state management, previously inline in `main.dart`

{{< callout type="info" >}}
These four services were extracted in February 2026 to reduce `main.dart` from ~845 lines to ~140 lines. The `AuthGate` widget was also simplified from a 20-iteration retry loop to a single synchronous session check with stream listener.
{{< /callout >}}

### Authentication & Security

Services that handle user authentication, session management, and data encryption:

- **[SupabaseService](auth/supabase-service)** - Singleton client initialization and session management
- **[AuthService](auth/auth-service)** - User authentication flows (sign up, sign in, sign out)
- **[EncryptionService](auth/encryption-service)** - AES-256-GCM encryption with PBKDF2 key derivation
- **[Password Services](auth/password-services)** - Password change workflows and multi-device session management

### Chat Storage

Services that manage chat data persistence, synchronization, and state:

- **[ChatStorageService](chat/chat-storage-service)** - Central facade for all chat operations
- **[ChatSyncService](chat/chat-sync-service)** - Background synchronization with 5-second polling
- **[Storage Modules](chat/storage-modules)** - Modular components for CRUD, state, sidebar, and mutations

### Streaming

Services that handle real-time AI response streaming:

- **[HTTP Streaming](streaming/http-streaming)** - Server-Sent Events (SSE) streaming
- **[WebSocket Streaming](streaming/websocket-streaming)** - Persistent WebSocket connections
- **[StreamingManager](streaming/streaming-manager)** - Concurrent stream orchestration
- **[Foreground Service](streaming/foreground-service)** - Android background keep-alive

### Projects

Services that manage project workspaces and context:

- **[ProjectStorageService](projects/project-storage-service)** - Project CRUD, file management, chat associations
- **[ProjectMessageService](projects/project-message-service)** - Building system prompts with project context

### Media

Services for image and file handling:

- **[ImageStorageService](media/image-storage-service)** - Encrypted image upload, download, and caching
- **[ImageGenerationService](media/image-generation-service)** - AI-powered image generation
- **[ImageCompressionService](media/image-compression-service)** - JPEG compression, magic byte validation, and decompression bomb detection
- **[FileConversionService](media/file-conversion-service)** - Document to markdown conversion

### Preferences

Services for user settings and customization:

- **[ThemeSettingsService](preferences/theme-settings-service)** - Theme sync across devices
- **[UserPreferencesService](preferences/user-preferences-service)** - Model and system prompt preferences
- **[CustomizationPreferencesService](preferences/customization-preferences-service)** - Feature display preferences

### Configuration

Services for API and system configuration:

- **[ApiConfigService](config/api-config-service)** - API endpoint configuration
- **[ApiStatusService](config/api-status-service)** - API health monitoring
- **[NetworkStatusService](config/network-status-service)** - Connectivity monitoring
- **[Model Services](config/model-services)** - Model prefetch, cache, and capabilities

## Architecture Principles

The service layer follows several key architectural principles:

### Singleton Pattern

Most services use the singleton pattern to ensure a single source of truth:

```dart
class ExampleService {
  static final ExampleService _instance = ExampleService._internal();
  factory ExampleService() => _instance;
  ExampleService._internal();
}
```

### Background Isolation

CPU-intensive operations (encryption, decryption, JSON parsing) run in background isolates:

```dart
// Heavy operations don't block the UI
final result = await compute(heavyOperation, data);
```

### Stream-Based Updates

Services expose streams for reactive UI updates:

```dart
// Listen to changes
ExampleService.changes.listen((event) {
  // Update UI reactively
});
```

### Error Handling

Services use consistent error handling patterns with meaningful error types:

```dart
try {
  await ExampleService.operation();
} on NetworkException catch (e) {
  // Handle network errors
} on AuthException catch (e) {
  // Handle auth errors
}
```

## Service Dependencies

Services have well-defined dependencies to maintain loose coupling:

```
SupabaseService (base layer)
    ↓
AuthService ← EncryptionService
    ↓
ChatStorageService ← ChatSyncService
    ↓
StreamingManager ← StreamingChatService / WebSocketChatService
```

## Getting Started

For new developers, we recommend exploring the services in this order:

1. Start with [SupabaseService](auth/supabase-service) to understand client initialization
2. Review [AuthService](auth/auth-service) for the authentication flow
3. Explore [ChatStorageService](chat/chat-storage-service) for data management patterns
4. Study the [streaming services](streaming/) for real-time communication

## Other Services

Beyond the documented categories, additional services handle specific features:

| Service | Description |
|---------|-------------|
| `TitleGenerationService` | Auto-generate chat titles using Qwen 3-8B |
| `NotificationService` | Local push notifications |
| `ProfileService` | User profile (display name) |
| `AppInitializationService` | App startup and user session initialization |
| `SessionManagerService` | Auth state listener with per-user init guard |
| `AppLifecycleService` | App lifecycle events (resume, pause, detached) |
| `AppThemeService` | Theme state management |
