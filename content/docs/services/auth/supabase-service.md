---
title: SupabaseService
weight: 1
---

The `SupabaseService` is a static singleton that initializes and provides access to the Supabase client, authentication, and session management.

## Definition

```dart
// lib/services/supabase_service.dart

class SupabaseService {
  const SupabaseService._();

  static SupabaseClient get client;
  static GoTrueClient get auth;

  static Future<void> initialize();
  static Future<Session?> refreshSession();
  static Future<void> signOut();
}
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `client` | `SupabaseClient` | The initialized Supabase client instance. Throws `StateError` if accessed before `initialize()`. |
| `auth` | `GoTrueClient` | Shortcut to `client.auth` for authentication operations. |

## Static Fields

| Field | Type | Description |
|-------|------|-------------|
| `_initialized` | `bool` | Guards against double initialization and premature client access. |
| `_lastRefreshTime` | `DateTime?` | Timestamp of the last session refresh, used for throttling. |
| `_inFlightRefresh` | `Future<Session?>?` | De-duplicates concurrent refresh calls so only one network request runs at a time. |
| `_kMinRefreshInterval` | `Duration` | Minimum 30-second gap between session refreshes. |

## Methods

### initialize

```dart
static Future<void> initialize() async
```

Initializes Supabase with credentials from `SupabaseConfig`. Loads environment variables (`.env` for desktop, `--dart-define` for mobile) and configures PKCE auth flow. Throws `StateError` if placeholder credentials are detected. Safe to call multiple times; subsequent calls are no-ops.

### refreshSession

```dart
static Future<Session?> refreshSession() async
```

Refreshes the current authentication session with built-in safeguards:

- **Throttling**: Skips refresh if the last one occurred within 30 seconds.
- **De-duplication**: Concurrent calls share a single in-flight request.
- **Network resilience**: Returns the existing session on network errors instead of signing the user out.
- **Auth errors**: Returns `null` on genuine auth failures (e.g., revoked token).

### signOut

```dart
static Future<void> signOut() async
```

Signs the user out via Supabase Auth. Catches and logs `AuthException` so callers do not need to handle sign-out failures.

## Usage Examples

### Initialization at App Startup

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SupabaseService.initialize();
  runApp(const ChukChatApp());
}
```

### Accessing the Client

```dart
// Direct database query
final response = await SupabaseService.client
    .from('chats')
    .select()
    .eq('user_id', userId);

// Auth operations
final user = SupabaseService.auth.currentUser;
```

### Session Refresh

```dart
// Refresh before making an authenticated API call
final session = await SupabaseService.refreshSession();
if (session == null) {
  // User is no longer authenticated
  navigateToLogin();
}
```

## Configuration

The service reads credentials through `SupabaseConfig`, which supports two modes:

| Platform | Source |
|----------|--------|
| Desktop | `.env` file with `SUPABASE_URL` and `SUPABASE_ANON_KEY` |
| Mobile | `--dart-define=SUPABASE_URL=...` and `--dart-define=SUPABASE_ANON_KEY=...` |

Authentication uses the **PKCE** (Proof Key for Code Exchange) flow via `AuthFlowType.pkce`.
