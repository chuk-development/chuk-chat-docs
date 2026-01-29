---
title: Session Management
weight: 6
---

Secure session management is critical for maintaining user authentication state while protecting against session hijacking and unauthorized access. chuk_chat implements robust session handling with multiple security layers.

## Session Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Login                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Password Verification                          │
│              └─ Supabase Auth                               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Key Derivation                                 │
│              └─ PBKDF2 (600k iterations)                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Session Established                            │
│              ├─ Access Token → Secure Storage               │
│              ├─ Refresh Token → Secure Storage              │
│              ├─ Encryption Key → Platform Keychain          │
│              └─ Password Revision → Local + Server          │
└─────────────────────────────────────────────────────────────┘
```

## Password Revision Detection

Detects when a password is changed on another device and forces re-authentication:

```dart
// lib/services/password_revision_service.dart
class PasswordRevisionService {
  static const _revisionKey = 'password_revision';
  static const _storage = FlutterSecureStorage();

  /// Checks if password was changed on another device
  static Future<bool> hasRevisionMismatch() async {
    final localRevision = await _getLocalRevision();
    final serverRevision = await _getServerRevision();

    if (localRevision == null) {
      // First login or fresh install - save server revision
      if (serverRevision != null) {
        await _setLocalRevision(serverRevision);
      }
      return false;
    }

    if (serverRevision == null) {
      // No server revision - might be old account
      return false;
    }

    // Compare revisions using secure comparison
    return !SecureTokenHandler.secureCompare(localRevision, serverRevision);
  }

  /// Handles password revision mismatch
  static Future<void> handleMismatch(BuildContext context) async {
    // Clear encryption key (derived from old password)
    await EncryptionService.clearKey();

    // Clear local session
    await AuthService.signOut();

    // Show re-authentication dialog
    if (context.mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          title: const Text('Password Changed'),
          content: const Text(
            'Your password was changed on another device. '
            'Please sign in again with your new password.',
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).pushNamedAndRemoveUntil(
                  '/login',
                  (route) => false,
                );
              },
              child: const Text('Sign In'),
            ),
          ],
        ),
      );
    }
  }

  /// Updates password revision after password change
  static Future<void> bumpRevision() async {
    final newRevision = const Uuid().v4();

    // Update server
    final userId = SupabaseService.auth.currentUser?.id;
    if (userId == null) return;

    await SupabaseService.client.auth.updateUser(
      UserAttributes(
        data: {'password_revision': newRevision},
      ),
    );

    // Update local
    await _setLocalRevision(newRevision);

    PrivacyLogger.log('PasswordRevision', 'Revision updated');
  }

  static Future<String?> _getLocalRevision() async {
    return await _storage.read(key: _revisionKey);
  }

  static Future<void> _setLocalRevision(String revision) async {
    await _storage.write(key: _revisionKey, value: revision);
  }

  static Future<String?> _getServerRevision() async {
    final user = SupabaseService.auth.currentUser;
    return user?.userMetadata?['password_revision'] as String?;
  }

  /// Clears local revision on logout
  static Future<void> clearRevision() async {
    await _storage.delete(key: _revisionKey);
  }
}
```

### Password Revision Flow

```
Device A (changes password):
┌──────────────────────────┐
│ 1. User changes password │
│ 2. Generate new revision │
│ 3. Update server         │
│ 4. Update local storage  │
│ 5. Re-derive encryption  │
│    key with new password │
└──────────────────────────┘

Device B (detects change):
┌──────────────────────────┐
│ 1. App resumes/launches  │
│ 2. Check revision match  │
│ 3. Mismatch detected!    │
│ 4. Clear encryption key  │
│ 5. Sign out              │
│ 6. Prompt re-auth        │
└──────────────────────────┘
```

## Session Refresh

Sessions are automatically refreshed with throttling to prevent abuse:

```dart
// lib/services/supabase_service.dart
class SupabaseService {
  static late SupabaseClient _client;
  static DateTime? _lastRefresh;
  static const _refreshInterval = Duration(seconds: 30);
  static final _refreshLock = Lock();

  static SupabaseClient get client => _client;
  static GoTrueClient get auth => _client.auth;

