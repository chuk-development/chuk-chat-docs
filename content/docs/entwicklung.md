---
title: Entwicklung
weight: 7
---

# Entwicklungsumgebung

## Voraussetzungen

| Tool | Version |
|------|---------|
| Dart SDK | ≥3.9.2 |
| Flutter SDK | ≥3.35.0 |
| Go | ≥1.20 (für Hugo Module) |

## Setup

### 1. Repository klonen

```bash
git clone https://github.com/your-org/chuk_chat.git
cd chuk_chat
```

### 2. Environment konfigurieren

```bash
cp .env.example .env
# .env bearbeiten mit Supabase-Credentials
```

### 3. Abhängigkeiten installieren

```bash
flutter pub get
```

### 4. App starten

```bash
# Linux Desktop
./run.sh linux

# Oder direkt
flutter run -d linux
```

---

## Build Commands

### Development

```bash
# Auto-detect Platform
flutter run

# Spezifische Plattform
flutter run -d linux
flutter run -d windows
flutter run -d android
flutter run -d ios
```

### Production Builds

```bash
# Linux (alle Pakete)
./build.sh linux

# Einzelne Pakete
./build.sh deb      # Debian
./build.sh rpm      # RPM
./build.sh appimage # AppImage

# Android
./build.sh apk

# Alle Plattformen
./build.sh all
```

### Mit Feature Flags

```bash
flutter build apk \
  --dart-define=FEATURE_PROJECTS=true \
  --dart-define=FEATURE_IMAGE_GEN=true \
  --dart-define=PLATFORM_MOBILE=true \
  --tree-shake-icons
```

---

## Projektstruktur

### Neuen Service hinzufügen

{{< steps >}}

### Service erstellen

```dart
// lib/services/my_service.dart
class MyService {
  static Future<void> initialize() async {
    // Setup
  }

  static Future<Result> doSomething() async {
    // Business Logic
  }
}
```

### In main.dart initialisieren (falls nötig)

```dart
Future<void> _initializeServicesAsync() async {
  await MyService.initialize();
}
```

### In UI verwenden

```dart
final result = await MyService.doSomething();
```

{{< /steps >}}

### Neue Page hinzufügen

{{< steps >}}

### Page erstellen

```dart
// lib/pages/my_page.dart
class MyPage extends StatefulWidget {
  const MyPage({super.key});

  @override
  State<MyPage> createState() => _MyPageState();
}

class _MyPageState extends State<MyPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Page')),
      body: const Center(child: Text('Content')),
    );
  }
}
```

### Navigation hinzufügen

```dart
Navigator.push(
  context,
  MaterialPageRoute(builder: (_) => const MyPage()),
);
```

{{< /steps >}}

---

## Code Style

### Analyse

```bash
flutter analyze
```

### Formatierung

```bash
dart format .
```

### Lint-Regeln

Definiert in `analysis_options.yaml`:

```yaml
include: package:flutter_lints/flutter.yaml

linter:
  rules:
    prefer_const_constructors: true
    prefer_final_fields: true
    avoid_print: true
```

---

## Debugging

### Debug Mode Check

```dart
import 'package:flutter/foundation.dart';

if (kDebugMode) {
  print('Only in debug builds');
}
```

{{< callout type="warning" >}}
**Niemals** `print()` ohne `kDebugMode`-Check verwenden!
{{< /callout >}}

### Service Logger

```dart
import 'package:chuk_chat/utils/service_logger.dart';

ServiceLogger.log('MyService', 'Operation completed');
ServiceLogger.error('MyService', 'Something failed', error);
```

---

## Testing

### Unit Tests ausführen

```bash
flutter test
```

### Widget Tests

```dart
// test/widget_test.dart
testWidgets('MyWidget renders correctly', (tester) async {
  await tester.pumpWidget(const MyWidget());
  expect(find.text('Expected'), findsOneWidget);
});
```

---

## Git Workflow

### Branch-Naming

```
feature/add-voice-mode
fix/chat-sync-issue
refactor/encryption-service
```

### Commit Messages

```
feat: add voice recording support
fix: resolve chat sync race condition
refactor: modularize ChatStorageService
docs: update API documentation
```

### Pre-Commit Checks

```bash
flutter analyze && dart format . && flutter test
```

---

## Wichtige Hinweise

{{< callout type="error" >}}
**Kritische Regeln:**
{{< /callout >}}

1. **Keine Debug-Builds für Android verwenden** - 3-10x langsamer
2. **Immer Release-Mode für APKs** - `--release`
3. **Logging in kDebugMode wrappen**
4. **Keine Benutzerinhalte in Logs**
5. **Tokens immer maskieren**

### Android Signing

Für Release-Builds:

```bash
cp android/key.properties.example android/key.properties
# key.properties mit Signing-Credentials bearbeiten
```

Siehe `docs/ANDROID_SIGNING.md` für Details.

---

## Abhängigkeiten

### Haupt-Dependencies

| Package | Version | Zweck |
|---------|---------|-------|
| `supabase_flutter` | ^2.10.3 | Backend |
| `dio` | ^5.4.0 | HTTP Client |
| `cryptography` | ^2.7.0 | Verschlüsselung |
| `flutter_secure_storage` | ^9.2.4 | Key Storage |
| `markdown_widget` | ^2.3.2+8 | Markdown Rendering |
| `record` | ^6.1.2 | Audio Recording |
| `pdfx` | ^2.8.0 | PDF Viewing |

### Dependency Update

```bash
flutter pub upgrade
flutter pub outdated
```

---

## Dokumentation

### Lokale Docs-Site

```bash
cd docs-site
docker compose up -d
# Öffne http://localhost:1313
```

### Docs aktualisieren

Markdown-Dateien in `docs-site/content/docs/` bearbeiten.
