---
title: ThemeSettingsService
weight: 1
---

`ThemeSettingsService` manages per-user visual theme settings stored in the `theme_settings` Supabase table.

## Definition

```dart
// lib/services/theme_settings_service.dart

class ThemeSettings {
  const ThemeSettings({
    required this.userId,
    required this.themeMode,
    required this.accentColor,
    required this.iconColor,
    required this.backgroundColor,
    required this.grainEnabled,
  });

  final String userId;
  final Brightness themeMode;
  final Color accentColor;
  final Color iconColor;
  final Color backgroundColor;
  final bool grainEnabled;
}
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `userId` | `String` | User ID (foreign key to `auth.users`) |
| `themeMode` | `Brightness` | `Brightness.light` or `Brightness.dark` |
| `accentColor` | `Color` | Primary accent color throughout the UI |
| `iconColor` | `Color` | Foreground color for icons |
| `backgroundColor` | `Color` | Main background color |
| `grainEnabled` | `bool` | Whether the background grain texture effect is active |

## Defaults

When no saved settings exist, the service creates a row using app-wide constants:

| Property | Default Constant |
|----------|-----------------|
| `themeMode` | `kDefaultThemeMode` |
| `accentColor` | `kDefaultAccentColor` |
| `iconColor` | `kDefaultIconFgColor` |
| `backgroundColor` | `kDefaultBgColor` |
| `grainEnabled` | `kDefaultGrainEnabled` |

## Serialization

Colors are stored as hex strings using the `ColorExtension` utility. Theme mode is stored as the string `"light"` or `"dark"`.

```dart
Map<String, dynamic> toMap() {
  return {
    'user_id': userId,
    'theme_mode': themeMode == Brightness.light ? 'light' : 'dark',
    'accent_color': accentColor.toHexString(),
    'icon_color': iconColor.toHexString(),
    'background_color': backgroundColor.toHexString(),
    'grain_enabled': grainEnabled,
  };
}
```

## Service Methods

```dart
class ThemeSettingsService {
  const ThemeSettingsService();

  Future<ThemeSettings> loadOrCreate();
  Future<void> save(ThemeSettings settings);
}
```

| Method | Return | Description |
|--------|--------|-------------|
| `loadOrCreate()` | `Future<ThemeSettings>` | Fetches the current user's theme row, or inserts defaults if none exists. Throws `ThemeSettingsServiceException` if the user is not signed in. |
| `save(settings)` | `Future<void>` | Upserts the given `ThemeSettings` to the `theme_settings` table, keyed on `user_id`. |

## Error Handling

```dart
class ThemeSettingsServiceException implements Exception {
  const ThemeSettingsServiceException(this.message);
  final String message;
}
```

Thrown when `loadOrCreate()` is called without an authenticated user.

## Usage Examples

### Loading Theme Settings

```dart
final service = const ThemeSettingsService();
final settings = await service.loadOrCreate();

// Apply theme
final brightness = settings.themeMode; // Brightness.dark
final accent = settings.accentColor;   // Color(0xFF...)
```

### Updating a Single Property

```dart
final updated = settings.copyWith(
  themeMode: Brightness.light,
);
await service.save(updated);
```

### Changing Accent Color

```dart
final updated = settings.copyWith(
  accentColor: const Color(0xFF6200EE),
);
await service.save(updated);
```
