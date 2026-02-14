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

## Chat Selection: ID-Based State

Chat selection uses ID-based state management (`selectedChatId`) rather than index-based selection. The previous `selectedChatIndex` global mutable field was eliminated in February 2026 along with all index-adjustment code across the storage modules.

Key changes:
- `selectedChatIndex` field, facade getter/setter, and all index-adjustment logic removed from `chat_storage_crud.dart`, `chat_storage_sync.dart`, `chat_storage_state.dart`, and `chat_storage_service.dart`
- Fully replaced by `selectedChatId` which identifies chats by their unique ID
- On mobile, `selectedChatId` writes are performed inside `setState` in `root_wrapper_mobile.dart` to ensure consistent UI updates

```dart
// ID-based selection (current approach)
void selectChat(String chatId) {
  setState(() {
    selectedChatId = chatId;
  });
}

// Index-based selection was removed:
// selectedChatIndex was a global mutable field that required
// manual adjustment on every insert, delete, or reorder operation
```

## Race Condition Elimination

Multiple race conditions in state initialization were fixed:

- **Triple chat-loading race**: Redundant `loadSavedChatsForSidebar()` calls from `login_page.dart`, sidebars (after delete), and `chat_ui_mobile` (after new-chat persist) were removed. A single startup load point exists in `AppInitializationService._loadUserData()`. Pull-to-refresh uses `ChatSyncService.syncNow()` instead.
- **Duplicate auth subscription race**: `SessionManagerService.initialize()` is deferred until after `waitForSupabase()` completes, preventing duplicate `onAuthStateChange` subscriptions.

## Best Practices

| Practice | Description |
|----------|-------------|
| **Minimize rebuilds** | Use `const` constructors, selective listeners |
| **Single source of truth** | State lives in services, UI observes |
| **Immutable updates** | Create new objects instead of mutating |
| **Dispose resources** | Clean up controllers and subscriptions |
| **ID-based selection** | Identify entities by unique ID, never by list index |
| **Single load point** | One initialization path to prevent race conditions |

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
