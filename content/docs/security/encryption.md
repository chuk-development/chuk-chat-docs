---
title: Encryption
weight: 1
---

# End-to-End Encryption

chuk_chat uses industry-standard encryption algorithms to ensure that user data remains private and secure. All encryption and decryption happens on the client device - the server never has access to plaintext data.

## Algorithm Specifications

| Component | Specification | Purpose |
|-----------|---------------|---------|
| Encryption | AES-256-GCM | Authenticated symmetric encryption |
| Key Derivation | PBKDF2-SHA256 | Password-based key generation |
| Iterations | 600,000 | Brute-force resistance |
| Nonce | 12 bytes (96 bits) | Cryptographically random per encryption |
| MAC | GCM tag (128 bits) | Authentication and integrity |
| Salt | 32 bytes (256 bits) | Unique per user |

### Why These Choices?

- **AES-256-GCM**: NIST-approved, provides both confidentiality and authenticity in a single operation
- **600,000 PBKDF2 iterations**: Exceeds OWASP 2023 recommendations, balances security with mobile performance
- **GCM mode**: Authenticated encryption prevents tampering attacks

## Encryption Format

All encrypted data follows this JSON structure for portability and version management:

```json
{
  "v": "1.0",
  "nonce": "base64-encoded-12-bytes",
  "ciphertext": "base64-encoded-encrypted-data",
  "mac": "base64-encoded-authentication-tag"
}
```

| Field | Description | Size |
|-------|-------------|------|
| `v` | Format version for future compatibility | Variable |
| `nonce` | Random initialization vector | 16 chars (base64) |
| `ciphertext` | Encrypted payload | Variable |
| `mac` | GCM authentication tag | 24 chars (base64) |

## Key Derivation

The encryption key is derived from the user's password using PBKDF2:

```dart
// lib/services/auth/encryption_service.dart
class EncryptionService {
  static const int _pbkdf2Iterations = 600000;
  static const int _keyLength = 32;  // 256 bits
  static const int _saltLength = 32;  // 256 bits

  /// Derives an encryption key from user password
  static Future<Uint8List> deriveKey({
    required String password,
    required Uint8List salt,
  }) async {
    final pbkdf2 = Pbkdf2(
      macAlgorithm: Hmac.sha256(),
      iterations: _pbkdf2Iterations,
      bits: _keyLength * 8,
    );

    final secretKey = await pbkdf2.deriveKey(
      secretKey: SecretKey(utf8.encode(password)),
      nonce: salt,
    );

    return Uint8List.fromList(await secretKey.extractBytes());
  }

  /// Generates a cryptographically secure salt
  static Uint8List generateSalt() {
    final random = Random.secure();
    return Uint8List.fromList(
      List.generate(_saltLength, (_) => random.nextInt(256)),
    );
  }
}
```

### Key Derivation Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ User         │     │ Unique Salt  │     │ PBKDF2       │
│ Password     │────▶│ (32 bytes)   │────▶│ 600k iters   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │ 256-bit Key  │
                                          └──────────────┘
```

## Encryption Operations

### Encrypting Data

```dart
class EncryptionService {
  static const int _nonceLength = 12;  // 96 bits for GCM

