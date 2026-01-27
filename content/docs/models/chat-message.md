---
title: ChatMessage
weight: 1
---

The `ChatMessage` model represents individual messages in a chat conversation.

## Definition

```dart
// lib/models/chat_message.dart

enum MessageRole { user, assistant, system }

class ChatMessage {
  final String id;
  final String content;
  final MessageRole role;
  final DateTime timestamp;
  final List<AttachedFile>? attachments;
  final String? model;
  final bool isStreaming;

  const ChatMessage({
    required this.id,
    required this.content,
    required this.role,
    required this.timestamp,
    this.attachments,
    this.model,
    this.isStreaming = false,
  });
}
```

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `String` | Yes | Unique message identifier |
| `content` | `String` | Yes | Message text content |
| `role` | `MessageRole` | Yes | Who sent the message |
| `timestamp` | `DateTime` | Yes | When message was created |
| `attachments` | `List<AttachedFile>?` | No | File attachments |
| `model` | `String?` | No | AI model used (assistant only) |
| `isStreaming` | `bool` | No | Whether still receiving content |

## MessageRole

| Value | Description |
|-------|-------------|
| `user` | Message from the user |
| `assistant` | Response from AI model |
| `system` | System prompt or instruction |

## JSON Serialization

```dart
factory ChatMessage.fromJson(Map<String, dynamic> json) {
  return ChatMessage(
    id: json['id'] as String,
    content: json['content'] as String,
    role: MessageRole.values.byName(json['role'] as String),
    timestamp: DateTime.parse(json['timestamp'] as String),
    attachments: json['attachments'] != null
        ? (json['attachments'] as List)
            .map((a) => AttachedFile.fromJson(a))
            .toList()
        : null,
    model: json['model'] as String?,
    isStreaming: json['is_streaming'] as bool? ?? false,
  );
}

Map<String, dynamic> toJson() => {
  'id': id,
  'content': content,
  'role': role.name,
  'timestamp': timestamp.toIso8601String(),
  'attachments': attachments?.map((a) => a.toJson()).toList(),
  'model': model,
  'is_streaming': isStreaming,
};
```

## Copy With

```dart
ChatMessage copyWith({
  String? id,
  String? content,
  MessageRole? role,
  DateTime? timestamp,
  List<AttachedFile>? attachments,
  String? model,
  bool? isStreaming,
}) {
  return ChatMessage(
    id: id ?? this.id,
    content: content ?? this.content,
    role: role ?? this.role,
    timestamp: timestamp ?? this.timestamp,
    attachments: attachments ?? this.attachments,
    model: model ?? this.model,
    isStreaming: isStreaming ?? this.isStreaming,
  );
}
```

## Usage Examples

### Creating Messages

```dart
// User message
final userMessage = ChatMessage(
  id: 'msg_${DateTime.now().millisecondsSinceEpoch}',
  content: 'Hello, how are you?',
  role: MessageRole.user,
  timestamp: DateTime.now(),
);

// Assistant message
final assistantMessage = ChatMessage(
  id: 'msg_${DateTime.now().millisecondsSinceEpoch}',
  content: 'I\'m doing well, thank you!',
  role: MessageRole.assistant,
  timestamp: DateTime.now(),
  model: 'deepseek/deepseek-chat',
);

// System message
final systemMessage = ChatMessage(
  id: 'system',
  content: 'You are a helpful assistant.',
  role: MessageRole.system,
  timestamp: DateTime.now(),
);
```

### With Attachments

```dart
final messageWithFile = ChatMessage(
  id: 'msg_123',
  content: 'Here is the document you requested.',
  role: MessageRole.user,
  timestamp: DateTime.now(),
  attachments: [
    AttachedFile(
      name: 'document.pdf',
      path: '/path/to/document.pdf',
      type: FileType.pdf,
      size: 1024000,
    ),
  ],
);
```

### Streaming Update

```dart
// Start streaming
var message = ChatMessage(
  id: 'msg_stream',
  content: '',
  role: MessageRole.assistant,
  timestamp: DateTime.now(),
  isStreaming: true,
);

// Append content as it arrives
message = message.copyWith(
  content: message.content + 'chunk of text',
);

// Complete streaming
message = message.copyWith(isStreaming: false);
```

## Equality

```dart
@override
bool operator ==(Object other) =>
    identical(this, other) ||
    other is ChatMessage &&
        id == other.id &&
        content == other.content &&
        role == other.role;

@override
int get hashCode => Object.hash(id, content, role);
```
