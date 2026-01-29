---
title: Password Services
weight: 4
---

The password services handle password changes with encryption key rotation (`PasswordChangeService`) and cross-session password revision tracking (`PasswordRevisionService`).

## PasswordChangeService

### Definition

```dart
// lib/services/password_change_service.dart

class PasswordChangeService {
  const PasswordChangeService();

  Future<String> changePassword({
    required String currentPassword,
    required String newPassword,
  });
}
```

### changePassword

```dart
Future<String> changePassword({
  required String currentPassword,
  required String newPassword,
}) async
```

Orchestrates a full password change with encryption key rotation. Returns a success message including the user's email address for confirmation.

**Sequence**:

1. **Validate** inputs (non-empty, minimum 8 characters, passwords differ).
2. **Verify** current password against the encryption key via `EncryptionService.initializeForPassword`.
3. **Snapshot** all chats and the system prompt for re-encryption.
4. **Rotate encryption** by calling `EncryptionService.rotateKeyForPasswordChange`, which re-encrypts all chats and the system prompt with the new key.
5. **Update password** in Supabase Auth. On failure, rolls back the encryption to the old key.
6. **Bump revision** via `PasswordRevisionService` so other sessions detect the change.
7. **Send confirmation OTP** email via `signInWithOtp`.
8. **Reload chats** to reflect the newly encrypted data.

### Validation Rules

| Rule | Error Message |
|------|---------------|
| Current password empty | "Enter your current password to continue." |
| New password empty | "Enter a new password." |
| New password < 8 chars | "Choose a password with at least 8 characters." |
| Passwords identical | "New password must be different from your current password." |
| Not signed in | "You need to be signed in to change your password." |

### PasswordChangeException

```dart
class PasswordChangeException implements Exception {
  const PasswordChangeException(this.message);
  final String message;
}
```

All errors during the password change flow are wrapped in `PasswordChangeException` with a descriptive message.

## PasswordRevisionService

### Definition

```dart
// lib/services/password_revision_service.dart

class PasswordRevisionService {
  const PasswordRevisionService._();

  static Future<bool> hasRevisionMismatch(User user);
  static Future<User?> ensureRevisionSeeded(User user);
  static Future<User?> bumpRevision(User user);
  static Future<void> cacheRemoteRevision(User user);
  static Future<void> clearCachedRevision({String? userId});
}
```

### Purpose

When a user changes their password on one device, all other active sessions must detect this and force a re-authentication. `PasswordRevisionService` achieves this by storing a UUID revision marker in both Supabase user metadata and local secure storage. A mismatch between the two indicates a password change occurred elsewhere.

### Methods

| Method | Description |
|--------|-------------|
| `hasRevisionMismatch(user)` | Compares the local cached revision with the remote one. Returns `true` if they differ, signaling the user should be signed out. Designed to be safe: returns `false` on any storage or unexpected error to prevent false-positive logouts. |
| `ensureRevisionSeeded(user)` | Creates an initial revision marker for new users or users who predate the feature. No-op if a revision already exists. |
| `bumpRevision(user)` | Generates a new UUID, writes it to Supabase user metadata, and caches it locally. Called after a successful password change. |
| `cacheRemoteRevision(user)` | Syncs the local cache to match the current remote value. |
| `clearCachedRevision({userId})` | Deletes the locally stored revision. Called during sign-out. |

### Storage Layout

| Location | Key | Value |
|----------|-----|-------|
| Supabase user metadata | `password_revision` | UUID v4 string |
| Flutter Secure Storage | `password_revision_{userId}` | UUID v4 string (cached copy) |

## Usage Examples

### Changing Password

```dart
final service = PasswordChangeService();

try {
  final message = await service.changePassword(
    currentPassword: 'oldPassword123',
    newPassword: 'newSecurePassword456',
  );
  showSuccess(message);
  // "Password updated. Check user@example.com to confirm the change."
} on PasswordChangeException catch (e) {
  showError(e.message);
}
```

### Checking for Password Change on Another Device

```dart
final user = SupabaseService.auth.currentUser;
if (user != null) {
  final mismatch = await PasswordRevisionService.hasRevisionMismatch(user);
  if (mismatch) {
    await AuthService().signOut();
    navigateToLogin(reason: 'Password changed on another device.');
  }
}
```

### Seeding Revision on First Login

```dart
final user = SupabaseService.auth.currentUser!;
await PasswordRevisionService.ensureRevisionSeeded(user);
```

## Dependencies

| Service | Used By | Purpose |
|---------|---------|---------|
| `EncryptionService` | `PasswordChangeService` | Key initialization, rotation, and verification |
| `ChatStorageService` | `PasswordChangeService` | Re-encrypts chat data during key rotation |
| `UserPreferencesService` | `PasswordChangeService` | Re-encrypts the system prompt during key rotation |
| `SupabaseService` | Both | Auth operations and user metadata updates |
