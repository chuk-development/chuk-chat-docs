---
title: ChatStreamEvent
weight: 3
---

The `ChatStreamEvent` model represents events received during streaming chat responses.

## Definition

```dart
// lib/models/chat_stream_event.dart

enum StreamEventType {
  content,     // Text content chunk
  toolCall,    // Tool/function call
  usage,       // Token usage stats
  done,        // Stream complete
  error,       // Error occurred
}

class ChatStreamEvent {
  final StreamEventType type;
  final String? content;
  final String? model;
  final TokenUsage? usage;
  final String? error;
  final Map<String, dynamic>? toolCall;

  const ChatStreamEvent({
    required this.type,
    this.content,
    this.model,
    this.usage,
    this.error,
    this.toolCall,
  });
}
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `type` | `StreamEventType` | Type of event |
| `content` | `String?` | Text content (for content events) |
| `model` | `String?` | Model that generated response |
| `usage` | `TokenUsage?` | Token usage statistics |
| `error` | `String?` | Error message (for error events) |
| `toolCall` | `Map?` | Tool call data |

## StreamEventType

| Type | Description |
|------|-------------|
| `content` | A chunk of text content |
| `toolCall` | Model wants to call a tool |
| `usage` | Final token usage statistics |
| `done` | Stream has completed |
| `error` | An error occurred |

## TokenUsage

```dart
class TokenUsage {
  final int promptTokens;
  final int completionTokens;
  final int totalTokens;

  const TokenUsage({
    required this.promptTokens,
    required this.completionTokens,
    required this.totalTokens,
  });

  factory TokenUsage.fromJson(Map<String, dynamic> json) {
    return TokenUsage(
      promptTokens: json['prompt_tokens'] as int,
      completionTokens: json['completion_tokens'] as int,
      totalTokens: json['total_tokens'] as int,
    );
  }
}
```

## Parsing SSE Events

```dart
ChatStreamEvent? parseSSELine(String line) {
  if (!line.startsWith('data: ')) return null;

  final data = line.substring(6);
  if (data == '[DONE]') {
    return const ChatStreamEvent(type: StreamEventType.done);
  }

  try {
    final json = jsonDecode(data) as Map<String, dynamic>;

    // Check for error
    if (json['error'] != null) {
      return ChatStreamEvent(
        type: StreamEventType.error,
        error: json['error']['message'] as String?,
      );
    }

    // Parse choices
    final choices = json['choices'] as List?;
    if (choices == null || choices.isEmpty) {
      // Check for usage only
      if (json['usage'] != null) {
        return ChatStreamEvent(
          type: StreamEventType.usage,
          usage: TokenUsage.fromJson(json['usage']),
        );
      }
      return null;
    }

    final delta = choices[0]['delta'] as Map<String, dynamic>?;
    if (delta == null) return null;

    // Content chunk
    if (delta['content'] != null) {
      return ChatStreamEvent(
        type: StreamEventType.content,
        content: delta['content'] as String,
        model: json['model'] as String?,
      );
    }

    // Tool call
    if (delta['tool_calls'] != null) {
      return ChatStreamEvent(
        type: StreamEventType.toolCall,
        toolCall: delta['tool_calls'][0] as Map<String, dynamic>,
      );
    }

    return null;
  } on FormatException {
    return ChatStreamEvent(
      type: StreamEventType.error,
      error: 'Failed to parse stream event',
    );
  }
}
```

## Usage Example

```dart
class StreamHandler {
  String _buffer = '';
  int _totalTokens = 0;

  void handleEvent(ChatStreamEvent event) {
    switch (event.type) {
      case StreamEventType.content:
        _buffer += event.content ?? '';
        onContentUpdate(_buffer);
        break;

      case StreamEventType.usage:
        _totalTokens = event.usage?.totalTokens ?? 0;
        break;

      case StreamEventType.done:
        onComplete(_buffer, _totalTokens);
        break;

      case StreamEventType.error:
        onError(event.error ?? 'Unknown error');
        break;

      case StreamEventType.toolCall:
        handleToolCall(event.toolCall!);
        break;
    }
  }
}
```

## Stream Processing

```dart
Stream<ChatStreamEvent> processStream(Stream<String> lines) async* {
  await for (final line in lines) {
    final event = parseSSELine(line);
    if (event != null) {
      yield event;
    }
  }
}

// Usage
final stream = dio.post('/chat', options: Options(
  responseType: ResponseType.stream,
));

await for (final event in processStream(stream.lines)) {
  handleEvent(event);
}
```
