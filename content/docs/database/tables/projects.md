---
title: Projects Table
weight: 5
---

# projects

The `projects` table stores project workspaces that organize chats with shared context. Projects allow users to group related conversations and apply project-specific system prompts.

## Schema

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | gen_random_uuid() | Unique project identifier |
| `user_id` | UUID | No | - | Owner's user ID |
| `name` | TEXT | No | - | Project name |
| `description` | TEXT | Yes | NULL | Project description |
| `system_prompt` | TEXT | Yes | NULL | Encrypted project system prompt |
| `is_archived` | BOOLEAN | No | FALSE | Whether project is archived |
| `created_at` | TIMESTAMPTZ | No | NOW() | Project creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | NOW() | Last modification timestamp |

## Indexes

```sql
-- Primary index for user queries
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Composite index for filtering archived projects
CREATE INDEX idx_projects_archived ON projects(user_id, is_archived);
```

## Row Level Security

Standard CRUD policies ensure complete data isolation.

### Select Policy

```sql
CREATE POLICY "Users can view own projects"
ON projects FOR SELECT
USING (auth.uid() = user_id);
```

### Insert Policy

```sql
CREATE POLICY "Users can insert own projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Update Policy

```sql
CREATE POLICY "Users can update own projects"
ON projects FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Delete Policy

```sql
CREATE POLICY "Users can delete own projects"
ON projects FOR DELETE
USING (auth.uid() = user_id);
```

## Project Features

### System Prompts

Each project can have a custom system prompt that applies to all chats within the project:

```dart
final projectPrompt = project['system_prompt'];
final decryptedPrompt = await EncryptionService.decrypt(
  jsonDecode(projectPrompt),
  userKey,
);

// Use in chat completion
final messages = [
  {'role': 'system', 'content': decryptedPrompt},
  ...chatMessages,
];
```

{{< callout type="info" >}}
Project system prompts are encrypted using the same scheme as chat messages.
{{< /callout >}}

### Archiving

Archived projects are hidden from the main project list but not deleted:

```dart
// Archive a project
await supabase
    .from('projects')
    .update({'is_archived': true})
    .eq('id', projectId);

// Fetch only active projects
final activeProjects = await supabase
    .from('projects')
    .select()
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('updated_at', ascending: false);
```

## Usage Examples

### Create New Project

```dart
final projectId = const Uuid().v4();

final encryptedPrompt = systemPrompt != null
    ? jsonEncode(await EncryptionService.encrypt(systemPrompt, userKey))
    : null;

await supabase.from('projects').insert({
  'id': projectId,
  'user_id': supabase.auth.currentUser!.id,
  'name': 'My Research Project',
  'description': 'AI research notes and discussions',
  'system_prompt': encryptedPrompt,
});
```

### List User Projects

```dart
final projects = await supabase
    .from('projects')
    .select('id, name, description, is_archived, updated_at')
    .eq('user_id', supabase.auth.currentUser!.id)
    .eq('is_archived', false)
    .order('updated_at', ascending: false);
```

### Get Project with Chat Count

```dart
final project = await supabase
    .from('projects')
    .select('''
      *,
      project_chats(count)
    ''')
    .eq('id', projectId)
    .single();

final chatCount = project['project_chats'][0]['count'];
```

### Update Project

```dart
await supabase
    .from('projects')
    .update({
      'name': 'Updated Name',
      'description': 'New description',
    })
    .eq('id', projectId);
```

### Delete Project

```dart
// This cascades to project_chats and project_files
await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);
```

{{< callout type="warning" >}}
Deleting a project cascades to `project_chats` and `project_files`, but does NOT delete the associated chats themselves - only the associations.
{{< /callout >}}

### Get Project with Files

```dart
final project = await supabase
    .from('projects')
    .select('''
      *,
      project_files(id, name, size_bytes, mime_type, created_at)
    ''')
    .eq('id', projectId)
    .single();
```

## Project Workflow

```
1. User creates project
   └── Optional: Add system prompt
   └── Optional: Add description

2. User associates chats with project
   └── Via project_chats junction table
   └── Chats can belong to multiple projects

3. User uploads files to project
   └── Files stored in project-files bucket
   └── Markdown extracted for context

4. When chatting in project context:
   └── Project system prompt is prepended
   └── Project files available as context
```

## Related

- [Project Relations](project-relations) - Chat and file associations
- [Storage Buckets](../storage-buckets) - Project file storage
