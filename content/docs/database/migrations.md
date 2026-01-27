---
title: Migrations
weight: 4
---

# Database Migrations

Migration files manage the database schema evolution. They provide a version-controlled history of all schema changes and ensure consistent database state across environments.

## Migration Files

Migration files are located in the `migrations/` directory:

| File | Description |
|------|-------------|
| `00_base_schema.sql` | Core tables with RLS policies |
| `projects.sql` | Projects feature tables |
| `images_storage.sql` | Image bucket RLS policies |
| `project_files_storage.sql` | Project files bucket RLS |
| `free_messages.sql` | Free message quota tracking |
| `project_files_markdown.sql` | Markdown summary column |
| `image_gen_settings.sql` | Image generation preferences |

## Running Migrations

### Using Supabase CLI

The recommended method for applying migrations:

```bash
# Push all pending migrations to the database
supabase db push

# Push to a specific environment
supabase db push --linked

# Dry run (show SQL without executing)
supabase db push --dry-run
```

### Manual Execution

For direct control or debugging, run migrations via the Supabase Dashboard:

1. Open your project in the Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the migration SQL
4. Click **Run**

### Using psql

For direct database access:

```bash
# Connect to database
psql "postgresql://postgres:[password]@[host]:5432/postgres"

# Run migration file
\i migrations/00_base_schema.sql
```

## Creating New Migrations

### Generate Migration File

```bash
# Create a new migration
supabase migration new feature_name

# Creates: supabase/migrations/[timestamp]_feature_name.sql
```

### Migration File Structure

```sql
-- migrations/20240115_add_user_settings.sql

-- Description: Add user settings table for app configuration
-- Author: Your Name
-- Date: 2024-01-15

-- ============================================
-- UP MIGRATION
-- ============================================

-- Create table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id
ON user_settings(user_id);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings FORCE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own settings"
ON user_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
ON user_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
ON user_settings FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Naming Conventions

```
[timestamp]_[action]_[subject].sql

Examples:
20240115_create_user_settings.sql
20240120_add_credits_column.sql
20240125_update_chat_indexes.sql
20240130_drop_legacy_table.sql
```

## Migration Best Practices

### Idempotent Migrations

Write migrations that can be run multiple times safely:

```sql
-- Good: Use IF NOT EXISTS
CREATE TABLE IF NOT EXISTS my_table (...);
CREATE INDEX IF NOT EXISTS idx_name ON my_table(...);

-- Good: Use CREATE OR REPLACE for functions
CREATE OR REPLACE FUNCTION my_function() ...

-- Good: Check before dropping
DROP TABLE IF EXISTS old_table;
DROP INDEX IF EXISTS old_index;
```

### Transactional Migrations

Wrap related changes in transactions:

```sql
BEGIN;

-- Multiple related changes
ALTER TABLE users ADD COLUMN new_field TEXT;
UPDATE users SET new_field = 'default' WHERE new_field IS NULL;
ALTER TABLE users ALTER COLUMN new_field SET NOT NULL;

COMMIT;
```

### Data Migrations

Separate schema changes from data migrations:

```sql
-- schema_migration.sql: Structure only
ALTER TABLE users ADD COLUMN display_name TEXT;

-- data_migration.sql: Populate data
UPDATE users
SET display_name = email
WHERE display_name IS NULL;
```

### Backwards Compatibility

Consider application compatibility during migration:

```sql
-- Phase 1: Add new column (nullable)
ALTER TABLE users ADD COLUMN new_email TEXT;

-- Phase 2: (After app deployment) Migrate data
UPDATE users SET new_email = email WHERE new_email IS NULL;

-- Phase 3: (After verification) Make required
ALTER TABLE users ALTER COLUMN new_email SET NOT NULL;

-- Phase 4: (After full rollout) Remove old column
ALTER TABLE users DROP COLUMN email;
```

## Example Migrations

### Base Schema

```sql
-- 00_base_schema.sql

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  credits DECIMAL(10,4) DEFAULT 0,
  free_messages_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Encrypted chats table
CREATE TABLE encrypted_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  encrypted_data TEXT NOT NULL,
  title TEXT,
  custom_name TEXT,
  is_starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_user_id ON profiles(id);
CREATE INDEX idx_encrypted_chats_user_id ON encrypted_chats(user_id);
CREATE INDEX idx_encrypted_chats_user_updated ON encrypted_chats(user_id, updated_at);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE encrypted_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE encrypted_chats FORCE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Chat policies
CREATE POLICY "Users can view own chats"
ON encrypted_chats FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chats"
ON encrypted_chats FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats"
ON encrypted_chats FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats"
ON encrypted_chats FOR DELETE USING (auth.uid() = user_id);
```

### Projects Feature

```sql
-- projects.sql

-- Projects table
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

-- Project-chat junction
CREATE TABLE project_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  chat_id UUID REFERENCES encrypted_chats(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, chat_id)
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_archived ON projects(user_id, is_archived);
CREATE INDEX idx_project_chats_project ON project_chats(project_id);
CREATE INDEX idx_project_chats_chat ON project_chats(chat_id);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;
ALTER TABLE project_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_chats FORCE ROW LEVEL SECURITY;

-- Projects policies (standard pattern)
CREATE POLICY "projects_select" ON projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "projects_insert" ON projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_update" ON projects FOR UPDATE
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_delete" ON projects FOR DELETE
USING (auth.uid() = user_id);

-- Project chats policies (join-based)
CREATE POLICY "project_chats_select" ON project_chats FOR SELECT
USING (EXISTS (
  SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()
));

CREATE POLICY "project_chats_insert" ON project_chats FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM encrypted_chats WHERE id = chat_id AND user_id = auth.uid())
);

CREATE POLICY "project_chats_delete" ON project_chats FOR DELETE
USING (EXISTS (
  SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()
));
```

### Storage Bucket Setup

```sql
-- images_storage.sql

-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('images', 'images', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- RLS policies
CREATE POLICY "images_insert" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "images_select" ON storage.objects FOR SELECT
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "images_delete" ON storage.objects FOR DELETE
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Rollback Strategies

### Manual Rollback

Create corresponding down migrations:

```sql
-- up: 20240115_add_feature.sql
CREATE TABLE new_feature (...);

-- down: 20240115_add_feature_rollback.sql
DROP TABLE IF EXISTS new_feature;
```

### Point-in-Time Recovery

For critical issues, use Supabase's point-in-time recovery:

1. Go to **Settings > Database**
2. Click **Restore**
3. Select the recovery point before the migration

{{< callout type="warning" >}}
Point-in-time recovery restores ALL data to that point, not just schema. Use with caution in production.
{{< /callout >}}

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Database

on:
  push:
    branches: [main]
    paths:
      - 'migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link Supabase Project
        run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Push Migrations
        run: supabase db push
```

## Related

- [Tables Overview](tables) - Table schema documentation
- [Row Level Security](row-level-security) - RLS policy patterns
- [Database Functions](functions) - Custom function migrations
