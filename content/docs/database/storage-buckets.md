---
title: Storage Buckets
weight: 2
---

Supabase Storage buckets for file storage in Chuk Chat.

## Overview

Chuk Chat uses Supabase Storage for encrypted file storage:

| Bucket | Purpose | Access |
|--------|---------|--------|
| `chat-images` | Message attachments | Authenticated |
| `user-avatars` | Profile pictures | Public read |

## chat-images Bucket

Stores encrypted chat attachments.

### Configuration

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', false);

-- RLS Policy: Users can only access their own files
CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### File Structure

```
chat-images/
└── {user_id}/
    └── {chat_id}/
        └── {timestamp}_{filename}
```

### Upload Example

```dart
Future<String> uploadImage(File file, String chatId) async {
  final userId = supabase.auth.currentUser!.id;
  final timestamp = DateTime.now().millisecondsSinceEpoch;
  final filename = file.path.split('/').last;
  final path = '$userId/$chatId/${timestamp}_$filename';

  // Encrypt before upload
  final bytes = await file.readAsBytes();
  final encrypted = await encryptionService.encryptBytes(bytes);

  await supabase.storage
      .from('chat-images')
      .uploadBinary(path, encrypted);

  return path;
}
```

### Download Example

```dart
Future<Uint8List> downloadImage(String path) async {
  final encrypted = await supabase.storage
      .from('chat-images')
      .download(path);

  // Decrypt after download
  return await encryptionService.decryptBytes(encrypted);
}
```

## user-avatars Bucket

Stores public profile pictures.

### Configuration

```sql
-- Create bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true);

-- RLS Policy: Users can only modify their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### File Structure

```
user-avatars/
└── {user_id}/
    └── avatar.{png|jpg}
```

### Upload Example

```dart
Future<String> uploadAvatar(File file) async {
  final userId = supabase.auth.currentUser!.id;
  final extension = file.path.split('.').last;
  final path = '$userId/avatar.$extension';

  // Compress before upload
  final compressed = await imageCompression.compress(file);

  await supabase.storage
      .from('user-avatars')
      .uploadBinary(path, compressed, fileOptions: FileOptions(
        upsert: true, // Replace existing
      ));

  return supabase.storage
      .from('user-avatars')
      .getPublicUrl(path);
}
```

## Storage Limits

| Limit | Value |
|-------|-------|
| Max file size | 50 MB |
| Max bucket size | 1 GB per user |
| Allowed image types | PNG, JPG, WebP, GIF |
| Allowed document types | PDF, TXT, MD |

## Best Practices

1. **Always encrypt sensitive files** before upload
2. **Use folder structure** based on user ID
3. **Compress images** to reduce storage costs
4. **Clean up orphaned files** when chats are deleted
5. **Use signed URLs** for time-limited access
