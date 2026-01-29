---
title: ChatStorageService
weight: 1
---

`ChatStorageService` is a facade that provides a unified, backward-compatible API for all chat storage operations, delegating to specialized modules for implementation.

## Definition

```dart
// lib/services/chat_storage_service.dart

class ChatStorageService {
  // State properties (delegated to ChatStorageState)
  static bool get initialSyncComplete;
  static int get selectedChatIndex;
  static ValueNotifier<String?> get selectedChatIdNotifier;
  static String? get selectedChatId;
  static bool get isMessageOperationInProgress;
  static String? get activeMessageChatId;
  static bool get isLoadingChat;
  static List<StoredChat> get savedChats;
  static Stream<String?> get changes;

  // CRUD operations (delegated to ChatStorageCrud)
  static Future<StoredChat?> loadFullChat(String chatId);
  static Future<void> loadFromCache();
  static Future<void> loadChats();
  static Future<StoredChat?> saveChat(List<Map<String, dynamic>> messagesMaps, {String? chatId});
  static Future<StoredChat?> updateChat(String chatId, List<Map<String, dynamic>> messagesMaps);
  static Future<void> deleteChat(String chatId);

  // Sidebar operations (delegated to ChatStorageSidebar)
  static Future<void> loadSavedChatsForSidebar();
  static Future<void> syncTitlesFromNetwork();

  // Mutations (delegated to ChatStorageMutations)
  static Future<void> setChatStarred(String chatId, bool isStarred);
  static Future<void> renameChat(String chatId, String newName);
  static Future<void> reencryptChats(List<StoredChat> chats);
  static Future<String> exportChats();
  static Future<String> exportChatsAsJson();

  // Sync support (delegated to ChatStorageSync)
  static Future<void> mergeSyncedChat(Map<String, dynamic> row);
  static Future<void> mergeSyncedChatsBatch(List<Map<String, dynamic>> rows);
  static void removeChatLocally(String chatId);

  // Reset
  static Future<void> reset();
}
```

## Architecture

`ChatStorageService` follows the **facade pattern**. It re-exports models and delegates all work to five internal modules:

| Module | Responsibility |
|--------|----------------|
| `ChatStorageState` | In-memory state, selection tracking, change notifications |
| `ChatStorageCrud` | Save, update, delete, load operations against Supabase |
| `ChatStorageSidebar` | Title-only loading and caching for fast sidebar display |
| `ChatStorageMutations` | Star, rename, re-encrypt, and export operations |
| `ChatStorageSync` | Merge synced chats from cloud into local state |

## State Properties

| Property | Type | Description |
|----------|------|-------------|
| `initialSyncComplete` | `bool` | Whether the initial cache load has finished |
| `selectedChatIndex` | `int` | Index of the currently selected chat (-1 for none) |
| `selectedChatIdNotifier` | `ValueNotifier<String?>` | Reactive notifier for the selected chat ID |
| `selectedChatId` | `String?` | The currently selected chat ID (null = new chat) |
| `isMessageOperationInProgress` | `bool` | Global lock preventing chat switching during message sends |
| `activeMessageChatId` | `String?` | Chat ID currently involved in a message operation |
| `isLoadingChat` | `bool` | Lock preventing rapid chat switching while loading |
| `savedChats` | `List<StoredChat>` | All chats sorted by creation date (most recent first) |
| `changes` | `Stream<String?>` | Stream emitting changed chat IDs, or null for bulk changes |

## Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getChatById(chatId)` | `StoredChat?` | Look up a chat by its ID |
| `getChatTimestamps()` | `Map<String, DateTime>` | Get chat ID to `updated_at` map for sync comparison |
| `loadFullChat(chatId)` | `Future<StoredChat?>` | Lazy-load a chat's full encrypted payload and messages |
| `loadFromCache()` | `Future<void>` | Load chats from local cache only (no network) |
| `loadChats()` | `Future<void>` | Load all chats from Supabase with cache fallback |
| `saveChat(messagesMaps, {chatId})` | `Future<StoredChat?>` | Save a new chat; encrypts payload and title separately |
| `updateChat(chatId, messagesMaps)` | `Future<StoredChat?>` | Update an existing chat's encrypted payload |
| `deleteChat(chatId)` | `Future<void>` | Delete a chat and its associated stored images |
| `loadSavedChatsForSidebar()` | `Future<void>` | Load title-only chat stubs for instant sidebar display |
| `syncTitlesFromNetwork()` | `Future<void>` | Fetch and decrypt titles from Supabase for sidebar |
| `setChatStarred(chatId, isStarred)` | `Future<void>` | Toggle a chat's starred status |
| `renameChat(chatId, newName)` | `Future<void>` | Rename a chat (loads full chat first if needed) |
| `reencryptChats(chats)` | `Future<void>` | Re-encrypt all provided chats with the current key |
| `exportChats()` | `Future<String>` | Export all fully-loaded chats as a JSON string |
| `mergeSyncedChat(row)` | `Future<void>` | Merge a single synced chat row into local state |
| `mergeSyncedChatsBatch(rows)` | `Future<void>` | Batch merge multiple synced chat rows efficiently |
| `removeChatLocally(chatId)` | `void` | Remove a chat from local state without a database call |
| `reset()` | `Future<void>` | Clear all in-memory state and caches |

## Usage Examples

### Loading Chats on Startup

```dart
// Fast path: load cached titles for sidebar, then sync in background
await ChatStorageService.loadSavedChatsForSidebar();

// Listen for changes
ChatStorageService.changes.listen((chatId) {
  if (chatId != null) {
    // Single chat changed — update just that item
  } else {
    // Bulk change — rebuild the full list
  }
});
```

### Saving and Updating a Chat

```dart
// Save a new chat
final chat = await ChatStorageService.saveChat([
  {'sender': 'user', 'text': 'Hello!'},
  {'sender': 'ai', 'text': 'Hi there!', 'modelId': 'deepseek/deepseek-chat'},
]);

// Update with new messages
await ChatStorageService.updateChat(chat!.id, [
  {'sender': 'user', 'text': 'Hello!'},
  {'sender': 'ai', 'text': 'Hi there!', 'modelId': 'deepseek/deepseek-chat'},
  {'sender': 'user', 'text': 'Tell me more.'},
  {'sender': 'ai', 'text': 'Sure, here is more detail...'},
]);
```

### Lazy-Loading a Full Chat

```dart
// Sidebar shows title-only stubs; load full content on tap
final fullChat = await ChatStorageService.loadFullChat(chatId);
if (fullChat != null) {
  // Display messages
  for (final msg in fullChat.messages) {
    print('${msg.role}: ${msg.text}');
  }
}
```

### Deleting and Starring

```dart
// Star a chat
await ChatStorageService.setChatStarred(chatId, true);

// Delete a chat (also removes associated images from storage)
await ChatStorageService.deleteChat(chatId);
```

### Exporting Chats

```dart
final json = await ChatStorageService.exportChats();
// json contains all chats with messages in JSON format
```

## Re-exports

The file also re-exports commonly used types for convenience:

```dart
export 'package:chuk_chat/models/chat_message.dart';
export 'package:chuk_chat/models/stored_chat.dart';
export 'package:chuk_chat/services/chat_storage_state.dart' show initChatStorageCache;
```
