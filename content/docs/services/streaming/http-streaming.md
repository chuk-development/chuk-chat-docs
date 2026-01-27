---
title: HTTP Streaming
weight: 1
---

# StreamingChatService

HTTP Server-Sent Events (SSE) streaming for AI chat responses. Provides token-by-token content delivery with support for reasoning events and performance metrics.

**File:** `lib/services/streaming_chat_service.dart`

## Basic Usage

Send a streaming chat request and process events:

```dart
final stream = StreamingChatService.sendStreamingChat(
  accessToken: token,
  message: "Hello, how are you?",
  modelId: "deepseek/deepseek-chat",
  providerSlug: "deepseek",
  history: previousMessages,
  systemPrompt: "You are a helpful assistant.",
  maxTokens: 512,
  temperature: 0.7,
);

await for (final event in stream) {
  switch (event) {
    case ContentEvent(:final text):
      // Message content chunk
      print('Content: $text');
    case ReasoningEvent(:final text):
      // AI thinking/reasoning
      print('Reasoning: $text');
    case TpsEvent(:final tps):
      // Tokens per second metric
      print('Speed: ${tps.toStringAsFixed(1)} t/s');
    case UsageEvent(:final usage):
      // Token usage stats
      print('Tokens: ${usage.inputTokens} in, ${usage.outputTokens} out');
    case ErrorEvent(:final message):
      // Error occurred
      print('Error: $message');
    case DoneEvent():
      // Stream complete
      print('Done');
  }
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
  int? maxTokens,
  double? temperature,
  double? topP,
  double? frequencyPenalty,
  double? presencePenalty,
})
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessToken` | `String` | Yes | Supabase access token for API auth |
| `message` | `String` | Yes | User message to send |
| `modelId` | `String` | Yes | Model identifier (e.g., "deepseek/deepseek-chat") |
| `providerSlug` | `String` | Yes | Provider identifier (e.g., "deepseek") |
| `history` | `List<Message>?` | No | Previous messages for context |
| `systemPrompt` | `String?` | No | System instruction for the AI |
| `maxTokens` | `int?` | No | Maximum tokens in response |
| `temperature` | `double?` | No | Randomness (0.0-2.0, default 1.0) |
| `topP` | `double?` | No | Nucleus sampling threshold |
| `frequencyPenalty` | `double?` | No | Repetition penalty (-2.0-2.0) |
| `presencePenalty` | `double?` | No | Topic diversity penalty (-2.0-2.0) |

## Event Types

### ContentEvent

Delivers chunks of the AI response content:

```dart
case ContentEvent(:final text):
  // Append to message buffer
  messageContent += text;
  updateUI();
```

### ReasoningEvent

Delivers AI reasoning/thinking (for models that support it):

```dart
case ReasoningEvent(:final text):
  // Append to reasoning buffer
  reasoningContent += text;
  updateReasoningPanel();
```

### TpsEvent

Reports tokens-per-second performance metric:

```dart
case TpsEvent(:final tps):
  // Display performance
  performanceLabel.text = '${tps.toStringAsFixed(1)} tokens/sec';
```

### UsageEvent

Reports final token usage statistics:

```dart
case UsageEvent(:final usage):
  print('Input tokens: ${usage.inputTokens}');
  print('Output tokens: ${usage.outputTokens}');
  print('Total tokens: ${usage.totalTokens}');
```

### ErrorEvent

Reports errors during streaming:

```dart
case ErrorEvent(:final message):
  // Handle error
  showErrorDialog(message);
  break; // Exit stream processing
```

### DoneEvent

Signals stream completion:

```dart
case DoneEvent():
  // Finalize message
  await saveMessage(messageContent, reasoningContent);
  setState(() => isStreaming = false);
```

## Complete Example

