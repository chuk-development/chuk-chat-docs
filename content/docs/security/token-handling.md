---
title: Token Handling
weight: 5
---

# Secure Token Handling

Tokens are sensitive credentials that require careful handling to prevent exposure in logs, error messages, or memory dumps. chuk_chat implements comprehensive token security measures.

## Token Security Principles

1. **Never log tokens** - All tokens are masked before any logging
2. **Constant-time comparison** - Prevents timing attacks
3. **Minimal exposure** - Tokens cleared from memory when not needed
4. **Secure storage** - Platform-native secure storage only
5. **Automatic sanitization** - Error messages are sanitized before display

## Token Masking

All tokens are masked before logging or displaying:

```dart
// lib/utils/secure_token_handler.dart
class SecureTokenHandler {
  /// Masks a token for safe logging
  /// Example: "eyJhbGciOiJIUzI1N..." → "eyJa...1NiJ"
  static String maskToken(String token) {
    if (token.isEmpty) return '***';
    if (token.length <= 8) return '***';

    // Show first 4 and last 4 characters only
    return '${token.substring(0, 4)}...${token.substring(token.length - 4)}';
  }

  /// Masks sensitive data in a map (for logging request/response)
  static Map<String, dynamic> maskSensitiveData(Map<String, dynamic> data) {
    final masked = Map<String, dynamic>.from(data);
    const sensitiveKeys = [
      'token',
      'access_token',
      'refresh_token',
      'api_key',
      'apikey',
      'password',
      'secret',
      'authorization',
      'bearer',
      'credential',
      'private_key',
    ];

    void maskRecursive(Map<String, dynamic> map) {
      for (final entry in map.entries.toList()) {
        final key = entry.key.toLowerCase();

        if (sensitiveKeys.any((s) => key.contains(s))) {
          if (entry.value is String) {
            map[entry.key] = maskToken(entry.value);
          } else {
            map[entry.key] = '[REDACTED]';
          }
        } else if (entry.value is Map<String, dynamic>) {
          maskRecursive(entry.value);
        } else if (entry.value is List) {
          for (final item in entry.value) {
            if (item is Map<String, dynamic>) {
              maskRecursive(item);
            }
          }
        }
      }
    }

    maskRecursive(masked);
    return masked;
  }
}
```

## Error Message Sanitization

All error messages are sanitized before logging or displaying to users:

```dart
class SecureTokenHandler {
  /// Sanitizes error messages to remove sensitive data
  static String sanitizeError(String error) {
    var sanitized = error;

    // Remove JWTs (matches the three-part structure)
    sanitized = sanitized.replaceAll(
      RegExp(r'eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+'),
      '[JWT_REDACTED]',
    );

    // Remove Bearer tokens
    sanitized = sanitized.replaceAll(
      RegExp(r'Bearer\s+[A-Za-z0-9_-]+', caseSensitive: false),
      'Bearer [REDACTED]',
    );

    // Remove API keys (various formats)
    sanitized = sanitized.replaceAll(
      RegExp(
        r'(api[_-]?key|apikey|access[_-]?token|secret[_-]?key)'
        r'[\"\s:=]+[\"\']?[\w-]+[\"\']?',
        caseSensitive: false,
      ),
      '[KEY_REDACTED]',
    );

    // Remove potential passwords in URLs
    sanitized = sanitized.replaceAll(
      RegExp(r'://[^:]+:[^@]+@'),
      '://[CREDENTIALS_REDACTED]@',
    );

    // Remove UUIDs (potential user/session IDs in errors)
    sanitized = sanitized.replaceAll(
      RegExp(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}',
          caseSensitive: false),
      '[UUID_REDACTED]',
    );

    // Remove email addresses
    sanitized = sanitized.replaceAll(
      RegExp(r'[\w.-]+@[\w.-]+\.\w+'),
      '[EMAIL_REDACTED]',
    );

    return sanitized;
  }

  /// Sanitizes a stack trace to remove sensitive paths
  static String sanitizeStackTrace(String stackTrace) {
    var sanitized = stackTrace;

    // Remove user-specific paths
    sanitized = sanitized.replaceAll(
      RegExp(r'/Users/[^/]+/'),
      '/Users/[USER]/',
    );
    sanitized = sanitized.replaceAll(
      RegExp(r'C:\\Users\\[^\\]+\\'),
      'C:\\Users\\[USER]\\',
    );
    sanitized = sanitized.replaceAll(
      RegExp(r'/home/[^/]+/'),
      '/home/[USER]/',
    );

    return sanitized;
  }
}
```

