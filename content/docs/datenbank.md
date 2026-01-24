---
title: Datenbank
weight: 5
---

# Datenbank-Schema

Die App nutzt **Supabase** (PostgreSQL) als Backend mit Row Level Security (RLS).

## Tabellen

### profiles

Benutzerprofile und Credits.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  credits DECIMAL(10,4) DEFAULT 0,
  free_messages_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies:**
- Benutzer können nur eigene Daten lesen/aktualisieren

---

### encrypted_chats

Verschlüsselte Chat-Konversationen.

```sql
CREATE TABLE encrypted_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  encrypted_data TEXT NOT NULL,  -- AES-256-GCM verschlüsselt
  title TEXT,
  is_starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies:**
- Benutzer können nur eigene Chats lesen/schreiben/löschen

{{< callout type="info" >}}
Der `encrypted_data`-Inhalt wird **client-seitig** verschlüsselt bevor er an Supabase gesendet wird.
{{< /callout >}}

---

### theme_settings

Benutzer-Theme-Einstellungen.

```sql
CREATE TABLE theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  theme_mode TEXT DEFAULT 'system',  -- 'light', 'dark', 'system'
  accent_color TEXT,
  background_color TEXT,
  icon_foreground_color TEXT,
  grain_enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### customization_preferences

Feature-Einstellungen.

```sql
CREATE TABLE customization_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  show_reasoning_tokens BOOLEAN DEFAULT TRUE,
  show_model_info BOOLEAN DEFAULT TRUE,
  show_tps BOOLEAN DEFAULT TRUE,
  voice_mode_enabled BOOLEAN DEFAULT FALSE,
  image_gen_settings JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### user_preferences

Allgemeine Benutzereinstellungen.

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  selected_model TEXT,
  selected_provider TEXT,
  system_prompt TEXT,
  preferences JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### projects

Projekt-Workspaces.

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

---

### project_chats

Zuordnung Chats ↔ Projekte.

```sql
CREATE TABLE project_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  chat_id UUID REFERENCES encrypted_chats(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, chat_id)
);
```

---

### project_files

Projektdateien mit Markdown-Summary.

```sql
CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  markdown_summary TEXT,  -- Konvertierter Inhalt
  size_bytes BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Storage Buckets

### images

Verschlüsselte Benutzerbilder.

```sql
-- Bucket: images (private)
-- Pfad: {user_id}/{uuid}.enc

-- RLS Policy
CREATE POLICY "Users can manage own images"
ON storage.objects FOR ALL
USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### project-files

Verschlüsselte Projektdateien.

```sql
-- Bucket: project-files (private)
-- Pfad: {user_id}/{project_id}/{uuid}

-- RLS Policy
CREATE POLICY "Users can manage own project files"
ON storage.objects FOR ALL
USING (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Migrations

Migrationen befinden sich in `migrations/`:

| Datei | Beschreibung |
|-------|--------------|
| `00_base_schema.sql` | Basis-Tabellen mit RLS |
| `projects.sql` | Projects-Feature |
| `images_storage.sql` | Image-Bucket RLS |
| `project_files_storage.sql` | Project-Files-Bucket RLS |
| `free_messages.sql` | Free-Message-Feature |
| `project_files_markdown.sql` | Markdown-Summary-Spalte |
| `image_gen_settings.sql` | Bildgenerierungs-Einstellungen |

### Migration ausführen

```bash
# Supabase CLI
supabase db push

# Oder manuell via SQL Editor im Supabase Dashboard
```

---

## Row Level Security (RLS)

Alle Tabellen haben RLS aktiviert. Beispiel:

```sql
-- RLS aktivieren
ALTER TABLE encrypted_chats ENABLE ROW LEVEL SECURITY;

-- Select Policy
CREATE POLICY "Users can view own chats"
ON encrypted_chats FOR SELECT
USING (auth.uid() = user_id);

-- Insert Policy
CREATE POLICY "Users can insert own chats"
ON encrypted_chats FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update Policy
CREATE POLICY "Users can update own chats"
ON encrypted_chats FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Delete Policy
CREATE POLICY "Users can delete own chats"
ON encrypted_chats FOR DELETE
USING (auth.uid() = user_id);
```

{{< callout type="warning" >}}
**Wichtig:** Ohne RLS-Policies können authentifizierte Benutzer auf alle Daten zugreifen!
{{< /callout >}}

---

## Sync-Strategie

### Lightweight Metadata Fetch

```sql
-- Nur IDs und Timestamps für Sync-Vergleich
SELECT id, updated_at
FROM encrypted_chats
WHERE user_id = auth.uid();
```

### Full Payload Fetch

```sql
-- Nur geänderte Chats vollständig laden
SELECT *
FROM encrypted_chats
WHERE id = ANY($1)  -- Array von geänderten IDs
AND user_id = auth.uid();
```

Diese Strategie minimiert Datentransfer und Decryption-Overhead.
