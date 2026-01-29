---
title: ApiStatusService
weight: 2
---

`ApiStatusService` checks whether the Chuk Chat API backend is reachable by probing its health and root endpoints.

## Definition

```dart
// lib/services/api_status_service.dart

class ApiStatusService {
  static const String _defaultBaseUrl = 'https://api.chuk.chat';
  static const Duration _defaultTimeout = Duration(seconds: 4);

  static Future<bool> isApiReachable({
    String? baseUrl,
    Duration timeout = _defaultTimeout,
  }) async { ... }
}
```

## Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `isApiReachable({baseUrl, timeout})` | `Future<bool>` | Returns `true` when the API responds to `/health` (GET) or root (HEAD) with a status code in the 200-499 range |

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `baseUrl` | `String?` | `'https://api.chuk.chat'` | Override the base URL to check |
| `timeout` | `Duration` | 4 seconds | Per-request timeout |

## Probing Strategy

The service uses a two-step probe:

1. **GET `/health`** -- If the health endpoint responds with any 2xx-4xx status, the API is considered reachable.
2. **HEAD `/`** -- If the health probe fails (timeout, network error, or 5xx), a HEAD request to the root URL is attempted as a fallback.

Any status code from 200 to 499 is treated as "reachable". This allows the check to succeed even when the endpoint returns 401 (unauthorized) or 404 (not found), since those still indicate the server is responding.

## Usage Examples

### Basic Reachability Check

```dart
final reachable = await ApiStatusService.isApiReachable();
if (!reachable) {
  showSnackBar('Cannot reach server. Check your connection.');
}
```

### Custom Base URL

```dart
final reachable = await ApiStatusService.isApiReachable(
  baseUrl: 'https://staging.chuk.chat',
  timeout: Duration(seconds: 8),
);
```
