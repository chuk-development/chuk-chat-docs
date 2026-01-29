---
title: EncryptionService
weight: 3
---

The `EncryptionService` provides end-to-end AES-256-GCM encryption for chat messages and files, deriving keys from the user's password via PBKDF2.

## Definition

```dart
// lib/services/encryption_service.dart

class EncryptionService {
  const EncryptionService._();

  static bool get hasKey;

  // Key lifecycle
  static Future<void> initializeForPassword(String password);
  static Future<bool> tryLoadKey();
  static Future<void> clearKey();
  static Future<void> rotateKeyForPasswordChange({
    required String currentPassword,
    required String newPassword,
    required Future<void> Function() migrateWithNewKey,
    required Future<void> Function() rollbackWithOldKey,
  });

  // String encryption
  static Future<String> encrypt(String plaintext);
  static Future<String> decrypt(String encrypted);

  // Binary encryption
  static Future<String> encryptBytes(Uint8List bytes);
  static Future<Uint8List> decryptBytes(String encrypted);

  // Background isolate operations
  static Future<String> decryptInBackground(String encrypted);
  static Future<List<String?>> decryptBatchInBackground(List<String> encryptedList);
}
```

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `_payloadVersion` | `"1"` | Version tag embedded in every ciphertext payload for forward compatibility. |
| `_kdfIterations` | `600,000` | PBKDF2 iteration count (OWASP-recommended for HMAC-SHA256). |
| `_saltLength` | `16` | Random salt length in bytes. |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `hasKey` | `bool` | Whether an encryption key is currently loaded in memory. |

## Methods

### initializeForPassword

```dart
static Future<void> initializeForPassword(String password) async
```

Derives an AES-256 key from the user's password using PBKDF2 (HMAC-SHA256, 600,000 iterations). On first use, generates a random 16-byte salt and stores it both locally (Flutter Secure Storage) and remotely (Supabase user metadata). On subsequent calls, verifies the derived key matches the stored key using constant-time comparison.

**Salt resolution logic**: When both local and remote salts exist but differ, the service tests the password against each salt to determine the canonical one, preventing multi-device conflicts.

### tryLoadKey

```dart
static Future<bool> tryLoadKey() async
```

Attempts to load a previously stored encryption key from Flutter Secure Storage without requiring the password. Returns `true` if successful. Syncs encryption metadata to Supabase in the background without blocking.

### clearKey

```dart
static Future<void> clearKey() async
```

Wipes the encryption key from memory and deletes the key, salt, and version from secure storage. Called during sign-out.

### rotateKeyForPasswordChange

```dart
static Future<void> rotateKeyForPasswordChange({
  required String currentPassword,
  required String newPassword,
  required Future<void> Function() migrateWithNewKey,
  required Future<void> Function() rollbackWithOldKey,
}) async
```

Performs a transactional key rotation when the user changes their password:

1. Verifies `currentPassword` against the stored key.
2. Generates a new salt and derives a new key from `newPassword`.
3. Calls `migrateWithNewKey` to re-encrypt all data.
4. On failure, restores the old key and calls `rollbackWithOldKey`.
5. Updates secure storage and Supabase metadata on success.

### encrypt / decrypt

```dart
static Future<String> encrypt(String plaintext) async
static Future<String> decrypt(String encrypted) async
```

Encrypts or decrypts a UTF-8 string on the main isolate. The ciphertext is a JSON payload:

```json
{
  "v": "1",
  "nonce": "<base64>",
  "ciphertext": "<base64>",
  "mac": "<base64>"
}
```

### encryptBytes / decryptBytes

```dart
static Future<String> encryptBytes(Uint8List bytes) async
static Future<Uint8List> decryptBytes(String encrypted) async
```

Encrypts or decrypts binary data (images, files) in a **background isolate** via `compute()` to avoid blocking the UI thread. Uses the same JSON payload format.

### decryptInBackground / decryptBatchInBackground

```dart
static Future<String> decryptInBackground(String encrypted) async
static Future<List<String?>> decryptBatchInBackground(List<String> encryptedList) async
```

Decrypt strings in a background isolate. The batch variant processes multiple ciphertexts in a single isolate spawn, returning `null` for any item that fails to decrypt.

## Concurrency

All key lifecycle methods (`initializeForPassword`, `tryLoadKey`, `clearKey`, `rotateKeyForPasswordChange`) run through `_runExclusive`, a future-based lock that serializes operations to prevent race conditions.

## Storage Layout

| Secure Storage Key | Content |
|--------------------|---------|
| `chat_key_{userId}` | Base64-encoded derived AES-256 key |
| `chat_salt_{userId}` | Base64-encoded PBKDF2 salt |
| `chat_key_version_{userId}` | Payload version string |

| Supabase User Metadata Key | Content |
|----------------------------|---------|
| `chat_kdf_salt` | Base64-encoded salt (synced across devices) |
| `chat_key_version` | Payload version string |

## Usage Examples

### Initialize After Login

```dart
await AuthService().signInWithPassword(
  email: email,
  password: password,
);
await EncryptionService.initializeForPassword(password);
```

### Encrypt and Decrypt a Message

```dart
final ciphertext = await EncryptionService.encrypt('Hello, world!');
final plaintext = await EncryptionService.decrypt(ciphertext);
```

### Batch Decrypt Chat History

```dart
final encryptedMessages = chats.map((c) => c.encryptedContent).toList();
final decrypted = await EncryptionService.decryptBatchInBackground(encryptedMessages);
for (final text in decrypted) {
  if (text != null) print(text);
}
```

### Encrypt a File

```dart
final imageBytes = await File('photo.jpg').readAsBytes();
final encryptedPayload = await EncryptionService.encryptBytes(imageBytes);
// Store encryptedPayload in Supabase Storage
```
