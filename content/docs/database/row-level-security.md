---
title: Row Level Security
weight: 3
---

Row Level Security (RLS) policies that protect user data in Chuk Chat.

## Overview

All tables implement RLS to ensure users can only access their own data:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE encrypted_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
```

## Policy Patterns

### User-Owned Data

Standard pattern for user-specific data:

```sql
-- SELECT: Users can only read their own data
CREATE POLICY "Users can view own data"
ON table_name FOR SELECT
USING (user_id = auth.uid());

-- INSERT: Users can only insert data for themselves
CREATE POLICY "Users can insert own data"
ON table_name FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can only update their own data
CREATE POLICY "Users can update own data"
ON table_name FOR UPDATE
USING (user_id = auth.uid());

-- DELETE: Users can only delete their own data
CREATE POLICY "Users can delete own data"
ON table_name FOR DELETE
USING (user_id = auth.uid());
```

## Table Policies

### profiles

```sql
CREATE POLICY "Users can select own profile"
ON profiles FOR SELECT
USING (id = (select auth.uid()));

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (id = (select auth.uid()));
```

### user_preferences

```sql
-- Full CRUD on own preferences
CREATE POLICY "Users can manage own preferences"
ON user_preferences FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

### projects

```sql
-- View own projects
CREATE POLICY "Users can view own projects"
ON projects FOR SELECT
USING (user_id = auth.uid());

-- Create projects for self
CREATE POLICY "Users can create own projects"
ON projects FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Update own projects
CREATE POLICY "Users can update own projects"
ON projects FOR UPDATE
USING (user_id = auth.uid());

-- Delete own projects
CREATE POLICY "Users can delete own projects"
ON projects FOR DELETE
USING (user_id = auth.uid());
```

### project_files

```sql
-- Access files through project ownership
CREATE POLICY "Users can view own project files"
ON project_files FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage own project files"
ON project_files FOR ALL
USING (
  project_id IN (
    SELECT id FROM projects WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  project_id IN (
    SELECT id FROM projects WHERE user_id = auth.uid()
  )
);
```

### user_sessions

```sql
CREATE POLICY "Users can view own sessions"
ON user_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
ON user_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
ON user_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
ON user_sessions FOR DELETE
USING (auth.uid() = user_id);
```

## Service Role Bypass

For server-side operations, use the service role key:

```dart
// Client-side (uses RLS)
final client = SupabaseClient(url, anonKey);

// Server-side (bypasses RLS)
final adminClient = SupabaseClient(url, serviceRoleKey);
```

{{< callout type="warning" >}}
Never expose the service role key in client applications.
{{< /callout >}}

## Testing Policies

```sql
-- Test as specific user
SET request.jwt.claim.sub = 'user-uuid-here';

-- Verify SELECT policy
SELECT * FROM profiles; -- Should only return user's data

-- Verify INSERT policy
INSERT INTO projects (user_id, name)
VALUES ('other-user-id', 'Test'); -- Should fail

-- Reset
RESET request.jwt.claim.sub;
```

## Performance: InitPlan Optimization

All RLS policies use `(select auth.uid())` instead of bare `auth.uid()` to prevent per-row re-evaluation. Without the wrapping subquery, PostgreSQL calls `auth.uid()` for every row scanned, which degrades performance on large tables.

```sql
-- Bad: auth.uid() re-evaluated per row
CREATE POLICY "example" ON table_name
  FOR SELECT USING (user_id = auth.uid());

-- Good: evaluated once via InitPlan
CREATE POLICY "example" ON table_name
  FOR SELECT USING (user_id = (select auth.uid()));
```

See [Supabase lint 0003](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan) for details. This fix was applied to all RLS policies in January 2026.

## Best Practices

1. **Enable RLS on all tables** containing user data
2. **Use `(select auth.uid())`** wrapped in a subquery for performance
3. **Test policies** with different user contexts
4. **Avoid complex subqueries** in policies (performance)
5. **Use indexes** on user_id columns