```dart
class StreamingChat {
  String content = '';
  String reasoning = '';
  double? tps;
  TokenUsage? usage;
  bool isComplete = false;
  String? error;

  Future<void> send(String message) async {
    // Reset state
    content = '';
    reasoning = '';
    tps = null;
    usage = null;
    isComplete = false;
    error = null;

    final stream = StreamingChatService.sendStreamingChat(
      accessToken: await getAccessToken(),
      message: message,
      modelId: 'deepseek/deepseek-chat',
      providerSlug: 'deepseek',
      history: conversationHistory,
      systemPrompt: 'You are a helpful assistant.',
      maxTokens: 1024,
      temperature: 0.7,
    );

    try {
      await for (final event in stream) {
        switch (event) {
          case ContentEvent(:final text):
            content += text;
            onContentUpdate?.call(content);

          case ReasoningEvent(:final text):
            reasoning += text;
            onReasoningUpdate?.call(reasoning);

          case TpsEvent(:final tps):
            this.tps = tps;
            onTpsUpdate?.call(tps);

          case UsageEvent(:final usage):
            this.usage = usage;

          case ErrorEvent(:final message):
            error = message;
            onError?.call(message);
            return;

          case DoneEvent():
            isComplete = true;
            onComplete?.call(content, reasoning);
        }
      }
    } catch (e) {
      error = e.toString();
      onError?.call(error!);
    }
  }

  // Callbacks
  void Function(String)? onContentUpdate;
  void Function(String)? onReasoningUpdate;
  void Function(double)? onTpsUpdate;
  void Function(String content, String reasoning)? onComplete;
  void Function(String error)? onError;
}
```

## With Flutter UI

```dart
class ChatMessage extends StatefulWidget {
  final String prompt;

  @override
  _ChatMessageState createState() => _ChatMessageState();
}

class _ChatMessageState extends State<ChatMessage> {
  String _content = '';
  String _reasoning = '';
  bool _isStreaming = true;
  double? _tps;

  @override
  void initState() {
    super.initState();
    _startStreaming();
  }

  Future<void> _startStreaming() async {
    final stream = StreamingChatService.sendStreamingChat(
      accessToken: context.read<AuthProvider>().accessToken!,
      message: widget.prompt,
      modelId: context.read<ModelProvider>().selectedModel,
      providerSlug: context.read<ModelProvider>().provider,
    );

    await for (final event in stream) {
      if (!mounted) return;

      setState(() {
        switch (event) {
          case ContentEvent(:final text):
            _content += text;
          case ReasoningEvent(:final text):
            _reasoning += text;
          case TpsEvent(:final tps):
            _tps = tps;
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
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_reasoning.isNotEmpty)
          ReasoningPanel(content: _reasoning),
        MarkdownBody(data: _content),
        if (_isStreaming)
          StreamingIndicator()
        else if (_tps != null)
          Text('${_tps!.toStringAsFixed(1)} tokens/sec'),
      ],
    );
  }
}
```

## SSE Protocol Details

The service uses Server-Sent Events over HTTP:

```http
POST /api/chat/stream
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "message": "Hello",
  "model_id": "deepseek/deepseek-chat",
  "provider_slug": "deepseek",
  "history": [...],
  "system_prompt": "...",
  "max_tokens": 512,
  "temperature": 0.7
}
```

Response stream:

```
event: content
data: {"text": "Hello"}

event: content
data: {"text": "!"}

event: reasoning
data: {"text": "The user greeted me..."}

event: tps
data: {"tps": 45.2}

event: usage
data: {"input_tokens": 10, "output_tokens": 5}

event: done
data: {}
```

## Error Handling

```dart
try {
  await for (final event in stream) {
    if (event is ErrorEvent) {
      // API-level error
      throw StreamingException(event.message);
    }
    // Process event...
  }
} on StreamingException catch (e) {
  // API error (rate limit, invalid model, etc.)
  showError('API error: ${e.message}');
} on SocketException catch (e) {
  // Network error
  showError('Network error: Check your connection');
} on TimeoutException catch (e) {
  // Request timeout
  showError('Request timed out');
} on FormatException catch (e) {
  // Invalid response format
  showError('Invalid response from server');
}
```

## Configuration

```dart
class StreamingConfig {
  // Connection timeout
  static const connectionTimeout = Duration(seconds: 30);

  // Read timeout (time between chunks)
  static const readTimeout = Duration(seconds: 60);

  // Maximum response size
  static const maxResponseSize = 10 * 1024 * 1024; // 10MB
}
```

## Dependencies

- `http` package - HTTP client
- `dart:convert` - JSON parsing

## Related Services

- [WebSocket Streaming](websocket-streaming) - Alternative WebSocket transport
- [StreamingManager](streaming-manager) - Stream orchestration
- [Foreground Service](foreground-service) - Android background support
