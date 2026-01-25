---
title: Rate Limiting
weight: 4
---

# Rate Limiting

Rate limiting protects the application from abuse, denial-of-service attacks, and excessive resource consumption. chuk_chat implements multiple rate limiting strategies at different levels.

## Rate Limiting Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Request                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Global Rate Limiter (IP-based)                 │
│              └─ 1000 requests/hour per IP                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│             Endpoint Rate Limiter (User + Endpoint)         │
│              └─ Varies by endpoint sensitivity              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Upload Rate Limiter (User-based)               │
│              └─ 5 uploads/5 min, 100/day                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Request Processing                     │
└─────────────────────────────────────────────────────────────┘
```

## API Rate Limiter

The primary rate limiter uses a sliding window algorithm:

```dart
// lib/utils/api_rate_limiter.dart
class ApiRateLimiter {
  /// Rate limits by endpoint category
  static const _limits = {
    'default': RateLimit(requests: 60, windowSeconds: 60),
    'auth': RateLimit(requests: 5, windowSeconds: 60),
    'upload': RateLimit(requests: 10, windowSeconds: 60),
    'chat': RateLimit(requests: 30, windowSeconds: 60),
    'search': RateLimit(requests: 20, windowSeconds: 60),
  };

  /// Stores request timestamps per user/endpoint
  static final _requestLog = <String, List<DateTime>>{};

  /// Check if request is allowed
  static RateLimitResult checkLimit({
    required String endpoint,
    required String userId,
    String category = 'default',
  }) {
    final limit = _limits[category] ?? _limits['default']!;
    final key = _createKey(endpoint, userId);
    final now = DateTime.now();
    final windowStart = now.subtract(Duration(seconds: limit.windowSeconds));

    // Clean old entries
    _requestLog[key] = (_requestLog[key] ?? [])
        .where((t) => t.isAfter(windowStart))
        .toList();

    final currentCount = _requestLog[key]!.length;

    // Check if limit exceeded
    if (currentCount >= limit.requests) {
      final retryAfter = _calculateRetryAfter(key, limit);
      return RateLimitResult(
        allowed: false,
        remaining: 0,
        retryAfter: retryAfter,
        limit: limit.requests,
      );
    }

    // Record this request
    _requestLog[key]!.add(now);

    return RateLimitResult(
      allowed: true,
      remaining: limit.requests - currentCount - 1,
      retryAfter: null,
      limit: limit.requests,
    );
  }

  static String _createKey(String endpoint, String userId) {
    // Normalize endpoint to category
    final category = _categorizeEndpoint(endpoint);
    return '$category:$userId';
  }

  static String _categorizeEndpoint(String endpoint) {
    if (endpoint.contains('/auth/')) return 'auth';
    if (endpoint.contains('/upload')) return 'upload';
    if (endpoint.contains('/chat')) return 'chat';
    if (endpoint.contains('/search')) return 'search';
    return 'default';
  }

  static Duration _calculateRetryAfter(String key, RateLimit limit) {
    final requests = _requestLog[key] ?? [];
    if (requests.isEmpty) return Duration.zero;

    final oldestRequest = requests.first;
    final windowEnd = oldestRequest.add(Duration(seconds: limit.windowSeconds));
    return windowEnd.difference(DateTime.now());
  }

  /// Reset rate limit for a user (e.g., after successful captcha)
  static void resetLimit(String userId, {String? category}) {
    if (category != null) {
      _requestLog.remove('$category:$userId');
    } else {
      _requestLog.removeWhere((key, _) => key.endsWith(':$userId'));
    }
  }
}

class RateLimit {
  final int requests;
  final int windowSeconds;

  const RateLimit({required this.requests, required this.windowSeconds});
}

class RateLimitResult {
  final bool allowed;
  final int remaining;
  final Duration? retryAfter;
  final int limit;

  RateLimitResult({
    required this.allowed,
    required this.remaining,
    required this.retryAfter,
    required this.limit,
  });
}
```

## Dio Interceptor Integration

Rate limiting is enforced via a Dio interceptor:

```dart
// lib/interceptors/rate_limit_interceptor.dart
class RateLimitInterceptor extends Interceptor {
  final String Function() getUserId;

