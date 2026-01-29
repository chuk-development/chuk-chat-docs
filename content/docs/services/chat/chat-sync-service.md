---
title: ChatSyncService
weight: 2
---

`ChatSyncService` keeps local chat state synchronized with Supabase using lightweight polling to detect changes without fetching full payloads.

## Definition

```dart
// lib/services/chat_sync_service.dart

class ChatSyncService {
  static const int _pollIntervalSeconds = 5;

  static void start();
  static void stop();
  static void pause();
  static void resume();
  static Future<void> syncNow();
}
```

## Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `start()` | `void` | Enable the sync service and begin polling every 5 seconds |
| `stop()` | `void` | Disable the sync service and cancel the timer |
| `pause()` | `void` | Cancel the timer without disabling (e.g., app backgrounded) |
| `resume()` | `void` | Restart the timer and sync titles from network immediately |
| `syncNow()` | `Future<void>` | Trigger an immediate sync cycle outside the timer |

## Sync Algorithm

Each polling cycle performs a three-step differential sync:

1. **Fetch metadata** -- Query `encrypted_chats` for `id` and `updated_at` only (lightweight).
2. **Detect differences** -- Compare cloud state against local state:
   - **New chats**: IDs present in cloud but not locally.
   - **Updated chats**: IDs present in both, but cloud `updated_at` is newer.
   - **Deleted chats**: IDs present locally but not in cloud.
3. **Apply changes**:
   - Fetch full encrypted payloads for new and updated chats, then call `ChatStorageService.mergeSyncedChatsBatch()`.
   - Remove deleted chats locally via `ChatStorageService.removeChatLocally()`.
   - Persist updated titles to the local cache.

## Lifecycle

```
App login  ──▶  start()
                  │
                  ├── 1s delay ──▶ first sync (titles from network)
                  ├── every 5s ──▶ _performSync()
                  │
App background ──▶  pause()
App foreground ──▶  resume()  ──▶ titles sync + restart timer
                  │
App logout  ──▶  stop()
```

## Guards and Safety

The sync cycle is skipped when any of these conditions are true:

| Condition | Reason |
|-----------|--------|
| `_isSyncing == true` | Prevents concurrent sync operations |
| `_isEnabled == false` | Service has been stopped |
| `initialSyncComplete == false` | Initial cache load has not finished yet |
| `NetworkStatusService.isOnline == false` | Device is offline |
| `currentUser == null` | No authenticated user |
| `EncryptionService.hasKey == false` | Encryption key not loaded |

## Error Handling

When a sync cycle fails:
- The error is logged but does not crash the service.
- If the error appears to be a network error, `NetworkStatusService.hasInternetConnection()` is called to update the offline indicator.
- The next polling cycle will retry automatically.

## Usage Examples

### Starting Sync After Login

```dart
// After user authenticates and sidebar loads:
await ChatStorageService.loadSavedChatsForSidebar();
ChatSyncService.start();
```

### App Lifecycle Integration

```dart
@override
void didChangeAppLifecycleState(AppLifecycleState state) {
  switch (state) {
    case AppLifecycleState.paused:
      ChatSyncService.pause();
      break;
    case AppLifecycleState.resumed:
      ChatSyncService.resume();
      break;
    default:
      break;
  }
}
```

### Force Sync

```dart
// After a user action that may have changed data on the server
await ChatSyncService.syncNow();
```

## Dependencies

| Service | Usage |
|---------|-------|
| `ChatStorageService` | Access local state, merge synced chats, sync titles |
| `ChatStorageState` | Read `initialSyncComplete` and `chatsById` |
| `SupabaseService` | Query `encrypted_chats` table |
| `EncryptionService` | Check if encryption key is loaded |
| `NetworkStatusService` | Check online status, detect network errors |
