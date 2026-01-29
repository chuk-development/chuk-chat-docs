---
title: Preferences Services
weight: 8
---

The preferences services manage user-specific settings that are persisted to Supabase and synced across devices.

## Services

| Service | Supabase Table | Purpose |
|---------|---------------|---------|
| [`ThemeSettingsService`](theme-settings-service) | `theme_settings` | Visual theme: colors, dark/light mode, grain effect |
| [`UserPreferencesService`](user-preferences-service) | `user_preferences`, `user_model_providers` | Selected AI model, provider routing, system prompt |
| [`CustomizationPreferencesService`](customization-preferences-service) | `customization_preferences` | UI toggles, voice behavior, image generation settings |

## Architecture

All three services follow a consistent pattern:

- **Data model class** holds typed fields with a `defaults()` factory, `fromMap()` deserialization, `toMap()` serialization, and `copyWith()` for immutable updates.
- **Service class** provides `loadOrCreate()` (fetch existing row or insert defaults) and `save()` (upsert by `user_id`).
- **Exception class** wraps error messages for service-specific failures.

`ThemeSettingsService` and `CustomizationPreferencesService` are instantiated as `const` objects, while `UserPreferencesService` uses only `static` methods with in-memory caching and TTL-based invalidation.

## Supabase Tables

All three tables use `user_id` as the primary key (foreign key to `auth.users`), enforced by Row Level Security so each user can only access their own preferences.