  RateLimitInterceptor({required this.getUserId});

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final userId = getUserId();
    final endpoint = options.path;
    final category = _categorizeEndpoint(endpoint);

    final result = ApiRateLimiter.checkLimit(
      endpoint: endpoint,
      userId: userId,
      category: category,
    );

    if (!result.allowed) {
      handler.reject(
        DioException(
          requestOptions: options,
          type: DioExceptionType.unknown,
          error: RateLimitException(
            retryAfter: result.retryAfter!,
            endpoint: endpoint,
          ),
        ),
      );
      return;
    }

    // Add rate limit headers to request for logging
    options.headers['X-RateLimit-Remaining'] = result.remaining.toString();
    options.headers['X-RateLimit-Limit'] = result.limit.toString();

    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    // Check server-side rate limit headers
    final remaining = response.headers.value('X-RateLimit-Remaining');
    final retryAfter = response.headers.value('Retry-After');

    if (remaining == '0' && retryAfter != null) {
      // Server is rate limiting, sync with local limiter
      PrivacyLogger.log('RateLimit', 'Server rate limit reached');
    }

    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response?.statusCode == 429) {
      // Handle server-side rate limit
      final retryAfter = err.response?.headers.value('Retry-After');
      final seconds = int.tryParse(retryAfter ?? '60') ?? 60;

      handler.reject(
        DioException(
          requestOptions: err.requestOptions,
          error: RateLimitException(
            retryAfter: Duration(seconds: seconds),
            endpoint: err.requestOptions.path,
          ),
        ),
      );
      return;
    }
    handler.next(err);
  }

  String _categorizeEndpoint(String endpoint) {
    if (endpoint.contains('/auth/')) return 'auth';
    if (endpoint.contains('/upload')) return 'upload';
    if (endpoint.contains('/chat')) return 'chat';
    if (endpoint.contains('/search')) return 'search';
    return 'default';
  }
}

class RateLimitException implements Exception {
  final Duration retryAfter;
  final String endpoint;

  RateLimitException({required this.retryAfter, required this.endpoint});

  @override
  String toString() => 'Rate limit exceeded for $endpoint. '
      'Retry after ${retryAfter.inSeconds} seconds.';
}
```

## Upload Rate Limiter

Specialized rate limiter for file uploads with daily quotas:

```dart
// lib/utils/upload_rate_limiter.dart
class UploadRateLimiter {
  static const _windowLimit = RateLimit(requests: 5, windowSeconds: 300);  // 5 per 5 min
  static const _dailyLimit = 100;
  static const _maxConcurrent = 3;

  static final _windowLog = <String, List<DateTime>>{};
  static final _dailyLog = <String, List<DateTime>>{};
  static final _activeUploads = <String, int>{};

  /// Check if upload is allowed
  static UploadRateLimitResult canUpload(String userId) {
    final now = DateTime.now();

    // Check concurrent uploads
    final concurrent = _activeUploads[userId] ?? 0;
    if (concurrent >= _maxConcurrent) {
      return UploadRateLimitResult(
        allowed: false,
        reason: 'Too many concurrent uploads',
        retryAfter: const Duration(seconds: 10),
      );
    }

    // Check window limit
    final windowResult = _checkWindowLimit(userId, now);
    if (!windowResult.allowed) {
      return windowResult;
    }

    // Check daily limit
    final dailyResult = _checkDailyLimit(userId, now);
    if (!dailyResult.allowed) {
      return dailyResult;
    }

    return UploadRateLimitResult(
      allowed: true,
      remainingWindow: _windowLimit.requests - (_windowLog[userId]?.length ?? 0) - 1,
      remainingDaily: _dailyLimit - (_dailyLog[userId]?.length ?? 0) - 1,
    );
  }

