---
title: WebSocket Streaming
weight: 2
---

# WebSocketChatService

WebSocket streaming for AI chat responses. Provides a persistent connection that survives app backgrounding better than HTTP, with support for inline image uploads.

**File:** `lib/services/websocket_chat_service.dart`

## Basic Usage

Send a streaming chat request over WebSocket:

```dart
final stream = WebSocketChatService.sendStreamingChat(
  accessToken: token,
  message: "Hello, how are you?",
  modelId: "deepseek/deepseek-chat",
  providerSlug: "deepseek",
  history: previousMessages,
  systemPrompt: "You are a helpful assistant.",
);

await for (final event in stream) {
  switch (event) {
    case ContentEvent(:final text):
      print('Content: $text');
    case ReasoningEvent(:final text):
      print('Reasoning: $text');
    case TpsEvent(:final tps):
      print('Speed: ${tps.toStringAsFixed(1)} t/s');
    case UsageEvent(:final usage):
      print('Tokens: ${usage.totalTokens}');
    case ErrorEvent(:final message):
      print('Error: $message');
    case DoneEvent():
      print('Done');
  }
}
```

## With Images

Send images inline with the message:

```dart
// Load images as Base64
final imageBytes = await File('photo.jpg').readAsBytes();
final base64Image = base64Encode(imageBytes);
final dataUri = 'data:image/jpeg;base64,$base64Image';

final stream = WebSocketChatService.sendStreamingChat(
  accessToken: token,
  message: "What's in this image?",
  modelId: "openai/gpt-4-vision",
  providerSlug: "openai",
  images: [dataUri],  // Multiple images supported
);
```

### Image Processing

The service handles image conversion automatically:

```dart
// From file
final file = File('image.png');
final bytes = await file.readAsBytes();
final dataUri = 'data:image/png;base64,${base64Encode(bytes)}';

// From camera
final XFile photo = await camera.takePicture();
final bytes = await photo.readAsBytes();
final dataUri = 'data:image/jpeg;base64,${base64Encode(bytes)}';

// From gallery
final XFile? picked = await picker.pickImage(source: ImageSource.gallery);
if (picked != null) {
  final bytes = await picked.readAsBytes();
  final mimeType = lookupMimeType(picked.path) ?? 'image/jpeg';
  final dataUri = 'data:$mimeType;base64,${base64Encode(bytes)}';
}
```

## API Reference

### sendStreamingChat

```dart
static Stream<StreamEvent> sendStreamingChat({
  required String accessToken,
  required String message,
  required String modelId,
  required String providerSlug,
  List<Message>? history,
  String? systemPrompt,
  List<String>? images,
  int? maxTokens,
  double? temperature,
})
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessToken` | `String` | Yes | Supabase access token |
| `message` | `String` | Yes | User message |
| `modelId` | `String` | Yes | Model identifier |
| `providerSlug` | `String` | Yes | Provider identifier |
| `history` | `List<Message>?` | No | Previous messages |
| `systemPrompt` | `String?` | No | System instruction |
| `images` | `List<String>?` | No | Base64 data URIs |
| `maxTokens` | `int?` | No | Maximum response tokens |
| `temperature` | `double?` | No | Randomness (0.0-2.0) |

## URL Conversion

The service automatically converts HTTP(S) URLs to WebSocket URLs:

```dart
// Automatic conversion
// https://api.example.com/chat → wss://api.example.com/chat
// http://localhost:8080/chat → ws://localhost:8080/chat

final wsUrl = WebSocketChatService.convertToWebSocketUrl(httpUrl);
```

## Complete Example

