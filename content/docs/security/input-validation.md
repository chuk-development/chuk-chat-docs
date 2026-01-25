---
title: Input Validation
weight: 3
---

# Input Validation

Comprehensive input validation is a critical defense layer that protects against injection attacks, malicious uploads, and data integrity issues. chuk_chat validates all user input at multiple levels.

## Validation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Input Sources                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Forms    │  │ Files    │  │ API      │  │ Deep     │    │
│  │          │  │          │  │ Params   │  │ Links    │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
┌───────────────────────────────────────────────────────────┐
│                   Validation Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Type        │  │ Format      │  │ Business    │        │
│  │ Validation  │  │ Validation  │  │ Rules       │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│                   Sanitized Input                          │
└───────────────────────────────────────────────────────────┘
```

## Password Validation

Strong password requirements protect user accounts from brute-force attacks:

```dart
// lib/utils/input_validator.dart
class InputValidator {
  static const minPasswordLength = 8;
  static const maxPasswordLength = 128;

  /// Validates password strength
  static ValidationResult validatePassword(String password) {
    final errors = <String>[];

    // Length checks
    if (password.length < minPasswordLength) {
      errors.add('Minimum $minPasswordLength characters required');
    }
    if (password.length > maxPasswordLength) {
      errors.add('Maximum $maxPasswordLength characters allowed');
    }

    // Complexity requirements
    if (!RegExp(r'[A-Z]').hasMatch(password)) {
      errors.add('At least one uppercase letter required');
    }
    if (!RegExp(r'[a-z]').hasMatch(password)) {
      errors.add('At least one lowercase letter required');
    }
    if (!RegExp(r'[0-9]').hasMatch(password)) {
      errors.add('At least one digit required');
    }
    if (!RegExp(r'[!@#$%^&*(),.?":{}|<>]').hasMatch(password)) {
      errors.add('At least one special character required');
    }

    // Common password check
    if (_isCommonPassword(password)) {
      errors.add('This password is too common');
    }

    // Sequential character check
    if (_hasSequentialChars(password)) {
      errors.add('Avoid sequential characters (abc, 123)');
    }

    return ValidationResult(
      isValid: errors.isEmpty,
      errors: errors,
      strength: _calculateStrength(password),
    );
  }

  static bool _isCommonPassword(String password) {
    const commonPasswords = [
      'password', 'password1', '12345678', 'qwerty',
      'admin', 'letmein', 'welcome', 'monkey',
      // Extended list in actual implementation
    ];
    return commonPasswords.contains(password.toLowerCase());
  }

  static bool _hasSequentialChars(String password) {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
      '01234567890',
    ];
    final lower = password.toLowerCase();
    for (final seq in sequences) {
      for (var i = 0; i <= seq.length - 3; i++) {
        if (lower.contains(seq.substring(i, i + 3))) {
          return true;
        }
      }
    }
    return false;
  }

  static PasswordStrength _calculateStrength(String password) {
    var score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (RegExp(r'[A-Z]').hasMatch(password)) score++;
    if (RegExp(r'[a-z]').hasMatch(password)) score++;
    if (RegExp(r'[0-9]').hasMatch(password)) score++;
    if (RegExp(r'[!@#$%^&*(),.?":{}|<>]').hasMatch(password)) score++;

    if (score <= 2) return PasswordStrength.weak;
    if (score <= 4) return PasswordStrength.fair;
    if (score <= 6) return PasswordStrength.good;
    return PasswordStrength.strong;
  }
}

enum PasswordStrength { weak, fair, good, strong }

class ValidationResult {
  final bool isValid;
  final List<String> errors;
  final PasswordStrength? strength;

  ValidationResult({
    required this.isValid,
    this.errors = const [],
    this.strength,
  });
}
```

## Email Validation

```dart
class InputValidator {
  /// Validates email format
  static bool isValidEmail(String email) {
    if (email.isEmpty || email.length > 254) return false;

    // RFC 5322 compliant regex
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9.!#$%&*+/=?^_`{|}~-]+@'
      r'[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?'
      r'(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$',
    );