  /// Record upload start
  static void startUpload(String userId) {
    _activeUploads[userId] = (_activeUploads[userId] ?? 0) + 1;

    final now = DateTime.now();
    _windowLog[userId] = [...(_windowLog[userId] ?? []), now];
    _dailyLog[userId] = [...(_dailyLog[userId] ?? []), now];
  }

  /// Record upload completion
  static void endUpload(String userId) {
    final count = _activeUploads[userId] ?? 1;
    if (count <= 1) {
      _activeUploads.remove(userId);
    } else {
      _activeUploads[userId] = count - 1;
    }
  }

  static UploadRateLimitResult _checkWindowLimit(String userId, DateTime now) {
    final windowStart = now.subtract(Duration(seconds: _windowLimit.windowSeconds));

    _windowLog[userId] = (_windowLog[userId] ?? [])
        .where((t) => t.isAfter(windowStart))
        .toList();

    if (_windowLog[userId]!.length >= _windowLimit.requests) {
      final oldestRequest = _windowLog[userId]!.first;
      final retryAfter = oldestRequest
          .add(Duration(seconds: _windowLimit.windowSeconds))
          .difference(now);

      return UploadRateLimitResult(
        allowed: false,
        reason: 'Upload limit reached (${_windowLimit.requests} per '
            '${_windowLimit.windowSeconds ~/ 60} minutes)',
        retryAfter: retryAfter,
      );
    }

    return UploadRateLimitResult(allowed: true);
  }

  static UploadRateLimitResult _checkDailyLimit(String userId, DateTime now) {
    final dayStart = DateTime(now.year, now.month, now.day);

    _dailyLog[userId] = (_dailyLog[userId] ?? [])
        .where((t) => t.isAfter(dayStart))
        .toList();

    if (_dailyLog[userId]!.length >= _dailyLimit) {
      final tomorrow = dayStart.add(const Duration(days: 1));
      return UploadRateLimitResult(
        allowed: false,
        reason: 'Daily upload limit reached ($_dailyLimit per day)',
        retryAfter: tomorrow.difference(now),
      );
    }

    return UploadRateLimitResult(allowed: true);
  }
}

class UploadRateLimitResult {
  final bool allowed;
  final String? reason;
  final Duration? retryAfter;
  final int? remainingWindow;
  final int? remainingDaily;

  UploadRateLimitResult({
    required this.allowed,
    this.reason,
    this.retryAfter,
    this.remainingWindow,
    this.remainingDaily,
  });
}
```

## Authentication Rate Limiter

Stricter limits for authentication endpoints to prevent brute-force attacks:

```dart
// lib/utils/auth_rate_limiter.dart
class AuthRateLimiter {
  static const _loginLimit = RateLimit(requests: 5, windowSeconds: 300);  // 5 per 5 min
  static const _passwordResetLimit = RateLimit(requests: 3, windowSeconds: 3600);  // 3 per hour
  static const _registrationLimit = RateLimit(requests: 3, windowSeconds: 3600);  // 3 per hour

  static final _failedAttempts = <String, List<DateTime>>{};
  static final _lockedAccounts = <String, DateTime>{};

  /// Check login attempt
  static AuthRateLimitResult checkLogin({
    required String email,
    required String? ipAddress,
  }) {
    final normalizedEmail = email.toLowerCase().trim();

    // Check if account is locked
    final lockExpiry = _lockedAccounts[normalizedEmail];
    if (lockExpiry != null && DateTime.now().isBefore(lockExpiry)) {
      return AuthRateLimitResult(
        allowed: false,
        reason: 'Account temporarily locked due to too many failed attempts',
        retryAfter: lockExpiry.difference(DateTime.now()),
        accountLocked: true,
      );
    }

    // Check rate limit by email
    final emailResult = _checkLimit(normalizedEmail, _loginLimit);
    if (!emailResult.allowed) {
      return emailResult;
    }

    // Check rate limit by IP (if available)
    if (ipAddress != null) {
      final ipResult = _checkLimit('ip:$ipAddress', _loginLimit);
      if (!ipResult.allowed) {
        return ipResult;
      }
    }

    return AuthRateLimitResult(allowed: true);
  }

