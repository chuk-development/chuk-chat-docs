---
title: Foreground Service
weight: 4
---

# StreamingForegroundService

Android foreground service that keeps AI response streaming alive when the app is backgrounded. Displays a persistent notification with streaming progress and sends completion notifications.

**File:** `lib/services/streaming_foreground_service.dart`

{{< callout type="info" >}}
This service is **Android only**. On iOS and other platforms, the service methods are no-ops that return immediately.
{{< /callout >}}

## Initialization

Initialize the service once at app startup:

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize foreground service
  await StreamingForegroundService.initialize();

  runApp(MyApp());
}
```

## Starting the Service

Start the foreground service when streaming begins:

```dart
// Start when streaming begins
await StreamingForegroundService.startService();
```

This shows a persistent notification indicating that streaming is in progress.

## Updating the Notification

Update the notification with current streaming content:

```dart
// Update notification with preview of content
await StreamingForegroundService.updateNotification(
  'The answer is being generated...',
);

// Truncate long content for notification
final preview = content.length > 100
    ? '${content.substring(0, 100)}...'
    : content;
await StreamingForegroundService.updateNotification(preview);
```

## Stopping the Service

Stop the foreground service when streaming completes:

```dart
// Stop when streaming completes or is cancelled
await StreamingForegroundService.stopService();
```

## Complete Example

```dart
class StreamingController {
  Future<void> startStreaming(String chatId, String message) async {
    // Start foreground service (Android only)
    if (Platform.isAndroid) {
      await StreamingForegroundService.startService();
    }

    final stream = WebSocketChatService.sendStreamingChat(
      accessToken: await getToken(),
      message: message,
      modelId: selectedModel,
      providerSlug: provider,
    );

    String content = '';

    try {
      await for (final event in stream) {
        switch (event) {
          case ContentEvent(:final text):
            content += text;

            // Update notification periodically
            if (Platform.isAndroid && content.length % 50 == 0) {
              await StreamingForegroundService.updateNotification(
                content.length > 100
                    ? '${content.substring(0, 100)}...'
                    : content,
              );
            }

            updateUI(content);

          case DoneEvent():
            // Stop foreground service
            if (Platform.isAndroid) {
              await StreamingForegroundService.stopService();
            }

            // Save message
            await saveMessage(chatId, content);

          case ErrorEvent(:final message):
            // Stop on error
            if (Platform.isAndroid) {
              await StreamingForegroundService.stopService();
            }
            showError(message);
        }
      }
    } catch (e) {
      // Always stop on exception
      if (Platform.isAndroid) {
        await StreamingForegroundService.stopService();
      }
      rethrow;
    }
  }
}
```

## Integration with StreamingManager

```dart
class ManagedStreamingController {
  final StreamingManager _manager = StreamingManager();

  Future<void> startStream(String chatId, String message) async {
    final stream = await _createStream(message);

    // Start foreground service
    if (Platform.isAndroid) {
      await StreamingForegroundService.startService();
    }

    _manager.startStream(
      chatId: chatId,
      messageIndex: 0,
      stream: stream,
      onUpdate: (content, reasoning) {
        // Update UI
        updateUI(chatId, content, reasoning);

        // Update notification
        if (Platform.isAndroid) {
          StreamingForegroundService.updateNotification(
            _truncate(content, 100),
          );
        }
      },
      onComplete: (content, reasoning, tps) async {
        // Save message
        await saveMessage(chatId, content, reasoning);

        // Stop foreground service if no more streams
        if (Platform.isAndroid && !_manager.hasActiveStreams) {
          await StreamingForegroundService.stopService();
        }
      },
      onError: (error) async {
        showError(chatId, error);

        // Stop foreground service if no more streams
        if (Platform.isAndroid && !_manager.hasActiveStreams) {
          await StreamingForegroundService.stopService();
        }
      },
    );
  }

  String _truncate(String text, int maxLength) {
    if (text.length <= maxLength) return text;
    return '${text.substring(0, maxLength)}...';
  }

  void dispose() {
    _manager.cancelAllStreams();
    if (Platform.isAndroid) {
      StreamingForegroundService.stopService();
    }
  }
}
```

## Android Configuration

### Manifest Permissions

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
  <!-- Foreground service permission -->
  <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
  <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />

  <!-- Notification permission (Android 13+) -->
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

  <application>
    <!-- Foreground service declaration -->
    <service
      android:name="com.example.app.StreamingForegroundService"
      android:foregroundServiceType="dataSync"
      android:exported="false" />
  </application>
</manifest>
```

### Notification Channel

The service creates a notification channel automatically:

```dart
// Channel configuration
const channelId = 'streaming_channel';
const channelName = 'AI Streaming';
const channelDescription = 'Shows when AI is generating a response';
```

## Notification Appearance

### During Streaming

```
[App Icon] AI Response Streaming
          The answer is being generated...
          [Ongoing notification - cannot be dismissed]
```

### On Completion

```
[App Icon] Response Complete
          Your AI response is ready
          [Can be dismissed]
```

## Platform Checks

The service gracefully handles non-Android platforms:

```dart
class StreamingForegroundService {
  static Future<void> initialize() async {
    if (!Platform.isAndroid) return;
    // Android-specific initialization
  }

  static Future<void> startService() async {
    if (!Platform.isAndroid) return;
    // Start Android foreground service
  }

  static Future<void> updateNotification(String content) async {
    if (!Platform.isAndroid) return;
    // Update Android notification
  }

  static Future<void> stopService() async {
    if (!Platform.isAndroid) return;
    // Stop Android foreground service
  }
}
```

## Error Handling

```dart
try {
  await StreamingForegroundService.startService();
} on PlatformException catch (e) {
  // Handle platform-specific errors
  debugPrint('Foreground service error: ${e.message}');
  // Continue without foreground service
}
```

## Best Practices

### Start Timing

Start the service **before** starting the stream:

```dart
// Correct order
await StreamingForegroundService.startService();
final stream = createStream();

// NOT this order (stream might start before service)
final stream = createStream();
await StreamingForegroundService.startService();
```

### Stop Timing

Stop the service **after** the stream completes:

```dart
// In onComplete callback
onComplete: (content, reasoning, tps) async {
  await saveMessage(content);  // Save first
  await StreamingForegroundService.stopService();  // Then stop service
},
```

### Multiple Streams

Only stop when all streams are complete:

```dart
if (!manager.hasActiveStreams) {
  await StreamingForegroundService.stopService();
}
```

### Update Frequency

Throttle notification updates to avoid performance issues:

```dart
int _updateCounter = 0;

void onContentUpdate(String content) {
  _updateCounter++;
  if (_updateCounter % 10 == 0) {  // Update every 10 chunks
    StreamingForegroundService.updateNotification(content);
  }
}
```

## Dependencies

- `flutter_foreground_task` package
- Android platform channel

## Related Services

- [StreamingManager](streaming-manager) - Coordinates with foreground service
- [HTTP Streaming](http-streaming) - SSE streaming source
- [WebSocket Streaming](websocket-streaming) - WebSocket streaming source