  /// Encrypts plaintext data
  static Future<EncryptedData> encrypt({
    required String plaintext,
    required Uint8List key,
  }) async {
    final algorithm = AesGcm.with256bits();

    // Generate cryptographically random nonce
    final nonce = Uint8List.fromList(
      List.generate(_nonceLength, (_) => Random.secure().nextInt(256)),
    );

    // Encrypt with authentication
    final secretBox = await algorithm.encrypt(
      utf8.encode(plaintext),
      secretKey: SecretKey(key),
      nonce: nonce,
    );

    return EncryptedData(
      version: '1.0',
      nonce: base64Encode(nonce),
      ciphertext: base64Encode(secretBox.cipherText),
      mac: base64Encode(secretBox.mac.bytes),
    );
  }
}
```

### Decrypting Data

```dart
class EncryptionService {
  /// Decrypts encrypted data
  static Future<String> decrypt({
    required EncryptedData encrypted,
    required Uint8List key,
  }) async {
    final algorithm = AesGcm.with256bits();

    // Reconstruct SecretBox from components
    final secretBox = SecretBox(
      base64Decode(encrypted.ciphertext),
      nonce: base64Decode(encrypted.nonce),
      mac: Mac(base64Decode(encrypted.mac)),
    );

    // Decrypt and verify authentication tag
    final plaintext = await algorithm.decrypt(
      secretBox,
      secretKey: SecretKey(key),
    );

    return utf8.decode(plaintext);
  }
}
```

## Key Storage by Platform

The derived encryption key is stored securely using platform-native mechanisms:

| Platform | Storage Mechanism | Security Level |
|----------|-------------------|----------------|
| Android | Android Keystore | Hardware-backed (when available) |
| iOS | Keychain Services | Secure Enclave (when available) |
| macOS | Keychain Services | Secure Enclave (when available) |
| Windows | Windows Credential Manager | DPAPI protected |
| Linux | libsecret (GNOME Keyring) | User session encrypted |

### Platform Key Storage Implementation

```dart
// lib/services/auth/secure_storage_service.dart
class SecureStorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
      keyCipherAlgorithm: KeyCipherAlgorithm.RSA_ECB_OAEPwithSHA_256andMGF1Padding,
      storageCipherAlgorithm: StorageCipherAlgorithm.AES_GCM_NoPadding,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  /// Stores the encryption key securely
  static Future<void> storeKey({
    required String userId,
    required Uint8List key,
  }) async {
    await _storage.write(
      key: 'encryption_key_$userId',
      value: base64Encode(key),
    );
  }

  /// Retrieves the encryption key
  static Future<Uint8List?> getKey(String userId) async {
    final encoded = await _storage.read(key: 'encryption_key_$userId');
    if (encoded == null) return null;
    return base64Decode(encoded);
  }

  /// Deletes the encryption key
  static Future<void> deleteKey(String userId) async {
    await _storage.delete(key: 'encryption_key_$userId');
  }
}
```

## Salt Management

Each user has a unique salt stored in their Supabase profile:

```dart
class SaltService {
  /// Retrieves or generates user salt
  static Future<Uint8List> getUserSalt(String userId) async {
    // Check for existing salt
    final profile = await SupabaseService.client
        .from('profiles')
        .select('encryption_salt')
        .eq('id', userId)
        .maybeSingle();

    if (profile?['encryption_salt'] != null) {
      return base64Decode(profile!['encryption_salt']);
    }

    // Generate new salt for new users
    final salt = EncryptionService.generateSalt();
    await SupabaseService.client
        .from('profiles')
        .update({'encryption_salt': base64Encode(salt)})
        .eq('id', userId);

    return salt;
  }
}
```

## Security Properties

### Confidentiality
- AES-256 provides 256-bit security level
- Key is never transmitted over network
- Ciphertext is indistinguishable from random data

### Integrity
- GCM authentication tag detects any tampering
- Modified ciphertext fails decryption
- Truncated data fails validation

### Authentication
- Only the correct key can decrypt data
- Key is derived from user's password
- Platform keychain protects stored key

{{< callout type="warning" >}}
**Key Security**: The encryption key never leaves the device. If the key is lost (device reset without backup), encrypted data cannot be recovered. Users should maintain secure backups of their password.
{{< /callout >}}

## Performance Considerations

| Operation | Typical Duration | Notes |
|-----------|------------------|-------|
| Key Derivation | 500-1500ms | One-time on login |
| Encrypt (1KB) | <5ms | Per-message overhead |
| Decrypt (1KB) | <5ms | Per-message overhead |

The key derivation is intentionally slow to resist brute-force attacks. The derived key is cached in secure storage to avoid repeated derivation.

## Privacy-Aware Logging

All debug logging throughout the application is guarded by `kDebugMode` checks, ensuring that no diagnostic output is emitted in release builds. This prevents accidental exposure of sensitive data (encryption parameters, key identifiers, token fragments) through platform log systems. No sensitive data is ever written to logs, even in debug mode.

## Related Documentation

- [Token Handling](../token-handling) - Secure token management
- [Session Management](../session-management) - Key lifecycle management
- [Threat Model](../threat-model) - Security boundaries
