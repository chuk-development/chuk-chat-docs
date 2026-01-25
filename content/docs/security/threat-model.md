---
title: Threat Model
weight: 7
---

# Threat Model

This document outlines the security threats considered in chuk_chat's design and the mitigations implemented to address them.

## Threat Modeling Approach

chuk_chat uses the STRIDE methodology for threat analysis:

| Category | Description | Examples |
|----------|-------------|----------|
| **S**poofing | Impersonating users or systems | Fake login pages, session hijacking |
| **T**ampering | Unauthorized data modification | Message tampering, database injection |
| **R**epudiation | Denying actions performed | Unauthorized access denial |
| **I**nformation Disclosure | Unauthorized data access | Data breaches, eavesdropping |
| **D**enial of Service | Disrupting availability | Resource exhaustion, spam |
| **E**levation of Privilege | Gaining unauthorized access | Admin access, cross-user access |

## Security Boundaries

### Trust Boundary Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT DEVICE                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               TRUST BOUNDARY 1                       │   │
│  │  ┌─────────────────────────────────────────────┐     │   │
│  │  │        Application Memory                    │     │   │
│  │  │  ┌───────────┐    ┌───────────────────┐     │     │   │
│  │  │  │ Encryption│    │ Decrypted        │     │     │   │
│  │  │  │ Key       │    │ Messages         │     │     │   │
│  │  │  │ (in use)  │    │ (temporary)      │     │     │   │
│  │  │  └───────────┘    └───────────────────┘     │     │   │
│  │  └─────────────────────────────────────────────┘     │   │
│  │                        │                              │   │
│  │                        ▼                              │   │
│  │  ┌─────────────────────────────────────────────┐     │   │
│  │  │        Platform Secure Storage              │     │   │
│  │  │  ┌───────────┐    ┌───────────────────┐     │     │   │
│  │  │  │ Encryption│    │ Auth Tokens       │     │     │   │
│  │  │  │ Key       │    │ (refresh, access) │     │     │   │
│  │  │  │ (at rest) │    │                   │     │     │   │
│  │  │  └───────────┘    └───────────────────┘     │     │   │
│  │  └─────────────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          │ Ciphertext Only                  │
│                          ▼                                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS + Certificate Pinning
            ───────────────┼───────────────
                TRUST BOUNDARY 2 (Network)
            ───────────────┼───────────────
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE CLOUD                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               TRUST BOUNDARY 3                       │   │
│  │  ┌─────────────────────────────────────────────┐     │   │
│  │  │        PostgreSQL + RLS                      │     │   │
│  │  │  ┌───────────────────────────────────┐       │     │   │
│  │  │  │ encrypted_chats                   │       │     │   │
│  │  │  │ ├─ id (UUID)                      │       │     │   │
│  │  │  │ ├─ user_id (UUID) ← RLS policy   │       │     │   │
│  │  │  │ └─ encrypted_data (JSON blob)     │       │     │   │
│  │  │  │     └─ Cannot decrypt without    │       │     │   │
│  │  │  │        user's password            │       │     │   │
│  │  │  └───────────────────────────────────┘       │     │   │
│  │  └─────────────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Boundary Descriptions

| Boundary | Description | Controls |
|----------|-------------|----------|
| Boundary 1 | Application process boundary | Process isolation, secure memory |
| Boundary 2 | Network boundary | TLS, certificate pinning |
| Boundary 3 | Database boundary | RLS, encrypted storage |

## Considered Threats

### 1. Server Compromise

**Threat**: Attacker gains access to Supabase infrastructure

**Attack Vector**: SQL injection, misconfiguration, insider threat

**Mitigation**:
- End-to-end encryption - server only stores ciphertext
- Encryption keys never transmitted to server
- Even with full database access, data remains encrypted

```dart
// Server sees only this - useless without user's password
{
  "v": "1.0",
  "nonce": "A3F8...",
  "ciphertext": "YWJj...",  // Cannot decrypt
  "mac": "x7Y2..."
}
```

**Residual Risk**: Metadata (timestamps, user IDs) is visible

---

### 2. Man-in-the-Middle (MITM) Attacks

**Threat**: Attacker intercepts network traffic

**Attack Vectors**:
- Rogue WiFi access points
- DNS spoofing
- Compromised Certificate Authority
- Corporate SSL inspection proxies

**Mitigation**:
- Certificate pinning in production builds
- SHA-256 fingerprint validation
- Multiple backup certificate pins

```dart
// Certificate validation fails for MITM attempts
static bool validateCertificate(X509Certificate cert) {
  final fingerprint = computeFingerprint(cert);
  return _pinnedCertificates.contains(fingerprint);
}
```

**Residual Risk**: Debug builds allow interception for development

---

### 3. Credential Theft

**Threat**: Attacker obtains user password

**Attack Vectors**:
- Phishing
- Keyloggers
- Password reuse from breached sites
- Brute force attacks

**Mitigation**:
- PBKDF2 with 600,000 iterations (slow brute force)
- Password complexity requirements
- Rate limiting on authentication
- Account lockout after failed attempts

```dart
// 600k iterations makes offline brute force impractical
final key = await pbkdf2(
  password: userPassword,
  salt: uniqueSalt,
  iterations: 600000,  // ~500ms per attempt
  keyLength: 32,
);
```

**Residual Risk**: Weak user-chosen passwords, successful phishing

---

### 4. Session Hijacking

**Threat**: Attacker steals active session

**Attack Vectors**:
- Token theft from device
- Cross-site scripting (N/A - native app)
- Session fixation

