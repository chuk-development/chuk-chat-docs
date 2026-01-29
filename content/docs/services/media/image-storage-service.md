---
title: ImageStorageService
weight: 1
---

`ImageStorageService` manages encrypted image upload, download, caching, and deletion in Supabase Storage.

## Definition

```dart
// lib/services/image_storage_service.dart

class ImageStorageService {
  const ImageStorageService._();

  static const String bucketName = 'images';

  /// Stream of deleted image paths for reactive UI updates
  static Stream<String> get onImageDeleted;

  /// In-memory cache for decrypted images
  static final Map<String, Uint8List> _imageCache = {};
}
```

## Helper Models

### StoredImage

```dart
class StoredImage {
  final String path;
  final String name;
  final DateTime? createdAt;
  final int? size;
}
```

### ChatUsingImage

```dart
class ChatUsingImage {
  final String chatId;
  final String chatName;
}
```

## Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `uploadEncryptedImage(Uint8List imageBytes)` | `Future<String>` | Compresses, encrypts, and uploads an image; returns the storage path |
| `downloadAndDecryptImage(String storagePath, {bool bypassCache})` | `Future<Uint8List>` | Downloads and decrypts an image, using in-memory cache by default |
| `deleteEncryptedImage(String storagePath)` | `Future<void>` | Deletes an image from storage, clears cache, and notifies listeners |
| `getImageSize(String storagePath)` | `Future<int>` | Returns the byte size of a stored image |
| `listUserImages()` | `Future<List<StoredImage>>` | Lists all `.enc` images for the current user |
| `findChatsUsingImage(String storagePath)` | `Future<List<ChatUsingImage>>` | Finds all chats referencing a given image path |
| `imageExists(String storagePath)` | `Future<bool>` | Checks if an image exists in storage |
| `clearFromCache(String storagePath)` | `void` | Removes a specific image from the in-memory cache |
| `clearCache()` | `void` | Clears the entire in-memory image cache |
| `getCached(String storagePath)` | `Uint8List?` | Returns a cached image if available, or null |

## Upload Pipeline

The `uploadEncryptedImage` method follows these steps:

1. Verify the user is authenticated and an encryption key is available
2. Compress the image via `ImageCompressionService.compressImage()` (JPEG, max 1920x1920, ~2 MB target)
3. Encrypt the compressed bytes with `EncryptionService.encryptBytes()` (AES-256-GCM)
4. Generate a UUID filename with `.enc` extension
5. Upload to Supabase Storage at `images/{userId}/{uuid}.enc` with `application/octet-stream` content type

## Usage Examples

### Uploading an Image

```dart
final storagePath = await ImageStorageService.uploadEncryptedImage(rawImageBytes);
// storagePath example: "abc123-user-id/e4f5a6b7-...-.enc"
```

### Downloading with Cache

```dart
// Uses cache automatically
final bytes = await ImageStorageService.downloadAndDecryptImage(storagePath);

// Force re-download (bypass cache)
final fresh = await ImageStorageService.downloadAndDecryptImage(
  storagePath,
  bypassCache: true,
);
```

### Listening for Deletions

```dart
ImageStorageService.onImageDeleted.listen((deletedPath) {
  // Update UI to remove references to the deleted image
  setState(() => images.removeWhere((img) => img.path == deletedPath));
});
```

### Finding Chats That Use an Image

```dart
final chats = await ImageStorageService.findChatsUsingImage(storagePath);
for (final chat in chats) {
  print('${chat.chatName} (${chat.chatId})');
}
```
