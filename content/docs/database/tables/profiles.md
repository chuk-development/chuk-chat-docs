---
title: Profiles Table
weight: 1
---

# profiles

The `profiles` table stores user profile information and credit balances. It has a one-to-one relationship with `auth.users`.

## Schema

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  credits DECIMAL(10,4) DEFAULT 0,
  free_messages_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | - | Primary key, references `auth.users(id)` |
| `display_name` | TEXT | Yes | NULL | User's display name |
| `credits` | DECIMAL(10,4) | No | 0 | Available credit balance |
| `free_messages_used` | INT | No | 0 | Count of free messages consumed |
| `created_at` | TIMESTAMPTZ | No | NOW() | Profile creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | NOW() | Last modification timestamp |

## Indexes

```sql
CREATE INDEX idx_profiles_user_id ON profiles(id);
```

The primary key index on `id` is sufficient for most queries since lookups are always by user ID.

## Row Level Security

RLS ensures users can only access their own profile data.

### Select Policy

```sql
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);
```

Users can only read their own profile row.

### Update Policy

```sql
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

Users can only modify their own profile. The `WITH CHECK` clause ensures the `id` cannot be changed to another user's ID.

## Triggers

### Auto-create Profile on Signup

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

This trigger automatically creates a profile row when a new user signs up.

### Auto-update Timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Usage Examples

### Get Current User Profile

```dart
final response = await supabase
    .from('profiles')
    .select()
    .eq('id', supabase.auth.currentUser!.id)
    .single();
```

### Update Display Name

```dart
await supabase
    .from('profiles')
    .update({'display_name': 'New Name'})
    .eq('id', supabase.auth.currentUser!.id);
```

### Check Credit Balance

```dart
final credits = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', supabase.auth.currentUser!.id)
    .single();

print('Available credits: ${credits['credits']}');
```

### Increment Free Messages Used

```dart
await supabase.rpc('increment_free_messages');
```

## Related

- [Database Functions](../functions) - Server-side procedures
- [Row Level Security](../row-level-security) - Security policy patterns
