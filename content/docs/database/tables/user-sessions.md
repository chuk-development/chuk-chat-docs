---
title: User Sessions Table
weight: 7
---

# user_sessions

The `user_sessions` table tracks active device sessions for each user, enabling multi-device session management and remote sign-out.

## Schema

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT,
  platform TEXT,
  app_version TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  refresh_token_hash TEXT
);
```

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | No | - | References `auth.users(id)`, cascades on delete |
| `device_name` | TEXT | Yes | NULL | Human-readable device name |
| `platform` | TEXT | Yes | NULL | Operating system (Android, iOS, Web, Linux, macOS, Windows) |
| `app_version` | TEXT | Yes | NULL | App version at time of session creation |
| `last_seen_at` | TIMESTAMPTZ | No | `NOW()` | Last activity timestamp, updated periodically |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | Session creation timestamp |
| `is_active` | BOOLEAN | No | `TRUE` | Whether the session is currently active |
| `refresh_token_hash` | TEXT | Yes | NULL | SHA-256 hash of the refresh token |

## Constraints

### Unique Constraint

```sql
ALTER TABLE user_sessions
  ADD CONSTRAINT user_sessions_user_id_refresh_token_hash_key
  UNIQUE (user_id, refresh_token_hash);
```

Ensures a user cannot have duplicate sessions for the same refresh token. This constraint is used by the `ON CONFLICT` clause in the upsert performed by `SessionTrackingService.registerSession()`.

### Foreign Key

```sql
ALTER TABLE user_sessions
  ADD CONSTRAINT user_sessions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

When a user account is deleted, all associated session records are automatically removed.

## Indexes

```sql
CREATE INDEX idx_user_sessions_user_active
  ON user_sessions (user_id, is_active);
```

Optimizes the most common query pattern: listing active sessions for a given user.

## Row Level Security

RLS is enabled so users can only access their own session records.

### Select Policy

```sql
CREATE POLICY "Users can view own sessions"
ON user_sessions FOR SELECT
USING (auth.uid() = user_id);
```

### Insert Policy

```sql
CREATE POLICY "Users can insert own sessions"
ON user_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Update Policy

```sql
CREATE POLICY "Users can update own sessions"
ON user_sessions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Delete Policy

```sql
CREATE POLICY "Users can delete own sessions"
ON user_sessions FOR DELETE
USING (auth.uid() = user_id);
```

## Usage Examples

### List Active Sessions

```dart
final sessions = await supabase
    .from('user_sessions')
    .select()
    .eq('user_id', supabase.auth.currentUser!.id)
    .eq('is_active', true)
    .order('last_seen_at', ascending: false);
```

### Deactivate a Session

```dart
await supabase
    .from('user_sessions')
    .update({'is_active': false})
    .eq('id', sessionId);
```

{{< callout type="info" >}}
Session revocation should use the `revoke-session` edge function rather than directly updating the table, so that the associated refresh token is also invalidated server-side.
{{< /callout >}}

## Related

- [SessionTrackingService](/docs/services/auth/session-tracking) - Client-side session tracking
- [Session Management](/docs/security/session-management) - Security architecture
- [Row Level Security](/docs/database/row-level-security) - Security policy patterns
