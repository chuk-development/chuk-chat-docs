---
title: User Preferences Tables
weight: 4
---

Chuk Chat stores user preferences across three Supabase tables, each scoped to a specific domain: general preferences, customization behavior, and theme settings.

## user_preferences

Stores the user's selected AI model and encrypted system prompt.

### Schema

```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Columns

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `user_id` | `UUID` | — | Primary key, references `auth.users` |
| `preferences` | `JSONB` | `'{}'` | General preferences object |
| `created_at` | `TIMESTAMPTZ` | `NOW()` | Row creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOW()` | Auto-updated on changes |

### Application Usage

The `UserPreferencesService` uses this table to persist two key settings:

- **Selected model** (`selected_model_id`) — the user's chosen AI model (e.g. `deepseek/deepseek-chat-v3.1`)
- **System prompt** (`system_prompt`) — encrypted with AES-256-GCM before storage

```dart
// Save model preference
await SupabaseService.client
    .from('user_preferences')
    .upsert({
      'user_id': userId,
      'selected_model_id': modelId,
    }, onConflict: 'user_id');

// Save encrypted system prompt
final encryptedPrompt = await EncryptionService.encrypt(systemPrompt);
await SupabaseService.client
    .from('user_preferences')
    .upsert({
      'user_id': userId,
      'selected_model_id': selectedModelId,
      'system_prompt': encryptedPrompt,
    }, onConflict: 'user_id');
```

The service implements a cache-first pattern with a 1-minute TTL to minimize network calls.

### RLS Policies

| Policy | Operation | Rule |
|--------|-----------|------|
| Users can view their own preferences | `SELECT` | `auth.uid() = user_id` |
| Users can insert their own preferences | `INSERT` | `auth.uid() = user_id` |
| Users can update their own preferences | `UPDATE` | `auth.uid() = user_id` |

---

## user_model_providers

Stores per-model provider preferences, allowing users to select a specific provider (e.g. a particular hosting endpoint) for each AI model.

### Schema

The table uses a composite unique constraint on `(user_id, model_id)`.

### Application Usage

```dart
// Save provider preference
await SupabaseService.client
    .from('user_model_providers')
    .upsert({
      'user_id': userId,
      'model_id': modelId,
      'provider_slug': providerSlug,
    }, onConflict: 'user_id,model_id');

// Load all provider preferences
final response = await SupabaseService.client
    .from('user_model_providers')
    .select('model_id, provider_slug')
    .eq('user_id', userId);
```

Provider preferences are cached both in-memory and via `ModelCacheService` for offline access.

---

## customization_preferences

Stores UI behavior toggles and image generation settings.

### Schema

```sql
CREATE TABLE customization_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_send_voice_transcription BOOLEAN NOT NULL DEFAULT false,
  show_reasoning_tokens BOOLEAN NOT NULL DEFAULT true,
  show_model_info BOOLEAN NOT NULL DEFAULT true,
  image_gen_enabled BOOLEAN NOT NULL DEFAULT false,
  image_gen_default_size TEXT NOT NULL DEFAULT 'landscape_4_3',
  image_gen_custom_width INTEGER NOT NULL DEFAULT 1024,
  image_gen_custom_height INTEGER NOT NULL DEFAULT 768,
  image_gen_use_custom_size BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Columns

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `user_id` | `UUID` | — | Primary key, references `auth.users` |
| `auto_send_voice_transcription` | `BOOLEAN` | `false` | Auto-send after voice transcription |
| `show_reasoning_tokens` | `BOOLEAN` | `true` | Display reasoning tokens in responses |
| `show_model_info` | `BOOLEAN` | `true` | Show model name in message bubbles |
| `image_gen_enabled` | `BOOLEAN` | `false` | Enable image generation feature |
| `image_gen_default_size` | `TEXT` | `'landscape_4_3'` | Default generated image size |
| `image_gen_custom_width` | `INTEGER` | `1024` | Custom width (256-2048) |
| `image_gen_custom_height` | `INTEGER` | `768` | Custom height (256-2048) |
| `image_gen_use_custom_size` | `BOOLEAN` | `false` | Use custom dimensions instead of preset |

### Constraints

```sql
CONSTRAINT valid_image_gen_size CHECK (
  image_gen_default_size IN (
    'square_hd', 'square', 'portrait_4_3',
    'portrait_16_9', 'landscape_4_3', 'landscape_16_9'
  )
),
CONSTRAINT valid_custom_width CHECK (image_gen_custom_width BETWEEN 256 AND 2048),
CONSTRAINT valid_custom_height CHECK (image_gen_custom_height BETWEEN 256 AND 2048)
```

### RLS Policies

All three tables share the same RLS pattern: users can only `SELECT`, `INSERT`, and `UPDATE` their own rows, enforced via `auth.uid() = user_id`.

---

## Related Services

| Service | Table(s) Used |
|---------|---------------|
| `UserPreferencesService` | `user_preferences`, `user_model_providers` |
| `CustomizationPreferencesService` | `customization_preferences` |
| `ThemeSettingsService` | `theme_settings` |