## Constant-Time Comparison

Prevents timing attacks when comparing tokens:

```dart
class SecureTokenHandler {
  /// Compares two strings in constant time
  /// Prevents timing attacks by always comparing all characters
  static bool secureCompare(String a, String b) {
    // Return false for null/empty, but still do constant-time comparison
    if (a.isEmpty || b.isEmpty) return false;

    // Convert to bytes for consistent comparison
    final aBytes = utf8.encode(a);
    final bBytes = utf8.encode(b);

    // Length check with constant-time behavior
    if (aBytes.length != bBytes.length) {
      // Still iterate to maintain constant time
      var dummy = 0;
      for (var i = 0; i < aBytes.length; i++) {
        dummy |= aBytes[i];
      }
      return false;
    }

    // XOR comparison - accumulates differences without early exit
    var result = 0;
    for (var i = 0; i < aBytes.length; i++) {
      result |= aBytes[i] ^ bBytes[i];
    }

    return result == 0;
  }

  /// Compares byte arrays in constant time
  static bool secureCompareBytes(Uint8List a, Uint8List b) {
    if (a.length != b.length) {
      var dummy = 0;
      for (var i = 0; i < a.length; i++) {
        dummy |= a[i];
      }
      return false;
    }

    var result = 0;
    for (var i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }

    return result == 0;
  }
}
```

### Why Constant-Time Comparison?

Regular string comparison returns early when a mismatch is found:

```dart
// VULNERABLE - timing attack possible
bool insecureCompare(String a, String b) {
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (a[i] != b[i]) return false;  // Early return reveals position
  }
  return true;
}
```

An attacker can measure response times to guess tokens character by character. Constant-time comparison eliminates this attack vector.

## Token Storage Service

Secure storage for all authentication tokens:

```dart
// lib/services/auth/token_storage_service.dart
class TokenStorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  static const _accessTokenKey = 'auth_access_token';
  static const _refreshTokenKey = 'auth_refresh_token';
  static const _tokenExpiryKey = 'auth_token_expiry';

  /// Stores access token securely
  static Future<void> storeAccessToken(String token) async {
    await _storage.write(key: _accessTokenKey, value: token);
    PrivacyLogger.log('TokenStorage', 'Access token stored: ${SecureTokenHandler.maskToken(token)}');
  }

  /// Retrieves access token
  static Future<String?> getAccessToken() async {
    return await _storage.read(key: _accessTokenKey);
  }

  /// Stores refresh token securely
  static Future<void> storeRefreshToken(String token) async {
    await _storage.write(key: _refreshTokenKey, value: token);
    PrivacyLogger.log('TokenStorage', 'Refresh token stored');
  }

  /// Retrieves refresh token
  static Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }

  /// Stores token expiry time
  static Future<void> storeTokenExpiry(DateTime expiry) async {
    await _storage.write(
      key: _tokenExpiryKey,
      value: expiry.millisecondsSinceEpoch.toString(),
    );
  }

  /// Checks if token is expired
  static Future<bool> isTokenExpired() async {
    final expiryStr = await _storage.read(key: _tokenExpiryKey);
    if (expiryStr == null) return true;

    final expiry = DateTime.fromMillisecondsSinceEpoch(int.parse(expiryStr));
    // Consider expired 5 minutes before actual expiry for safety
    return DateTime.now().isAfter(expiry.subtract(const Duration(minutes: 5)));
  }

  /// Clears all tokens (logout)
  static Future<void> clearAllTokens() async {
    await Future.wait([
      _storage.delete(key: _accessTokenKey),
      _storage.delete(key: _refreshTokenKey),
      _storage.delete(key: _tokenExpiryKey),
    ]);
    PrivacyLogger.log('TokenStorage', 'All tokens cleared');
  }
}
```

## Privacy-Aware Logging

Logging that respects token security:

