---
title: State Management
weight: 5
---

Chuk Chat uses a pragmatic approach to state management, combining Flutter's built-in state mechanisms with service-based state handling.

## State Architecture

```
┌─────────────────────────────────────────────┐
│              UI Components                   │
│         (StatefulWidgets)                    │
├─────────────────────────────────────────────┤
│            Local UI State                    │
│    (scroll position, input focus, etc.)      │
├─────────────────────────────────────────────┤
│          Application State                   │
│   (services with ChangeNotifier/streams)     │
├─────────────────────────────────────────────┤
│          Persisted State                     │
│    (local storage, Supabase, encrypted)      │
└─────────────────────────────────────────────┘
```

## State Categories

### Local UI State

Managed within `StatefulWidget`:

```dart
class _ChatInputState extends State<ChatInput> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  bool _isComposing = false;

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }
}
```

**Examples:**
- Text input content
- Scroll position
- Animation state
- Focus state

### Application State

Managed by services using `ChangeNotifier` or streams:

```dart
class ChatStateService extends ChangeNotifier {
  List<ChatMessage> _messages = [];
  bool _isLoading = false;
  String? _error;

  List<ChatMessage> get messages => List.unmodifiable(_messages);
  bool get isLoading => _isLoading;
  String? get error => _error;

  void addMessage(ChatMessage message) {
    _messages.add(message);
    notifyListeners();
  }

  void setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }
}
```

**Examples:**
- Chat messages
- User authentication state
- Selected AI model
- Theme preferences

### Persisted State

Stored locally or in Supabase:

```dart
class ChatStorageService {
  Future<void> saveChat(StoredChat chat) async {
    // Encrypt before storage
    final encrypted = await _encryptionService.encrypt(
      jsonEncode(chat.toJson()),
    );

    // Save to local database
    await _localDb.put(chat.id, encrypted);

    // Sync to cloud if online
    if (await _networkService.isOnline) {
      await _supabase.upsert(chat);
    }
  }
}
```

**Examples:**
- Chat history
- User preferences
- Encryption keys
- Cached model list

## State Flow

### Message Flow Example

```
User Input → ChatService → StateService → UI Update
                ↓
         API Request
                ↓
         Stream Response
                ↓
         Update State
                ↓
         Persist to Storage
```

```dart
// 1. User sends message
Future<void> sendMessage(String content) async {
  // 2. Update state immediately
  final userMessage = ChatMessage(
    content: content,
    role: MessageRole.user,
  );
  _stateService.addMessage(userMessage);

  // 3. Start streaming response
  _stateService.setLoading(true);

  try {
    await for (final chunk in _apiService.streamChat(content)) {
      _stateService.appendToAssistantMessage(chunk);
    }
  } finally {
    _stateService.setLoading(false);

    // 4. Persist to storage
    await _storageService.saveChat(_stateService.currentChat);
  }
}
```

## State Synchronization

### Online/Offline Sync

```dart
class ChatSyncService {
  final _pendingChanges = <ChatChange>[];

  Future<void> queueChange(ChatChange change) async {
    _pendingChanges.add(change);
    await _localStorage.savePending(_pendingChanges);

    if (await _networkService.isOnline) {
      await _syncPendingChanges();
    }
  }

  Future<void> _syncPendingChanges() async {
    for (final change in _pendingChanges) {
      await _supabase.apply(change);
    }
    _pendingChanges.clear();
  }
}
```

## Best Practices

| Practice | Description |
|----------|-------------|
| **Minimize rebuilds** | Use `const` constructors, selective listeners |
| **Single source of truth** | State lives in services, UI observes |
| **Immutable updates** | Create new objects instead of mutating |
| **Dispose resources** | Clean up controllers and subscriptions |

## State Testing

```dart
void main() {
  test('adding message notifies listeners', () {
    final service = ChatStateService();
    var notified = false;
    service.addListener(() => notified = true);

    service.addMessage(ChatMessage(content: 'Hello'));

    expect(notified, isTrue);
    expect(service.messages.length, 1);
  });
}
```
