---
title: Row Level Security
weight: 3
---

Row Level Security (RLS) policies that protect user data in Chuk Chat.

## Overview

All tables implement RLS to ensure users can only access their own data:

```sql
-- Enable RLS on all tables
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
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

### user_credits

```sql
-- View own credits
CREATE POLICY "Users can view own credits"
ON user_credits FOR SELECT
USING (user_id = auth.uid());

-- Credits are managed by server functions only
-- No direct INSERT/UPDATE/DELETE policies
```

### credit_transactions

```sql
-- View own transaction history
CREATE POLICY "Users can view own transactions"
ON credit_transactions FOR SELECT
USING (user_id = auth.uid());

-- Transactions created by server functions only
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
SELECT * FROM user_credits; -- Should only return user's data

-- Verify INSERT policy
INSERT INTO projects (user_id, name)
VALUES ('other-user-id', 'Test'); -- Should fail

-- Reset
RESET request.jwt.claim.sub;
```

## Best Practices

1. **Enable RLS on all tables** containing user data
2. **Use auth.uid()** for user identification
3. **Test policies** with different user contexts
4. **Avoid complex subqueries** in policies (performance)
5. **Use indexes** on user_id columns
