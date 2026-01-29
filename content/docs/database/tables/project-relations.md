---
title: Project Relations Tables
weight: 6
---

Projects in Chuk Chat use two junction tables to link chats and files to project workspaces. Both tables cascade-delete when the parent project is removed.

## project_chats

Many-to-many relationship between projects and chats. A single chat can belong to multiple projects.

### Schema

```sql
CREATE TABLE project_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chat_id UUID NOT NULL REFERENCES encrypted_chats(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_project_chat UNIQUE(project_id, chat_id)
);
```

### Columns

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `UUID` | Auto-generated | Primary key |
| `project_id` | `UUID` | — | References `projects(id)`, cascades on delete |
| `chat_id` | `UUID` | — | References `encrypted_chats(id)`, cascades on delete |
| `added_at` | `TIMESTAMPTZ` | `NOW()` | When the chat was linked to the project |

### Indexes

```sql
CREATE INDEX idx_project_chats_project_id ON project_chats(project_id);
CREATE INDEX idx_project_chats_chat_id ON project_chats(chat_id);
```

### RLS Policies

| Policy | Operation | Rule |
|--------|-----------|------|
| View project chats | `SELECT` | User owns the parent project |
| Add chats to projects | `INSERT` | User owns both the project and the chat |
| Remove chats from projects | `DELETE` | User owns the parent project |

The `INSERT` policy enforces that users can only link their own chats to their own projects:

```sql
CREATE POLICY "Users can add chats to their own projects"
  ON project_chats FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_chats.project_id AND projects.user_id = auth.uid())
    AND
    EXISTS (SELECT 1 FROM encrypted_chats WHERE encrypted_chats.id = project_chats.chat_id AND encrypted_chats.user_id = auth.uid())
  );
```

### Application Usage

```dart
// Add chat to project
await SupabaseService.client.from('project_chats').insert({
  'project_id': projectId,
  'chat_id': chatId,
});

// Remove chat from project
await SupabaseService.client
    .from('project_chats')
    .delete()
    .eq('project_id', projectId)
    .eq('chat_id', chatId);

// Load all chats for multiple projects (batch)
final rows = await SupabaseService.client
    .from('project_chats')
    .select('project_id, chat_id')
    .inFilter('project_id', projectIds);
```

Duplicate inserts are silently ignored by catching the `unique_project_chat` constraint violation in `ProjectStorageService`.

---

## project_files

Stores metadata for encrypted file attachments uploaded to projects. The actual file content is stored encrypted in the `project-files` Supabase Storage bucket.

### Schema

```sql
CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  markdown_summary TEXT,

  CONSTRAINT file_name_not_empty CHECK (LENGTH(TRIM(file_name)) > 0),
  CONSTRAINT storage_path_not_empty CHECK (LENGTH(TRIM(storage_path)) > 0),
  CONSTRAINT file_size_positive CHECK (file_size > 0),
  CONSTRAINT file_size_limit CHECK (file_size <= 10485760)
);
```

### Columns

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `UUID` | Auto-generated | Primary key |
| `project_id` | `UUID` | — | References `projects(id)`, cascades on delete |
| `file_name` | `TEXT` | — | Original file name |
| `storage_path` | `TEXT` | — | Path in Supabase Storage (`{user_id}/{file_id}.enc`) |
| `file_type` | `TEXT` | — | File extension (e.g. `pdf`, `dart`, `txt`) |
| `file_size` | `BIGINT` | — | Original file size in bytes (max 10 MB) |
| `uploaded_at` | `TIMESTAMPTZ` | `NOW()` | Upload timestamp |
| `markdown_summary` | `TEXT` | `NULL` | AI-generated or plain-text markdown summary |

### Constraints

- File name and storage path must not be empty
- File size must be between 1 byte and 10 MB (10,485,760 bytes)

### RLS Policies

| Policy | Operation | Rule |
|--------|-----------|------|
| View files | `SELECT` | User owns the parent project |
| Upload files | `INSERT` | User owns the parent project |
| Delete files | `DELETE` | User owns the parent project |

### Application Usage

Files are encrypted client-side with AES-256-GCM before upload. The `markdown_summary` field is populated either from plain-text file content or via an AI conversion API for binary formats (PDF, Office documents).

```dart
// Upload encrypted file and save metadata
final insertData = {
  'project_id': projectId,
  'file_name': fileName,
  'storage_path': storagePath,  // e.g. "{userId}/{fileId}.enc"
  'file_type': fileType,
  'file_size': fileBytes.length,
};
if (markdownSummary != null) {
  insertData['markdown_summary'] = markdownSummary;
}

await SupabaseService.client
    .from('project_files')
    .insert(insertData)
    .select()
    .single();
```

---

## project_stats View

A helper view joins both junction tables for analytics:

```sql
CREATE VIEW project_stats AS
SELECT
  p.id, p.user_id, p.name, p.is_archived,
  COUNT(DISTINCT pc.chat_id) AS chat_count,
  COUNT(DISTINCT pf.id) AS file_count,
  COALESCE(SUM(pf.file_size), 0) AS total_file_size,
  p.created_at, p.updated_at
FROM projects p
LEFT JOIN project_chats pc ON p.id = pc.project_id
LEFT JOIN project_files pf ON p.id = pf.project_id
GROUP BY p.id, p.user_id, p.name, p.is_archived, p.created_at, p.updated_at;
```

---

## Related

- `ProjectStorageService` manages all CRUD operations for these tables
- Files are stored encrypted in the `project-files` Supabase Storage bucket
