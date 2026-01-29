---
title: Sidebars
weight: 2
---

Chuk Chat provides separate sidebar implementations for desktop and mobile, each optimized for its form factor.

## Files

| File | Widget | Description |
|------|--------|-------------|
| `sidebar_desktop.dart` | `SidebarDesktop` | Persistent sidebar for desktop/tablet layouts. Always visible alongside the chat panel. |
| `sidebar_mobile.dart` | `SidebarMobile` | Drawer-style sidebar for mobile layouts. Slides in from the left edge. |

## SidebarDesktop

A stateful widget that displays:

- **New chat** button
- **Chat history** list from `ChatStorageService`, sorted by recency
- **Navigation buttons**: Projects, Media Manager, Settings
- **Credit display** showing remaining credits and free messages
- **Network status** indicator via `NetworkStatusService`
- **Compact mode** support for narrow windows

### Key Callbacks

| Callback | Type | Description |
|----------|------|-------------|
| `onChatSelected` | `Function(String? chatId)` | Called when a chat is tapped, or `null` for new chat |
| `onSettingsTapped` | `Function()` | Navigate to settings |
| `onProjectsTapped` | `Function()` | Navigate to projects |
| `onMediaTapped` | `Function()` | Navigate to media manager |
| `onChatDeleted` | `Future<void> Function(String chatId)?` | Delete a chat with confirmation |

## SidebarMobile

Shares the same callback interface as `SidebarDesktop` with one addition:

| Callback | Type | Description |
|----------|------|-------------|
| `onAssistantsTapped` | `Function()` | Navigate to assistants (mobile-only) |

Both sidebars listen to `ChatStorageService.changes` and `ProfileService` for real-time updates to the chat list and user profile.
