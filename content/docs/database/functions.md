---
title: Database Functions
weight: 6
---

PostgreSQL functions used in Chuk Chat for server-side logic.

## User Management Functions

### initialize_user

Sets up a new user with default data (profile and preferences):

```sql
CREATE OR REPLACE FUNCTION initialize_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id)
  VALUES (NEW.id);

  -- Create default preferences
  INSERT INTO user_preferences (user_id, theme, language)
  VALUES (NEW.id, 'dark', 'en');

  RETURN NEW;
END;
$$;

-- Trigger on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION initialize_user();
```

## Project Functions

### clone_project

Creates a copy of a project:

```sql
CREATE OR REPLACE FUNCTION clone_project(
  p_project_id UUID,
  p_new_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_new_project_id UUID;
BEGIN
  -- Verify ownership
  SELECT user_id INTO v_user_id
  FROM projects
  WHERE id = p_project_id;

  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Clone project
  INSERT INTO projects (user_id, name, system_prompt, settings)
  SELECT user_id, p_new_name, system_prompt, settings
  FROM projects
  WHERE id = p_project_id
  RETURNING id INTO v_new_project_id;

  -- Clone files
  INSERT INTO project_files (project_id, name, content, type)
  SELECT v_new_project_id, name, content, type
  FROM project_files
  WHERE project_id = p_project_id;

  RETURN v_new_project_id;
END;
$$;
```

## Utility Functions

### cleanup_old_data

Removes expired data (inactive sessions older than 90 days):

```sql
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER := 0;
BEGIN
  -- Delete old inactive sessions (keep 90 days)
  DELETE FROM user_sessions
  WHERE is_active = false
    AND last_seen_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN v_deleted;
END;
$$;
```

## Edge Functions

### revoke-session

A Supabase Edge Function at `supabase/functions/revoke-session/index.ts` that invalidates user sessions by revoking refresh tokens through the Supabase Admin API.

The function supports two modes:

| Mode | Parameter | Description |
|------|-----------|-------------|
| **Single session** | `session_id` | Revokes a specific session by its ID |
| **Revoke all others** | `current_token_hash` | Revokes all sessions except the one matching the provided token hash |

**Security**: The function validates session ownership before performing any revocation -- a user can only revoke their own sessions. It uses the Supabase Admin API with a service role key to invalidate the underlying refresh tokens.

```typescript
// supabase/functions/revoke-session/index.ts
// POST /revoke-session
// Body: { session_id: string } OR { current_token_hash: string }
// Auth: Bearer token (validated against session owner)
```

---

## Calling Functions from Dart

```dart
// Call an RPC function
final result = await supabase
    .rpc('clone_project', params: {
      'p_project_id': projectId,
      'p_new_name': 'My Clone',
    });

final newProjectId = result as String;
```
