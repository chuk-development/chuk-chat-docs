---
title: Sync Strategy
weight: 5
---

# Lightweight Sync Strategy

The app uses a lightweight synchronization strategy designed to minimize data transfer, CPU usage, and battery consumption while keeping data consistent across devices.

## Overview

Traditional sync approaches fetch all data on every sync, which is wasteful for chat applications where most data rarely changes. Our strategy only transfers what has actually changed.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Phase 1        │────▶│  Phase 2        │────▶│  Phase 3        │
│  Metadata Fetch │     │  Diff Calc      │     │  Payload Fetch  │
│  (IDs + times)  │     │  (Client-side)  │     │  (Changed only) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────┐
                                               │  Phase 4        │
                                               │  Decrypt/Merge  │
                                               └─────────────────┘
```

## Phase 1: Metadata Fetch

Fetch only IDs and timestamps - no encrypted content.

### SQL Query

```sql
SELECT id, updated_at
FROM encrypted_chats
WHERE user_id = auth.uid();
```

### Dart Implementation

```dart
Future<Map<String, DateTime>> fetchServerMetadata() async {
  final response = await supabase
      .from('encrypted_chats')
      .select('id, updated_at')
      .eq('user_id', supabase.auth.currentUser!.id);

  return {
    for (final row in response)
      row['id'] as String: DateTime.parse(row['updated_at'] as String),
  };
}
```

### Data Size Comparison

| Chats | Full Fetch | Metadata Only | Savings |
|-------|------------|---------------|---------|
| 100   | ~500 KB    | ~5 KB         | 99%     |
| 500   | ~2.5 MB    | ~25 KB        | 99%     |
| 1000  | ~5 MB      | ~50 KB        | 99%     |

## Phase 2: Diff Calculation

Compare server metadata against local state to identify changes. This happens entirely on the client.

### Algorithm

```dart
class SyncDiff {
  final Set<String> newIds;      // Exist on server, not locally
  final Set<String> deletedIds;  // Exist locally, not on server
  final Set<String> updatedIds;  // Exist both, server newer

  SyncDiff({
    required this.newIds,
    required this.deletedIds,
    required this.updatedIds,
  });
}

SyncDiff calculateDiff(
  Map<String, DateTime> serverChats,
  Map<String, DateTime> localChats,
) {
  final serverIds = serverChats.keys.toSet();
  final localIds = localChats.keys.toSet();

  // New: on server but not local
  final newIds = serverIds.difference(localIds);

  // Deleted: on local but not server
  final deletedIds = localIds.difference(serverIds);

  // Updated: on both, but server is newer
  final updatedIds = serverIds.intersection(localIds).where((id) {
    final serverTime = serverChats[id]!;
    final localTime = localChats[id]!;
    return serverTime.isAfter(localTime);
  }).toSet();

  return SyncDiff(
    newIds: newIds,
    deletedIds: deletedIds,
    updatedIds: updatedIds,
  );
}
```

### Example Scenario

```
Server State:
  chat_a: 2024-01-15 10:00:00  (unchanged)
  chat_b: 2024-01-15 12:00:00  (updated)
  chat_c: 2024-01-15 14:00:00  (new)

Local State:
  chat_a: 2024-01-15 10:00:00
  chat_b: 2024-01-15 11:00:00  (older version)
  chat_d: 2024-01-14 09:00:00  (deleted on server)

Diff Result:
  newIds: {chat_c}
  deletedIds: {chat_d}
  updatedIds: {chat_b}
```

## Phase 3: Full Payload Fetch

Only fetch the complete data for chats that have changed.

### SQL Query

```sql
SELECT *
FROM encrypted_chats
WHERE id = ANY($1)  -- Array of changed IDs
AND user_id = auth.uid();
```

### Dart Implementation

```dart
Future<List<EncryptedChat>> fetchChangedChats(Set<String> ids) async {
  if (ids.isEmpty) return [];

  final response = await supabase
      .from('encrypted_chats')
      .select()
      .inFilter('id', ids.toList())
      .eq('user_id', supabase.auth.currentUser!.id);

  return response.map((row) => EncryptedChat.fromJson(row)).toList();
}
```

### Batching for Large Sync

```dart
Future<List<EncryptedChat>> fetchChangedChatsBatched(Set<String> ids) async {
  if (ids.isEmpty) return [];

  const batchSize = 100;
  final idList = ids.toList();
  final results = <EncryptedChat>[];

  for (var i = 0; i < idList.length; i += batchSize) {
    final batch = idList.sublist(
      i,
      (i + batchSize).clamp(0, idList.length),
    );

    final response = await supabase
        .from('encrypted_chats')
        .select()
        .inFilter('id', batch);

    results.addAll(
      response.map((row) => EncryptedChat.fromJson(row)),
    );
  }

  return results;
}
```

## Phase 4: Decrypt and Merge

Decrypt the fetched data and merge into local storage.

### Background Decryption

Heavy decryption runs in a background isolate to keep the UI responsive:

```dart
Future<void> processSync(SyncDiff diff, List<EncryptedChat> changedChats) async {
  // Decrypt in background isolate
  final decrypted = await compute(
    _decryptChatsIsolate,
    DecryptionPayload(
      chats: changedChats,
      key: encryptionKey,
    ),
  );

  // Merge into local state
  for (final chat in decrypted) {
    ChatStorageService.saveChat(chat);
  }

  // Remove deleted chats locally
  for (final id in diff.deletedIds) {
    ChatStorageService.removeLocal(id);
  }
}

