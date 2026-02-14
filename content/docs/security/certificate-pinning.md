---
title: Certificate Pinning
weight: 2
---


Certificate pinning provides an additional layer of transport security by validating that the server's SSL certificate matches a known fingerprint. This protects against man-in-the-middle (MITM) attacks, even if an attacker has compromised a Certificate Authority.

## Overview

In **release builds**, SSL certificate pinning is enabled to prevent MITM attacks. Debug builds disable pinning to allow development tools like Charles Proxy or mitmproxy.

The implementation uses real SHA-256 certificate validation via `badCertificateCallback`, with platform-specific registration through conditional exports:

| File | Purpose |
|------|---------|
| `lib/utils/certificate_pinning_io.dart` | SHA-256 fingerprint validation using `dart:io` X509Certificate |
| `lib/utils/certificate_pinning_register.dart` | Abstract registration (conditional export entry point) |
| `lib/utils/certificate_pinning_register_io.dart` | Native platform registration via Dio's `IOHttpClientAdapter` |
| `lib/utils/certificate_pinning_register_stub.dart` | Web stub (no-op, web doesn't support custom cert validation) |

```dart
// lib/utils/certificate_pinning_io.dart
class CertificatePinning {
  /// SHA-256 fingerprints of trusted certificates
  static const _pinnedCertificates = [
    // Primary API server certificate
    'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    // Backup certificate (for rotation)
    'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
  ];

  /// Validates certificate against pinned fingerprints
  /// Uses badCertificateCallback for real SHA-256 validation
  static bool validateCertificate(X509Certificate cert, String host, int port) {
    // Only validate for pinned domains (exact match or subdomain)
    if (!_isPinnedDomain(host)) return true;

    final fingerprint = _computeFingerprint(cert);
    return _pinnedCertificates.any(
      (pinned) => SecureTokenHandler.secureCompare(pinned, fingerprint),
    );
  }

  /// Exact domain match or dot-prefixed subdomain check
  /// Prevents subdomain bypass (e.g. evil-api.chuk.chat.attacker.com)
  static bool _isPinnedDomain(String host) {
    return _pinnedDomains.any(
      (domain) => host == domain || host.endsWith('.$domain'),
    );
  }
}
```

## Protection Coverage

Certificate pinning protects against:

| Threat | Description | Protection |
|--------|-------------|------------|
| MITM Attacks | Attacker intercepts network traffic | Certificate validation fails |
| Compromised CAs | Rogue CA issues fake certificates | Only pinned certs accepted |
| Corporate Proxies | SSL-inspecting proxies | Connection rejected |
| Rogue WiFi | Malicious access points | Cannot impersonate server |
| DNS Spoofing | Redirecting to fake servers | Certificate mismatch detected |

## Implementation by Platform

### Android Implementation

Android uses Network Security Configuration with certificate pinning:

```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </base-config>

    <domain-config>
        <domain includeSubdomains="true">api.chuk.chat</domain>
        <domain includeSubdomains="true">supabase.co</domain>
        <pin-set expiration="2025-12-31">
            <pin digest="SHA-256">AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=</pin>
            <pin digest="SHA-256">BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=</pin>
        </pin-set>
    </domain-config>
</network-security-config>
```

Reference in AndroidManifest.xml:

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

### iOS/macOS Implementation

iOS and macOS use URLSession delegate for certificate validation:

```dart
// lib/utils/certificate_pinning_ios.dart
class IOSCertificatePinning {
  static const MethodChannel _channel = MethodChannel('certificate_pinning');

  static Future<void> configurePinning() async {
    if (!kReleaseMode) return;

    await _channel.invokeMethod('configurePinning', {
      'pins': CertificatePinning._pinnedCertificates,
      'domains': ['api.chuk.chat', 'supabase.co'],
    });
  }
}
```

Swift implementation:

```swift
// ios/Runner/CertificatePinningPlugin.swift
class CertificatePinningPlugin: NSObject, URLSessionDelegate {
    private var pinnedCertificates: [String] = []

    func urlSession(
        _ session: URLSession,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
              let serverTrust = challenge.protectionSpace.serverTrust,
              let certificate = SecTrustGetCertificateAtIndex(serverTrust, 0) else {
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }

        let serverFingerprint = computeSHA256Fingerprint(certificate)

        if pinnedCertificates.contains(serverFingerprint) {
            completionHandler(.useCredential, URLCredential(trust: serverTrust))
        } else {
            completionHandler(.cancelAuthenticationChallenge, nil)
        }
    }

    private func computeSHA256Fingerprint(_ certificate: SecCertificate) -> String {
        let data = SecCertificateCopyData(certificate) as Data
        var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        data.withUnsafeBytes {
            _ = CC_SHA256($0.baseAddress, CC_LONG(data.count), &hash)
        }
        return "sha256/" + Data(hash).base64EncodedString()
    }
}
```

### Windows/Linux Implementation

Desktop platforms use Dart's HttpClient with custom certificate validation:

```dart
// lib/utils/certificate_pinning_desktop.dart
class DesktopCertificatePinning {
  static HttpClient createPinnedClient() {
    final client = HttpClient();

    if (kReleaseMode) {
      client.badCertificateCallback = (cert, host, port) {
        // Always reject invalid certificates in release
        return false;
      };

      // Custom certificate validation
      client.connectionFactory = (uri, proxyHost, proxyPort) async {
        final socket = await SecureSocket.connect(
          uri.host,
          uri.port,
          context: CertificatePinning.getSecurityContext(),
          onBadCertificate: (cert) {
            return CertificatePinning.validateCertificate(cert);
          },
        );
        return ConnectionTask.fromSocket(
          Future.value(socket),
          () => socket.close(),
        );
      };
    }

    return client;
  }
}
```

## Dio HTTP Client Integration

The app uses Dio for HTTP requests with certificate pinning:

```dart
// lib/services/network/dio_client.dart
class DioClient {
  static Dio createClient() {
    final dio = Dio(BaseOptions(
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
    ));

    if (kReleaseMode) {
      dio.httpClientAdapter = IOHttpClientAdapter(
        createHttpClient: () {
          final client = HttpClient(
            context: CertificatePinning.getSecurityContext(),
          );
          client.badCertificateCallback = (cert, host, port) => false;
          return client;
        },
      );
    }

    // Add interceptors
    dio.interceptors.addAll([
      LogInterceptor(requestBody: kDebugMode, responseBody: kDebugMode),
      RetryInterceptor(dio: dio, retries: 3),
      RateLimitInterceptor(),
    ]);

    return dio;
  }
}
```

## Certificate Rotation

To rotate certificates without breaking existing app installations:

### 1. Add New Certificate Before Rotation

```dart
static const _pinnedCertificates = [
  // Current certificate (keep until all clients updated)
  'sha256/OLD_CERTIFICATE_FINGERPRINT_HERE...',
  // New certificate (add before server rotation)
  'sha256/NEW_CERTIFICATE_FINGERPRINT_HERE...',
];
```

### 2. Rotation Timeline

| Phase | Duration | Action |
|-------|----------|--------|
| Preparation | 2 weeks | Add new cert fingerprint to app |
| Deployment | 1 week | Release app update |
| Rotation | 1 day | Switch server certificate |
| Cleanup | 4 weeks | Monitor for issues |
| Removal | After 4 weeks | Remove old fingerprint |

### 3. Extracting Certificate Fingerprint

```bash
# Get fingerprint from live server
echo | openssl s_client -connect api.chuk.chat:443 2>/dev/null | \
  openssl x509 -noout -fingerprint -sha256

# Get fingerprint from certificate file
openssl x509 -in certificate.pem -noout -fingerprint -sha256

# Convert to base64 format for pinning
echo | openssl s_client -connect api.chuk.chat:443 2>/dev/null | \
  openssl x509 -pubkey -noout | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256 -binary | base64
```

## Error Handling

When certificate validation fails:

```dart
class CertificatePinningException implements Exception {
  final String message;
  final String host;
  final String? actualFingerprint;

  CertificatePinningException({
    required this.message,
    required this.host,
    this.actualFingerprint,
  });

  @override
  String toString() => 'CertificatePinningException: $message for $host';
}

// Usage in error handling
try {
  final response = await dio.get('/api/data');
} on DioException catch (e) {
  if (e.type == DioExceptionType.badCertificate) {
    // Certificate pinning failed
    throw CertificatePinningException(
      message: 'Server certificate does not match pinned certificate',
      host: e.requestOptions.uri.host,
    );
  }
  rethrow;
}
```

## Debug Mode Considerations

{{< callout type="info" >}}
Certificate pinning is **disabled in debug builds** to allow development tools. This is intentional and does not affect production security.
{{< /callout >}}

```dart
// Check if pinning is active
bool isPinningEnabled() {
  return kReleaseMode && !_bypassPinning;
}

// Development-only bypass (never in release)
static bool _bypassPinning = false;

@visibleForTesting
static void setBypassForTesting(bool bypass) {
  assert(!kReleaseMode, 'Cannot bypass pinning in release mode');
  _bypassPinning = bypass;
}
```

## Testing Certificate Pinning

### Unit Tests

```dart
void main() {
  group('CertificatePinning', () {
    test('validates correct certificate', () {
      final cert = loadTestCertificate('valid_cert.pem');
      expect(CertificatePinning.validateCertificate(cert), isTrue);
    });

    test('rejects incorrect certificate', () {
      final cert = loadTestCertificate('invalid_cert.pem');
      expect(CertificatePinning.validateCertificate(cert), isFalse);
    });

    test('uses secure comparison', () {
      // Timing attack resistance
      final start = DateTime.now();
      CertificatePinning.validateCertificate(loadTestCertificate('invalid_cert.pem'));
      final invalidTime = DateTime.now().difference(start);

      final start2 = DateTime.now();
      CertificatePinning.validateCertificate(loadTestCertificate('valid_cert.pem'));
      final validTime = DateTime.now().difference(start2);

      // Times should be similar (within tolerance)
      expect((invalidTime - validTime).abs().inMicroseconds, lessThan(1000));
    });
  });
}
```

### Integration Tests

```bash
# Test with mitmproxy (should fail in release build)
mitmproxy --mode transparent

# Test that app rejects the proxy certificate
flutter run --release
# App should show connection error, not allow traffic through proxy
```

## Related Documentation

- [Encryption](../encryption) - Data encryption at rest
- [Token Handling](../token-handling) - Secure API token management
- [Threat Model](../threat-model) - MITM threat analysis
