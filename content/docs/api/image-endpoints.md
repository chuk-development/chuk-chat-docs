---
title: Image Endpoints
weight: 3
---

# Image Generation API

The image generation API enables AI-powered image creation using Z-Image Turbo. Users can generate images from text prompts with various aspect ratio presets or custom dimensions.

## Generate Image Endpoint

```http
POST /v1/ai/generate-image
```

### Headers

```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Request Body

```json
{
  "prompt": "A serene mountain landscape at sunset with snow-capped peaks",
  "image_size": "landscape_16_9",
  "custom_width": null,
  "custom_height": null
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | Image description (max 1000 characters) |
| `image_size` | string | Yes | Size preset identifier |
| `custom_width` | integer | No | Custom width in pixels (64-2048) |
| `custom_height` | integer | No | Custom height in pixels (64-2048) |

### Size Presets

| Preset | Dimensions | Aspect Ratio | Best For |
|--------|------------|--------------|----------|
| `square_hd` | 1024x1024 | 1:1 | Profile pictures, icons |
| `square` | 512x512 | 1:1 | Thumbnails, quick generation |
| `portrait_4_3` | 768x1024 | 3:4 | Portrait photos |
| `portrait_16_9` | 576x1024 | 9:16 | Mobile wallpapers, stories |
| `landscape_4_3` | 1024x768 | 4:3 | Traditional photos |
| `landscape_16_9` | 1024x576 | 16:9 | Desktop wallpapers, banners |

### Custom Dimensions

When using custom dimensions, both `custom_width` and `custom_height` must be provided:

```json
{
  "prompt": "Abstract geometric art",
  "image_size": "custom",
  "custom_width": 1920,
  "custom_height": 1080
}
```

{{< callout type="info" >}}
Custom dimensions must be between 64 and 2048 pixels. Larger dimensions cost more credits.
{{< /callout >}}

### Response

```json
{
  "success": true,
  "image_url": "https://storage.example.com/generated/abc123.png",
  "width": 1024,
  "height": 576,
  "seed": 42857391,
  "billing": {
    "cost_eur": 0.05
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether generation succeeded |
| `image_url` | string | URL to the generated image |
| `width` | integer | Actual image width |
| `height` | integer | Actual image height |
| `seed` | integer | Random seed used (for reproducibility) |
| `billing.cost_eur` | number | Cost in EUR |

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_PROMPT` | Prompt is empty or exceeds length limit |
| 400 | `INVALID_DIMENSIONS` | Custom dimensions out of valid range |
| 402 | `INSUFFICIENT_CREDITS` | Not enough credits for generation |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `GENERATION_FAILED` | Image generation service error |

---

## Usage Examples

### Basic Generation

```dart
import 'package:dio/dio.dart';

Future<GeneratedImage> generateImage(String prompt, String size) async {
  final dio = Dio();

  final response = await dio.post(
    'https://api.chuk.chat/v1/ai/generate-image',
    data: {
      'prompt': prompt,
      'image_size': size,
    },
    options: Options(
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
    ),
  );

  return GeneratedImage.fromJson(response.data);
}

class GeneratedImage {
  final String imageUrl;
  final int width;
  final int height;
  final int seed;
  final double costEur;

  GeneratedImage({
    required this.imageUrl,
    required this.width,
    required this.height,
    required this.seed,
    required this.costEur,
  });

  factory GeneratedImage.fromJson(Map<String, dynamic> json) {
    return GeneratedImage(
      imageUrl: json['image_url'],
      width: json['width'],
      height: json['height'],
      seed: json['seed'],
      costEur: json['billing']['cost_eur'],
    );
  }
}
```

### With Custom Dimensions

```dart
Future<GeneratedImage> generateCustomImage(
  String prompt,
  int width,
  int height,
) async {
  // Validate dimensions
  if (width < 64 || width > 2048 || height < 64 || height > 2048) {
    throw ArgumentError('Dimensions must be between 64 and 2048 pixels');
  }

  final dio = Dio();

  final response = await dio.post(
    'https://api.chuk.chat/v1/ai/generate-image',
    data: {
      'prompt': prompt,
      'image_size': 'custom',
      'custom_width': width,
      'custom_height': height,
    },
    options: Options(
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
    ),
  );

  return GeneratedImage.fromJson(response.data);
}
```

### Download Generated Image

```dart
import 'dart:io';

Future<File> downloadImage(String imageUrl, String savePath) async {
  final dio = Dio();

  await dio.download(imageUrl, savePath);

  return File(savePath);
}

// Usage with gallery save
Future<void> saveToGallery(String imageUrl) async {
  final tempDir = await getTemporaryDirectory();
  final tempPath = '${tempDir.path}/generated_${DateTime.now().millisecondsSinceEpoch}.png';

  await downloadImage(imageUrl, tempPath);

  // Save to device gallery (requires image_gallery_saver package)
  await ImageGallerySaver.saveFile(tempPath);

  // Clean up temp file
  await File(tempPath).delete();
}
```

---

## Prompt Best Practices

### Effective Prompts

Good prompts are specific, descriptive, and include style guidance:

```
Good: "A cozy coffee shop interior with warm lighting, wooden tables,
       steaming cups, and bookshelves, in a watercolor painting style"

Bad: "coffee shop"
```

### Prompt Structure

1. **Subject**: Main focus of the image
2. **Setting**: Environment or background
3. **Style**: Artistic style or medium
4. **Details**: Lighting, mood, colors

### Example Prompts by Category

**Landscapes:**
```
"Misty forest at dawn with rays of sunlight filtering through
tall pine trees, a small stream in the foreground,
photorealistic style with soft colors"
```

**Portraits:**
```
"Portrait of an elderly man with kind eyes and a warm smile,
wearing a tweed jacket, soft studio lighting,
oil painting style reminiscent of Rembrandt"
```

**Abstract:**
```
"Geometric abstract composition with overlapping circles and
triangles in coral, teal, and gold colors,
modern minimalist design on white background"
```

**Sci-Fi:**
```
"Futuristic cityscape at night with flying vehicles,
neon lights reflecting on wet streets, towering skyscrapers,
cyberpunk aesthetic with purple and blue color palette"
```

---

## Credit System

Image generation uses a credit-based billing system.

### Credit Costs

| Size | Pixels | Cost (EUR) |
|------|--------|------------|
| 512x512 | 262,144 | 0.02 |
| 768x1024 | 786,432 | 0.04 |
| 1024x576 | 589,824 | 0.03 |
| 1024x768 | 786,432 | 0.04 |
| 1024x1024 | 1,048,576 | 0.05 |
| Custom | Variable | Based on pixel count |

### Checking Credits Before Generation

```dart
Future<bool> canGenerateImage(String size) async {
  final dio = Dio();

  // Get current credit balance
  final balanceResponse = await dio.get(
    'https://api.chuk.chat/v1/user/credits',
    options: Options(
      headers: {'Authorization': 'Bearer $accessToken'},
    ),
  );

  final balance = balanceResponse.data['credits_eur'] as double;

  // Estimate cost based on size
  final estimatedCost = _estimateCost(size);

  return balance >= estimatedCost;
}

double _estimateCost(String size) {
  switch (size) {
    case 'square':
      return 0.02;
    case 'square_hd':
      return 0.05;
    case 'portrait_4_3':
    case 'landscape_4_3':
      return 0.04;
    case 'portrait_16_9':
    case 'landscape_16_9':
      return 0.03;
    default:
      return 0.05; // Assume max for custom
  }
}
```

### Handling Insufficient Credits

```dart
Future<GeneratedImage?> safeGenerateImage(String prompt, String size) async {
  try {
    return await generateImage(prompt, size);
  } on DioException catch (e) {
    if (e.response?.statusCode == 402) {
      final error = e.response?.data['error'];
      final required = error?['details']?['required'] ?? 0.0;
      final available = error?['details']?['available'] ?? 0.0;

      throw InsufficientCreditsException(
        required: required,
        available: available,
      );
    }
    rethrow;
  }
}

class InsufficientCreditsException implements Exception {
  final double required;
  final double available;

  InsufficientCreditsException({
    required this.required,
    required this.available,
  });

  double get shortfall => required - available;

  @override
  String toString() =>
    'Insufficient credits: need $required EUR, have $available EUR';
}
```

---

## Image Service Integration

### Complete Image Generation Service

```dart
class ImageGenerationService {
  final Dio _dio;
  final String _baseUrl;

  ImageGenerationService({
    required String baseUrl,
    required String accessToken,
  })  : _baseUrl = baseUrl,
        _dio = Dio()
          ..options.headers['Authorization'] = 'Bearer $accessToken';

  Future<GeneratedImage> generate({
    required String prompt,
    required ImageSize size,
    int? customWidth,
    int? customHeight,
  }) async {
    // Validate prompt
    if (prompt.isEmpty) {
      throw ArgumentError('Prompt cannot be empty');
    }
    if (prompt.length > 1000) {
      throw ArgumentError('Prompt exceeds 1000 character limit');
    }

    // Build request
    final body = {
      'prompt': prompt,
      'image_size': size.apiValue,
      if (size == ImageSize.custom) ...{
        'custom_width': customWidth,
        'custom_height': customHeight,
      },
    };

    try {
      final response = await _dio.post(
        '$_baseUrl/v1/ai/generate-image',
        data: body,
      );

      return GeneratedImage.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(DioException e) {
    final statusCode = e.response?.statusCode;
    final errorData = e.response?.data?['error'];

    switch (statusCode) {
      case 400:
        return InvalidRequestException(
          errorData?['message'] ?? 'Invalid request',
        );
      case 402:
        return InsufficientCreditsException(
          required: errorData?['details']?['required'] ?? 0.0,
          available: errorData?['details']?['available'] ?? 0.0,
        );
      case 429:
        return RateLimitedException(
          retryAfter: Duration(
            seconds: int.tryParse(
              e.response?.headers.value('Retry-After') ?? '60',
            ) ?? 60,
          ),
        );
      default:
        return ImageGenerationException(
          'Generation failed: ${e.message}',
        );
    }
  }
}

enum ImageSize {
  square('square'),
  squareHd('square_hd'),
  portrait43('portrait_4_3'),
  portrait169('portrait_16_9'),
  landscape43('landscape_4_3'),
  landscape169('landscape_16_9'),
  custom('custom');

  final String apiValue;
  const ImageSize(this.apiValue);
}
```
