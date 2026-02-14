---
title: StreamingManager
weight: 3
---

The `StreamingManager` orchestrates multiple concurrent AI response streams across different chats, buffering content and managing lifecycle events including background notifications. It preserves streaming responses when users switch between chats.

## Definition

```dart
// lib/services/streaming_manager.dart (conditional export)
// lib/services/streaming_manager_io.dart (Android/iOS/desktop)
// lib/services/streaming_manager_stub.dart (Web)

class StreamingManager {
  // Singleton
  static final StreamingManager _instance = StreamingManager._internal();
  factory StreamingManager() => _instance;

  // Map of chatId -> _ActiveStream
  final Map<String, _ActiveStream> _activeStreams = {};

  // App lifecycle tracking (notifications only when backgrounded)
  bool _isAppInBackground = false;
}
```

The class uses a **singleton pattern** so all chat screens share the same stream registry.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `hasActiveStreams` | `bool` | `true` if any chat is currently streaming |

## Methods

### Stream Lifecycle

| Method | Return Type | Description |
|--------|-------------|-------------|
| `startStream({chatId, messageIndex, stream, onUpdate, onComplete, onError, chatTitle})` | `Future<void>` | Begin listening to a `ChatStreamEvent` stream; cancels any existing stream for the same chat |
| `cancelStream(chatId)` | `Future<void>` | Cancel and remove a specific chat's stream |
| `cancelAllStreams()` | `Future<void>` | Cancel every active stream; stops Android foreground service |
| `isStreaming(chatId)` | `bool` | Check if a specific chat has an active stream |

### Content Access

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getBufferedContent(chatId)` | `String?` | Current accumulated response text, or `null` if not streaming |
| `getBufferedReasoning(chatId)` | `String?` | Current accumulated reasoning text |
| `getStreamingMessageIndex(chatId)` | `int?` | Index of the message being streamed in the message list |
| `getTps(chatId)` | `double?` | Tokens per second metric from the latest `TpsEvent` |

### Background Message Storage

| Method | Return Type | Description |
|--------|-------------|-------------|
| `setBackgroundMessages(chatId, messages, {modelId, provider})` | `void` | Store the full message list when user navigates away from a streaming chat |
| `getBackgroundMessages(chatId)` | `List<Map<String, dynamic>>?` | Retrieve messages with current buffer content applied to the AI placeholder |
| `hasBackgroundMessages(chatId)` | `bool` | Check if background messages are stored for a chat |

### Lifecycle Management

| Method | Return Type | Description |
|--------|-------------|-------------|
| `onAppLifecycleChanged({isInBackground})` | `void` | Start/stop Android foreground service based on app visibility |
| `getActiveStreamsInfo()` | `Map<String, bool>` | Debug map of chatId to active status |

## Event Handling

Each `ChatStreamEvent` is processed asynchronously:

```dart
// ContentEvent -- append text to buffer, notify UI
activeStream.contentBuffer.write(event.text);
onUpdate(content, reasoning);

// ReasoningEvent -- append to reasoning buffer, notify UI
activeStream.reasoningBuffer.write(event.text);
onUpdate(content, reasoning);

// TpsEvent -- store metric for display
activeStream.tps = event.tokensPerSecond;

// ErrorEvent -- notify error handler, clean up
onError(event.message);
_cleanupStream(chatId);

// DoneEvent -- show notification if backgrounded, complete
onComplete(finalContent, finalReasoning, tps);
_cleanupStream(chatId);
```

## Platform Behavior

### Android/iOS (streaming_manager_io.dart)

The manager is app-lifecycle-aware. The foreground service only starts when the app transitions to the background, not when streaming begins:

1. `onAppLifecycleChanged(isInBackground: true)` starts the Android foreground service only if streams are active
2. Streaming content updates are forwarded to the notification, throttled to **500ms intervals** to avoid excessive UI updates
3. Completion notifications are only shown when the app is backgrounded -- if the user is actively viewing the app, no notification is displayed
4. When the app returns to foreground, the foreground service is stopped

### Web (streaming_manager_stub.dart)

`streaming_manager_stub.dart` contains the full streaming logic (stream management, buffering, background messages) but omits all notification and foreground service calls. This serves as a platform stub so the same `StreamingManager` API works on web without conditional imports for notification dependencies.

## Usage Examples

### Starting a Stream

```dart
final manager = StreamingManager();

await manager.startStream(
  chatId: 'chat_123',
  messageIndex: 5, // index of the AI message placeholder
  stream: StreamingChatService.sendStreamingChat(
    accessToken: token,
    message: 'Hello',
    modelId: 'deepseek/deepseek-chat',
    providerSlug: 'deepseek',
  ),
  onUpdate: (content, reasoning) {
    setState(() {
      messages[5].text = content;
      messages[5].reasoning = reasoning;
    });
  },
  onComplete: (content, reasoning, tps) {
    saveMessageToDatabase(content, reasoning);
    if (tps != null) showTpsMetric(tps);
  },
  onError: (error) {
    showErrorSnackbar(error);
  },
  chatTitle: 'My Chat',
);
```

### Streaming Persistence on Chat Switch

When a user switches away from a chat while the AI is still streaming, the response is preserved:

- **Active streams** continue in the background with content buffered
- **Completed streams** retain buffered content in memory with a 5-minute TTL (max 5 retained)
- When loading a chat, the manager checks both active AND completed streams for buffered content
- A per-chat streaming guard prevents false "Response cancelled" errors

```dart
// User switches to a different chat while streaming
if (manager.isStreaming(currentChatId)) {
  manager.setBackgroundMessages(
    currentChatId,
    currentMessages,
    modelId: selectedModel,
    provider: selectedProvider,
  );
}

// User returns to the streaming chat -- content preserved
final bgMessages = manager.getBackgroundMessages(chatId);
if (bgMessages != null) {
  setState(() => messages = bgMessages);
}
```

### Cancelling a Stream

```dart
// Cancel one chat's stream (e.g., user presses stop)
await manager.cancelStream('chat_123');

// Cancel all streams (e.g., on logout)
await manager.cancelAllStreams();
```

## Internal: _ActiveStream

Each active stream is tracked by an `_ActiveStream` instance:

```dart
class _ActiveStream {
  final StreamSubscription<ChatStreamEvent> subscription;
  final int messageIndex;
  final String chatId;
  final String? chatTitle;
  final StringBuffer contentBuffer = StringBuffer();
  final StringBuffer reasoningBuffer = StringBuffer();
  bool isActive = true;
  double? tps;
  List<Map<String, dynamic>>? backgroundMessages;
  String? modelId;
  String? provider;
}
```
