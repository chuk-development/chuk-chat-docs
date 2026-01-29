---
title: ModelItem
weight: 5
---

Represents an AI model available for chat, mapping API model data to an internal representation used throughout the app.

## Definition

```dart
class ModelItem {
  final String name;       // Display name
  final String value;      // Model ID (slug for API)
  final bool isToggle;     // Not from API, for potential local use
  final String? badge;     // Not from API, for potential local use
  final String? iconUrl;   // Icon URL from API

  ModelItem({
    required this.name,
    required this.value,
    this.isToggle = false,
    this.badge,
    this.iconUrl,
  });
}
```

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `String` | Yes | Human-readable display name of the model |
| `value` | `String` | Yes | Model ID slug used for API requests (e.g., `deepseek/deepseek-r1`) |
| `isToggle` | `bool` | No | Local-only flag for UI toggle state. Defaults to `false` |
| `badge` | `String?` | No | Local-only badge label (e.g., "New", "Fast"). Defaults to `null` |
| `iconUrl` | `String?` | No | URL for the model provider's icon from the API |

## JSON Serialization

### fromJson

The factory constructor maps the API's `id` field to the internal `value` property. The `isToggle` and `badge` fields are not present in API responses and default to `false` and `null` respectively.

```dart
factory ModelItem.fromJson(Map<String, dynamic> json) {
  return ModelItem(
    name: json['name'] as String,
    value: json['id'] as String,   // 'id' from API becomes 'value'
    isToggle: false,
    badge: null,
    iconUrl: json['icon_url'] as String?,
  );
}
```

**Example API JSON input:**

```json
{
  "id": "deepseek/deepseek-r1",
  "name": "DeepSeek R1",
  "icon_url": "https://openrouter.ai/icons/deepseek.svg"
}
```

## Equality

`ModelItem` implements custom equality based solely on the `value` (model ID) property. Two `ModelItem` instances are considered equal if they reference the same model ID, regardless of display name or other fields.

```dart
@override
bool operator ==(Object other) =>
    identical(this, other) ||
    other is ModelItem &&
        runtimeType == other.runtimeType &&
        value == other.value;

@override
int get hashCode => value.hashCode;
```

## Usage Examples

```dart
// Create from API response
final model = ModelItem.fromJson(apiResponse);

// Create manually
final model = ModelItem(
  name: 'DeepSeek R1',
  value: 'deepseek/deepseek-r1',
  iconUrl: 'https://openrouter.ai/icons/deepseek.svg',
);

// Equality check (compares by model ID)
final a = ModelItem(name: 'Model A', value: 'deepseek/deepseek-r1');
final b = ModelItem(name: 'Model B', value: 'deepseek/deepseek-r1');
print(a == b); // true
```

## Related

- [AttachedFile](../attached-file) -- file attachments within a chat message
- [ChatMessage](../chat-message) -- messages that reference a selected model
