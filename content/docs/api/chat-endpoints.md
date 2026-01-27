---
title: Chat Endpoints
weight: 1
---

# Chat Streaming Endpoints

The chat API supports two streaming protocols: HTTP Server-Sent Events (SSE) for web compatibility and WebSocket for persistent connections. Both protocols stream AI responses in real-time with support for reasoning tokens, usage statistics, and performance metrics.

## HTTP SSE Endpoint

```http
POST /v1/ai/chat
```

Server-Sent Events provide unidirectional streaming over HTTP, ideal for web browsers and stateless request handling.

### Headers

```http
Authorization: Bearer {accessToken}
Accept: text/event-stream
Content-Type: multipart/form-data
```

### Request Parameters

The request body is sent as `multipart/form-data`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model_id` | string | Yes | Model identifier (e.g., `deepseek/deepseek-chat`) |
| `message` | string | Yes | User message content |
| `max_tokens` | integer | No | Maximum tokens in response (default: 4096) |
| `temperature` | float | No | Response creativity (0.0-2.0, default: 0.7) |
| `provider` | string | Yes | Provider display name |
| `provider_slug` | string | Yes | Provider identifier for routing |
| `history` | JSON string | No | Previous conversation turns |
| `system_prompt` | string | No | Custom system instructions |
| `metadata` | JSON string | No | Request metadata for logging |
| `images[]` | file(s) | No | Image attachments for vision models |

### History Format

The `history` field contains previous conversation turns as a JSON array:

```json
[
  {
    "role": "user",
    "content": "What is Flutter?",
    "images": null
  },
  {
    "role": "assistant",
    "content": "Flutter is Google's UI toolkit for building natively compiled applications..."
  },
  {
    "role": "user",
    "content": "How does hot reload work?",
    "images": null
  }
]
```

### Response Stream

The server streams events in SSE format:

```
data: {"content": "Hello"}

data: {"content": ", how can"}

data: {"content": " I help you?"}

data: {"reasoning": "The user is asking for assistance..."}

data: {"usage": {"prompt_tokens": 45, "completion_tokens": 128}}

data: {"meta": {"model": "deepseek-chat", "provider": "deepseek"}}

data: {"tps": 52.3}

data: [DONE]
```

### Event Types

| Event | Description |
|-------|-------------|
| `content` | Text chunk of the AI response |
| `reasoning` | Thinking/reasoning tokens (for reasoning models) |
| `usage` | Token usage statistics |
| `meta` | Model and provider metadata |
| `tps` | Tokens per second performance metric |
| `error` | Error message if streaming fails |
| `[DONE]` | End of stream marker |

### Complete Example

```dart
import 'package:dio/dio.dart';

Future<void> streamChat() async {
  final dio = Dio();
  final formData = FormData.fromMap({
    'model_id': 'deepseek/deepseek-chat',
    'message': 'Explain quantum computing in simple terms',
    'max_tokens': 1024,
    'temperature': 0.7,
    'provider': 'DeepSeek',
    'provider_slug': 'deepseek',
    'history': jsonEncode([]),
    'system_prompt': 'You are a helpful science teacher.',
  });

  final response = await dio.post(
    'https://api.chuk.chat/v1/ai/chat',
    data: formData,
    options: Options(
      headers: {
        'Authorization': 'Bearer $accessToken',
        'Accept': 'text/event-stream',
      },
      responseType: ResponseType.stream,
    ),
  );

  final stream = response.data.stream as Stream<List<int>>;
  final buffer = StringBuffer();

  await for (final chunk in stream) {
    final text = utf8.decode(chunk);
    for (final line in text.split('\n')) {
      if (line.startsWith('data: ')) {
        final data = line.substring(6);
        if (data == '[DONE]') {
          print('Stream complete');
          break;
        }

        final json = jsonDecode(data);
        if (json['content'] != null) {
          buffer.write(json['content']);
          print('Content: ${json['content']}');
        }
        if (json['reasoning'] != null) {
          print('Reasoning: ${json['reasoning']}');
        }
        if (json['tps'] != null) {
          print('Speed: ${json['tps']} tokens/sec');
        }
      }
    }
  }

  print('Final response: $buffer');
}
```

---

## WebSocket Endpoint

```
WS /v1/ai/chat/ws
```

WebSocket provides bidirectional, persistent connections ideal for mobile applications where connection stability during app backgrounding is important.

{{< callout type="info" >}}
WebSocket is the preferred protocol for mobile clients as it handles network transitions and app lifecycle events more gracefully than SSE.
{{< /callout >}}

### Connection

```dart
import 'package:web_socket_channel/web_socket_channel.dart';

final channel = WebSocketChannel.connect(
  Uri.parse('wss://api.chuk.chat/v1/ai/chat/ws'),
);
```

### Request Message

Send a JSON message to initiate streaming:

```json
{
  "token": "accessToken",
  "message": "What is the meaning of life?",
  "model_id": "deepseek/deepseek-chat",
  "provider_slug": "deepseek",
  "max_tokens": 512,
  "temperature": 0.7,
  "history": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Hi! How can I help you today?"
    }
  ],
  "system_prompt": "You are a philosophical advisor.",
  "images": ["data:image/png;base64,iVBORw0KGgo..."]
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | Yes | Authentication access token |
| `message` | string | Yes | User message content |
| `model_id` | string | Yes | Model identifier |
| `provider_slug` | string | Yes | Provider routing identifier |
| `max_tokens` | integer | No | Maximum response tokens |
| `temperature` | float | No | Response creativity (0.0-2.0) |
| `history` | array | No | Previous conversation turns |
| `system_prompt` | string | No | Custom system instructions |
| `images` | array | No | Base64 data URLs for vision models |

### Response Events

The server sends JSON messages for each event:

