---
title: StoredChat
weight: 2
---

The `StoredChat` model represents a persisted chat conversation.

## Definition

```dart
// lib/models/stored_chat.dart

class StoredChat {
  final String id;
  final String title;
  final List<ChatMessage> messages;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? projectId;
  final String? model;
  final bool isEncrypted;

  const StoredChat({
    required this.id,
    required this.title,
    required this.messages,
    required this.createdAt,
    required this.updatedAt,
    this.projectId,
    this.model,
    this.isEncrypted = true,
  });
}
```

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `String` | Yes | Unique chat identifier |
| `title` | `String` | Yes | Chat display title |
| `messages` | `List<ChatMessage>` | Yes | All messages in chat |
| `createdAt` | `DateTime` | Yes | When chat was created |
| `updatedAt` | `DateTime` | Yes | Last modification time |
| `projectId` | `String?` | No | Associated project |
| `model` | `String?` | No | Default AI model |
| `isEncrypted` | `bool` | No | Whether messages are encrypted |

## JSON Serialization

```dart
factory StoredChat.fromJson(Map<String, dynamic> json) {
  return StoredChat(
    id: json['id'] as String,
    title: json['title'] as String,
    messages: (json['messages'] as List)
        .map((m) => ChatMessage.fromJson(m))
        .toList(),
    createdAt: DateTime.parse(json['created_at'] as String),
    updatedAt: DateTime.parse(json['updated_at'] as String),
    projectId: json['project_id'] as String?,
    model: json['model'] as String?,
    isEncrypted: json['is_encrypted'] as bool? ?? true,
  );
}

Map<String, dynamic> toJson() => {
  'id': id,
  'title': title,
  'messages': messages.map((m) => m.toJson()).toList(),
  'created_at': createdAt.toIso8601String(),
  'updated_at': updatedAt.toIso8601String(),
  'project_id': projectId,
  'model': model,
  'is_encrypted': isEncrypted,
};
```

## Copy With

```dart
StoredChat copyWith({
  String? id,
  String? title,
  List<ChatMessage>? messages,
  DateTime? createdAt,
  DateTime? updatedAt,
  String? projectId,
  String? model,
  bool? isEncrypted,
}) {
  return StoredChat(
    id: id ?? this.id,
    title: title ?? this.title,
    messages: messages ?? this.messages,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
    projectId: projectId ?? this.projectId,
    model: model ?? this.model,
    isEncrypted: isEncrypted ?? this.isEncrypted,
  );
}
```

## Factory Methods

### Create New Chat

```dart
factory StoredChat.create({
  String? title,
  String? projectId,
  String? model,
}) {
  final now = DateTime.now();
  return StoredChat(
    id: 'chat_${now.millisecondsSinceEpoch}',
    title: title ?? 'New Chat',
    messages: [],
    createdAt: now,
    updatedAt: now,
    projectId: projectId,
    model: model,
  );
}
```

### Generate Title

```dart
String generateTitle() {
  // Use first user message as title
  final firstUserMessage = messages.firstWhere(
    (m) => m.role == MessageRole.user,
    orElse: () => messages.first,
  );

  final content = firstUserMessage.content;
  if (content.length <= 50) return content;
  return '${content.substring(0, 47)}...';
}
```

## Usage Examples

### Creating a Chat

```dart
// New empty chat
final chat = StoredChat.create(
  title: 'Code Review',
  projectId: 'proj_123',
  model: 'deepseek/deepseek-chat',
);
```

### Adding Messages

```dart
// Add a message
final updatedChat = chat.copyWith(
  messages: [
    ...chat.messages,
    ChatMessage(
      id: 'msg_1',
      content: 'Hello!',
      role: MessageRole.user,
      timestamp: DateTime.now(),
    ),
  ],
  updatedAt: DateTime.now(),
);
```

### Saving and Loading

```dart
// Save (encrypted)
Future<void> saveChat(StoredChat chat) async {
  final json = jsonEncode(chat.toJson());
  final encrypted = await encryptionService.encrypt(json);
  await storage.save(chat.id, encrypted);
}

// Load (decrypted)
Future<StoredChat> loadChat(String id) async {
  final encrypted = await storage.load(id);
  final json = await encryptionService.decrypt(encrypted);
  return StoredChat.fromJson(jsonDecode(json));
}
```

## Computed Properties

```dart
extension StoredChatExtensions on StoredChat {
  /// Number of messages in chat
  int get messageCount => messages.length;

  /// Last message in chat
  ChatMessage? get lastMessage =>
      messages.isNotEmpty ? messages.last : null;

  /// Whether chat has any user messages
  bool get hasUserMessages =>
      messages.any((m) => m.role == MessageRole.user);

  /// Duration since last update
  Duration get timeSinceUpdate =>
      DateTime.now().difference(updatedAt);
}
```
