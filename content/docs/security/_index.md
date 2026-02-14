---
title: Security
weight: 6
---

# Security Architecture

chuk_chat implements multiple security layers to protect user data with a privacy-first approach. This section provides comprehensive documentation of all security mechanisms.

## Design Principles

The security architecture follows these core principles:

- **Zero-Knowledge Design**: The server never has access to plaintext user data
- **Defense in Depth**: Multiple overlapping security layers protect against various attack vectors
- **Secure by Default**: All security features are enabled automatically without user configuration
- **Platform Integration**: Leverages native platform security features (Keychain, Keystore, etc.)
- **Minimal Attack Surface**: Only necessary data is transmitted and stored

## Security Features Overview

| Feature | Implementation | Status |
|---------|---------------|--------|
| End-to-End Encryption | AES-256-GCM with PBKDF2 | Active |
| Certificate Pinning | Real SHA-256 fingerprint via `badCertificateCallback` | Production |
| ZDR Provider Filtering | Automatic non-ZDR provider blocking | Active |
| Input Validation | Multi-layer validation, min password 8 chars | Active |
| Rate Limiting | Per-endpoint and per-user | Active |
| Token Security | Masking, sanitization, secure comparison | Active |
| Session Management | Revision detection, auto-refresh | Active |
| Row Level Security | PostgreSQL RLS policies | Active |
| Debug Log Protection | `kDebugMode` guards on all `debugPrint` calls | Active |
| Android Backup Disabled | `allowBackup=false` + `dataExtractionRules` | Active |
| Image Validation | Magic byte verification, decompression bomb detection | Active |

## Quick Links

{{< cards >}}
  {{< card link="encryption" title="Encryption" subtitle="AES-256-GCM, PBKDF2, key management" icon="lock-closed" >}}
  {{< card link="certificate-pinning" title="Certificate Pinning" subtitle="SSL pinning implementation by platform" icon="shield-check" >}}
  {{< card link="zdr-provider-filtering" title="ZDR Provider Filtering" subtitle="Zero Data Retention provider enforcement" icon="eye-off" >}}
  {{< card link="input-validation" title="Input Validation" subtitle="Password, file, and upload validation" icon="check-circle" >}}
  {{< card link="rate-limiting" title="Rate Limiting" subtitle="API and upload rate limiters" icon="clock" >}}
  {{< card link="token-handling" title="Token Handling" subtitle="Secure token management and sanitization" icon="key" >}}
  {{< card link="session-management" title="Session Management" subtitle="Password revision and session refresh" icon="user-circle" >}}
  {{< card link="threat-model" title="Threat Model" subtitle="Threat analysis and security boundaries" icon="exclamation" >}}
  {{< card link="security-checklist" title="Security Checklist" subtitle="Complete security implementation checklist" icon="clipboard-list" >}}
{{< /cards >}}

## Data Flow Security

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Device                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               Trust Boundary                         │   │
│  │  ┌─────────────────┐    ┌─────────────────────┐     │   │
│  │  │ User Password   │───▶│ PBKDF2 Key Derivation│     │   │
│  │  └─────────────────┘    └─────────────────────┘     │   │
│  │                                │                     │   │
│  │                                ▼                     │   │
│  │  ┌─────────────────┐    ┌─────────────────────┐     │   │
│  │  │ Encryption Key  │◀───│ Platform Keychain   │     │   │
│  │  └─────────────────┘    └─────────────────────┘     │   │
│  │         │                                            │   │
│  │         ▼                                            │   │
│  │  ┌─────────────────┐                                 │   │
│  │  │ AES-256-GCM     │                                 │   │
│  │  │ Encrypt/Decrypt │                                 │   │
│  │  └─────────────────┘                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼ (Ciphertext only)               │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS + Certificate Pinning
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Backend                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Row Level Security (RLS)                            │   │
│  │  - User isolation at database level                  │   │
│  │  - Encrypted ciphertext storage only                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Recent Security Hardening (February 2026)

Several security improvements were applied across the codebase:

- **kDebugMode guards**: All 873 `debugPrint()` calls across 53 files wrapped in `kDebugMode` checks to prevent information leakage in release builds
- **Android backup disabled**: `allowBackup=false`, `fullBackupContent=false`, and custom `dataExtractionRules` added to `AndroidManifest.xml` to prevent encryption keys and cached messages from leaking into cloud or device-transfer backups
- **Password minimum raised to 8**: Updated in both Supabase `config.toml` and `InputValidator.minPasswordLength`
- **Certificate pinning domain fix**: Subdomain matching now uses exact match or dot-prefixed check (`host == domain || host.endsWith('.domain')`) to prevent bypass via crafted hostnames
- **WebSocket timeouts**: Connection timeout (15s), first-chunk timeout (120s), and idle timer (60s) prevent indefinite hangs
- **Network timeouts**: 10-30s timeouts added to critical Supabase and HTTP operations
- **Image security**: Magic byte validation and decompression bomb detection in `ImageCompressionService`
- **Edge function CORS hardening**: Wildcard `Access-Control-Allow-Origin` replaced with origin allowlist in the `revoke-session` edge function
- **RLS fix**: `get_credits_remaining` function updated with `auth.uid()` check; service role (null `auth.uid()`) still allowed for webhooks

## Vulnerability Reporting

Report security vulnerabilities to: **security@chuk.chat**

**Please do not:**
- Post vulnerabilities publicly
- Exploit vulnerabilities beyond proof-of-concept
- Access other users' data

**We will:**
- Respond within 48 hours
- Provide status updates
- Credit reporters (if desired)
- Not pursue legal action for good-faith reports

{{< callout type="warning" >}}
The encryption key **never** leaves the device. Supabase only stores encrypted ciphertext that cannot be decrypted without the user's password.
{{< /callout >}}
