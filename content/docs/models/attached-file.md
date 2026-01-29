---
title: AttachedFile
weight: 6
---

Represents a file attached to a chat message, tracking upload state, content extraction, and encrypted image storage.

## Definition

```dart
class AttachedFile {
  final String id;                    // Unique ID for managing state
  final String fileName;
  final String? markdownContent;      // Null if still uploading or failed
  final bool isUploading;
  final String? localPath;            // Local file system path when available
  final int? fileSizeBytes;           // File size in bytes, used for UI display
  final String? encryptedImagePath;   // Storage path for encrypted images (e.g., "userId/fileId.enc")
  final bool isImage;                 // Whether this is an image file

  AttachedFile({
    required this.id,
    required this.fileName,
    this.markdownContent,
    this.isUploading = false,
    this.localPath,
    this.fileSizeBytes,
    this.encryptedImagePath,
    this.isImage = false,
  });
}
```

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `String` | Yes | Unique identifier for state management |
| `fileName` | `String` | Yes | Original file name including extension |
| `markdownContent` | `String?` | No | Extracted text content in Markdown format. `null` while uploading or on failure |
| `isUploading` | `bool` | No | Whether the file is currently being uploaded. Defaults to `false` |
| `localPath` | `String?` | No | Local file system path when the file is available on device |
| `fileSizeBytes` | `int?` | No | File size in bytes for UI display |
| `encryptedImagePath` | `String?` | No | Supabase storage path for encrypted images (e.g., `userId/fileId.enc`) |
| `isImage` | `bool` | No | Whether this file is an image stored in encrypted storage. Defaults to `false` |

## JSON Serialization

### toJson

```dart
Map<String, dynamic> toJson() {
  return {
    'id': id,
    'fileName': fileName,
    'markdownContent': markdownContent,
    'isUploading': isUploading,
    'localPath': localPath,
    'fileSizeBytes': fileSizeBytes,
    'encryptedImagePath': encryptedImagePath,
    'isImage': isImage,
  };
}
```

### fromJson

```dart
factory AttachedFile.fromJson(Map<String, dynamic> json) {
  return AttachedFile(
    id: json['id'] as String,
    fileName: json['fileName'] as String,
    markdownContent: json['markdownContent'] as String?,
    isUploading: json['isUploading'] as bool? ?? false,
    localPath: json['localPath'] as String?,
    fileSizeBytes: json['fileSizeBytes'] as int?,
    encryptedImagePath: json['encryptedImagePath'] as String?,
    isImage: json['isImage'] as bool? ?? false,
  );
}
```

**Example JSON:**

```json
{
  "id": "abc-123",
  "fileName": "report.pdf",
  "markdownContent": "# Report\nExtracted content...",
  "isUploading": false,
  "localPath": "/data/user/0/com.example.app/cache/report.pdf",
  "fileSizeBytes": 204800,
  "encryptedImagePath": null,
  "isImage": false
}
```

## copyWith

Creates a copy with selectively overridden fields. The `id` and `fileName` are immutable and always carried over from the original instance.

```dart
AttachedFile copyWith({
  String? markdownContent,
  bool? isUploading,
  String? localPath,
  int? fileSizeBytes,
  String? encryptedImagePath,
  bool? isImage,
})
```

**Example:**

```dart
final uploading = AttachedFile(
  id: 'abc-123',
  fileName: 'photo.jpg',
  isUploading: true,
  isImage: true,
);

// Mark upload complete with encrypted path
final uploaded = uploading.copyWith(
  isUploading: false,
  encryptedImagePath: 'user123/abc-123.enc',
);
```

## Usage Examples

```dart
// Create a text file attachment during upload
final file = AttachedFile(
  id: 'file-001',
  fileName: 'notes.md',
  isUploading: true,
  fileSizeBytes: 1024,
);

// Update after content extraction completes
final ready = file.copyWith(
  isUploading: false,
  markdownContent: '# My Notes\nContent here...',
);

// Create an encrypted image attachment
final image = AttachedFile(
  id: 'img-002',
  fileName: 'screenshot.png',
  isImage: true,
  encryptedImagePath: 'user123/img-002.enc',
  fileSizeBytes: 512000,
);

// Serialize for storage
final json = image.toJson();
final restored = AttachedFile.fromJson(json);
```

## Related

- [ModelItem](../model-item) -- AI model selection
- [ChatMessage](../chat-message) -- messages that contain attached files