  /// Refreshes session with throttling
  static Future<void> refreshSession() async {
    await _refreshLock.synchronized(() async {
      final now = DateTime.now();

      // Throttle refresh attempts
      if (_lastRefresh != null &&
          now.difference(_lastRefresh!) < _refreshInterval) {
        PrivacyLogger.log('Session', 'Refresh throttled');
        return;
      }

      try {
        final response = await auth.refreshSession();

        if (response.session != null) {
          _lastRefresh = now;

          // Store new tokens
          await TokenStorageService.storeAccessToken(
            response.session!.accessToken,
          );

          if (response.session!.refreshToken != null) {
            await TokenStorageService.storeRefreshToken(
              response.session!.refreshToken!,
            );
          }

          PrivacyLogger.log('Session', 'Session refreshed successfully');
        }
      } on AuthException catch (e) {
        PrivacyLogger.error('Session', 'Refresh failed', e);

        if (e.statusCode == '401' || e.statusCode == '403') {
          // Session invalid - trigger logout
          await signOut();
        }
      }
    });
  }

  /// Signs out and clears all session data
  static Future<void> signOut() async {
    try {
      await auth.signOut();
    } catch (e) {
      // Ignore errors during sign out
    }

    // Clear all stored credentials
    await Future.wait([
      TokenStorageService.clearAllTokens(),
      PasswordRevisionService.clearRevision(),
      EncryptionService.clearKey(),
    ]);

    PrivacyLogger.log('Session', 'Signed out and cleared all data');
  }
}
```

## Session State Listener

Monitors authentication state changes:

```dart
// lib/services/auth_state_service.dart
class AuthStateService {
  static final _stateController = StreamController<AuthState>.broadcast();
  static StreamSubscription? _subscription;

  static Stream<AuthState> get stateChanges => _stateController.stream;

  /// Initialize auth state listener
  static void initialize() {
    _subscription = SupabaseService.auth.onAuthStateChange.listen(
      (data) async {
        final event = data.event;
        final session = data.session;

        switch (event) {
          case AuthChangeEvent.signedIn:
            PrivacyLogger.log('AuthState', 'User signed in');
            await _handleSignIn(session!);
            _stateController.add(AuthState.authenticated);

          case AuthChangeEvent.signedOut:
            PrivacyLogger.log('AuthState', 'User signed out');
            await _handleSignOut();
            _stateController.add(AuthState.unauthenticated);

          case AuthChangeEvent.tokenRefreshed:
            PrivacyLogger.log('AuthState', 'Token refreshed');
            if (session != null) {
              await TokenStorageService.storeAccessToken(session.accessToken);
            }

          case AuthChangeEvent.userUpdated:
            PrivacyLogger.log('AuthState', 'User updated');
            // Check for password revision change
            if (await PasswordRevisionService.hasRevisionMismatch()) {
              _stateController.add(AuthState.passwordChanged);
            }

          case AuthChangeEvent.passwordRecovery:
            PrivacyLogger.log('AuthState', 'Password recovery initiated');
            _stateController.add(AuthState.passwordRecovery);

          default:
            break;
        }
      },
      onError: (error) {
        PrivacyLogger.error('AuthState', 'Auth state error', error);
      },
    );
  }

  static Future<void> _handleSignIn(Session session) async {
    await TokenStorageService.storeAccessToken(session.accessToken);
    if (session.refreshToken != null) {
      await TokenStorageService.storeRefreshToken(session.refreshToken!);
    }
    await TokenStorageService.storeTokenExpiry(
      DateTime.fromMillisecondsSinceEpoch(session.expiresAt! * 1000),
    );
  }

  static Future<void> _handleSignOut() async {
    await TokenStorageService.clearAllTokens();
    await PasswordRevisionService.clearRevision();
  }

  static void dispose() {
    _subscription?.cancel();
    _stateController.close();
  }
}

enum AuthState {
  authenticated,
  unauthenticated,
  passwordChanged,
  passwordRecovery,
}
```

## Session Validation

Validates session before sensitive operations:

```dart
// lib/services/session_validator.dart
class SessionValidator {
  /// Validates session is still valid
  static Future<SessionValidationResult> validate() async {
    // Check token expiry
    if (await TokenStorageService.isTokenExpired()) {
      // Try to refresh
      final refreshed = await TokenRefreshService.refreshTokens();
      if (!refreshed) {
        return SessionValidationResult(
          isValid: false,
          reason: 'Session expired',
          requiresReauth: true,
        );
      }
    }

    // Check password revision
    if (await PasswordRevisionService.hasRevisionMismatch()) {
      return SessionValidationResult(
        isValid: false,
        reason: 'Password changed on another device',
        requiresReauth: true,
      );
    }

    // Check encryption key availability
    final hasKey = await EncryptionService.hasKey();
    if (!hasKey) {
      return SessionValidationResult(
        isValid: false,
        reason: 'Encryption key unavailable',
        requiresReauth: true,
      );
    }

    return SessionValidationResult(isValid: true);
  }

