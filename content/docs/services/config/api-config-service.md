---
title: ApiConfigService
weight: 1
---

`ApiConfigService` resolves the API base URL from compile-time environment variables, with platform-aware fallbacks for native and web targets.

## Definition

```dart
// lib/services/api_config_service_io.dart (native platforms)
// lib/services/api_config_service_stub.dart (web)

class ApiConfigService {
  static const String _envApiUrl = String.fromEnvironment('API_BASE_URL');
  static const String _envApiHost = String.fromEnvironment('API_HOST');
  static const String _envApiPort = String.fromEnvironment('API_PORT');

  static const String _defaultPort = '443';
  static const String _defaultProtocol = 'https';
  static const String _defaultProductionUrl = 'https://api.chuk.chat';

  static const String _productionUrl = String.fromEnvironment(
    'PRODUCTION_API_URL',
  );

  static String get apiBaseUrl { ... }
  static String get environment { ... }
  static String get platform { ... }
  static bool get isConfigured { ... }
  static String get configurationDescription { ... }
}
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `apiBaseUrl` | `String` | Resolved API base URL. Checks `PRODUCTION_API_URL`, then `API_BASE_URL`, then `API_HOST`/`API_PORT`, then falls back to `https://api.chuk.chat` |
| `environment` | `String` | Returns `'development'` in debug mode, `'production'` otherwise |
| `platform` | `String` | Current platform name (`android`, `ios`, `windows`, `linux`, `macos`, or `web` on the web stub) |
| `isConfigured` | `bool` | `true` when an explicit environment override is set or the default production URL is available |
| `configurationDescription` | `String` | Human-readable summary of environment, platform, URL, and configured status |

## URL Resolution Order

The service resolves the API base URL using the first non-empty value in this order:

1. `PRODUCTION_API_URL` environment variable
2. `API_BASE_URL` environment variable
3. `API_HOST` + `API_PORT` (defaults to port `443` over HTTPS)
4. Hardcoded fallback: `https://api.chuk.chat`

## Platform Conditional Export

```dart
// lib/services/api_config_service.dart
export 'api_config_service_stub.dart'
    if (dart.library.io) 'api_config_service_io.dart';
```

The entry file uses Dart conditional exports. On native platforms (`dart:io` available), the IO implementation is loaded which uses `Platform.isAndroid`, `Platform.isIOS`, etc. On web, the stub returns `'web'` for the platform getter.

## Usage Examples

### Reading the Base URL

```dart
final url = ApiConfigService.apiBaseUrl;
// => 'https://api.chuk.chat' (default)
```

### Building a Request

```dart
final response = await http.get(
  Uri.parse('${ApiConfigService.apiBaseUrl}/v1/models_info'),
  headers: {'Authorization': 'Bearer $accessToken'},
);
```

### Compile-Time Override

```bash
flutter run --dart-define=API_BASE_URL=https://staging.chuk.chat
```
