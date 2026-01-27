---
title: Design Patterns
weight: 6
---

Chuk Chat implements several design patterns to ensure maintainability, testability, and scalability.

## Service Pattern

All business logic is encapsulated in service classes:

```dart
class EncryptionService {
  static const _algorithm = 'AES-256-GCM';
  static const _keyDerivation = 'PBKDF2';

  Future<String> encrypt(String plaintext, String password) async {
    final key = await _deriveKey(password);
    final iv = _generateIV();
    final encrypted = await _aesEncrypt(plaintext, key, iv);
    return base64Encode(encrypted);
  }

  Future<String> decrypt(String ciphertext, String password) async {
    final key = await _deriveKey(password);
    final decoded = base64Decode(ciphertext);
    return await _aesDecrypt(decoded, key);
  }
}
```

**Benefits:**
- Single responsibility
- Easy to test
- Reusable across components

## Repository Pattern

Data access is abstracted through repositories:

```dart
abstract class ChatRepository {
  Future<List<StoredChat>> getChats();
  Future<StoredChat?> getChat(String id);
  Future<void> saveChat(StoredChat chat);
  Future<void> deleteChat(String id);
}

class LocalChatRepository implements ChatRepository {
  final LocalDatabase _db;

  @override
  Future<List<StoredChat>> getChats() async {
    final rows = await _db.query('chats');
    return rows.map(StoredChat.fromJson).toList();
  }
}

class RemoteChatRepository implements ChatRepository {
  final SupabaseClient _supabase;

  @override
  Future<List<StoredChat>> getChats() async {
    final response = await _supabase.from('chats').select();
    return response.map(StoredChat.fromJson).toList();
  }
}
```

## Factory Pattern

Used for creating platform-specific implementations:

```dart
abstract class ChatUI {
  Widget build();

  factory ChatUI.forPlatform() {
    if (Platform.isWindows || Platform.isMacOS || Platform.isLinux) {
      return DesktopChatUI();
    } else {
      return MobileChatUI();
    }
  }
}
```

## Observer Pattern

Services notify listeners of state changes:

```dart
class ModelSelectionService extends ChangeNotifier {
  ModelItem? _selectedModel;

  ModelItem? get selectedModel => _selectedModel;

  void selectModel(ModelItem model) {
    _selectedModel = model;
    notifyListeners();
  }
}

// Usage in widget
class ModelSelector extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: modelService,
      builder: (context, _) {
        return Text(modelService.selectedModel?.name ?? 'None');
      },
    );
  }
}
```

## Strategy Pattern

Used for interchangeable algorithms:

```dart
abstract class MessageFormatter {
  String format(ChatMessage message);
}

class PlainTextFormatter implements MessageFormatter {
  @override
  String format(ChatMessage message) => message.content;
}

class MarkdownFormatter implements MessageFormatter {
  @override
  String format(ChatMessage message) {
    return markdownToHtml(message.content);
  }
}

class ChatRenderer {
  MessageFormatter formatter = PlainTextFormatter();

  void setFormatter(MessageFormatter f) => formatter = f;

  Widget render(ChatMessage message) {
    final formatted = formatter.format(message);
    return Text(formatted);
  }
}
```

## Builder Pattern

Used for complex object construction:

```dart
class ChatRequestBuilder {
  String? _model;
  List<Message> _messages = [];
  double _temperature = 0.7;
  int? _maxTokens;

  ChatRequestBuilder model(String model) {
    _model = model;
    return this;
  }

  ChatRequestBuilder addMessage(Message message) {
    _messages.add(message);
    return this;
  }

  ChatRequestBuilder temperature(double temp) {
    _temperature = temp;
    return this;
  }

  ChatRequestBuilder maxTokens(int tokens) {
    _maxTokens = tokens;
    return this;
  }

  ChatRequest build() {
    if (_model == null) throw StateError('Model required');
    if (_messages.isEmpty) throw StateError('Messages required');

    return ChatRequest(
      model: _model!,
      messages: _messages,
      temperature: _temperature,
      maxTokens: _maxTokens,
    );
  }
}

// Usage
final request = ChatRequestBuilder()
    .model('deepseek/deepseek-chat')
    .addMessage(Message.user('Hello'))
    .temperature(0.8)
    .build();
```

## Singleton Pattern

Used sparingly for global services:

```dart
class AnalyticsService {
  static final AnalyticsService _instance = AnalyticsService._internal();

  factory AnalyticsService() => _instance;

  AnalyticsService._internal();

  void logEvent(String name, Map<String, dynamic> params) {
    // Log to analytics
  }
}
```

## Pattern Summary

| Pattern | Use Case | Example |
|---------|----------|---------|
| Service | Business logic | `EncryptionService`, `ChatService` |
| Repository | Data access | `ChatRepository`, `ModelRepository` |
| Factory | Platform objects | `ChatUI.forPlatform()` |
| Observer | State changes | `ChangeNotifier` services |
| Strategy | Algorithms | Message formatters |
| Builder | Complex objects | Request builders |
| Singleton | Global services | Analytics, logging |