  /// Validates session with user interaction
  static Future<bool> validateWithPrompt(BuildContext context) async {
    final result = await validate();

    if (!result.isValid) {
      if (result.requiresReauth && context.mounted) {
        final confirmed = await showDialog<bool>(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            title: const Text('Session Expired'),
            content: Text(result.reason ?? 'Please sign in again.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: const Text('Sign In'),
              ),
            ],
          ),
        );

        if (confirmed == true) {
          await SupabaseService.signOut();
          if (context.mounted) {
            Navigator.of(context).pushNamedAndRemoveUntil(
              '/login',
              (route) => false,
            );
          }
        }
      }
      return false;
    }

    return true;
  }
}

class SessionValidationResult {
  final bool isValid;
  final String? reason;
  final bool requiresReauth;

  SessionValidationResult({
    required this.isValid,
    this.reason,
    this.requiresReauth = false,
  });
}
```

## App Lifecycle Session Management

Handles session state during app lifecycle events:

```dart
// lib/services/app_lifecycle_service.dart
class AppLifecycleService with WidgetsBindingObserver {
  static final instance = AppLifecycleService._();
  AppLifecycleService._();

  DateTime? _pausedAt;
  static const _maxBackgroundDuration = Duration(minutes: 30);

  void initialize() {
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.paused:
        _pausedAt = DateTime.now();
        PrivacyLogger.log('Lifecycle', 'App paused');

      case AppLifecycleState.resumed:
        _handleResume();

      case AppLifecycleState.detached:
        // App being terminated - clear sensitive memory
        _clearSensitiveMemory();

      default:
        break;
    }
  }

  Future<void> _handleResume() async {
    PrivacyLogger.log('Lifecycle', 'App resumed');

    // Check if session should be invalidated due to long background time
    if (_pausedAt != null) {
      final backgroundDuration = DateTime.now().difference(_pausedAt!);

      if (backgroundDuration > _maxBackgroundDuration) {
        PrivacyLogger.log(
          'Lifecycle',
          'Background duration exceeded, validating session',
        );

        final result = await SessionValidator.validate();
        if (!result.isValid) {
          // Session invalid - will be handled by auth state listener
          return;
        }
      }
    }

    // Check password revision (might have changed while backgrounded)
    if (await PasswordRevisionService.hasRevisionMismatch()) {
      PrivacyLogger.log('Lifecycle', 'Password revision mismatch detected');
      // Will be handled by auth state listener
    }

    // Refresh session if needed
    if (await TokenStorageService.isTokenExpired()) {
      await SupabaseService.refreshSession();
    }

    _pausedAt = null;
  }

  void _clearSensitiveMemory() {
    // Clear any sensitive data from memory
    // This is a best-effort cleanup before app termination
    PrivacyLogger.log('Lifecycle', 'Clearing sensitive memory');
  }

  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
  }
}
```

## Secure Session Configuration

Configuration for session security:

```dart
// lib/config/session_config.dart
class SessionConfig {
  /// Maximum session duration before requiring re-authentication
  static const maxSessionDuration = Duration(days: 30);

  /// Duration after which idle session expires
  static const idleTimeout = Duration(hours: 24);

  /// Minimum interval between session refreshes
  static const refreshInterval = Duration(seconds: 30);

  /// Maximum time app can be in background before requiring validation
  static const maxBackgroundDuration = Duration(minutes: 30);

  /// Number of failed auth attempts before lockout
  static const maxFailedAttempts = 10;

