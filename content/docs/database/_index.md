---
title: Database
weight: 5
---

Chuk Chat uses Supabase (PostgreSQL) as its backend database with Row Level Security (RLS) for data protection.

## Database Architecture

The database follows a user-centric design where all data is associated with authenticated users and protected by RLS policies.

```
┌─────────────────────────────────────────────────┐
│                   Supabase                       │
├─────────────────────────────────────────────────┤
│  PostgreSQL Database                             │
│  ├── Tables (user data, chats, projects)        │
│  ├── Row Level Security (per-user isolation)    │
│  ├── Database Functions (server-side logic)     │
│  └── Realtime Subscriptions                     │
├─────────────────────────────────────────────────┤
│  Storage Buckets                                 │
│  ├── chat-images (encrypted attachments)        │
│  └── user-avatars (profile images)              │
├─────────────────────────────────────────────────┤
│  Authentication                                  │
│  └── Email/Password with JWT tokens             │
└─────────────────────────────────────────────────┘
```

## Core Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `user_credits` | Credit balance tracking | User-only |
| `credit_transactions` | Transaction history | User-only |
| `user_preferences` | App settings | User-only |
| `projects` | Chat workspaces | User-only |
| `project_files` | Project attachments | User-only |

## Security Model

All tables implement Row Level Security:

- **SELECT**: Users can only read their own data
- **INSERT**: Users can only create data for themselves
- **UPDATE**: Users can only modify their own data
- **DELETE**: Users can only delete their own data

## Storage

Encrypted file storage using Supabase Storage:

| Bucket | Purpose | Access |
|--------|---------|--------|
| `chat-images` | Message attachments | Authenticated |
| `user-avatars` | Profile pictures | Public read |

## Database Sections

{{< cards >}}
  {{< card link="tables" title="Tables" subtitle="Schema documentation" >}}
  {{< card link="functions" title="Functions" subtitle="Server-side procedures" >}}
  {{< card link="row-level-security" title="Row Level Security" subtitle="Access policies" >}}
  {{< card link="storage-buckets" title="Storage Buckets" subtitle="File storage" >}}
{{< /cards >}}