    if (!emailRegex.hasMatch(email)) return false;

    // Additional checks
    final parts = email.split('@');
    if (parts.length != 2) return false;

    final local = parts[0];
    final domain = parts[1];

    // Local part checks
    if (local.isEmpty || local.length > 64) return false;
    if (local.startsWith('.') || local.endsWith('.')) return false;
    if (local.contains('..')) return false;

    // Domain checks
    if (domain.isEmpty || domain.length > 253) return false;
    if (!domain.contains('.')) return false;

    return true;
  }

  /// Normalizes email for comparison
  static String normalizeEmail(String email) {
    final lower = email.toLowerCase().trim();
    final parts = lower.split('@');

    if (parts.length != 2) return lower;

    var local = parts[0];
    final domain = parts[1];

    // Gmail-specific: remove dots and plus addressing
    if (domain == 'gmail.com' || domain == 'googlemail.com') {
      local = local.split('+').first.replaceAll('.', '');
    }

    return '$local@$domain';
  }
}
```

## File Upload Validation

File validation uses magic bytes (file signatures) rather than extensions to prevent spoofing:

```dart
// lib/utils/file_upload_validator.dart
class FileUploadValidator {
  static const maxFileSize = 10 * 1024 * 1024;  // 10 MB
  static const maxFilenameLength = 255;

  /// Allowed MIME types with their magic bytes
  static const _allowedTypes = {
    // Documents
    'application/pdf': [0x25, 0x50, 0x44, 0x46],  // %PDF
    'text/plain': null,  // No specific magic bytes
    'text/markdown': null,

    // Images
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],  // .PNG
    'image/gif': [0x47, 0x49, 0x46],  // GIF
    'image/webp': [0x52, 0x49, 0x46, 0x46],  // RIFF

    // Audio
    'audio/mpeg': [0xFF, 0xFB],  // MP3
    'audio/wav': [0x52, 0x49, 0x46, 0x46],  // RIFF
    'audio/m4a': [0x00, 0x00, 0x00],  // ftyp marker follows

    // Office documents (OOXML)
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        [0x50, 0x4B, 0x03, 0x04],  // PK (ZIP)
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        [0x50, 0x4B, 0x03, 0x04],  // PK (ZIP)
  };

  /// Validates a file for upload
  static Future<ValidationResult> validate(File file) async {
    final errors = <String>[];

    // Filename validation
    final filename = path.basename(file.path);
    if (filename.length > maxFilenameLength) {
      errors.add('Filename too long (max $maxFilenameLength characters)');
    }
    if (_hasPathTraversal(filename)) {
      errors.add('Invalid filename');
    }

    // Size validation
    final size = await file.length();
    if (size == 0) {
      errors.add('File is empty');
    }
    if (size > maxFileSize) {
      errors.add('File exceeds ${maxFileSize ~/ (1024 * 1024)} MB limit');
    }

    // MIME type validation (magic bytes)
    final mimeType = await _detectMimeType(file);
    if (mimeType == null) {
      errors.add('Unable to determine file type');
    } else if (!_allowedTypes.containsKey(mimeType)) {
      errors.add('File type not allowed: $mimeType');
    }

    // Archive-specific checks
    if (mimeType == 'application/zip' ||
        mimeType?.startsWith('application/vnd.openxmlformats') == true) {
      final archiveResult = await _validateArchive(file);
      errors.addAll(archiveResult.errors);
    }

    return ValidationResult(
      isValid: errors.isEmpty,
      errors: errors,
    );
  }

  static bool _hasPathTraversal(String filename) {
    return filename.contains('..') ||
           filename.contains('/') ||
           filename.contains('\\') ||
           filename.contains('\x00');
  }

  static Future<String?> _detectMimeType(File file) async {
    final bytes = await file.openRead(0, 16).first;

    for (final entry in _allowedTypes.entries) {
      final signature = entry.value;
      if (signature == null) continue;

      if (bytes.length >= signature.length) {
        var match = true;
        for (var i = 0; i < signature.length; i++) {
          if (bytes[i] != signature[i]) {
            match = false;
            break;
          }
        }
        if (match) return entry.key;
      }
    }

    // Fallback to extension-based detection for text files
    final ext = path.extension(file.path).toLowerCase();
    if (ext == '.txt') return 'text/plain';
    if (ext == '.md') return 'text/markdown';

    return null;
  }
}
```

## Zip Bomb Detection

Protects against decompression bombs that could exhaust system resources:

```dart
class FileUploadValidator {
  static const _maxCompressionRatio = 100;  // 100:1 ratio
  static const _maxUncompressedSize = 100 * 1024 * 1024;  // 100 MB
  static const _maxEntryCount = 10000;

