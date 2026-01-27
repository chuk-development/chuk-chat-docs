---
title: Chat Services
weight: 2
---

# Chat Storage Services

The chat services manage all aspects of chat data persistence, synchronization, and state management. These services work together to provide a seamless experience for storing, loading, and syncing encrypted chat data.

## Overview

The chat storage architecture follows a modular design:

```
ChatStorageService (facade)
    ├── ChatStorageCrud      - Create, read, update, delete
    ├── ChatStorageState     - In-memory state and notifications
    ├── ChatStorageSidebar   - Fast sidebar loading
    ├── ChatStorageSync      - Merge synced chats
    └── ChatStorageMutations - Message mutations
```

## Service Components

### [ChatStorageService](chat-storage-service)

The central facade that provides a unified API for all chat operations:

- Progressive loading (cache, sidebar, full)
- CRUD operations (save, update, delete)
- State access and notifications
- Chat mutations (rename, star, add/delete messages)

### [ChatSyncService](chat-sync-service)

Handles background synchronization with the server:

- 5-second polling interval
- Differential sync (only changed chats)
- Batch decryption in background isolate
- Automatic merge with local state

### [Storage Modules](storage-modules)

Modular components that power ChatStorageService:

- **ChatStorageCrud** - Database operations
- **ChatStorageState** - Reactive state management
- **ChatStorageSidebar** - Optimized sidebar queries
- **ChatStorageMutations** - Message-level operations

## Data Flow

### Loading Flow

```
App Start
    ↓
Load from Local Cache (instant)
    ↓
Load Sidebar Data (titles only, fast)
    ↓
Load Full Chat on Selection (lazy)
    ↓
Background Sync (continuous)
```

### Save Flow

```
User Creates/Updates Chat
    ↓
Encrypt with EncryptionService
    ↓
Save to Supabase
    ↓
Update Local State
    ↓
Notify Listeners
```

### Sync Flow

```
Every 5 Seconds
    ↓
Fetch Server Timestamps
    ↓
Compare with Local Timestamps
    ↓
Identify: New, Updated, Deleted
    ↓
Fetch Changed Chats
    ↓
Decrypt in Background Isolate
    ↓
Merge into Local State
```

## Integration Example

Here's how the chat services work together:

```dart
// 1. Initialize on sign in (automatic via AuthService)
await ChatStorageService.loadSavedChatsForSidebar();
ChatSyncService.start();

// 2. Display sidebar
final chats = ChatStorageService.savedChats;
for (final chat in chats) {
  print('${chat.title} - ${chat.messageCount} messages');
}

// 3. Load full chat on selection
await ChatStorageService.loadFullChat(chatId);
final fullChat = ChatStorageService.getChatById(chatId);
for (final message in fullChat.messages) {
  print('${message.role}: ${message.content}');
}

// 4. Listen for updates
ChatStorageService.changes.listen((chatId) {
  // Refresh UI for this chat
  setState(() {});
});

// 5. Stop sync on sign out (automatic via AuthService)
ChatSyncService.stop();
```

## State Management

The chat services integrate with Flutter's reactive model:

```dart
class ChatListWidget extends StatefulWidget {
  @override
  _ChatListWidgetState createState() => _ChatListWidgetState();
}

class _ChatListWidgetState extends State<ChatListWidget> {
  late StreamSubscription _subscription;

  @override
  void initState() {
    super.initState();
    _subscription = ChatStorageService.changes.listen((_) {
      setState(() {});
    });
  }

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final chats = ChatStorageService.savedChats;
    return ListView.builder(
      itemCount: chats.length,
      itemBuilder: (context, index) => ChatTile(chat: chats[index]),
    );
  }
}
```

## Encryption Integration

All chat data is encrypted before storage:

```dart
// Automatic during save
await ChatStorageService.saveChat(messages, chatId);
// Internally: EncryptionService.encryptString(jsonEncode(chat))

// Automatic during load
await ChatStorageService.loadFullChat(chatId);
// Internally: EncryptionService.decryptString(encryptedData)
```

## Performance Optimizations

### Progressive Loading

Chats are loaded in stages for optimal UX:

| Stage | Data | Speed | Use Case |
|-------|------|-------|----------|
| Cache | Previous session | Instant | Show immediately |
| Sidebar | Title, timestamp | Fast | Populate sidebar |
| Full | All messages | Lazy | When chat selected |

### Background Processing

Heavy operations run in isolates:

- Decryption of chat data
- JSON parsing of large chats
- Batch sync operations

### Differential Sync

Only changed chats are synchronized:

```dart
// Server query
SELECT id, updated_at FROM encrypted_chats WHERE user_id = ?

// Local comparison
final newIds = serverIds.difference(localIds);
final deletedIds = localIds.difference(serverIds);
final updatedIds = serverIds.where((id) =>
  serverTimestamps[id] > localTimestamps[id]
);

// Fetch only what changed
SELECT * FROM encrypted_chats WHERE id IN (newIds + updatedIds)
```

## Error Handling

```dart
try {
  await ChatStorageService.saveChat(messages, chatId);
} on EncryptionException catch (e) {
  // Encryption failed
  showError('Failed to encrypt chat');
} on PostgrestException catch (e) {
  // Database error
  showError('Failed to save chat');
} on NetworkException catch (e) {
  // Offline - queue for later
  await OfflineQueue.add(SaveOperation(messages, chatId));
}
```

## Related Services

- [EncryptionService](../auth/encryption-service) - Data encryption
- [SupabaseService](../auth/supabase-service) - Database operations
- [StreamingManager](../streaming/streaming-manager) - Active chat streaming