```json
{"content": "The meaning of life"}
```

```json
{"content": " is a deeply personal question..."}
```

```json
{"reasoning": "This is a philosophical question that requires careful consideration..."}
```

```json
{"usage": {"prompt_tokens": 89, "completion_tokens": 256}}
```

```json
{"tps": 48.7}
```

```json
{"done": true}
```

### Complete WebSocket Example

```dart
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';

class WebSocketChatClient {
  WebSocketChannel? _channel;
  final StringBuffer _contentBuffer = StringBuffer();
  final StringBuffer _reasoningBuffer = StringBuffer();

  Future<String> sendMessage({
    required String token,
    required String message,
    required String modelId,
    required String providerSlug,
    List<Map<String, dynamic>>? history,
    String? systemPrompt,
    List<String>? images,
  }) async {
    _channel = WebSocketChannel.connect(
      Uri.parse('wss://api.chuk.chat/v1/ai/chat/ws'),
    );

    final request = {
      'token': token,
      'message': message,
      'model_id': modelId,
      'provider_slug': providerSlug,
      'max_tokens': 1024,
      'temperature': 0.7,
      'history': history ?? [],
      if (systemPrompt != null) 'system_prompt': systemPrompt,
      if (images != null) 'images': images,
    };

    _channel!.sink.add(jsonEncode(request));

    await for (final message in _channel!.stream) {
      final event = jsonDecode(message as String);

      if (event['content'] != null) {
        _contentBuffer.write(event['content']);
        onContentReceived?.call(event['content']);
      }

      if (event['reasoning'] != null) {
        _reasoningBuffer.write(event['reasoning']);
        onReasoningReceived?.call(event['reasoning']);
      }

      if (event['tps'] != null) {
        onTpsReceived?.call(event['tps'] as double);
      }

      if (event['usage'] != null) {
        onUsageReceived?.call(event['usage']);
      }

      if (event['error'] != null) {
        throw ChatException(event['error']);
      }

      if (event['done'] == true) {
        break;
      }
    }

    await _channel!.sink.close();
    return _contentBuffer.toString();
  }

  // Callbacks for real-time updates
  void Function(String)? onContentReceived;
  void Function(String)? onReasoningReceived;
  void Function(double)? onTpsReceived;
  void Function(Map<String, dynamic>)? onUsageReceived;

  void dispose() {
    _channel?.sink.close();
  }
}
```

---

## Vision Model Support

For models that support image understanding (e.g., `gpt-4-vision`, `claude-3-opus`), images can be attached to messages.

### SSE with Images

```dart
final formData = FormData.fromMap({
  'model_id': 'openai/gpt-4-vision-preview',
  'message': 'What objects are in this image?',
  'provider': 'OpenAI',
  'provider_slug': 'openai',
  'images[]': [
    await MultipartFile.fromFile('/path/to/image.jpg'),
  ],
});
```

### WebSocket with Images

Images are sent as base64 data URLs:

```json
{
  "token": "accessToken",
  "message": "Describe this image",
  "model_id": "openai/gpt-4-vision-preview",
  "provider_slug": "openai",
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
  ]
}
```

### Image Preparation

```dart
// Convert image to base64 data URL
Future<String> imageToDataUrl(File file) async {
  final bytes = await file.readAsBytes();
  final base64 = base64Encode(bytes);
  final mimeType = lookupMimeType(file.path) ?? 'image/jpeg';
  return 'data:$mimeType;base64,$base64';
}

// Resize image for upload (recommended max 2048px)
Future<Uint8List> resizeImage(Uint8List bytes, {int maxDimension = 2048}) async {
  final image = img.decodeImage(bytes);
  if (image == null) return bytes;

  if (image.width <= maxDimension && image.height <= maxDimension) {
    return bytes;
  }

  final resized = img.copyResize(
    image,
    width: image.width > image.height ? maxDimension : null,
    height: image.height >= image.width ? maxDimension : null,
  );

  return Uint8List.fromList(img.encodeJpg(resized, quality: 85));
}
```

---

## Streaming Best Practices

### Connection Handling

```dart
// Implement exponential backoff for reconnection
class StreamingRetryPolicy {
  int _attempts = 0;
  static const maxAttempts = 5;
  static const baseDelay = Duration(seconds: 1);

  Duration get nextDelay {
    final delay = baseDelay * pow(2, _attempts).toInt();
    _attempts++;
    return delay.clamp(Duration.zero, const Duration(seconds: 30));
  }

  bool get shouldRetry => _attempts < maxAttempts;

  void reset() => _attempts = 0;
}
```

### Buffering Strategy

```dart
// Efficient text buffering for real-time display
class StreamingBuffer {
  final StringBuffer _content = StringBuffer();
  final StringBuffer _reasoning = StringBuffer();
  final _controller = StreamController<String>.broadcast();

  Stream<String> get contentStream => _controller.stream;
  String get content => _content.toString();
  String get reasoning => _reasoning.toString();

  void addContent(String text) {
    _content.write(text);
    _controller.add(text);
  }

  void addReasoning(String text) {
    _reasoning.write(text);
  }

  void dispose() {
    _controller.close();
  }
}
```

### Cancellation

```dart
// Cancel ongoing stream requests
class CancellableStream {
  CancelToken? _cancelToken;

  Future<void> startStream() async {
    _cancelToken = CancelToken();

    try {
      await dio.post(
        '/v1/ai/chat',
        cancelToken: _cancelToken,
        // ... other options
      );
    } on DioException catch (e) {
      if (e.type == DioExceptionType.cancel) {
        print('Stream cancelled by user');
      } else {
        rethrow;
      }
    }
  }

  void cancel() {
    _cancelToken?.cancel('User cancelled');
    _cancelToken = null;
  }
}
```