  /// Validates archive files for security threats
  static Future<ValidationResult> _validateArchive(File file) async {
    final errors = <String>[];

    try {
      final archive = ZipDecoder().decodeBuffer(
        InputFileStream(file.path),
      );

      // Entry count check
      if (archive.files.length > _maxEntryCount) {
        errors.add('Archive contains too many entries');
        return ValidationResult(isValid: false, errors: errors);
      }

      var totalUncompressedSize = 0;
      final compressedSize = await file.length();

      for (final entry in archive.files) {
        // Check for path traversal in archive entries
        if (_hasPathTraversal(entry.name)) {
          errors.add('Archive contains invalid path: ${entry.name}');
          continue;
        }

        // Check for symbolic links
        if (entry.isSymbolicLink) {
          errors.add('Archive contains symbolic links');
          continue;
        }

        totalUncompressedSize += entry.size;

        // Progressive ratio check
        if (totalUncompressedSize / compressedSize > _maxCompressionRatio) {
          errors.add('Suspicious compression ratio detected');
          break;
        }
      }

      // Total size check
      if (totalUncompressedSize > _maxUncompressedSize) {
        errors.add('Uncompressed size exceeds limit');
      }

    } on ArchiveException catch (e) {
      errors.add('Invalid archive format: ${e.message}');
    }

    return ValidationResult(isValid: errors.isEmpty, errors: errors);
  }

  /// Quick zip bomb detection without full extraction
  static Future<bool> isZipBomb(File file) async {
    try {
      final compressedSize = await file.length();
      final archive = ZipDecoder().decodeBuffer(
        InputFileStream(file.path),
      );

      var totalUncompressed = 0;
      for (final entry in archive.files) {
        totalUncompressed += entry.size;

        // Early exit if ratio exceeded
        if (totalUncompressed / compressedSize > _maxCompressionRatio) {
          return true;
        }
      }

      return false;
    } catch (e) {
      // Treat parsing errors as suspicious
      return true;
    }
  }
}
```

## Text Input Sanitization

```dart
class InputSanitizer {
  /// Sanitizes text input to prevent injection attacks
  static String sanitizeText(String input, {
    int maxLength = 10000,
    bool allowNewlines = true,
    bool stripHtml = true,
  }) {
    var sanitized = input;

    // Trim and limit length
    sanitized = sanitized.trim();
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    // Remove null bytes
    sanitized = sanitized.replaceAll('\x00', '');

    // Normalize unicode
    sanitized = _normalizeUnicode(sanitized);

    // Optionally strip HTML
    if (stripHtml) {
      sanitized = _stripHtmlTags(sanitized);
    }

    // Optionally remove newlines
    if (!allowNewlines) {
      sanitized = sanitized.replaceAll(RegExp(r'[\r\n]+'), ' ');
    }

    return sanitized;
  }

