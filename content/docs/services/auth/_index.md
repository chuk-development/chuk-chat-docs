---
title: Auth Services
weight: 1
---

# Authentication & Security Services

The authentication and security services form the foundation of Chuk Chat's security model. These services handle user authentication, session management, encryption key derivation, and secure password workflows.

## Overview

The auth services work together to provide end-to-end encryption for user data:

```
User Password
    ↓
SupabaseService (authentication)
    ↓
EncryptionService (key derivation)
    ↓
Encrypted Data Storage
```

## Service Components

### [SupabaseService](supabase-service)

The foundation layer that initializes and manages the Supabase client connection. Handles:

- Client initialization with PKCE auth flow
- Session refresh with 30-second throttling
- In-flight request deduplication
- Network error resilience

### [AuthService](auth-service)

Orchestrates the complete authentication flow including:

- Email/password sign up with display name
- Sign in with automatic encryption key initialization
- Sign out with secure key clearing
- Integration with chat loading on authentication

### [EncryptionService](encryption-service)

Provides AES-256-GCM encryption with industry-standard key derivation:

- PBKDF2 with 600,000 iterations
- Background isolate processing
- String and binary encryption/decryption
- Key rotation for password changes

### [Password Services](password-services)

Manages secure password workflows:

- **PasswordChangeService** - Atomic password changes with data re-encryption
- **PasswordRevisionService** - Multi-device session invalidation

### [SessionTrackingService](session-tracking)

Tracks active device sessions across platforms:

- Device session registration with SHA-256 hashed refresh tokens
- Active session listing for settings UI
- Remote session revocation via Supabase edge function
- Remote sign-out detection and login page banner

## Security Architecture

### End-to-End Encryption

All user data is encrypted client-side before transmission:

```dart
// Data flow
UserData → EncryptionService.encrypt() → Supabase Storage
Supabase Storage → EncryptionService.decrypt() → UserData
```

### Key Management

The encryption key is derived from the user's password and never stored:

1. User enters password
2. PBKDF2 derives 256-bit key (600,000 iterations)
3. Key held in memory only
4. Key cleared on sign out

### Session Security

Sessions are protected through multiple mechanisms:

- PKCE flow prevents authorization code interception
- Refresh token rotation
- Password revision tracking for multi-device logout
- Automatic session refresh with deduplication

## Integration Example

Here's how the auth services work together during sign-in:

```dart
// 1. User initiates sign in
await AuthService.signInWithPassword(email, password);

// Internal flow:
// a) SupabaseService authenticates with Supabase
// b) EncryptionService derives key from password
// c) ChatStorageService loads encrypted chats
// d) ChatSyncService starts background sync
```

## Error Handling

Auth services use typed exceptions for clear error handling:

```dart
try {
  await AuthService.signInWithPassword(email, password);
} on AuthException catch (e) {
  // Invalid credentials, network error, etc.
  showError(e.message);
} on EncryptionException catch (e) {
  // Key derivation failed
  showError('Encryption error: ${e.message}');
}
```

## Best Practices

When working with auth services:

1. **Always check authentication state** before accessing encrypted data
2. **Never store passwords** - only the derived key in memory
3. **Clear sensitive data** on sign out using `EncryptionService.clearKey()`
4. **Handle network errors gracefully** - SupabaseService preserves sessions on network failure
5. **Use password revision checks** on app resume for multi-device security
