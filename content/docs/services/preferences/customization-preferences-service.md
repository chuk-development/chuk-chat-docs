---
title: CustomizationPreferencesService
weight: 3
---

`CustomizationPreferencesService` manages UI behavior toggles and image generation settings stored in the `customization_preferences` Supabase table.

## Definition

```dart
// lib/services/customization_preferences_service.dart

class CustomizationPreferences {
  const CustomizationPreferences({
    required this.userId,
    required this.autoSendVoiceTranscription,
    required this.showReasoningTokens,
    required this.showModelInfo,
    required this.showTps,
    required this.imageGenEnabled,
    required this.imageGenDefaultSize,
    required this.imageGenCustomWidth,
    required this.imageGenCustomHeight,
    required this.imageGenUseCustomSize,
  });

  final String userId;
  final bool autoSendVoiceTranscription;
  final bool showReasoningTokens;
  final bool showModelInfo;
  final bool showTps;
  final bool imageGenEnabled;
  final String imageGenDefaultSize;
  final int imageGenCustomWidth;
  final int imageGenCustomHeight;
  final bool imageGenUseCustomSize;
}
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `userId` | `String` | -- | User ID (foreign key to `auth.users`) |
| `autoSendVoiceTranscription` | `bool` | `false` | Automatically send voice transcription without manual confirmation |
| `showReasoningTokens` | `bool` | `true` | Display reasoning/thinking tokens in AI responses |
| `showModelInfo` | `bool` | `true` | Show model name and metadata in the chat UI |
| `showTps` | `bool` | `false` | Display tokens-per-second performance metric |
| `imageGenEnabled` | `bool` | `false` | Enable the image generation feature |
| `imageGenDefaultSize` | `String` | `'landscape_4_3'` | Default image generation aspect ratio preset |
| `imageGenCustomWidth` | `int` | `1024` | Custom width in pixels when using custom size |
| `imageGenCustomHeight` | `int` | `768` | Custom height in pixels when using custom size |
| `imageGenUseCustomSize` | `bool` | `false` | Use custom dimensions instead of the preset size |

## Service Methods

```dart
class CustomizationPreferencesService {
  const CustomizationPreferencesService();

  Future<CustomizationPreferences> loadOrCreate();
  Future<void> save(CustomizationPreferences preferences);
}
```

| Method | Return | Description |
|--------|--------|-------------|
| `loadOrCreate()` | `Future<CustomizationPreferences>` | Fetches the user's customization row, or inserts defaults if none exists. Throws `CustomizationPreferencesServiceException` if the user is not signed in. |
| `save(preferences)` | `Future<void>` | Upserts the given preferences to the `customization_preferences` table, keyed on `user_id`. |

## Error Handling

```dart
class CustomizationPreferencesServiceException implements Exception {
  const CustomizationPreferencesServiceException(this.message);
  final String message;
}
```

Thrown when `loadOrCreate()` is called without an authenticated user.

## Usage Examples

### Loading Preferences

```dart
final service = const CustomizationPreferencesService();
final prefs = await service.loadOrCreate();

if (prefs.showReasoningTokens) {
  // Render reasoning tokens in chat bubbles
}
```

### Toggling a Setting

```dart
final updated = prefs.copyWith(
  autoSendVoiceTranscription: true,
);
await service.save(updated);
```

### Configuring Image Generation

```dart
final updated = prefs.copyWith(
  imageGenEnabled: true,
  imageGenUseCustomSize: true,
  imageGenCustomWidth: 1920,
  imageGenCustomHeight: 1080,
);
await service.save(updated);
```
