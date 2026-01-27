---
title: Theme Settings Table
weight: 3
---

# theme_settings

The `theme_settings` table stores user theme preferences that sync across all devices. This enables consistent visual customization regardless of which device the user accesses the app from.

## Schema

```sql
CREATE TABLE theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  theme_mode TEXT DEFAULT 'system',  -- 'light', 'dark', 'system'
  accent_color TEXT,                  -- Hex color (#RRGGBB)
  background_color TEXT,              -- Hex color
  icon_foreground_color TEXT,         -- Hex color
  grain_enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | gen_random_uuid() | Unique row identifier |
| `user_id` | UUID | No | - | Owner's user ID (unique) |
| `theme_mode` | TEXT | No | 'system' | Theme mode: 'light', 'dark', or 'system' |
| `accent_color` | TEXT | Yes | NULL | Primary accent color (#RRGGBB) |
| `background_color` | TEXT | Yes | NULL | Background color override (#RRGGBB) |
| `icon_foreground_color` | TEXT | Yes | NULL | Icon/text color (#RRGGBB) |
| `grain_enabled` | BOOLEAN | No | FALSE | Enable film grain texture effect |
| `updated_at` | TIMESTAMPTZ | No | NOW() | Last modification timestamp |

## Indexes

```sql
CREATE INDEX idx_theme_settings_user_id ON theme_settings(user_id);
```

The `UNIQUE` constraint on `user_id` also creates an implicit index.

## Row Level Security

Standard user isolation policies apply.

### Select Policy

```sql
CREATE POLICY "Users can view own theme settings"
ON theme_settings FOR SELECT
USING (auth.uid() = user_id);
```

### Insert Policy

```sql
CREATE POLICY "Users can insert own theme settings"
ON theme_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Update Policy

```sql
CREATE POLICY "Users can update own theme settings"
ON theme_settings FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

## Theme Mode Values

| Value | Behavior |
|-------|----------|
| `system` | Follow device/OS theme preference |
| `light` | Always use light theme |
| `dark` | Always use dark theme |

## Color Format

All color columns use hexadecimal format with the `#` prefix:

```
#RRGGBB

Examples:
- #3B82F6 (blue)
- #10B981 (green)
- #8B5CF6 (purple)
- #1F2937 (dark gray)
```

{{< callout type="warning" >}}
Always validate color values client-side before saving. Invalid hex colors may cause rendering issues.
{{< /callout >}}

## Usage Examples

### Get User Theme Settings

```dart
final settings = await supabase
    .from('theme_settings')
    .select()
    .eq('user_id', supabase.auth.currentUser!.id)
    .maybeSingle();

if (settings == null) {
  // Use default settings
  return ThemeSettings.defaults();
}
```

### Create or Update Settings (Upsert)

```dart
await supabase.from('theme_settings').upsert({
  'user_id': supabase.auth.currentUser!.id,
  'theme_mode': 'dark',
  'accent_color': '#3B82F6',
  'grain_enabled': true,
}, onConflict: 'user_id');
```

### Update Single Property

```dart
await supabase
    .from('theme_settings')
    .update({'accent_color': '#10B981'})
    .eq('user_id', supabase.auth.currentUser!.id);
```

### Reset to Defaults

```dart
await supabase
    .from('theme_settings')
    .update({
      'theme_mode': 'system',
      'accent_color': null,
      'background_color': null,
      'icon_foreground_color': null,
      'grain_enabled': false,
    })
    .eq('user_id', supabase.auth.currentUser!.id);
```

## Sync Behavior

Theme settings are synced on:

1. **App launch** - Fetch latest settings from server
2. **Settings change** - Immediately push to server
3. **Sign in on new device** - Pull existing settings

```dart
class ThemeService {
  Future<void> syncFromServer() async {
    final remote = await supabase
        .from('theme_settings')
        .select()
        .eq('user_id', userId)
        .maybeSingle();

    if (remote != null && remote['updated_at'] > localUpdatedAt) {
      applyTheme(ThemeSettings.fromJson(remote));
    }
  }

  Future<void> saveAndSync(ThemeSettings settings) async {
    // Apply locally first for immediate feedback
    applyTheme(settings);

    // Then sync to server
    await supabase.from('theme_settings').upsert(
      settings.toJson(),
      onConflict: 'user_id',
    );
  }
}
```

## Default Values

When no theme settings exist for a user:

| Property | Default |
|----------|---------|
| Theme Mode | `system` |
| Accent Color | App default (typically blue) |
| Background Color | Theme default |
| Icon Color | Theme default |
| Grain Effect | Disabled |

## Related

- [Preferences Tables](preferences) - Other user preference tables
- [Sync Strategy](../sync-strategy) - How settings sync across devices
