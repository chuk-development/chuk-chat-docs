---
title: Chat Handlers
weight: 4
---

Chat handlers extract complex chat-related logic into focused, reusable classes. They are used by both `ChatUiDesktop` and `ChatUiMobile` to avoid code duplication.

## Files

All handlers are located in `lib/platform_specific/chat/handlers/`.

| File | Class | Description |
|------|-------|-------------|
| `streaming_message_handler.dart` | `StreamingMessageHandler` | Manages the streaming chat lifecycle: initiates WebSocket or HTTP streaming connections, appends text chunks to the current message, handles reasoning tokens, and signals completion. |
| `chat_persistence_handler.dart` | `ChatPersistenceHandler` | Handles saving and loading chats via `ChatStorageService`. Manages offline detection via `NetworkStatusService` and auto-saves after each message exchange. |
| `file_attachment_handler.dart` | `FileAttachmentHandler` | File picker integration: opens the native file picker, validates selected files (size, type), reads bytes, and prepares attachments for the message payload. |
| `audio_recording_handler.dart` | `AudioRecordingHandler` | Audio recording and transcription: starts/stops recording via the `record` package, sends audio to Groq Whisper for transcription, and optionally auto-sends the transcribed text. |
| `message_actions_handler.dart` | `MessageActionsHandler` | Post-send message actions: copy to clipboard, edit message content, regenerate response, and delete messages. Uses `MessageBubbleAction` for action type routing. |

## Usage Pattern

Handlers are instantiated by the chat UI widgets and composed together:

```dart
// In ChatUiDesktop or ChatUiMobile
final _streamingHandler = StreamingMessageHandler(...);
final _persistenceHandler = ChatPersistenceHandler(...);
final _fileHandler = FileAttachmentHandler(...);
final _audioHandler = AudioRecordingHandler(...);
final _actionsHandler = MessageActionsHandler(...);
```

Each handler is self-contained with its own state management and cleanup via `dispose()` methods.
