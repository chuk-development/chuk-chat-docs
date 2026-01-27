---
title: File Endpoints
weight: 2
---

# File Conversion API

The file conversion endpoint transforms various document formats into Markdown text, enabling AI models to understand and process document content. This is essential for the Projects feature where users attach reference documents to conversations.

## Convert File Endpoint

```http
POST /v1/ai/convert-file
```

### Headers

```http
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

### Request

Send the file as a multipart form upload:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | binary | Yes | The file to convert |

### Response

```json
{
  "markdown": "# Document Title\n\nConverted content in Markdown format...\n\n## Section 1\n\nParagraph text..."
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Invalid file format or corrupted file |
| 413 | File too large (max 10 MB) |
| 415 | Unsupported file type |
| 500 | Conversion failed |

---

## Supported Formats

### Documents

| Format | Extensions | Notes |
|--------|------------|-------|
| PDF | `.pdf` | Text extraction with layout preservation |
| Word | `.docx`, `.doc` | Full formatting support |
| PowerPoint | `.pptx`, `.ppt` | Slide-by-slide extraction |
| Excel | `.xlsx`, `.xls` | Table-to-Markdown conversion |

### Images

| Format | Extensions | Notes |
|--------|------------|-------|
| JPEG | `.jpg`, `.jpeg` | OCR text extraction |
| PNG | `.png` | OCR text extraction |
| GIF | `.gif` | First frame OCR |
| BMP | `.bmp` | OCR text extraction |
| WebP | `.webp` | OCR text extraction |
| TIFF | `.tiff`, `.tif` | Multi-page OCR support |

### Audio

| Format | Extensions | Notes |
|--------|------------|-------|
| MP3 | `.mp3` | Transcription via Whisper |
| WAV | `.wav` | Transcription via Whisper |
| M4A | `.m4a` | Transcription via Whisper |
| FLAC | `.flac` | Transcription via Whisper |
| OGG | `.ogg` | Transcription via Whisper |

### Other Formats

| Format | Extensions | Notes |
|--------|------------|-------|
| Archives | `.zip` | Extracts and converts contained files |
| E-Books | `.epub` | Chapter-by-chapter extraction |
| Email | `.msg`, `.eml` | Headers and body extraction |

---

## Usage Examples

### Basic File Upload

```dart
import 'package:dio/dio.dart';

Future<String> convertFile(File file) async {
  final dio = Dio();

  final formData = FormData.fromMap({
    'file': await MultipartFile.fromFile(
      file.path,
      filename: file.path.split('/').last,
    ),
  });

  final response = await dio.post(
    'https://api.chuk.chat/v1/ai/convert-file',
    data: formData,
    options: Options(
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
    ),
  );

  return response.data['markdown'] as String;
}
```

### With Progress Tracking

```dart
Future<String> convertFileWithProgress(
  File file,
  void Function(double) onProgress,
) async {
  final dio = Dio();

  final formData = FormData.fromMap({
    'file': await MultipartFile.fromFile(
      file.path,
      filename: file.path.split('/').last,
    ),
  });

  final response = await dio.post(
    'https://api.chuk.chat/v1/ai/convert-file',
    data: formData,
    options: Options(
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
    ),
    onSendProgress: (sent, total) {
      onProgress(sent / total);
    },
  );

  return response.data['markdown'] as String;
}
```

### Batch File Processing

```dart
Future<List<String>> convertFiles(List<File> files) async {
  final results = <String>[];

  for (final file in files) {
    try {
      final markdown = await convertFile(file);
      results.add(markdown);
    } catch (e) {
      // Log error but continue with other files
      print('Failed to convert ${file.path}: $e');
      results.add('[Conversion failed: ${file.path.split('/').last}]');
    }
  }

  return results;
}
```

---

## File Validation

### Client-Side Validation

```dart
class FileValidator {
  static const maxFileSize = 10 * 1024 * 1024; // 10 MB

  static const supportedExtensions = {
    // Documents
    'pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls',
    // Images
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif',
    // Audio
    'mp3', 'wav', 'm4a', 'flac', 'ogg',
    // Other
    'zip', 'epub', 'msg', 'eml',
  };

  static ValidationResult validate(File file) {
    final extension = file.path.split('.').last.toLowerCase();
    final size = file.lengthSync();

    if (!supportedExtensions.contains(extension)) {
      return ValidationResult.error(
        'Unsupported file type: .$extension',
      );
    }

    if (size > maxFileSize) {
      final sizeMB = (size / 1024 / 1024).toStringAsFixed(1);
      return ValidationResult.error(
        'File too large: ${sizeMB}MB (max 10MB)',
      );
    }

    return ValidationResult.success();
  }
}

class ValidationResult {
  final bool isValid;
  final String? errorMessage;

  ValidationResult.success()
      : isValid = true,
        errorMessage = null;

  ValidationResult.error(this.errorMessage) : isValid = false;
}
```

### MIME Type Detection

```dart
import 'package:mime/mime.dart';

String? detectMimeType(File file) {
  // Try by extension first
  final mimeType = lookupMimeType(file.path);
  if (mimeType != null) return mimeType;

  // Fall back to magic bytes
  final bytes = file.readAsBytesSync().take(12).toList();
  return lookupMimeType('', headerBytes: bytes);
}

bool isConvertibleFile(File file) {
  final mimeType = detectMimeType(file);
  if (mimeType == null) return false;

  return mimeType.startsWith('application/pdf') ||
         mimeType.startsWith('application/vnd.openxmlformats') ||
         mimeType.startsWith('application/msword') ||
         mimeType.startsWith('image/') ||
         mimeType.startsWith('audio/') ||
         mimeType == 'application/zip' ||
         mimeType == 'application/epub+zip';
}
```

---

## Integration with Projects

The file conversion API is primarily used with the Projects feature to provide document context to AI conversations.

### Project File Upload Flow

```dart
class ProjectFileService {
  final Dio _dio;
  final SupabaseClient _supabase;

  Future<ProjectFile> uploadAndConvert(
    String projectId,
    File file,
  ) async {
    // 1. Upload to Supabase Storage
    final storagePath = 'projects/$projectId/${file.path.split('/').last}';
    await _supabase.storage
        .from('project-files')
        .upload(storagePath, file);

    // 2. Convert to Markdown
    final markdown = await _convertFile(file);

    // 3. Create ProjectFile record
    final projectFile = ProjectFile(
      id: const Uuid().v4(),
      name: file.path.split('/').last,
      storagePath: storagePath,
      markdownSummary: markdown,
      sizeBytes: file.lengthSync(),
      mimeType: detectMimeType(file),
      uploadedAt: DateTime.now(),
    );

    // 4. Save to database
    await _supabase
        .from('project_files')
        .insert(projectFile.toJson());

    return projectFile;
  }

  Future<String> _convertFile(File file) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(file.path),
    });

    final response = await _dio.post(
      '/v1/ai/convert-file',
      data: formData,
    );

    return response.data['markdown'] as String;
  }
}
```

### Context Injection

```dart
// Build system prompt with project file context
String buildContextualPrompt(Project project) {
  final buffer = StringBuffer();

  if (project.systemPrompt != null) {
    buffer.writeln(project.systemPrompt);
    buffer.writeln();
  }

  if (project.files.isNotEmpty) {
    buffer.writeln('## Reference Documents');
    buffer.writeln();

    for (final file in project.files) {
      if (file.markdownSummary != null) {
        buffer.writeln('### ${file.name}');
        buffer.writeln(file.markdownSummary);
        buffer.writeln();
      }
    }
  }

  return buffer.toString();
}
```

---

## Best Practices

{{< callout type="warning" >}}
**Maximum file size: 10 MB**

Files larger than 10 MB will be rejected. Consider compressing or splitting large documents before upload.
{{< /callout >}}

### Performance Optimization

1. **Validate before upload**: Check file type and size on the client before sending to avoid wasted bandwidth
2. **Show progress**: Use upload progress callbacks to provide user feedback
3. **Cache results**: Store converted Markdown to avoid re-conversion of unchanged files
4. **Batch wisely**: Convert files in parallel but limit concurrency to avoid overwhelming the server

### Error Handling

```dart
Future<String?> safeConvertFile(File file) async {
  try {
    final validation = FileValidator.validate(file);
    if (!validation.isValid) {
      throw ConversionException(validation.errorMessage!);
    }

    return await convertFile(file);
  } on DioException catch (e) {
    if (e.response?.statusCode == 413) {
      throw ConversionException('File too large for conversion');
    }
    if (e.response?.statusCode == 415) {
      throw ConversionException('Unsupported file format');
    }
    throw ConversionException('Conversion failed: ${e.message}');
  }
}

class ConversionException implements Exception {
  final String message;
  ConversionException(this.message);
}
```
