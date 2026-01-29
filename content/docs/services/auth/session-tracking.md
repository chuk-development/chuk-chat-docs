---
title: SessionTrackingService
weight: 6
---


The `SessionTrackingService` tracks active device sessions and enables remote sign-out across all platforms.

## Overview

When a user signs in on a device, the service registers a session record in the `user_sessions` table. Each session is identified by a SHA-256 hash of the refresh token, ensuring the raw token is never stored server-side. Users can view all their active sessions and remotely revoke any session from another device.

## Architecture

```
┌──────────────┐     ┌────────────────────┐     ┌─────────────────────┐
│  User Login  │────►│ registerSession()  │────►│  user_sessions      │
│              │     │ (upsert by hash)   │     │  table (Supabase)   │
└──────────────┘     └────────────────────┘     └─────────────────────┘
                                                         │
┌──────────────┐     ┌────────────────────┐              │
│  Settings    │────►│ listActiveSessions │◄─────────────┘
│  Page        │     └────────────────────┘
│              │             │
│              │     ┌────────────────────┐     ┌─────────────────────┐
│  "Revoke"   │────►│ revokeSession()    │────►│  Edge Function      │
│  button      │     │                    │     │  (invalidates JWT)  │
└──────────────┘     └────────────────────┘     └─────────────────────┘
```

## SessionRecord Class

The `SessionRecord` data class represents a single device session:

```dart
class SessionRecord {
  final String id;
  final String userId;
  final String deviceName;
  final String platform;
  final String appVersion;
  final DateTime lastSeenAt;
  final DateTime createdAt;
  final bool isActive;
  final String refreshTokenHash;

  SessionRecord({
    required this.id,
    required this.userId,
    required this.deviceName,
    required this.platform,
    required this.appVersion,
    required this.lastSeenAt,
    required this.createdAt,
    required this.isActive,
    required this.refreshTokenHash,
  });

  factory SessionRecord.fromJson(Map<String, dynamic> json) {
    return SessionRecord(
      id: json['id'],
      userId: json['user_id'],
      deviceName: json['device_name'],
      platform: json['platform'],
      appVersion: json['app_version'],
      lastSeenAt: DateTime.parse(json['last_seen_at']),
      createdAt: DateTime.parse(json['created_at']),
      isActive: json['is_active'],
      refreshTokenHash: json['refresh_token_hash'],
    );
  }
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | String | UUID primary key |
| `userId` | String | References `auth.users(id)` |
| `deviceName` | String | Human-readable device name (e.g. "Pixel 8 Pro") |
| `platform` | String | One of: Android, iOS, Web, Linux, macOS, Windows |
| `appVersion` | String | App version at time of login |
| `lastSeenAt` | DateTime | Last activity timestamp |
| `createdAt` | DateTime | Session creation timestamp |
| `isActive` | bool | Whether the session is currently active |
| `refreshTokenHash` | String | SHA-256 hash of the refresh token |

## Key Methods

All methods are static on the `SessionTrackingService` class.

### registerSession()

Registers or updates a device session using upsert with `ON CONFLICT(user_id, refresh_token_hash)`. Called automatically after successful sign-in.

```dart
static Future<void> registerSession() async {
  final session = SupabaseService.auth.currentSession;
  if (session == null) return;

  final refreshTokenHash = _hashToken(session.refreshToken!);
  final deviceName = await _getDeviceName();
  final platform = _getPlatform();

  await SupabaseService.client.from('user_sessions').upsert({
    'user_id': session.user.id,
    'device_name': deviceName,
    'platform': platform,
    'app_version': appVersion,
    'refresh_token_hash': refreshTokenHash,
    'last_seen_at': DateTime.now().toIso8601String(),
    'is_active': true,
  }, onConflict: 'user_id, refresh_token_hash');

  // Store session ID locally for later reference
  await _storeLocalSessionId(refreshTokenHash);
}
```

The upsert ensures that if a device logs in with the same refresh token (e.g. after a token refresh), the existing record is updated rather than duplicated.

### updateLastSeen()

Updates the `last_seen_at` timestamp for the current session. Called periodically during app usage.

```dart
static Future<void> updateLastSeen() async {
  final sessionId = await _getLocalSessionId();
  if (sessionId == null) return;

  await SupabaseService.client
      .from('user_sessions')
      .update({'last_seen_at': DateTime.now().toIso8601String()})
      .eq('id', sessionId);
}
```

### listActiveSessions()

Returns all active sessions for the current user, ordered by most recently seen.

```dart
static Future<List<SessionRecord>> listActiveSessions() async {
  final userId = SupabaseService.auth.currentUser?.id;
  if (userId == null) return [];

  final response = await SupabaseService.client
      .from('user_sessions')
      .select()
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_seen_at', ascending: false);

  return response.map((json) => SessionRecord.fromJson(json)).toList();
}
```

### revokeSession()

Revokes a specific session by calling a Supabase edge function. The edge function invalidates the refresh token server-side and marks the session as inactive.

```dart
static Future<void> revokeSession(String sessionId) async {
  await SupabaseService.client.functions.invoke(
    'revoke-session',
    body: {'session_id': sessionId},
  );
}
```

### revokeAllOtherSessions()

Revokes all sessions except the current one. Useful as a security action after a suspected compromise.

```dart
static Future<void> revokeAllOtherSessions() async {
  final currentSessionId = await _getLocalSessionId();
  if (currentSessionId == null) return;

  await SupabaseService.client.functions.invoke(
    'revoke-session',
    body: {'exclude_session_id': currentSessionId},
  );
}
```

### deactivateCurrentSession()

Marks the current session as inactive locally. Called during sign-out.

```dart
static Future<void> deactivateCurrentSession() async {
  final sessionId = await _getLocalSessionId();
  if (sessionId == null) return;

  await SupabaseService.client
      .from('user_sessions')
      .update({'is_active': false})
      .eq('id', sessionId);

  await _clearLocalSessionId();
}
```

## Remote Sign-Out Flow

When a session is revoked remotely, the affected device detects it on next app resume or token refresh:

```
Device A (revoking):                    Device B (revoked):
┌────────────────────────┐              ┌────────────────────────┐
│ 1. User taps "Revoke"  │              │ 1. App resumes or      │
│ 2. Call revokeSession() │              │    token refresh fires │
│ 3. Edge function        │              │ 2. Refresh fails (401) │
│    invalidates token   │              │ 3. Auth state listener │
│ 4. Session marked      │              │    triggers sign-out   │
│    inactive in DB      │              │ 4. Set remotely signed │
└────────────────────────┘              │    out flag            │
                                        │ 5. Show banner on      │
                                        │    login page          │
                                        └────────────────────────┘
