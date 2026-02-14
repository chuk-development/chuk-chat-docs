---
title: ImageCompressionService
weight: 3
---

`ImageCompressionService` compresses images to JPEG format in a background isolate, adaptively reducing quality and dimensions to reach a target file size. It also provides security validation including magic byte verification and decompression bomb detection.

## Definition

```dart
// lib/services/image_compression_service.dart

class ImageCompressionService {
  const ImageCompressionService._();

  static const int maxDimension = 1920;
  static const int targetFileSizeBytes = 2 * 1024 * 1024; // 2 MB
  static const int initialQuality = 85;
  static const int minQuality = 50;

  static Future<Uint8List> compressImage(Uint8List imageBytes);
  static String getFileSizeMB(Uint8List bytes);
  static bool isValidImage(Uint8List bytes);
}
```

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `maxDimension` | 1920 | Maximum width or height in pixels |
| `targetFileSizeBytes` | 2,097,152 (2 MB) | Target output size for optimal API performance |
| `initialQuality` | 85 | Starting JPEG quality level |
| `minQuality` | 50 | Lowest JPEG quality before dimension reduction |

## Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `compressImage(Uint8List imageBytes)` | `Future<Uint8List>` | Compresses an image to JPEG in a background isolate |
| `getFileSizeMB(Uint8List bytes)` | `String` | Returns file size as a formatted string in MB |
| `isValidImage(Uint8List bytes)` | `bool` | Validates magic bytes and checks for decompression bombs |

## Compression Algorithm

The compression runs in a separate Dart isolate via `compute()` to prevent UI blocking:

1. **Decode** the input bytes using the `image` package
2. **Resize** to fit within 1920x1920 while maintaining aspect ratio (linear interpolation)
3. **Encode to JPEG** starting at quality 85
4. If output exceeds 2 MB, reduce quality by 10 and retry (down to quality 50)
5. If still over 2 MB at minimum quality, reduce dimensions by 30% and reset quality to 85
6. Continue reducing dimensions until under 2 MB or reaching 640px minimum
7. **Final fallback**: 640px at quality 50 (always produces output, no hard size limit)

The algorithm guarantees an output is always returned -- it never rejects an image.

## Usage Examples

### Compressing Before Upload

```dart
final compressed = await ImageCompressionService.compressImage(rawBytes);
print('Compressed to ${ImageCompressionService.getFileSizeMB(compressed)} MB');

// Pass to storage service
final path = await ImageStorageService.uploadEncryptedImage(compressed);
```

> **Note:** `ImageStorageService.uploadEncryptedImage()` already calls `compressImage()` internally, so you do not need to compress manually before uploading.

## Security Validation

The service validates images before processing to prevent attacks:

### Magic Byte Verification

Checks the first bytes of the file against known image format signatures (JPEG `FF D8 FF`, PNG `89 50 4E 47`, GIF `47 49 46`, WebP `52 49 46 46`). Files that don't match any known image format are rejected before decoding.

### Decompression Bomb Detection

After decoding, the service checks whether the decoded pixel dimensions are disproportionately large relative to the compressed file size. This prevents attackers from uploading small files that expand to consume excessive memory when decoded (e.g., a 100 KB file that decodes to a 100,000 x 100,000 pixel image).

```dart
// Validate before compression
if (!ImageCompressionService.isValidImage(rawBytes)) {
  throw Exception('Invalid or potentially malicious image file');
}
final compressed = await ImageCompressionService.compressImage(rawBytes);
```
