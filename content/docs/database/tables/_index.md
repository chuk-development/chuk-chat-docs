---
title: Tables
weight: 1
---

# Database Tables

This section documents all database tables used by the application. Each table includes its schema definition, indexes, and associated RLS policies.

## Table Categories

### User Data

| Table | Purpose |
|-------|---------|
| [profiles](profiles) | User profiles and credit balances |
| [user_preferences](preferences) | Model selection and system prompts |
| [theme_settings](theme-settings) | Visual theme customization |
| [customization_preferences](preferences) | Feature display preferences |

### Chat Data

| Table | Purpose |
|-------|---------|
| [encrypted_chats](encrypted-chats) | Encrypted chat conversations |

### Project Data

| Table | Purpose |
|-------|---------|
| [projects](projects) | Project workspaces |
| [project_chats](project-relations) | Chat-to-project associations |
| [project_files](project-relations) | Project file attachments |

## Common Patterns

All tables follow consistent patterns:

### Primary Keys

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

Most tables use auto-generated UUIDs. The `profiles` table is an exception, using the `auth.users` ID directly.

### Timestamps

```sql
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
```

All tables track creation time. Tables that support updates also track modification time.

### Foreign Keys

```sql
user_id UUID REFERENCES auth.users(id) NOT NULL
```

All user-owned tables reference `auth.users` for RLS policy enforcement.

### Indexes

```sql
CREATE INDEX idx_{table}_{column} ON {table}({column});
```

All foreign keys and frequently queried columns are indexed for performance.

## Entity Relationship

```
┌─────────────┐
│  auth.users │
└──────┬──────┘
       │
       │ 1:1
       ▼
┌─────────────┐     ┌───────────────────────┐     ┌──────────────────┐
│  profiles   │     │ customization_prefs   │     │  theme_settings  │
└─────────────┘     └───────────────────────┘     └──────────────────┘
       │
       │ 1:many
       ▼
┌─────────────────┐         ┌────────────┐
│ encrypted_chats │◄────────│  projects  │
└────────┬────────┘         └─────┬──────┘
         │                        │
         │    ┌───────────────┐   │
         └───►│ project_chats │◄──┘
              └───────────────┘
                      │
              ┌───────────────┐
              │ project_files │
              └───────────────┘
```

{{< callout type="info" >}}
The `profiles` table is created automatically when a user signs up via a database trigger on `auth.users`.
{{< /callout >}}