  /// Record failed login attempt
  static void recordFailedAttempt(String email) {
    final normalizedEmail = email.toLowerCase().trim();
    final now = DateTime.now();

    _failedAttempts[normalizedEmail] = [
      ...(_failedAttempts[normalizedEmail] ?? []),
      now,
    ];

    // Check for account lockout (10 failures in 15 minutes)
    final recentAttempts = _failedAttempts[normalizedEmail]!
        .where((t) => t.isAfter(now.subtract(const Duration(minutes: 15))))
        .length;

    if (recentAttempts >= 10) {
      // Lock account for 30 minutes
      _lockedAccounts[normalizedEmail] = now.add(const Duration(minutes: 30));
      PrivacyLogger.log('Auth', 'Account locked: ${_maskEmail(normalizedEmail)}');
    }
  }

  /// Clear failed attempts on successful login
  static void clearFailedAttempts(String email) {
    final normalizedEmail = email.toLowerCase().trim();
    _failedAttempts.remove(normalizedEmail);
    _lockedAccounts.remove(normalizedEmail);
  }

  static AuthRateLimitResult _checkLimit(String key, RateLimit limit) {
    final now = DateTime.now();
    final windowStart = now.subtract(Duration(seconds: limit.windowSeconds));

    _failedAttempts[key] = (_failedAttempts[key] ?? [])
        .where((t) => t.isAfter(windowStart))
        .toList();

    if (_failedAttempts[key]!.length >= limit.requests) {
      final oldestAttempt = _failedAttempts[key]!.first;
      final retryAfter = oldestAttempt
          .add(Duration(seconds: limit.windowSeconds))
          .difference(now);

      return AuthRateLimitResult(
        allowed: false,
        reason: 'Too many attempts. Please try again later.',
        retryAfter: retryAfter,
      );
    }

    return AuthRateLimitResult(allowed: true);
  }

  static String _maskEmail(String email) {
    final parts = email.split('@');
    if (parts.length != 2) return '***';
    final local = parts[0];
    final domain = parts[1];
    if (local.length <= 2) return '***@$domain';
    return '${local[0]}***${local[local.length - 1]}@$domain';
  }
}

class AuthRateLimitResult {
  final bool allowed;
  final String? reason;
  final Duration? retryAfter;
  final bool accountLocked;

  AuthRateLimitResult({
    required this.allowed,
    this.reason,
    this.retryAfter,
    this.accountLocked = false,
  });
}
```

## Rate Limit UI Feedback

Displaying rate limit information to users:

```dart
// lib/widgets/rate_limit_dialog.dart
class RateLimitDialog extends StatelessWidget {
  final Duration retryAfter;
  final String? message;

  const RateLimitDialog({
    required this.retryAfter,
    this.message,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Please Wait'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(message ?? 'You\'ve made too many requests.'),
          const SizedBox(height: 16),
          CountdownTimer(
            duration: retryAfter,
            onComplete: () => Navigator.of(context).pop(),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('OK'),
        ),
      ],
    );
  }
}

// Usage in error handling
void handleApiError(dynamic error) {
  if (error is RateLimitException) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => RateLimitDialog(
        retryAfter: error.retryAfter,
        message: 'Please wait before trying again.',
      ),
    );
  }
}
```

## Rate Limit Headers

Standard rate limit headers used in responses:

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Maximum requests allowed | `60` |
| `X-RateLimit-Remaining` | Requests remaining in window | `45` |
| `X-RateLimit-Reset` | Unix timestamp when limit resets | `1699123456` |
| `Retry-After` | Seconds until retry is allowed | `30` |

{{< callout type="info" >}}
Rate limits are designed to allow normal usage while preventing abuse. If you're hitting rate limits during normal use, please contact support.
{{< /callout >}}

## Related Documentation

- [Input Validation](../input-validation) - Request validation
- [Session Management](../session-management) - Authentication session handling
- [Security Checklist](../security-checklist) - Rate limiting requirements
