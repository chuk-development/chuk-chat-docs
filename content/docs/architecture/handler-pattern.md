---
title: Handler Pattern
weight: 4
---

The mobile chat UI uses a handler pattern to separate concerns and improve maintainability.

## Overview

Instead of a monolithic chat widget, mobile chat functionality is split into specialized handlers:

```
chat_ui_mobile.dart
    ├── StreamingMessageHandler
    ├── ChatPersistenceHandler
    ├── FileAttachmentHandler
    ├── AudioRecordingHandler
    └── MessageActionsHandler
```

## Handler Architecture

```dart
// Base handler interface
abstract class ChatHandler {
  final ChatState state;
  final ChatCallbacks callbacks;

  ChatHandler(this.state, this.callbacks);

  void dispose();
}
```

## Handler Implementations

### StreamingMessageHandler

Manages real-time message streaming from AI models:

```dart
class StreamingMessageHandler extends ChatHandler {
  StreamSubscription? _subscription;

  Future<void> startStream(String message) async {
    _subscription = chatService
        .streamMessage(message)
        .listen(_onChunk, onError: _onError);
  }

  void _onChunk(String chunk) {
    state.appendToCurrentMessage(chunk);
    callbacks.onMessageUpdate();
  }

  @override
  void dispose() {
    _subscription?.cancel();
  }
}
```

**Responsibilities:**
- HTTP SSE connection management
- Chunk processing and buffering
- Error handling and retry logic
- Stream cancellation

### ChatPersistenceHandler

Manages save/load operations for chat history:

```dart
class ChatPersistenceHandler extends ChatHandler {
  Future<void> saveChat() async {
    final chat = StoredChat(
      id: state.chatId,
      messages: state.messages,
      timestamp: DateTime.now(),
    );
    await storageService.save(chat);
  }

  Future<void> loadChat(String chatId) async {
    final chat = await storageService.load(chatId);
    state.setMessages(chat.messages);
  }
}
```

**Responsibilities:**
- Local storage operations
- Cloud sync coordination
- Auto-save functionality
- Chat history management

### FileAttachmentHandler

Handles file and image attachments:

```dart
class FileAttachmentHandler extends ChatHandler {
  Future<void> pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'txt', 'md'],
    );

    if (result != null) {
      await _processFile(result.files.first);
    }
  }

  Future<void> _processFile(PlatformFile file) async {
    final converted = await conversionService.convert(file);
    state.addAttachment(converted);
  }
}
```

**Responsibilities:**
- File picker integration
- Format conversion
- Image compression
- Upload management

### AudioRecordingHandler

Manages voice input and transcription:

```dart
class AudioRecordingHandler extends ChatHandler {
  final AudioRecorder _recorder = AudioRecorder();

  Future<void> startRecording() async {
    await _recorder.start(
      RecordConfig(encoder: AudioEncoder.aacLc),
      path: await _getTempPath(),
    );
    state.setRecording(true);
  }

  Future<String> stopAndTranscribe() async {
    final path = await _recorder.stop();
    state.setRecording(false);
    return await transcriptionService.transcribe(path);
  }
}
```

**Responsibilities:**
- Audio recording
- Transcription API calls
- Permission handling
- Temporary file cleanup

### MessageActionsHandler

Handles message operations:

```dart
class MessageActionsHandler extends ChatHandler {
  void copyMessage(ChatMessage message) {
    Clipboard.setData(ClipboardData(text: message.content));
    callbacks.showToast('Copied to clipboard');
  }

  Future<void> deleteMessage(ChatMessage message) async {
    await storageService.deleteMessage(message.id);
    state.removeMessage(message.id);
  }

  void editMessage(ChatMessage message) {
    state.setEditingMessage(message);
    callbacks.focusInput();
  }
}
```

**Responsibilities:**
- Copy to clipboard
- Delete messages
- Edit message mode
- Regenerate responses

## Benefits

| Benefit | Description |
|---------|-------------|
| **Separation of Concerns** | Each handler has a single responsibility |
| **Testability** | Handlers can be unit tested in isolation |
| **Maintainability** | Changes are localized to specific handlers |
| **Reusability** | Handlers can be shared between platforms |

## Usage in Chat UI

```dart
class _ChatUIMobileState extends State<ChatUIMobile> {
  late final StreamingMessageHandler _streamingHandler;
  late final ChatPersistenceHandler _persistenceHandler;
  late final FileAttachmentHandler _fileHandler;
  late final AudioRecordingHandler _audioHandler;
  late final MessageActionsHandler _actionsHandler;

  @override
  void initState() {
    super.initState();
    _streamingHandler = StreamingMessageHandler(_state, _callbacks);
    _persistenceHandler = ChatPersistenceHandler(_state, _callbacks);
    // ... initialize other handlers
  }

  @override
  void dispose() {
    _streamingHandler.dispose();
    _persistenceHandler.dispose();
    // ... dispose other handlers
    super.dispose();
  }
}
```