// Runs in isolate
List<Chat> _decryptChatsIsolate(DecryptionPayload payload) {
  return payload.chats.map((encrypted) {
    return Chat(
      id: encrypted.id,
      title: encrypted.title,
      messages: EncryptionService.decrypt(
        encrypted.encryptedData,
        payload.key,
      ),
    );
  }).toList();
}
```

### Merge Strategy

```dart
void mergeChats(List<Chat> serverChats) {
  for (final chat in serverChats) {
    final local = _localChats[chat.id];

    if (local == null) {
      // New chat - add directly
      _localChats[chat.id] = chat;
    } else if (chat.updatedAt.isAfter(local.updatedAt)) {
      // Server is newer - replace
      _localChats[chat.id] = chat;
    }
    // If local is newer, keep local (will be pushed on next upload sync)
  }

  // Persist to local storage
  _saveToLocalStorage();
}
```

## Conflict Resolution

### Last-Write-Wins

The app uses a simple last-write-wins strategy based on `updated_at`:

```dart
Chat resolveConflict(Chat local, Chat server) {
  if (server.updatedAt.isAfter(local.updatedAt)) {
    return server;
  }
  return local;
}
```

### Handling Offline Changes

When the device comes online after offline edits:

```dart
Future<void> syncOfflineChanges() async {
  final unsyncedChats = ChatStorageService.getUnsyncedChats();

  for (final chat in unsyncedChats) {
    // Check server version
    final serverVersion = await fetchChatMetadata(chat.id);

    if (serverVersion == null) {
      // Chat was deleted on server - ask user
      final keepLocal = await showConflictDialog(chat);
      if (keepLocal) {
        await uploadChat(chat);
      } else {
        ChatStorageService.removeLocal(chat.id);
      }
    } else if (chat.updatedAt.isAfter(serverVersion.updatedAt)) {
      // Local is newer - push to server
      await uploadChat(chat);
    } else {
      // Server is newer - fetch and replace
      final serverChat = await fetchFullChat(chat.id);
      ChatStorageService.saveChat(serverChat);
    }
  }
}
```

## Sync Triggers

### Automatic Triggers

```dart
class SyncService {
  Timer? _periodicSync;

  void initialize() {
    // Sync on app startup
    sync();

    // Sync when app comes to foreground
    WidgetsBinding.instance.addObserver(_AppLifecycleObserver(onResume: sync));

    // Periodic sync every 5 minutes (when active)
    _periodicSync = Timer.periodic(Duration(minutes: 5), (_) => sync());

    // Sync on connectivity restored
    Connectivity().onConnectivityChanged.listen((status) {
      if (status != ConnectivityResult.none) {
        sync();
      }
    });
  }
}
```

### Manual Trigger

```dart
// Pull-to-refresh in chat list
RefreshIndicator(
  onRefresh: () => SyncService.sync(),
  child: ChatListView(),
);
```

## Optimization Benefits

### Network Efficiency

| Scenario | Traditional | Lightweight | Improvement |
|----------|-------------|-------------|-------------|
| No changes | ~500 KB | ~5 KB | 100x less |
| 1 chat changed | ~500 KB | ~10 KB | 50x less |
| 10 chats changed | ~500 KB | ~55 KB | 9x less |

### CPU Efficiency

Only decrypt what changed:

```
Traditional: Decrypt 100 chats = 100 decrypt operations
Lightweight: Decrypt 3 changed chats = 3 decrypt operations
```

### Battery Efficiency

Less network + less CPU = better battery life for mobile devices.

## Full Sync Implementation

```dart
class ChatSyncService {
  Future<SyncResult> sync() async {
    try {
      // Phase 1: Fetch metadata
      final serverMetadata = await fetchServerMetadata();
      final localMetadata = ChatStorageService.getMetadata();

      // Phase 2: Calculate diff
      final diff = calculateDiff(serverMetadata, localMetadata);

      if (diff.isEmpty) {
        return SyncResult.noChanges();
      }

      // Phase 3: Fetch changed chats
      final changedIds = {...diff.newIds, ...diff.updatedIds};
      final changedChats = await fetchChangedChats(changedIds);

      // Phase 4: Decrypt and merge
      await processSync(diff, changedChats);

      return SyncResult.success(
        added: diff.newIds.length,
        updated: diff.updatedIds.length,
        deleted: diff.deletedIds.length,
      );
    } catch (e) {
      return SyncResult.error(e.toString());
    }
  }
}
```

## Related

- [Encrypted Chats Table](tables/encrypted-chats) - Chat storage schema
- [Row Level Security](row-level-security) - Security during sync
- [Security Documentation](/security) - Encryption details
