---
title: Chat UI
weight: 3
---

The chat UI is split into desktop and mobile implementations, sharing business logic through common services and handlers.

## Files

| File | Widget/Class | Description |
|------|--------------|-------------|
| `chat/chat_ui_desktop.dart` | `ChatUiDesktop` | Desktop chat interface with keyboard shortcuts, drag-and-drop file attachment, and side-by-side project panel. |
| `chat/chat_ui_mobile.dart` | `ChatUiMobile` | Mobile chat interface with touch-optimized input, swipe actions, and model selection dropdown in the app bar. |
| `chat/chat_api_service.dart` | `ChatApiService` | API service for chat-related HTTP operations such as file uploads and conversion. Environment-aware base URL via `ApiConfigService`. |

## Platform Widgets

| File | Description |
|------|-------------|
| `chat/widgets/desktop_chat_widgets.dart` | Desktop-specific UI components: icon buttons, toolbar elements sized for mouse interaction. |
| `chat/widgets/mobile_chat_widgets.dart` | Mobile-specific UI components: compact icon buttons and toolbar elements sized for touch. |

## Shared Architecture

Both `ChatUiDesktop` and `ChatUiMobile`:

- Use `ChatStorageService` for chat persistence
- Use `UserPreferencesService` for the selected model
- Use `ModelCapabilitiesService` to determine feature support (vision, file upload)
- Use `MessageCompositionService` to build message payloads
- Listen to `ModelSelectionEventBus` for model changes
- Delegate complex logic to handlers in `chat/handlers/`

The desktop variant adds:
- Keyboard shortcuts (Enter to send, Shift+Enter for newline)
- `AttachmentPreviewBar` for drag-and-drop files
- `ProjectPanel` for project context

The mobile variant adds:
- `ModelSelectionDropdown` in the app bar
- Network status awareness via `NetworkStatusService`
- Auto-generated chat titles via `TitleGenerationService`