**Mitigation**:
- Tokens stored in platform secure storage
- Automatic session refresh (short-lived access tokens)
- Password revision detection
- Session validation on resume

```dart
// Password change invalidates all other sessions
if (await PasswordRevisionService.hasRevisionMismatch()) {
  await AuthService.signOut();  // Force re-authentication
}
```

**Residual Risk**: Device compromise, memory dumping

---

### 5. Brute Force Attacks

**Threat**: Attacker guesses credentials through repeated attempts

**Attack Vectors**:
- Password guessing
- API endpoint enumeration
- Dictionary attacks

**Mitigation**:
- Rate limiting (5 attempts per 5 minutes)
- Account lockout (30 minutes after 10 failures)
- CAPTCHA after multiple failures
- Progressive delays

```dart
// Account locked after repeated failures
if (recentAttempts >= 10) {
  _lockedAccounts[email] = now.add(Duration(minutes: 30));
}
```

**Residual Risk**: Distributed attacks from many IPs

---

### 6. Malicious File Uploads

**Threat**: Attacker uploads harmful files

**Attack Vectors**:
- Malware disguised as documents
- Zip bombs (decompression attacks)
- Path traversal in filenames

**Mitigation**:
- MIME type validation via magic bytes
- Zip bomb detection (compression ratio check)
- Filename sanitization
- File size limits

```dart
// Detect zip bombs before extraction
if (uncompressedSize / compressedSize > 100) {
  return ValidationResult(isValid: false, errors: ['Suspicious archive']);
}
```

**Residual Risk**: Zero-day exploits in file parsers

---

### 7. Data Leakage

**Threat**: Sensitive data exposed through logging or errors

**Attack Vectors**:
- Tokens in log files
- PII in crash reports
- Sensitive data in error messages

**Mitigation**:
- No logging in production builds
- All tokens masked before any logging
- Error message sanitization
- Stack trace filtering

```dart
// Tokens always masked
static String maskToken(String token) {
  return '${token.substring(0, 4)}...${token.substring(token.length - 4)}';
}
```

**Residual Risk**: Debug build logs on shared devices

---

### 8. Cross-User Data Access

**Threat**: User accesses another user's data

**Attack Vectors**:
- IDOR (Insecure Direct Object Reference)
- API manipulation
- Database query manipulation

**Mitigation**:
- Row Level Security on all tables
- User ID verified at database level
- No client-side authorization checks only

```sql
-- RLS policy - user can only see own data
CREATE POLICY "Users can view own chats"
ON encrypted_chats FOR SELECT
USING (auth.uid() = user_id);
```

**Residual Risk**: RLS policy misconfiguration

---

### 9. Denial of Service (DoS)

**Threat**: Service made unavailable to legitimate users

**Attack Vectors**:
- Request flooding
- Upload spam
- Resource exhaustion

**Mitigation**:
- API rate limiting (60 req/min)
- Upload rate limiting (5/5min, 100/day)
- File size limits (10MB)
- Concurrent upload limits (3)

```dart
// Rate limit exceeded
if (currentCount >= limit.requests) {
  throw RateLimitException(retryAfter: calculateRetryAfter());
}
```

**Residual Risk**: Distributed attacks, Supabase infrastructure attacks

---

### 10. Device Theft

**Threat**: Physical access to user's device

**Attack Vectors**:
- Unlocked device access
- Device forensics
- Memory extraction

**Mitigation**:
- Platform secure storage (hardware-backed when available)
- No sensitive data in plaintext files
- Key cleared on app termination
- Biometric protection (optional)

**Residual Risk**: Sophisticated forensic attacks on rooted/jailbroken devices

## Threat Summary Matrix

| Threat | Likelihood | Impact | Risk Level | Primary Mitigation |
|--------|------------|--------|------------|-------------------|
| Server Compromise | Medium | High | **Medium** | E2E Encryption |
| MITM Attack | Medium | High | **Medium** | Certificate Pinning |
| Credential Theft | High | High | **High** | PBKDF2, Rate Limiting |
| Session Hijacking | Low | High | **Medium** | Token Security |
| Brute Force | High | Medium | **Medium** | Rate Limiting |
| Malicious Upload | Medium | Medium | **Medium** | File Validation |
| Data Leakage | Low | Medium | **Low** | Privacy Logging |
| Cross-User Access | Low | High | **Medium** | RLS Policies |
| DoS | Medium | Medium | **Medium** | Rate Limiting |
| Device Theft | Low | High | **Medium** | Secure Storage |

## Assumptions

The threat model assumes:

1. **User's device is not compromised** - Malware on the device can access anything the app can access
2. **Platform security is intact** - We rely on iOS/Android/OS security features
3. **User's password is not trivially weak** - Password requirements enforce minimum complexity
4. **Network is untrusted** - All network communication is treated as potentially hostile
5. **Supabase infrastructure is properly maintained** - We rely on Supabase's security practices

## Out of Scope

The following are explicitly out of scope for this threat model:

- Social engineering attacks against users
- Physical attacks on Supabase data centers
- Government-level adversaries
- Zero-day vulnerabilities in cryptographic libraries
- Side-channel attacks on encryption

{{< callout type="warning" >}}
**Security is a process, not a product.** This threat model is reviewed and updated regularly as new threats emerge and the application evolves.
{{< /callout >}}

## Related Documentation

- [Encryption](../encryption) - Cryptographic implementation details
- [Certificate Pinning](../certificate-pinning) - Network security
- [Security Checklist](../security-checklist) - Implementation verification
