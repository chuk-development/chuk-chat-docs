---
title: Models Endpoints
weight: 6
---


The models endpoints provide information about available AI models. A public endpoint is available for general model information, while the protected endpoint returns the full model list for authenticated users.

## List Available Models (Protected)

```http
GET /v1/ai/models
```

Returns the list of AI models available to the authenticated user.

### Headers

```http
Authorization: Bearer {accessToken}
```

### Response

Returns an array of model objects:

```json
[
  {
    "id": "deepseek/deepseek-chat",
    "name": "DeepSeek Chat",
    "icon_url": "https://example.com/icon.png",
    "supports_vision": false
  },
  {
    "id": "openai/gpt-4o",
    "name": "GPT-4o",
    "icon_url": "https://example.com/gpt4o.png",
    "supports_vision": true
  }
]
```

### Model Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique model identifier used in chat requests |
| `name` | string | Human-readable model display name |
| `icon_url` | string | URL to the model provider icon |
| `supports_vision` | boolean | Whether the model accepts image inputs |

### Example

```dart
Future<List<Map<String, dynamic>>> getModels() async {
  final dio = Dio();
  final response = await dio.get(
    'https://api.chuk.chat/v1/ai/models',
    options: Options(
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
    ),
  );

  return List<Map<String, dynamic>>.from(response.data);
}
```

---

## Public Models Info

```http
GET /v1/models_info
```

Returns public model information without requiring authentication. This endpoint is used for displaying model details before the user has signed in.

### Response

Returns an array of model objects with the same structure as the protected endpoint.

### Example

```dart
Future<List<Map<String, dynamic>>> getPublicModelsInfo() async {
  final dio = Dio();
  final response = await dio.get(
    'https://api.chuk.chat/v1/models_info',
  );

  return List<Map<String, dynamic>>.from(response.data);
}
```

---

## Client Integration

The Chuk Chat app uses the **public** `/v1/models_info` endpoint exclusively — it does not call the protected `/v1/ai/models` endpoint. `ModelPrefetchService` fetches models at startup from `/v1/models_info`, and `ModelCacheService` maintains a local SharedPreferences cache to reduce API calls. Vision support is determined from the `supports_vision` field in the API response.
