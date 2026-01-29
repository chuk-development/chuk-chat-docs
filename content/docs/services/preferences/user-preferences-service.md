---
title: UserPreferencesService
weight: 2
---

`UserPreferencesService` manages the user's selected AI model, per-model provider routing, and encrypted system prompt via Supabase.

## Definition

```dart
// lib/services/user_preferences_service.dart

class UserPreferencesService {
  const UserPreferencesService._();

  static const String _kFallbackModelId = 'deepseek/deepseek-chat-v3.1';
  static const Duration _kSelectedModelTtl = Duration(minutes: 1);
  static const Duration _kProviderPreferencesTtl = Duration(minutes: 1);
}
```

This service is entirely static -- it cannot be instantiated. All methods are class-level and manage their own in-memory caches with TTL-based invalidation.

## Supabase Tables

| Table | Key | Purpose |
|-------|-----|---------|
| `user_preferences` | `user_id` | Stores `selected_model_id` and encrypted `system_prompt` |
| `user_model_providers` | `user_id, model_id` | Maps each model to the user's preferred provider slug |

## Methods -- Model Selection

| Method | Return | Description |
|--------|--------|-------------|
| `saveSelectedModel(modelId)` | `Future<bool>` | Upserts the selected model to Supabase and local cache. Notifies listeners via `ModelSelectionEventBus`. |
| `loadSelectedModel()` | `Future<String?>` | Returns the selected model, checking in-memory cache first, then `ModelCacheService` local cache, then Supabase. Triggers a background network sync when serving from local cache. |
| `clearSelectedModel()` | `Future<bool>` | Deletes the user's model preference row and clears all caches. |
| `refreshModelSelections()` | `Future<void>` | Fires a refresh event on `ModelSelectionEventBus` to force UI model dropdowns to re-query. |

## Methods -- Provider Preferences

| Method | Return | Description |
|--------|--------|-------------|
| `saveSelectedProvider(modelId, providerSlug)` | `Future<bool>` | Upserts a provider preference for a specific model. |
| `loadSelectedProvider(modelId)` | `Future<String?>` | Loads the preferred provider for a model. Falls back to `ModelCacheService` on network error. |
| `loadAllProviderPreferences()` | `Future<Map<String, String>>` | Returns all model-to-provider mappings. Uses in-memory cache with 1-minute TTL, falls back to local cache on error. |
| `clearSelectedProvider(modelId)` | `Future<bool>` | Removes the provider preference for a specific model. |
| `clearAllProviderPreferences()` | `Future<bool>` | Deletes all provider preferences for the user. |

## Methods -- System Prompt

| Method | Return | Description |
|--------|--------|-------------|
| `saveSystemPrompt(systemPrompt)` | `Future<bool>` | Encrypts the prompt with `EncryptionService.encrypt()` and upserts it to `user_preferences`. Preserves the existing `selected_model_id`. |
| `loadSystemPrompt()` | `Future<String?>` | Fetches the encrypted prompt and decrypts it with `EncryptionService.decrypt()`. |
| `clearSystemPrompt()` | `Future<bool>` | Sets the `system_prompt` column to `null`. |

## Caching Strategy

The service uses a three-tier caching strategy for model selection:

1. **In-memory cache** -- static fields (`_cachedSelectedModel`, `_cachedProviderPreferences`) with a 1-minute TTL.
2. **Local cache** -- `ModelCacheService` for offline-capable persistent storage.
3. **Network** -- Supabase queries as the source of truth.

In-flight request deduplication prevents concurrent identical queries from hitting Supabase multiple times.

## Usage Examples

### Saving and Loading a Model

```dart
// Save selected model
await UserPreferencesService.saveSelectedModel('deepseek/deepseek-chat-v3.1');

// Load selected model (cache-first)
final modelId = await UserPreferencesService.loadSelectedModel();
```

### Provider Routing

```dart
// Save a provider preference for a model
await UserPreferencesService.saveSelectedProvider(
  'meta-llama/llama-3.1-70b-instruct',
  'together',
);

// Load all provider preferences
final providers = await UserPreferencesService.loadAllProviderPreferences();
// {'meta-llama/llama-3.1-70b-instruct': 'together', ...}
```

### Encrypted System Prompt

```dart
// Save (automatically encrypted with AES-256-GCM)
await UserPreferencesService.saveSystemPrompt(
  'You are a helpful coding assistant.',
);

// Load (automatically decrypted)
final prompt = await UserPreferencesService.loadSystemPrompt();
```