```

The `wasRemotelySignedOut()` and `setRemotelySignedOut()` methods use `FlutterSecureStorage` to persist a flag that the login page reads to show an informational banner:

```dart
static Future<bool> wasRemotelySignedOut() async {
  final value = await _storage.read(key: _remoteSignOutKey);
  return value == 'true';
}

static Future<void> setRemotelySignedOut(bool value) async {
  if (value) {
    await _storage.write(key: _remoteSignOutKey, value: 'true');
  } else {
    await _storage.delete(key: _remoteSignOutKey);
  }
}
```

## Integration Points

| Component | Integration |
|-----------|------------|
| `AuthService.signIn()` | Calls `registerSession()` after successful login |
| `AuthService.signOut()` | Calls `deactivateCurrentSession()` |
| `AppLifecycleService` | Calls `updateLastSeen()` on resume |
| `SessionValidator` | Checks remote sign-out flag |
| Settings page | Calls `listActiveSessions()` and `revokeSession()` |

## Security

### SHA-256 Token Hashing

Refresh tokens are never stored in the database in plain text. Instead, a SHA-256 hash is computed and used for identification:

```dart
static String _hashToken(String token) {
  final bytes = utf8.encode(token);
  final digest = sha256.convert(bytes);
  return digest.toString();
}
```

This ensures that even if the `user_sessions` table is compromised, the actual refresh tokens cannot be recovered.

### Secure Local Storage

The local session ID is stored using `FlutterSecureStorage`, which maps to:

| Platform | Storage Backend |
|----------|----------------|
| Android | Android Keystore |
| iOS | Keychain |
| macOS | Keychain |
| Linux | libsecret |
| Windows | Windows Credential Manager |
| Web | Encrypted local storage |

### Platform Detection

The service detects the current platform to populate the `platform` field:

```dart
static String _getPlatform() {
  if (kIsWeb) return 'Web';
  if (Platform.isAndroid) return 'Android';
  if (Platform.isIOS) return 'iOS';
  if (Platform.isLinux) return 'Linux';
  if (Platform.isMacOS) return 'macOS';
  if (Platform.isWindows) return 'Windows';
  return 'Unknown';
}
```

## Related

- [Auth Services](../) - Authentication overview
- [Session Management](/docs/security/session-management) - Session security details
- [User Sessions Table](/docs/database/tables/user-sessions) - Database schema
- [Token Handling](/docs/security/token-handling) - Token security
