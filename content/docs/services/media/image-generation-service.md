---
title: ImageGenerationService
weight: 2
---

`ImageGenerationService` generates images from text prompts via the Z-Image Turbo API and optionally encrypts them into Supabase Storage.

## Definition

```dart
// lib/services/image_generation_service.dart

class ImageGenerationService {
  const ImageGenerationService();

  static Future<ImageGenerationResult> generateImage({
    required String prompt,
    String? sizePreset,
    int? customWidth,
    int? customHeight,
    bool storeEncrypted = true,
  });
}
```

## Result Model

```dart
class ImageGenerationResult {
  final bool success;
  final String? imageUrl;        // Remote URL from API
  final String? encryptedPath;   // Supabase storage path for encrypted image
  final Uint8List? imageBytes;   // Image data for immediate display
  final int? width;
  final int? height;
  final int? seed;
  final double? costEur;
  final String? errorMessage;

  factory ImageGenerationResult.error(String message);
}
```

## Size Presets

`ImageSizePresets` provides predefined dimension configurations:

| Preset | Width | Height |
|--------|-------|--------|
| `square_hd` | 1024 | 1024 |
| `square` | 512 | 512 |
| `portrait_4_3` | 768 | 1024 |
| `portrait_16_9` | 576 | 1024 |
| `landscape_4_3` | 1024 | 768 |
| `landscape_16_9` | 1024 | 576 |

Cost is calculated at `$0.005 per megapixel`, rounded up to the nearest cent.

## Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `generateImage(...)` | `Future<ImageGenerationResult>` | Generates an image from a prompt, optionally storing it encrypted |
| `ImageSizePresets.getDimensions(String preset)` | `Map<String, int>` | Returns width/height for a named preset |
| `ImageSizePresets.calculateCostEur(int width, int height)` | `double` | Estimates generation cost in EUR |

## Generation Pipeline

1. Obtain the Supabase access token for authentication
2. Send a `POST` multipart request to `/v1/ai/generate-image` with prompt and size parameters
3. Parse the response for `image_url`, dimensions, seed, and billing info
4. If `storeEncrypted` is true (default), download the image bytes and delegate to `ImageStorageService.uploadEncryptedImage()`
5. Return an `ImageGenerationResult` with both the remote URL and the encrypted storage path

## Error Handling

| HTTP Status | Meaning |
|-------------|---------|
| `402` | Insufficient credits for generation |
| Other non-200 | Server-side generation failure |

Errors are returned as `ImageGenerationResult.error(message)` rather than thrown exceptions.

## Usage Examples

### Generate with a Preset Size

```dart
final result = await ImageGenerationService.generateImage(
  prompt: 'A sunset over mountain peaks, digital art',
  sizePreset: 'landscape_16_9',
);

if (result.success) {
  // Display immediately from bytes
  Image.memory(result.imageBytes!);

  // Reference encrypted path in chat message
  print('Stored at: ${result.encryptedPath}');
  print('Cost: EUR ${result.costEur}');
}
```

### Generate with Custom Dimensions

```dart
final result = await ImageGenerationService.generateImage(
  prompt: 'Abstract geometric pattern',
  customWidth: 800,
  customHeight: 600,
);
```

### Generate Without Storing

```dart
final result = await ImageGenerationService.generateImage(
  prompt: 'Quick preview image',
  storeEncrypted: false,
);
// result.encryptedPath will be null
// result.imageUrl contains the remote URL
```
