---
title: AuthService
weight: 2
---

The `AuthService` handles user sign-in, sign-up, and sign-out, coordinating with encryption and session tracking services during the authentication lifecycle.

## Definition

```dart
// lib/services/auth_service.dart

class AuthService {
  const AuthService();

  Future<void> signInWithPassword({
    required String email,
    required String password,
  });

  Future<void> signUpWithPassword({
    required String email,
    required String password,
    String? displayName,
  });

  Future<void> signOut();
}
```

## Methods

### signInWithPassword

```dart
Future<void> signInWithPassword({
  required String email,
  required String password,
}) async
```

Authenticates an existing user with email and password via `SupabaseService.auth.signInWithPassword`. Wraps all Supabase errors into `AuthServiceException`.

### signUpWithPassword

```dart
Future<void> signUpWithPassword({
  required String email,
  required String password,
  String? displayName,
}) async
```

Creates a new account. If `displayName` is provided (non-empty), it is stored in user metadata as `display_name`. Detects duplicate-email errors from Supabase and re-throws them with the dedicated `codeEmailAlreadyRegistered` error code.

### signOut

```dart
Future<void> signOut() async
```

Performs a full sign-out sequence in order:

1. Deactivates the current session via `SessionTrackingService`.
2. Clears the cached password revision via `PasswordRevisionService`.
3. Signs out from Supabase Auth.
4. Wipes the in-memory encryption key via `EncryptionService.clearKey()`.

## AuthServiceException

```dart
class AuthServiceException implements Exception {
  const AuthServiceException({required this.message, this.code});

  final String message;
  final String? code;

  static const String codeEmailAlreadyRegistered = 'email_already_registered';
}
```

| Property | Type | Description |
|----------|------|-------------|
| `message` | `String` | Human-readable error description. |
| `code` | `String?` | Optional machine-readable error code for programmatic handling. |

### Error Codes

| Code | Meaning |
|------|---------|
| `email_already_registered` | The email address is already associated with an existing account. |

## Usage Examples

### Sign In

```dart
final authService = AuthService();

try {
  await authService.signInWithPassword(
    email: 'user@example.com',
    password: 'securePassword123',
  );
} on AuthServiceException catch (e) {
  showError(e.message);
}
```

### Sign Up

```dart
try {
  await authService.signUpWithPassword(
    email: 'newuser@example.com',
    password: 'securePassword123',
    displayName: 'Jane Doe',
  );
} on AuthServiceException catch (e) {
  if (e.code == AuthServiceException.codeEmailAlreadyRegistered) {
    // Suggest signing in instead
  }
}
```

### Sign Out

```dart
try {
  await authService.signOut();
  navigateToLogin();
} on AuthServiceException catch (e) {
  showError(e.message);
}
```

## Dependencies

| Service | Purpose |
|---------|---------|
| `SupabaseService` | Underlying Supabase Auth calls |
| `EncryptionService` | Clears encryption key on sign-out |
| `PasswordRevisionService` | Clears cached revision on sign-out |
| `SessionTrackingService` | Deactivates session record on sign-out |
