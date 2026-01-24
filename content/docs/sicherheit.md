---
title: Sicherheit
weight: 6
---

# Sicherheitsarchitektur

chuk_chat implementiert mehrere Sicherheitsebenen zum Schutz der Benutzerdaten.

## Ende-zu-Ende-Verschlüsselung

### Algorithmus

| Komponente | Spezifikation |
|------------|---------------|
| Verschlüsselung | AES-256-GCM |
| Key Derivation | PBKDF2 (600.000 Iterationen) |
| Nonce | 12 Bytes, zufällig generiert |
| MAC | GCM-Tag (128 Bit) |

### Verschlüsselungsformat

```json
{
  "v": "1.0",
  "nonce": "base64-encoded-12-bytes",
  "ciphertext": "base64-encoded-encrypted-data",
  "mac": "base64-encoded-authentication-tag"
}
```

### Key Management

```dart
// Key wird aus Passwort abgeleitet
final key = await pbkdf2(
  password: userPassword,
  salt: uniqueSalt,
  iterations: 600000,
  keyLength: 32,  // 256 bits
);

// Key wird im Device Keychain gespeichert
await FlutterSecureStorage().write(
  key: 'encryption_key',
  value: base64Encode(key),
);
```

{{< callout type="warning" >}}
Der Encryption Key verlässt **niemals** das Gerät. Supabase sieht nur verschlüsselte Daten.
{{< /callout >}}

---

## Certificate Pinning

In **Release-Builds** wird SSL Certificate Pinning aktiviert:

```dart
// lib/utils/certificate_pinning.dart
class CertificatePinning {
  static SecurityContext? getSecurityContext() {
    if (kReleaseMode) {
      // Pin API-Zertifikat
      return SecurityContext()
        ..setTrustedCertificates(pinnedCert);
    }
    return null;  // Kein Pinning in Debug
  }
}
```

**Schutz gegen:**
- Man-in-the-Middle-Angriffe
- Kompromittierte CAs
- SSL-Interception durch Proxies

---

## Input Validation

### Passwort-Anforderungen

```dart
// lib/utils/input_validator.dart
class InputValidator {
  static bool isValidPassword(String password) {
    return password.length >= 12 &&
           hasUppercase(password) &&
           hasLowercase(password) &&
           hasDigit(password) &&
           hasSpecialChar(password);
  }
}
```

**Anforderungen:**
- Mindestens 12 Zeichen
- Großbuchstaben
- Kleinbuchstaben
- Ziffern
- Sonderzeichen

### Datei-Validierung

```dart
// lib/utils/file_upload_validator.dart
class FileUploadValidator {
  static const maxFileSize = 10 * 1024 * 1024;  // 10 MB

  static Future<bool> validate(File file) async {
    // Größe prüfen
    if (await file.length() > maxFileSize) return false;

    // MIME-Type prüfen
    if (!allowedMimeTypes.contains(getMimeType(file))) return false;

    // Zip-Bomb-Detection
    if (isZipFile(file) && await isZipBomb(file)) return false;

    return true;
  }
}
```

**Erlaubte Dateitypen:**
- Dokumente: PDF, DOCX, XLSX, PPTX, TXT, MD
- Bilder: JPG, PNG, GIF, WEBP
- Audio: MP3, WAV, M4A
- Code: PY, JS, TS, JSON, YAML

---

## Rate Limiting

### API Rate Limiter

```dart
// lib/utils/api_rate_limiter.dart
class ApiRateLimiter {
  static const maxRequests = 60;
  static const windowSeconds = 60;

  static bool canMakeRequest(String endpoint, String userId) {
    final key = '$endpoint:$userId';
    final count = requestCounts[key] ?? 0;
    return count < maxRequests;
  }
}
```

### Upload Rate Limiter

```dart
// lib/utils/upload_rate_limiter.dart
class UploadRateLimiter {
  static const maxUploads = 5;
  static const windowMinutes = 5;

  // Schutz gegen DoS durch Upload-Spam
}
```

---

## Secure Token Handling

```dart
// lib/utils/secure_token_handler.dart
class SecureTokenHandler {
  // Tokens in Logs maskieren
  static String maskToken(String token) {
    if (token.length <= 8) return '***';
    return '${token.substring(0, 4)}...${token.substring(token.length - 4)}';
  }

  // Sichere Fehlermeldungen (keine Tokens)
  static String sanitizeError(String error) {
    return error.replaceAll(tokenPattern, '[REDACTED]');
  }
}
```

---

## Privacy Logging

```dart
// lib/utils/privacy_logger.dart
class PrivacyLogger {
  static void log(String message) {
    if (kDebugMode) {
      // Nur in Debug-Builds loggen
      // Niemals Benutzerinhalte loggen
      print('[DEBUG] $message');
    }
  }
}
```

**Regeln:**
- Kein Logging in Release-Builds
- Keine Benutzerinhalte in Logs
- Tokens werden maskiert
- Stack Traces werden gefiltert

---

## Row Level Security (RLS)

Alle Supabase-Tabellen haben RLS:

```sql
-- Benutzer können nur eigene Daten sehen
CREATE POLICY "Users can view own data"
ON encrypted_chats FOR SELECT
USING (auth.uid() = user_id);
```

**Schutz:**
- Benutzer können nur eigene Daten lesen
- Benutzer können nur eigene Daten schreiben
- Benutzer können nur eigene Daten löschen
- Kein Zugriff auf fremde Daten möglich

---

## Session Management

### Password Revision Service

Erkennt Passwortänderungen auf anderen Geräten:

```dart
// lib/services/password_revision_service.dart
class PasswordRevisionService {
  static Future<void> checkPasswordRevision() async {
    final storedRevision = await secureStorage.read('password_revision');
    final serverRevision = await fetchServerRevision();

    if (storedRevision != serverRevision) {
      // Passwort wurde geändert → Logout erzwingen
      await AuthService.signOut();
      await EncryptionService.clearKey();
    }
  }
}
```

### Session Refresh

```dart
// Sessions werden automatisch refreshed
// Throttled auf 30-Sekunden-Intervalle
SupabaseService.refreshSession();
```

---

## Sicherheits-Checkliste

{{< callout type="info" >}}
Folgende Punkte sind implementiert:
{{< /callout >}}

- [x] AES-256-GCM Verschlüsselung
- [x] PBKDF2 Key Derivation (600k Iterationen)
- [x] Certificate Pinning (Production)
- [x] Rate Limiting (API + Upload)
- [x] Input Validation
- [x] Zip-Bomb Detection
- [x] Row Level Security (RLS)
- [x] Secure Token Handling
- [x] Privacy-aware Logging
- [x] Passwort-Komplexitätsanforderungen
- [x] Automatic Session Refresh
- [x] Password Revision Detection

---

## Vulnerability Reporting

Sicherheitslücken bitte an: **security@chuk.chat**

Nicht öffentlich melden! Wir antworten innerhalb von 48 Stunden.
