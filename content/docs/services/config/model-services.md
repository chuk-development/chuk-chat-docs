---
title: Model Services
weight: 4
---

Three services work together to cache, prefetch, and query the capabilities of AI models available through the Chuk Chat API.

{{< callout type="info" >}}
**Dynamic model list**: All hardcoded model lists have been removed. Models are now fetched exclusively from the OpenRouter API at runtime. Vision support is detected from the API's `supports_vision` field rather than maintained in hardcoded lists. Model icons have also been removed from the dropdown UI in favor of a cleaner, text-only presentation.
{{< /callout >}}

## ModelCacheService

Persists model metadata and user preferences to `SharedPreferences` so the UI can render model selectors instantly without waiting for a network call.

### Definition

```dart
// lib/services/model_cache_service.dart

class ModelCacheService {
  static const Duration _cacheValidDuration = Duration(hours: 24);

  static Future<void> saveAvailableModels(List<Map<String, dynamic>> models) async { ... }
  static Future<List<Map<String, dynamic>>> loadAvailableModels() async { ... }
  static Future<bool> isCacheValid() async { ... }

  static Future<void> saveSelectedModel(String userId, String modelId) async { ... }
  static Future<String?> loadSelectedModel(String userId) async { ... }

  static Future<void> saveProviderPreferences(String userId, Map<String, String> providers) async { ... }
  static Future<Map<String, String>> loadProviderPreferences(String userId) async { ... }
  static Future<void> updateProviderPreference(String userId, String modelId, String providerSlug) async { ... }
  static Future<void> clearProviderPreference(String userId, String modelId) async { ... }

  static Future<void> clearAllForUser(String userId) async { ... }
}
```

### Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `saveAvailableModels(models)` | `Future<void>` | Persist the model list and update the cache timestamp |
| `loadAvailableModels()` | `Future<List<Map<String, dynamic>>>` | Load cached models. Returns an empty list on missing or corrupt data |
| `isCacheValid()` | `Future<bool>` | `true` if the cache is less than 24 hours old |
| `saveSelectedModel(userId, modelId)` | `Future<void>` | Save the user's selected model |
| `loadSelectedModel(userId)` | `Future<String?>` | Load the user's selected model |
| `saveProviderPreferences(userId, providers)` | `Future<void>` | Save all provider preferences as a JSON-encoded map |
| `loadProviderPreferences(userId)` | `Future<Map<String, String>>` | Load provider preferences. Returns empty map on failure |
| `updateProviderPreference(userId, modelId, providerSlug)` | `Future<void>` | Update a single provider preference |
| `clearProviderPreference(userId, modelId)` | `Future<void>` | Remove a single provider preference |
| `clearAllForUser(userId)` | `Future<void>` | Remove both selected model and provider preferences for a user |

### Storage Keys

| Key Pattern | Contents |
|-------------|----------|
| `cached_models_v2` | JSON-encoded list of model metadata |
| `cached_models_timestamp_v2` | Milliseconds since epoch of last cache write |
| `cached_selected_model_{userId}` | Selected model ID string |
| `cached_provider_prefs_{userId}` | JSON-encoded `Map<String, String>` of model-to-provider mappings |

---

## ModelPrefetchService

Fetches model metadata from the API early in the app lifecycle and writes it to `ModelCacheService`. Optimized for fast startup with a 3-second timeout and silent failure.

### Definition

```dart
// lib/services/model_prefetch_service.dart

class ModelPrefetchService {
  static const Duration _httpTimeout = Duration(seconds: 3);

  static Future<void> prefetch() async { ... }
}
```

### Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `prefetch()` | `Future<void>` | Fetch models from `/v1/models_info`, cache them, and initialize capabilities. Skips the network call if the cache is still valid (< 24 hours). Fails silently on error |

### Prefetch Flow

1. Check `ModelCacheService.isCacheValid()`. If valid, initialize `ModelCapabilitiesService` from cache and return.
2. Refresh the Supabase session to get a valid access token.
3. Load and cache the user's provider preferences via `UserPreferencesService`.
4. GET `/v1/models_info` with a 3-second timeout.
5. Parse the response and save to `ModelCacheService`.
6. Call `ModelCapabilitiesService.refresh()` to populate the in-memory vision cache.

The service is guarded against concurrent calls -- if `prefetch()` is already running, subsequent calls return immediately.

---

## ModelCapabilitiesService

Provides synchronous and asynchronous lookups for model capabilities (currently vision support) using an in-memory cache built from the cached API data.

### Definition

```dart
// lib/services/model_capabilities_service.dart

class ModelCapabilitiesService {
  static Future<void> initialize() async { ... }
  static Future<void> refresh() async { ... }
  static Future<bool> supportsImageInput(String modelId) async { ... }
  static bool supportsImageInputSync(String modelId) { ... }
}
```

### Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `initialize()` | `Future<void>` | Load cached models and build the in-memory vision support map. No-op if already initialized |
| `refresh()` | `Future<void>` | Reset and re-initialize from disk cache. Call after model data is refreshed from the API |
| `supportsImageInput(modelId)` | `Future<bool>` | Async check; auto-initializes if needed. Returns `false` for unknown models |
| `supportsImageInputSync(modelId)` | `bool` | Synchronous check for use in build methods. Returns `false` if the cache is not yet initialized |

The service reads the `supports_vision` boolean field from each cached model entry. No hardcoded model lists are used -- all capability data originates from the API.

## Usage Examples

### Startup Prefetch

```dart
// In app initialization
await ModelPrefetchService.prefetch();
```

### Checking Vision Support in UI

```dart
// Synchronous -- safe in build()
final canAttachImage = ModelCapabilitiesService.supportsImageInputSync(
  selectedModelId,
);

// Asynchronous -- auto-initializes
final canAttachImage = await ModelCapabilitiesService.supportsImageInput(
  selectedModelId,
);
```

### Saving a User's Model Selection

```dart
await ModelCacheService.saveSelectedModel(userId, 'deepseek/deepseek-chat');

// Later...
final savedModel = await ModelCacheService.loadSelectedModel(userId);
```