  /// Duration of account lockout after max failed attempts
  static const lockoutDuration = Duration(minutes: 30);
}
```

{{< callout type="info" >}}
Sessions are automatically refreshed in the background. Users only need to re-authenticate when their password changes or after extended inactivity.
{{< /callout >}}

## Device Session Tracking

{{< callout type="info" >}}
Session tracking is behind the `FEATURE_SESSION_MANAGEMENT` feature flag and must be enabled at build time via `--dart-define=FEATURE_SESSION_MANAGEMENT=true`. When disabled, session tracking calls are skipped to prevent logout loops.
{{< /callout >}}

Chuk Chat tracks active sessions across devices using the `user_sessions` table. Each login registers a session record containing the device name, platform, app version, and a SHA-256 hash of the refresh token.

### How It Works

1. On sign-in, `SessionTrackingService.registerSession()` upserts a row in `user_sessions`
2. The refresh token is hashed with SHA-256 before storage -- the raw token never reaches the database
3. `updateLastSeen()` is called on app resume to keep activity timestamps current
4. Users can view all active sessions from the settings page

### Force-Verify on Resume

On app resume and startup, `main.dart` calls `SupabaseService.forceVerifySession()` to detect revoked tokens. This issues a lightweight session refresh; if the server returns a 401, the user is signed out immediately. This ensures that remotely revoked sessions are detected even before the next automatic token refresh.

```
┌────────────┐   registerSession()   ┌─────────────────┐
│  Sign In   │──────────────────────►│  user_sessions   │
└────────────┘   (upsert by hash)    │  table           │
                                     └─────────────────┘
┌────────────┐   listActiveSessions()        │
│  Settings  │◄──────────────────────────────┘
└────────────┘
```

### SHA-256 Token Hashing

Refresh tokens are hashed before being stored in the `user_sessions` table:

```dart
static String _hashToken(String token) {
  final bytes = utf8.encode(token);
  final digest = sha256.convert(bytes);
  return digest.toString();
}
```

This ensures that if the database is compromised, refresh tokens cannot be recovered. The hash serves only as a unique identifier for upsert conflict resolution via the `(user_id, refresh_token_hash)` unique constraint.

## Remote Session Revocation

Users can revoke any active session from the settings page. Revocation is handled by a Supabase edge function to ensure the refresh token is also invalidated server-side.

### Revocation Flow

```
Device A (initiates revoke):           Device B (revoked session):
┌─────────────────────────┐            ┌─────────────────────────┐
│ 1. Tap "Revoke" on      │            │ 1. App resumes or       │
│    session entry         │            │    token refresh fires  │
│ 2. Call revokeSession()  │            │ 2. Refresh returns 401  │
│ 3. Edge function:        │            │ 3. Auth listener        │
│    a. Invalidate token   │            │    triggers sign-out    │
│    b. Mark session       │            │ 4. Remote sign-out flag │
│       inactive in DB     │            │    set in secure store  │
└─────────────────────────┘            │ 5. Login page shows     │
                                       │    info banner           │
                                       └─────────────────────────┘
```

### Supabase Edge Function

The `revoke-session` edge function accepts either a `session_id` (to revoke a single session) or an `exclude_session_id` (to revoke all sessions except the current one):

```
POST /functions/v1/revoke-session

Body (single revoke):
{ "session_id": "uuid" }

Body (revoke all others):
{ "exclude_session_id": "uuid" }
```

The edge function:
1. Looks up the session record to find the associated refresh token hash
2. Invalidates the refresh token in Supabase Auth
3. Sets `is_active = false` on the session record

### Remote Sign-Out Detection

When a device's token is revoked remotely, the next token refresh will fail with a 401. The app detects this and sets a flag in `FlutterSecureStorage` so the login page can display an informational banner:

```dart
static Future<bool> wasRemotelySignedOut() async {
  final value = await _storage.read(key: _remoteSignOutKey);
  return value == 'true';
}
```

## Session Security Checklist

| Security Measure | Implementation |
|-----------------|----------------|
| Secure token storage | Platform keychain/keystore |
| Token refresh | Automatic with throttling |
| Password change detection | Revision tracking |
| Session validation | Before sensitive operations |
| Lifecycle management | Background timeout |
| Idle timeout | Configurable duration |
| Secure logout | Clear all credentials |
| Device session tracking | `user_sessions` table with SHA-256 hashed tokens |
| Remote revocation | Supabase edge function invalidates tokens |
| Multi-device visibility | Settings page lists all active sessions |
| Force-verify on resume | `forceVerifySession()` detects revoked tokens on app resume |
| Feature flag guard | Session tracking wrapped in `kFeatureSessionManagement` to prevent logout loops |

## Related Documentation

- [Token Handling](../token-handling) - Token security
- [Encryption](../encryption) - Key lifecycle
- [Rate Limiting](../rate-limiting) - Auth rate limits
- [SessionTrackingService](/services/auth/session-tracking) - Service implementation
- [User Sessions Table](/database/tables/user-sessions) - Database schema
