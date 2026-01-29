---
title: Encrypted Chats Table
weight: 2
---

# encrypted_chats

The `encrypted_chats` table stores encrypted chat conversations. All message content is encrypted client-side using AES-256-GCM before being stored in the database.

## Schema

```sql
CREATE TABLE encrypted_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  encrypted_data TEXT NOT NULL,  -- AES-256-GCM encrypted JSON
  title TEXT,                     -- Generated chat title
  custom_name TEXT,               -- User-defined title override
  is_starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | gen_random_uuid() | Unique chat identifier |
| `user_id` | UUID | No | - | Owner's user ID |
| `encrypted_data` | TEXT | No | - | AES-256-GCM encrypted message JSON |
| `title` | TEXT | Yes | NULL | Auto-generated chat title |
| `custom_name` | TEXT | Yes | NULL | User-defined title override |
| `is_starred` | BOOLEAN | No | FALSE | Whether chat is starred/pinned |
| `created_at` | TIMESTAMPTZ | No | NOW() | Chat creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | NOW() | Last modification timestamp |

## Indexes

```sql
-- Primary index for user queries
CREATE INDEX idx_encrypted_chats_user_id ON encrypted_chats(user_id);

-- Index for sorting by update time
CREATE INDEX idx_encrypted_chats_updated_at ON encrypted_chats(updated_at);

-- Composite index for efficient sync queries
CREATE INDEX idx_encrypted_chats_user_updated ON encrypted_chats(user_id, updated_at);

-- Partial index for starred chats (optional optimization)
CREATE INDEX idx_encrypted_chats_starred
ON encrypted_chats(user_id)
WHERE is_starred = TRUE;
```

## Row Level Security

Full CRUD policies ensure complete data isolation.

### Select Policy

```sql
CREATE POLICY "Users can view own chats"
ON encrypted_chats FOR SELECT
USING (auth.uid() = user_id);
```

### Insert Policy

```sql
CREATE POLICY "Users can insert own chats"
ON encrypted_chats FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Update Policy

```sql
CREATE POLICY "Users can update own chats"
ON encrypted_chats FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Delete Policy

```sql
CREATE POLICY "Users can delete own chats"
ON encrypted_chats FOR DELETE
USING (auth.uid() = user_id);
```

## Encrypted Data Structure

The `encrypted_data` column contains a JSON object with the encrypted payload:

```json
{
  "v": "1.0",
  "nonce": "base64-12-bytes",
  "ciphertext": "base64-encrypted-messages-json",
  "mac": "base64-gcm-tag"
}
```

| Field | Description |
|-------|-------------|
| `v` | Encryption format version |
| `nonce` | 12-byte random initialization vector (base64) |
| `ciphertext` | Encrypted message array (base64) |
| `mac` | GCM authentication tag (base64) |

### Decrypted Message Format

When decrypted, the ciphertext contains an array of message objects:

```json
[
  {
    "id": "uuid",
    "role": "user",
    "content": "Hello, how are you?",
    "timestamp": "2024-01-15T10:30:00Z",
    "model": null
  },
  {
    "id": "uuid",
    "role": "assistant",
    "content": "I'm doing well, thank you!",
    "timestamp": "2024-01-15T10:30:05Z",
    "model": "deepseek/deepseek-chat"
  }
]
```

{{< callout type="info" >}}
The server never sees plaintext chat content. Encryption and decryption happen entirely on the client device.
{{< /callout >}}

## Usage Examples

### Create New Chat

```dart
final chatId = const Uuid().v4();
final encryptedData = await EncryptionService.encrypt(
  jsonEncode(messages),
  userKey,
);

await supabase.from('encrypted_chats').insert({
  'id': chatId,
  'user_id': supabase.auth.currentUser!.id,
  'encrypted_data': jsonEncode(encryptedData),
  'title': generateTitle(messages.first.content),
});
```

### Fetch Chat List (Sidebar)

```dart
// Fetch metadata only - skip encrypted_data for performance
final chats = await supabase
    .from('encrypted_chats')
    .select('id, title, custom_name, updated_at, is_starred')
    .eq('user_id', supabase.auth.currentUser!.id)
    .order('updated_at', ascending: false)
    .limit(50);
```

### Load Full Chat

```dart
final chat = await supabase
    .from('encrypted_chats')
    .select()
    .eq('id', chatId)
    .single();

final decryptedMessages = await EncryptionService.decrypt(
  jsonDecode(chat['encrypted_data']),
  userKey,
);
```

### Star/Unstar Chat

```dart
await supabase
    .from('encrypted_chats')
    .update({'is_starred': true})
    .eq('id', chatId);
```

### Delete Chat

```dart
await supabase
    .from('encrypted_chats')
    .delete()
    .eq('id', chatId);
```

### Sync Metadata Query

```dart
// Efficient query for sync - only IDs and timestamps
final metadata = await supabase
    .from('encrypted_chats')
    .select('id, updated_at')
    .eq('user_id', supabase.auth.currentUser!.id);
```

## Performance Considerations

### Query Optimization

Always use projections to avoid fetching `encrypted_data` when not needed:

```sql
-- Good: Only fetch what's needed for the sidebar
SELECT id, title, custom_name, updated_at, is_starred
FROM encrypted_chats
WHERE user_id = auth.uid()
ORDER BY updated_at DESC
LIMIT 50;

-- Avoid: Fetching encrypted_data for list views
SELECT *
FROM encrypted_chats
WHERE user_id = auth.uid();
```

### Pagination

For users with many chats, implement cursor-based pagination:

```dart
final chats = await supabase
    .from('encrypted_chats')
    .select('id, title, custom_name, updated_at, is_starred')
    .eq('user_id', supabase.auth.currentUser!.id)
    .lt('updated_at', lastChatUpdatedAt)
    .order('updated_at', ascending: false)
    .limit(50);
```

## Related

- [Sync Strategy](../sync-strategy) - How chats are synchronized across devices
- [Project Relations](project-relations) - Linking chats to projects
- [Security Documentation](/security) - Encryption implementation details
