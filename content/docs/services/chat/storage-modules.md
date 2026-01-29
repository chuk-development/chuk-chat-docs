---
title: Storage Modules
weight: 3
---

The chat storage system is decomposed into five internal modules that `ChatStorageService` delegates to, each handling a distinct concern.

## Module Overview

```
ChatStorageService (facade)
├── ChatStorageState      — in-memory state and change notifications
├── ChatStorageCrud       — save, update, delete, load from Supabase
├── ChatStorageSidebar    — title-only loading and caching for sidebar
├── ChatStorageMutations  — star, rename, re-encrypt, export
└── ChatStorageSync       — merge synced chats from cloud to local
```

## ChatStorageState

Central state management providing the single source of truth for all chats.

```dart
// lib/services/chat_storage_state.dart

class ChatStorageState {
  static final Map<String, StoredChat> chatsById;
  static final StreamController<String?> changesController;

  static bool initialSyncComplete;
  static int selectedChatIndex;
  static String? get selectedChatId;
  static bool isMessageOperationInProgress;
  static bool isLoadingChat;

  static List<StoredChat> get savedChats;
  static StoredChat? getChatById(String chatId);
  static Stream<String?> get changes;
  static Map<String, DateTime> getChatTimestamps();
  static void notifyChanges([String? chatId]);
  static void notifyChangesImmediate([String? chatId]);
  static Future<void> reset();
}
```

| Feature | Details |
|---------|---------|
| Storage | `Map<String, StoredChat>` keyed by chat ID |
| Notifications | Broadcast `StreamController<String?>` with 100ms debounce |
| Locking | `isMessageOperationInProgress` prevents chat switching during sends; `isLoadingChat` prevents rapid switching during loads |
| Selection | `selectedChatIdNotifier` (`ValueNotifier`) for reactive UI binding |

### Initialization

```dart
// Call at app startup for instant SharedPreferences access
await initChatStorageCache();
```

## ChatStorageCrud

Handles all CRUD operations: creating, reading, updating, and deleting chats in Supabase.

```dart
// lib/services/chat_storage_crud.dart

class ChatStorageCrud {
  static Future<StoredChat?> loadFullChat(String chatId);
  static Future<void> loadFromCache();
  static Future<void> loadChats();
  static Future<StoredChat?> saveChat(List<Map<String, dynamic>> messagesMaps, {String? chatId});
  static Future<StoredChat?> updateChat(String chatId, List<Map<String, dynamic>> messagesMaps);
  static Future<void> deleteChat(String chatId);
}
```

| Feature | Details |
|---------|---------|
| Encryption | All payloads encrypted via `EncryptionService` before storage; titles encrypted separately for fast sidebar loading |
| Progressive loading | First 15 chats decrypted in a single isolate for fast UI, remainder decrypted in background |
| Concurrency | `pendingSaves` map prevents duplicate save operations for the same chat ID |
| Offline fallback | `loadChats()` falls back to `LocalChatCacheService` when offline or on network failure |
| Image cleanup | `deleteChat()` fetches `image_paths` and deletes associated encrypted images from Supabase Storage |

### Save Flow

```
saveChat(messages)
  ├── Generate UUID (or use provided chatId)
  ├── Check for pending saves (deduplicate)
  ├── Convert message maps to ChatMessage objects
  ├── Encrypt payload + title separately
  ├── INSERT into encrypted_chats
  ├── Add to chatsById + notify
  └── Update local cache (async)
```

## ChatStorageSidebar

Optimized loading path for the sidebar: loads only titles (not full message payloads) for instant display.

```dart
// lib/services/chat_storage_sidebar.dart

class ChatStorageSidebar {
  static Future<void> loadSavedChatsForSidebar();
  static Future<void> syncTitlesFromNetwork();
}
```

| Feature | Details |
|---------|---------|
| Cache-first | Loads titles from `SharedPreferences` (no decryption, no network) |
| Incremental decryption | Only decrypts titles that are new or have a newer `updated_at` than the cache |
| Batch decryption | Uses `EncryptionService.decryptBatchInBackground()` for multiple titles in one isolate |
| Change detection | Compares `updated_at` timestamps to skip unchanged titles |

### Loading Strategy

```
loadSavedChatsForSidebar()
  ├── Load titles from SharedPreferences cache (instant)
  ├── Notify UI immediately (no debounce)
  ├── Set initialSyncComplete = true
  └── ChatSyncService takes over for network sync
```

## ChatStorageMutations

Handles non-CRUD mutations: starring, renaming, re-encryption, and export.

```dart
// lib/services/chat_storage_mutations.dart

class ChatStorageMutations {
  static Future<void> setChatStarred(String chatId, bool isStarred);
  static Future<void> renameChat(String chatId, String newName);
  static Future<void> reencryptChats(List<StoredChat> chats);
  static Future<String> exportChats();
  static Future<String> exportChatsAsJson();
}
```

| Method | Details |
|--------|---------|
| `setChatStarred` | Updates `is_starred` in Supabase, updates in-memory state, updates local cache |
| `renameChat` | Requires fully loaded chat; re-encrypts both payload (with `customName`) and title; updates Supabase, memory, and both caches |
| `reencryptChats` | Iterates all provided chats, re-encrypts each payload, and updates Supabase and memory |
| `exportChats` | Waits for all chats to be preloaded, then serializes fully loaded chats to JSON |

### Payload Format

```json
{
  "v": 2,
  "customName": "My Chat Title",
  "messages": [
    {"role": "user", "text": "Hello"},
    {"role": "assistant", "text": "Hi there!", "modelId": "deepseek/deepseek-chat"}
  ]
}
```

## ChatStorageSync

Handles merging cloud-synced chats into local state, called by `ChatSyncService`.

```dart
// lib/services/chat_storage_sync.dart

class ChatStorageSync {
  static Future<void> mergeSyncedChat(Map<String, dynamic> row);
  static Future<void> mergeSyncedChatsBatch(List<Map<String, dynamic>> rows);
  static void removeChatLocally(String chatId);
}
```

| Feature | Details |
|---------|---------|
| Conflict avoidance | Skips chats currently being saved (`savingChats`) or with pending saves |
| Timestamp comparison | Only updates local state if the synced version has a newer `updated_at` |
| Batch processing | `mergeSyncedChatsBatch` decrypts all payloads in a single isolate, then deserializes sequentially with periodic yields to avoid UI jank |
| Fallback | If batch decryption fails, falls back to individual `mergeSyncedChat` calls |
| Local removal | `removeChatLocally` clears the chat from memory, adjusts selection indices, and clears `selectedChatId` if the deleted chat was active |

### Helper Functions

Two top-level functions support background deserialization:

```dart
// Runs in a compute() isolate — must be top-level
DeserializeResult deserializePayloadIsolate(String json);

// Async wrapper: runs isolate + converts maps to ChatMessage objects
Future<ChatPayload> deserializePayloadAsync(String json);
```

The deserializer handles both payload version 1 (legacy field normalization) and version 2 (current format).
