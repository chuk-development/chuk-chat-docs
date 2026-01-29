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
| `profiles` | User profiles and credit balances | User-only |
| `encrypted_chats` | Encrypted chat conversations | User-only |
| `user_preferences` | App settings | User-only |
| `theme_settings` | Visual theme customization | User-only |
| `customization_preferences` | Feature display preferences | User-only |
| `projects` | Chat workspaces | User-only |
| `project_chats` | Chat-to-project associations | User-only |
| `project_files` | Project attachments | User-only |
| `user_sessions` | Device session tracking and remote sign-out | User-only |

{{< callout type="info" >}}
The following tables were dropped in January 2026 as they were pre-planned but never used: `credit_transactions`, `customers`, `customer_preferences`, `orders`, `team_settings`, `user_credits`, `user_subscriptions`, `project_status`.
{{< /callout >}}

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