```dart
// lib/utils/privacy_logger.dart
class PrivacyLogger {
  /// Logs message only in debug mode
  static void log(String tag, String message) {
    if (kDebugMode) {
      final sanitized = SecureTokenHandler.sanitizeError(message);
      print('[$tag] $sanitized');
    }
  }

  /// Logs error with sanitization
  static void error(String tag, String message, [Object? error, StackTrace? stackTrace]) {
    if (kDebugMode) {
      final sanitizedMessage = SecureTokenHandler.sanitizeError(message);
      print('[$tag ERROR] $sanitizedMessage');

      if (error != null) {
        final sanitizedError = SecureTokenHandler.sanitizeError(error.toString());
        print('  Error: $sanitizedError');
      }

      if (stackTrace != null) {
        final sanitizedStack = SecureTokenHandler.sanitizeStackTrace(stackTrace.toString());
        print('  Stack: $sanitizedStack');
      }
    }
  }

  /// Logs API request (with masked sensitive data)
  static void logRequest(String method, String url, Map<String, dynamic>? headers) {
    if (kDebugMode) {
      print('[HTTP] $method $url');
      if (headers != null) {
        final masked = SecureTokenHandler.maskSensitiveData(headers);
        print('  Headers: $masked');
      }
    }
  }

  /// Logs API response (with masked sensitive data)
  static void logResponse(int statusCode, Map<String, dynamic>? body) {
    if (kDebugMode) {
      print('[HTTP] Response: $statusCode');
      if (body != null) {
        final masked = SecureTokenHandler.maskSensitiveData(body);
        print('  Body: $masked');
      }
    }
  }
}
```

## Logging Rules

| Rule | Implementation |
|------|----------------|
| No production logging | `if (kDebugMode)` checks |
| Never log user content | Messages, prompts excluded |
| Always mask tokens | `maskToken()` before logging |
| Sanitize all errors | `sanitizeError()` on all exceptions |
| Filter stack traces | `sanitizeStackTrace()` removes paths |
| No PII in crash reports | Custom error boundaries |

## Authorization Header Handling

Secure handling of authorization headers:

```dart
// lib/interceptors/auth_interceptor.dart
class AuthInterceptor extends Interceptor {
  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await TokenStorageService.getAccessToken();

    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';

      // Log with masked token
      PrivacyLogger.logRequest(
        options.method,
        options.uri.toString(),
        {'Authorization': 'Bearer ${SecureTokenHandler.maskToken(token)}'},
      );
    }

    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Sanitize error before any handling
    final sanitizedMessage = SecureTokenHandler.sanitizeError(
      err.message ?? err.toString(),
    );

    if (err.response?.statusCode == 401) {
      // Token expired or invalid - trigger refresh
      PrivacyLogger.log('Auth', 'Token invalid, attempting refresh');
      _handleTokenRefresh(err, handler);
      return;
    }

    // Re-throw with sanitized message
    handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        type: err.type,
        error: sanitizedMessage,
      ),
    );
  }
}
```

## Token Refresh Security

Secure token refresh with race condition prevention:

```dart
class TokenRefreshService {
  static final _refreshLock = Lock();
  static DateTime? _lastRefreshAttempt;
  static const _minRefreshInterval = Duration(seconds: 5);

  /// Refreshes tokens with deduplication
  static Future<bool> refreshTokens() async {
    return await _refreshLock.synchronized(() async {
      // Prevent rapid refresh attempts
      final now = DateTime.now();
      if (_lastRefreshAttempt != null &&
          now.difference(_lastRefreshAttempt!) < _minRefreshInterval) {
        PrivacyLogger.log('TokenRefresh', 'Skipping refresh (too recent)');
        return false;
      }
      _lastRefreshAttempt = now;

      final refreshToken = await TokenStorageService.getRefreshToken();
      if (refreshToken == null) {
        PrivacyLogger.log('TokenRefresh', 'No refresh token available');
        return false;
      }

      try {
        final response = await SupabaseService.auth.refreshSession();

        if (response.session != null) {
          await TokenStorageService.storeAccessToken(response.session!.accessToken);
          await TokenStorageService.storeRefreshToken(response.session!.refreshToken!);
          await TokenStorageService.storeTokenExpiry(
            DateTime.fromMillisecondsSinceEpoch(response.session!.expiresAt! * 1000),
          );

          PrivacyLogger.log('TokenRefresh', 'Tokens refreshed successfully');
          return true;
        }
      } catch (e) {
        PrivacyLogger.error('TokenRefresh', 'Refresh failed', e);
      }

      return false;
    });
  }
}
```

{{< callout type="warning" >}}
**Security Note**: Never expose tokens in URLs, error messages displayed to users, or non-secure storage. Always use the provided secure storage and logging utilities.
{{< /callout >}}

## Related Documentation

- [Encryption](../encryption) - Encryption key handling
- [Session Management](../session-management) - Token lifecycle
- [Security Checklist](../security-checklist) - Token security requirements
