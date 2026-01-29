---
title: FileConversionService
weight: 4
---

`FileConversionService` converts binary files (PDF, Office documents, audio, e-books, email) to markdown via the `/v1/ai/convert-file` API endpoint, with rate limiting, file validation, and certificate pinning.

## Definition

```dart
// lib/services/file_conversion_service.dart

class FileConversionService {
  static const int maxTokensPerFile = 40000;
  static const int maxCharsPerFile = 160000; // ~4 chars per token

  static Future<Map<String, dynamic>> convertFile({
    required String filePath,
    required String accessToken,
    String? userId,
  });

  static bool isExtensionSupported(String extension);
  static String getFileCategory(String extension);
}
```

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `maxTokensPerFile` | 40,000 | Maximum tokens allowed in converted output |
| `maxCharsPerFile` | 160,000 | Character limit (~4 chars per token) |

## Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `convertFile(...)` | `Future<Map<String, dynamic>>` | Converts a binary file to markdown; returns `{success, markdown, error}` |
| `isExtensionSupported(String extension)` | `bool` | Checks if a file extension is supported (delegates to `FileConstants`) |
| `getFileCategory(String extension)` | `String` | Returns the category: `audio`, `ebook`, `email`, `document`, `image`, `archive`, or `text` |

## Conversion Pipeline

1. **File existence check** -- verify the file exists on disk
2. **Upload rate limiting** -- `UploadRateLimiter` enforces per-user upload frequency
3. **API rate limiting** -- `ApiRateLimiter` with `RateLimitConfig.fileConversion` rules
4. **File validation** -- `FileUploadValidator.validateFile()` checks size, MIME type, and archive content
5. **Extension check** -- only extensions in `FileConstants.allowedExtensions` are accepted
6. **Token validation** -- `SecureTokenHandler.validateTokenForRequest()` ensures token integrity
7. **Secure upload** -- multipart POST via Dio with certificate pinning (`CertificatePinning.createSecureDio`)
8. **Output size check** -- reject if converted markdown exceeds 160,000 characters (~40k tokens)
9. **Return** `{success: true, markdown: "...", error: null}` on success

## Error Handling

| HTTP Status | Error Message |
|-------------|---------------|
| `401` | Authentication failed. Please sign in again. |
| `413` | File is too large (max 10 MB) |
| `415` | Unsupported file type |
| Timeout | Request timed out. The file may be too large. |

Rate limit violations return a user-friendly message with the minutes until reset. All errors are returned in the result map rather than thrown as exceptions.

## Timeout Configuration

| Setting | Value |
|---------|-------|
| Connect timeout | 30 seconds |
| Send timeout | 5 minutes |
| Receive timeout | 5 minutes |

## File Categories

The `getFileCategory` method classifies extensions:

| Category | Examples |
|----------|----------|
| `document` | PDF, DOCX, XLSX, PPTX |
| `audio` | MP3, WAV, M4A, OGG |
| `ebook` | EPUB |
| `email` | MSG, EML |
| `image` | PNG, JPG, WEBP |
| `archive` | ZIP |
| `text` | Code files, config files (handled directly, not via this service) |

## Usage Examples

### Converting a PDF

```dart
final result = await FileConversionService.convertFile(
  filePath: '/path/to/document.pdf',
  accessToken: session.accessToken,
  userId: user.id,
);

if (result['success'] == true) {
  final markdown = result['markdown'] as String;
  // Use markdown content in chat context
} else {
  print('Error: ${result['error']}');
}
```

### Checking Support

```dart
if (FileConversionService.isExtensionSupported('docx')) {
  final category = FileConversionService.getFileCategory('docx');
  print('Category: $category'); // "document"
}
```

> **Note:** Plain text files (source code, config files) are handled directly by `ChatApiService` and `ProjectStorageService` without using this conversion API. `FileConversionService` is only for binary file formats.