  static String _normalizeUnicode(String input) {
    // Remove zero-width characters (potential for homograph attacks)
    return input.replaceAll(RegExp(r'[\u200B-\u200D\uFEFF]'), '');
  }

  static String _stripHtmlTags(String input) {
    return input.replaceAll(RegExp(r'<[^>]*>'), '');
  }

  /// Sanitizes for use in SQL LIKE patterns
  static String sanitizeForLike(String input) {
    return input
        .replaceAll('%', r'\%')
        .replaceAll('_', r'\_')
        .replaceAll('[', r'\[');
  }
}
```

## URL Validation

```dart
class InputValidator {
  static const _allowedSchemes = ['http', 'https'];
  static const _blockedHosts = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
  ];

  /// Validates and sanitizes URLs
  static ValidationResult validateUrl(String url) {
    final errors = <String>[];

    try {
      final uri = Uri.parse(url);

      // Scheme validation
      if (!_allowedSchemes.contains(uri.scheme.toLowerCase())) {
        errors.add('Only HTTP and HTTPS URLs are allowed');
      }

      // Host validation
      if (uri.host.isEmpty) {
        errors.add('URL must have a valid host');
      }

      // Block internal addresses
      if (_blockedHosts.contains(uri.host.toLowerCase())) {
        errors.add('Internal URLs are not allowed');
      }

      // Check for IP address ranges (SSRF prevention)
      if (_isPrivateIp(uri.host)) {
        errors.add('Private IP addresses are not allowed');
      }

      // Port validation
      if (uri.port != 0 && uri.port != 80 && uri.port != 443) {
        errors.add('Non-standard ports are not allowed');
      }

    } on FormatException {
      errors.add('Invalid URL format');
    }

    return ValidationResult(isValid: errors.isEmpty, errors: errors);
  }

  static bool _isPrivateIp(String host) {
    try {
      final ip = InternetAddress(host);
      if (ip.type == InternetAddressType.IPv4) {
        final parts = host.split('.').map(int.parse).toList();
        // 10.x.x.x
        if (parts[0] == 10) return true;
        // 172.16.x.x - 172.31.x.x
        if (parts[0] == 172 && parts[1] >= 16 && parts[1] <= 31) return true;
        // 192.168.x.x
        if (parts[0] == 192 && parts[1] == 168) return true;
      }
      return false;
    } catch (e) {
      return false;  // Not an IP address
    }
  }
}
```

## Form Validation Widget

Integration with Flutter forms:

```dart
// lib/widgets/validated_text_field.dart
class ValidatedTextField extends StatelessWidget {
  final String label;
  final ValidationType type;
  final TextEditingController controller;
  final void Function(String)? onChanged;

  const ValidatedTextField({
    required this.label,
    required this.type,
    required this.controller,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(labelText: label),
      obscureText: type == ValidationType.password,
      validator: (value) => _validate(value ?? ''),
      onChanged: onChanged,
      autovalidateMode: AutovalidateMode.onUserInteraction,
    );
  }

  String? _validate(String value) {
    switch (type) {
      case ValidationType.email:
        return InputValidator.isValidEmail(value)
            ? null
            : 'Enter a valid email address';
      case ValidationType.password:
        final result = InputValidator.validatePassword(value);
        return result.isValid ? null : result.errors.first;
      case ValidationType.url:
        final result = InputValidator.validateUrl(value);
        return result.isValid ? null : result.errors.first;
      case ValidationType.text:
        return value.isEmpty ? 'This field is required' : null;
    }
  }
}

enum ValidationType { email, password, url, text }
```

{{< callout type="info" >}}
All validation errors are displayed to users in a friendly format. Technical details are logged for debugging but never exposed to users.
{{< /callout >}}

## Related Documentation

- [Rate Limiting](../rate-limiting) - Request throttling
- [Token Handling](../token-handling) - Input sanitization for tokens
- [Security Checklist](../security-checklist) - Validation requirements
