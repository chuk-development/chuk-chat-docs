---
title: Debugging
weight: 5
---

Debugging techniques and tools for Chuk Chat development.

## Flutter DevTools

### Launch DevTools

```bash
# Open DevTools in browser
flutter pub global activate devtools
flutter pub global run devtools

# Or from VS Code
# Click "Open DevTools" in debug toolbar
```

### Key DevTools Features

| Tool | Purpose |
|------|---------|
| Inspector | Widget tree exploration |
| Performance | Frame rendering analysis |
| Memory | Memory usage profiling |
| Network | HTTP request inspection |
| Logging | Console output |

## Debug Logging

### Using debugPrint

```dart
// Preferred for development
debugPrint('Message count: ${messages.length}');
debugPrint('User: ${user.toJson()}');

// Throttled output (won't flood console)
debugPrint('Large data: $largeString');
```

### Custom Logger

```dart
class AppLogger {
  static void info(String message) {
    debugPrint('[INFO] $message');
  }

  static void error(String message, [Object? error, StackTrace? stack]) {
    debugPrint('[ERROR] $message');
    if (error != null) debugPrint('Error: $error');
    if (stack != null) debugPrint('Stack: $stack');
  }

  static void network(String method, String url, {int? statusCode}) {
    debugPrint('[NET] $method $url ${statusCode ?? ''}');
  }
}
```

## Breakpoints

### VS Code

- Click line number gutter to set breakpoint
- Right-click for conditional breakpoints
- Use `debugger()` statement in code

```dart
void someMethod() {
  debugger(); // Pauses here when debugging
  // ...
}
```

### Conditional Breakpoints

```dart
for (final message in messages) {
  // Set conditional breakpoint: message.id == 'specific_id'
  processMessage(message);
}
```

## Network Debugging

### Dio Interceptor

```dart
class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    debugPrint('→ ${options.method} ${options.uri}');
    debugPrint('Headers: ${options.headers}');
    debugPrint('Body: ${options.data}');
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    debugPrint('← ${response.statusCode} ${response.requestOptions.uri}');
    debugPrint('Response: ${response.data}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    debugPrint('✗ ${err.message}');
    debugPrint('Response: ${err.response?.data}');
    handler.next(err);
  }
}

// Add to Dio
dio.interceptors.add(LoggingInterceptor());
```

## State Debugging

### Print State Changes

```dart
class ChatStateService extends ChangeNotifier {
  List<ChatMessage> _messages = [];

  void addMessage(ChatMessage message) {
    debugPrint('Adding message: ${message.id}');
    debugPrint('Current count: ${_messages.length}');

    _messages.add(message);
    notifyListeners();

    debugPrint('New count: ${_messages.length}');
  }
}
```

## Platform-Specific Debugging

### iOS

```bash
# View iOS logs
flutter logs

# Open iOS Simulator logs
open -a Console
```

### Android

```bash
# View Android logs
adb logcat | grep flutter

# Clear logs
adb logcat -c
```

### Desktop

```bash
# Run with verbose output
flutter run -d macos -v
```

## Common Issues

### Widget Overflow

```dart
// Debug layout issues
Container(
  color: Colors.red.withOpacity(0.3), // Highlight bounds
  child: problematicWidget,
)
```

### Async Issues

```dart
// Track async operations
Future<void> loadData() async {
  debugPrint('loadData: starting');
  try {
    final data = await api.fetch();
    debugPrint('loadData: received ${data.length} items');
  } catch (e, stack) {
    debugPrint('loadData: error $e');
    debugPrint('Stack: $stack');
  }
  debugPrint('loadData: complete');
}
```

### Memory Leaks

```dart
class _MyWidgetState extends State<MyWidget> {
  StreamSubscription? _subscription;

  @override
  void initState() {
    super.initState();
    _subscription = stream.listen((_) {});
    debugPrint('Subscription created');
  }

  @override
  void dispose() {
    debugPrint('Disposing subscription');
    _subscription?.cancel();
    super.dispose();
  }
}
```
