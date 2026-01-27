---
title: Database Functions
weight: 6
---

PostgreSQL functions used in Chuk Chat for server-side logic.

## Credit Management Functions

### add_credits

Adds credits to a user's balance:

```sql
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount DECIMAL,
  p_description TEXT DEFAULT 'Credit addition'
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance DECIMAL;
BEGIN
  -- Update balance
  UPDATE user_credits
  SET balance = balance + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;

  -- Record transaction
  INSERT INTO credit_transactions (
    user_id, amount, type, description
  ) VALUES (
    p_user_id, p_amount, 'credit', p_description
  );

  RETURN v_new_balance;
END;
$$;
```

### deduct_credits

Deducts credits for API usage:

```sql
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount DECIMAL,
  p_description TEXT DEFAULT 'API usage'
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
BEGIN
  -- Check current balance
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Deduct
  UPDATE user_credits
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;

  -- Record transaction
  INSERT INTO credit_transactions (
    user_id, amount, type, description
  ) VALUES (
    p_user_id, -p_amount, 'debit', p_description
  );

  RETURN v_new_balance;
END;
$$;
```

### get_credit_balance

Returns user's current balance:

```sql
CREATE OR REPLACE FUNCTION get_credit_balance(p_user_id UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance DECIMAL;
BEGIN
  SELECT balance INTO v_balance
  FROM user_credits
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_balance, 0);
END;
$$;
```

## User Management Functions

### initialize_user

Sets up a new user with default data:

```sql
CREATE OR REPLACE FUNCTION initialize_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create credit account with welcome bonus
  INSERT INTO user_credits (user_id, balance)
  VALUES (NEW.id, 1.00);

  -- Create default preferences
  INSERT INTO user_preferences (user_id, theme, language)
  VALUES (NEW.id, 'dark', 'en');

  -- Record welcome credit
  INSERT INTO credit_transactions (
    user_id, amount, type, description
  ) VALUES (
    NEW.id, 1.00, 'credit', 'Welcome bonus'
  );

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

Removes expired data:

```sql
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER := 0;
BEGIN
  -- Delete old transactions (keep 90 days)
  DELETE FROM credit_transactions
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN v_deleted;
END;
$$;
```

## Calling Functions from Dart

```dart
// Call function
final result = await supabase
    .rpc('get_credit_balance', params: {
      'p_user_id': userId,
    });

// With return value
final balance = result as double;

// Void function
await supabase.rpc('deduct_credits', params: {
  'p_user_id': userId,
  'p_amount': 0.05,
  'p_description': 'Chat completion',
});
```
