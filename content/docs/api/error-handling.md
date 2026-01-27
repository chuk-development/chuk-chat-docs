---
title: Error Handling
weight: 5
---

This guide covers error responses from the Chuk Chat API, including error codes, response formats, and best practices for handling errors in your client application.

## Error Response Format

All API errors follow a consistent JSON structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": {
      "field": "additional context"
    }
  }
}
```

### Error Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `error.code` | string | Machine-readable error code |
| `error.message` | string | Human-readable description |
| `error.details` | object | Additional context (optional) |

---

## HTTP Status Codes

### Client Errors (4xx)

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| 400 | Bad Request | Invalid parameters, malformed JSON |
| 401 | Unauthorized | Missing or invalid access token |
| 402 | Payment Required | Insufficient credits |
| 403 | Forbidden | Access denied to resource |
| 404 | Not Found | Resource doesn't exist |
| 413 | Payload Too Large | File exceeds size limit |
| 415 | Unsupported Media Type | Invalid file format |
| 429 | Too Many Requests | Rate limit exceeded |

### Server Errors (5xx)

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| 500 | Internal Server Error | Unexpected server failure |
| 502 | Bad Gateway | Upstream service failure |
| 503 | Service Unavailable | Model or service temporarily down |
| 504 | Gateway Timeout | Request timed out |

---

## Error Codes Reference

### Authentication Errors

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `UNAUTHORIZED` | 401 | Invalid or missing token | Re-authenticate user |
| `TOKEN_EXPIRED` | 401 | Access token expired | Refresh the token |
| `INVALID_TOKEN` | 401 | Token is malformed | Get new token |
| `FORBIDDEN` | 403 | User lacks permission | Check user roles |

**Example Response:**
```json
{
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Your session has expired. Please sign in again.",
    "details": {
      "expired_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Billing Errors

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `INSUFFICIENT_CREDITS` | 402 | Not enough credits | Add credits or reduce usage |
| `BILLING_ERROR` | 402 | Payment processing failed | Update payment method |

**Example Response:**
```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Not enough credits for this operation",
    "details": {
      "required": 0.05,
      "available": 0.02,
      "operation": "image_generation"
    }
  }
}
```

### Rate Limiting Errors

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `RATE_LIMITED` | 429 | Too many requests | Wait and retry |
| `QUOTA_EXCEEDED` | 429 | Daily/monthly quota exceeded | Wait for reset |

**Example Response:**
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please wait before trying again.",
    "details": {
      "retry_after": 60,
      "limit": 60,
      "window": "1 minute"
    }
  }
}
```

### Chat Errors

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `CONTEXT_TOO_LONG` | 400 | Message exceeds context window | Reduce history or message |
| `MODEL_UNAVAILABLE` | 503 | Model temporarily unavailable | Try different model |
| `PROVIDER_ERROR` | 502 | Upstream provider error | Retry or change provider |
| `STREAM_INTERRUPTED` | 500 | Stream connection lost | Retry request |
| `CONTENT_FILTERED` | 400 | Content policy violation | Modify content |

**Example Response:**
```json
{
  "error": {
    "code": "CONTEXT_TOO_LONG",
    "message": "Message exceeds the model's context window",
    "details": {
      "max_tokens": 128000,
      "requested_tokens": 145000,
      "model": "deepseek/deepseek-chat"
    }
  }
}
```

### File Errors

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `FILE_TOO_LARGE` | 413 | File exceeds size limit | Compress or split file |
| `UNSUPPORTED_FORMAT` | 415 | File type not supported | Convert to supported format |
| `CONVERSION_FAILED` | 500 | File conversion error | Try different file |
| `CORRUPT_FILE` | 400 | File is corrupted | Upload valid file |

**Example Response:**
```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File exceeds the maximum size limit",
    "details": {
      "max_size_bytes": 10485760,
      "file_size_bytes": 15728640,
      "max_size_display": "10 MB"
    }
  }
}
```

---

## Client-Side Error Handling

### Comprehensive Error Handler

```dart
import 'package:dio/dio.dart';

class ApiException implements Exception {
  final String code;
  final String message;
  final Map<String, dynamic>? details;
  final int? statusCode;

  ApiException({
    required this.code,
    required this.message,
    this.details,
    this.statusCode,
  });