```dart
class ImageChatWidget extends StatefulWidget {
  @override
  _ImageChatWidgetState createState() => _ImageChatWidgetState();
}

class _ImageChatWidgetState extends State<ImageChatWidget> {
  final _picker = ImagePicker();
  final _images = <String>[];
  String _content = '';
  bool _isStreaming = false;

  Future<void> _pickImage() async {
    final picked = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 85,
    );

    if (picked != null) {
      final bytes = await picked.readAsBytes();
      final dataUri = 'data:image/jpeg;base64,${base64Encode(bytes)}';
      setState(() => _images.add(dataUri));
    }
  }

  Future<void> _sendMessage(String message) async {
    setState(() {
      _isStreaming = true;
      _content = '';
    });

    final stream = WebSocketChatService.sendStreamingChat(
      accessToken: await _getToken(),
      message: message,
      modelId: 'openai/gpt-4-vision',
      providerSlug: 'openai',
      images: _images.isNotEmpty ? _images : null,
    );

    try {
      await for (final event in stream) {
        if (!mounted) return;

        setState(() {
          switch (event) {
            case ContentEvent(:final text):
              _content += text;
            case DoneEvent():
              _isStreaming = false;
            case ErrorEvent(:final message):
              _content = 'Error: $message';
              _isStreaming = false;
            default:
              break;
          }
        });
      }
    } catch (e) {
      setState(() {
        _content = 'Error: $e';
        _isStreaming = false;
      });
    }

    // Clear images after sending
    setState(() => _images.clear());
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Image preview
        if (_images.isNotEmpty)
          Wrap(
            children: _images.map((uri) => ImagePreview(dataUri: uri)).toList(),
          ),

        // Add image button
        IconButton(
          icon: Icon(Icons.image),
          onPressed: _pickImage,
        ),

        // Response
        if (_content.isNotEmpty)
          MarkdownBody(data: _content),

        // Loading indicator
        if (_isStreaming)
          CircularProgressIndicator(),
      ],
    );
  }
}
```

## WebSocket Protocol

### Connection

```dart
// WebSocket handshake with auth
final ws = await WebSocket.connect(
  wsUrl,
  headers: {
    'Authorization': 'Bearer $accessToken',
  },
);
```

### Request Format

```json
{
  "type": "chat",
  "message": "What's in this image?",
  "model_id": "openai/gpt-4-vision",
  "provider_slug": "openai",
  "images": ["data:image/jpeg;base64,..."],
  "history": [...],
  "system_prompt": "...",
  "max_tokens": 1024,
  "temperature": 0.7
}
```

### Response Messages

```json
{"type": "content", "text": "I can see..."}
{"type": "reasoning", "text": "Analyzing the image..."}
{"type": "tps", "tps": 42.5}
{"type": "usage", "input_tokens": 1200, "output_tokens": 150}
{"type": "done"}
{"type": "error", "message": "Rate limit exceeded"}
```

## Connection Management

### Automatic Reconnection

```dart
class WebSocketManager {
  WebSocket? _socket;
  int _reconnectAttempts = 0;
  static const maxReconnectAttempts = 3;

  Future<void> connect() async {
    try {
      _socket = await WebSocket.connect(wsUrl);
      _reconnectAttempts = 0;
    } catch (e) {
      if (_reconnectAttempts < maxReconnectAttempts) {
        _reconnectAttempts++;
        await Future.delayed(Duration(seconds: _reconnectAttempts));
        return connect();
      }
      rethrow;
    }
  }
}
```

### Graceful Shutdown

```dart
// Close connection properly
await _socket?.close(1000, 'Normal closure');
```

## Advantages Over HTTP

| Feature | WebSocket | HTTP/SSE |
|---------|-----------|----------|
| Connection | Persistent | Per-request |
| Background survival | Better | Limited |
| Image handling | Inline | Separate upload |
| Bidirectional | Yes | No |
| Overhead | Lower | Higher |

### When to Use WebSocket

- Mobile apps with frequent backgrounding
- Vision models with image inputs
- Long conversations with many messages
- Low-latency requirements

## Error Handling

```dart
try {
  await for (final event in stream) {
    // Process events...
  }
} on WebSocketException catch (e) {
  // Connection error
  if (e.message.contains('Connection refused')) {
    showError('Server unavailable');
  } else if (e.message.contains('Connection closed')) {
    showError('Connection lost');
  } else {
    showError('WebSocket error: ${e.message}');
  }
} on SocketException catch (e) {
  // Network error
  showError('Network error');
} on TimeoutException catch (e) {
  // Connection timeout
  showError('Connection timed out');
}
```

## Configuration

```dart
class WebSocketConfig {
  // Connection timeout
  static const connectTimeout = Duration(seconds: 10);

  // Ping interval to keep connection alive
  static const pingInterval = Duration(seconds: 30);

  // Maximum message size
  static const maxMessageSize = 50 * 1024 * 1024; // 50MB for images
}
```

## Dependencies

- `dart:io` - WebSocket client
- `dart:convert` - JSON and Base64

## Related Services

- [HTTP Streaming](http-streaming) - Alternative SSE transport
- [StreamingManager](streaming-manager) - Stream orchestration
- [Foreground Service](foreground-service) - Android background support