  factory ApiException.fromDioError(DioException e) {
    final response = e.response;
    final data = response?.data;

    if (data is Map<String, dynamic> && data['error'] != null) {
      final error = data['error'];
      return ApiException(
        code: error['code'] ?? 'UNKNOWN_ERROR',
        message: error['message'] ?? 'An unknown error occurred',
        details: error['details'],
        statusCode: response?.statusCode,
      );
    }

    // Handle non-JSON errors
    return ApiException(
      code: _codeFromStatus(response?.statusCode),
      message: e.message ?? 'Network error',
      statusCode: response?.statusCode,
    );
  }

  static String _codeFromStatus(int? statusCode) {
    switch (statusCode) {
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 429:
        return 'RATE_LIMITED';
      case 500:
        return 'INTERNAL_ERROR';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  bool get isAuthError => code == 'UNAUTHORIZED' || code == 'TOKEN_EXPIRED';
  bool get isRateLimited => code == 'RATE_LIMITED';
  bool get isCreditsError => code == 'INSUFFICIENT_CREDITS';
  bool get isRetryable => statusCode != null && statusCode! >= 500;

  @override
  String toString() => 'ApiException($code): $message';
}
```

### Error Handling Middleware

```dart
class ErrorHandlingInterceptor extends Interceptor {
  final AuthService _authService;
  final ToastService _toastService;

  ErrorHandlingInterceptor(this._authService, this._toastService);

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    final exception = ApiException.fromDioError(err);

    // Handle auth errors globally
    if (exception.isAuthError) {
      await _handleAuthError(exception);
      return handler.reject(err);
    }

    // Handle rate limiting
    if (exception.isRateLimited) {
      final retryAfter = exception.details?['retry_after'] ?? 60;
      _toastService.show('Please wait $retryAfter seconds before retrying');
    }

    // Handle insufficient credits
    if (exception.isCreditsError) {
      _toastService.show('Insufficient credits. Please add more credits.');
      // Optionally navigate to credits page
    }

    handler.next(err);
  }

  Future<void> _handleAuthError(ApiException exception) async {
    if (exception.code == 'TOKEN_EXPIRED') {
      // Try to refresh token
      final refreshed = await _authService.refreshToken();
      if (!refreshed) {
        await _authService.signOut();
      }
    } else {
      await _authService.signOut();
    }
  }
}
```

### Retry with Exponential Backoff

```dart
class RetryPolicy {
  final int maxRetries;
  final Duration baseDelay;
  final double multiplier;

  RetryPolicy({
    this.maxRetries = 3,
    this.baseDelay = const Duration(seconds: 1),
    this.multiplier = 2.0,
  });

  Future<T> execute<T>(Future<T> Function() operation) async {
    int attempt = 0;
    Duration delay = baseDelay;

    while (true) {
      try {
        return await operation();
      } on DioException catch (e) {
        final exception = ApiException.fromDioError(e);

        attempt++;

        // Don't retry client errors (except rate limiting)
        if (!exception.isRetryable && !exception.isRateLimited) {
          rethrow;
        }

        if (attempt >= maxRetries) {
          rethrow;
        }

        // Use server-provided retry delay for rate limiting
        if (exception.isRateLimited) {
          final retryAfter = exception.details?['retry_after'] ?? 60;
          delay = Duration(seconds: retryAfter);
        }

        await Future.delayed(delay);
        delay = Duration(
          milliseconds: (delay.inMilliseconds * multiplier).round(),
        );
      }
    }
  }
}

// Usage
final retryPolicy = RetryPolicy(maxRetries: 3);
final result = await retryPolicy.execute(() => api.sendChat(message));
```

---

## Stream Error Handling

### SSE Error Parsing

```dart
void handleStreamLine(String line) {
  if (!line.startsWith('data: ')) return;

  final data = line.substring(6);
  if (data == '[DONE]') {
    onComplete();
    return;
  }

  try {
    final json = jsonDecode(data);

    // Check for inline error events
    if (json['error'] != null) {
      final error = json['error'];
      throw StreamException(
        code: error['code'] ?? 'STREAM_ERROR',
        message: error['message'] ?? 'Stream error occurred',
      );
    }

    // Process normal events
    if (json['content'] != null) {
      onContent(json['content']);
    }
  } on FormatException {
    // Handle malformed JSON in stream
    print('Malformed stream data: $data');
  }
}
```

### WebSocket Error Handling

```dart
class WebSocketChatClient {
  void _handleMessage(dynamic message) {
    try {
      final json = jsonDecode(message as String);

      // Check for error event
      if (json['error'] != null) {
        _handleError(json['error']);
        return;
      }

      // Process normal events...
    } on FormatException catch (e) {
      print('Failed to parse WebSocket message: $e');
    }
  }

  void _handleError(dynamic error) {
    final code = error is Map ? error['code'] : 'UNKNOWN';
    final message = error is Map ? error['message'] : error.toString();

    switch (code) {
      case 'CONTEXT_TOO_LONG':
        onError?.call(ContextTooLongException(message));
        break;
      case 'MODEL_UNAVAILABLE':
        onError?.call(ModelUnavailableException(message));
        break;
      case 'RATE_LIMITED':
        onError?.call(RateLimitedException(message));
        break;
      default:
        onError?.call(StreamException(code: code, message: message));
    }
  }
}
```

---

## User-Friendly Error Messages

### Error Message Mapping

```dart
class ErrorMessages {
  static String getUserMessage(ApiException error) {
    switch (error.code) {
      case 'UNAUTHORIZED':
      case 'TOKEN_EXPIRED':
        return 'Your session has expired. Please sign in again.';
      case 'INSUFFICIENT_CREDITS':
        final required = error.details?['required'] ?? 0;
        final available = error.details?['available'] ?? 0;
        return 'Not enough credits. You need $required but have $available.';
      case 'RATE_LIMITED':
        final retryAfter = error.details?['retry_after'] ?? 60;
        return 'Too many requests. Please wait $retryAfter seconds.';
      case 'CONTEXT_TOO_LONG':
        return 'Your message is too long. Try removing some conversation history.';
      case 'MODEL_UNAVAILABLE':
        return 'This model is temporarily unavailable. Try a different model.';
      case 'FILE_TOO_LARGE':
        return 'File is too large. Maximum size is 10 MB.';
      case 'UNSUPPORTED_FORMAT':
        return 'This file format is not supported.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}
```

### Error Dialog Component

```dart
class ErrorDialog extends StatelessWidget {
  final ApiException error;
  final VoidCallback? onRetry;
  final VoidCallback? onDismiss;

  const ErrorDialog({
    required this.error,
    this.onRetry,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(_getTitle()),
      content: Text(ErrorMessages.getUserMessage(error)),
      actions: [
        if (onDismiss != null)
          TextButton(
            onPressed: onDismiss,
            child: const Text('Dismiss'),
          ),
        if (error.isRetryable && onRetry != null)
          ElevatedButton(
            onPressed: onRetry,
            child: const Text('Retry'),
          ),
        if (error.isCreditsError)
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/credits'),
            child: const Text('Add Credits'),
          ),
      ],
    );
  }

  String _getTitle() {
    if (error.isAuthError) return 'Session Expired';
    if (error.isCreditsError) return 'Insufficient Credits';
    if (error.isRateLimited) return 'Slow Down';
    return 'Error';
  }
}
```

---

## Best Practices

### 1. Always Check Error Codes

```dart
// Good: Check specific error codes
if (exception.code == 'INSUFFICIENT_CREDITS') {
  showCreditsDialog();
} else if (exception.code == 'RATE_LIMITED') {
  scheduleRetry(exception.details?['retry_after'] ?? 60);
}

// Bad: Only check HTTP status
if (statusCode == 402) {
  // Could be different billing errors
}
```

### 2. Implement Graceful Degradation

```dart
Future<String> chat(String message) async {
  try {
    return await _primaryProvider.chat(message);
  } on ApiException catch (e) {
    if (e.code == 'MODEL_UNAVAILABLE') {
      // Fall back to alternative model
      return await _fallbackProvider.chat(message);
    }
    rethrow;
  }
}
```

### 3. Log Errors for Debugging

```dart
void logApiError(ApiException error, StackTrace stackTrace) {
  final logData = {
    'code': error.code,
    'message': error.message,
    'details': error.details,
    'statusCode': error.statusCode,
    'timestamp': DateTime.now().toIso8601String(),
  };

  // Log locally
  print('API Error: $logData');

  // Send to crash reporting (non-PII only)
  crashReporting.recordError(error, stackTrace, extra: logData);
}
```

### 4. Handle Network Errors

```dart
Future<T> withNetworkCheck<T>(Future<T> Function() operation) async {
  final connectivity = await Connectivity().checkConnectivity();

  if (connectivity == ConnectivityResult.none) {
    throw ApiException(
      code: 'NO_NETWORK',
      message: 'No internet connection',
    );
  }

  try {
    return await operation();
  } on SocketException {
    throw ApiException(
      code: 'NETWORK_ERROR',
      message: 'Network connection failed',
    );
  }
}
```
