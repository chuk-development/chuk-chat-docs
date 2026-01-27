---
title: Configuration
weight: 6
---

This guide covers environment variables, feature flags, and runtime configuration for the Chuk Chat application.

## Environment Variables

### Compile-Time Variables

Compile-time variables are embedded into the application binary using Dart's `--dart-define` flag. These cannot be changed after compilation.

```bash
flutter build apk \
  --dart-define=SUPABASE_URL=https://xxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key \
  --dart-define=API_BASE_URL=https://api.chuk.chat \
  --dart-define=ENVIRONMENT=production
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...` |
| `API_BASE_URL` | Backend API base URL | `https://api.chuk.chat` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Environment name | `production` |
| `SENTRY_DSN` | Sentry error tracking DSN | (none) |
| `ANALYTICS_ID` | Analytics tracking ID | (none) |

### Accessing in Code

```dart
// lib/core/config/env_config.dart

class EnvConfig {
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: '',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.chuk.chat',
  );

  static const String environment = String.fromEnvironment(
    'ENVIRONMENT',
    defaultValue: 'production',
  );

  static bool get isDevelopment => environment == 'development';
  static bool get isProduction => environment == 'production';

  static void validate() {
    if (supabaseUrl.isEmpty) {
      throw ConfigurationException('SUPABASE_URL is required');
    }
    if (supabaseAnonKey.isEmpty) {
      throw ConfigurationException('SUPABASE_ANON_KEY is required');
    }
  }
}
```

---

## Runtime Configuration (.env)

For desktop development, runtime configuration can be loaded from a `.env` file.

{{< callout type="info" >}}
The `.env` file is only loaded for desktop development builds. Production builds and mobile apps use compile-time defines exclusively.
{{< /callout >}}

### .env File Format

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# API Configuration
API_BASE_URL=https://api.chuk.chat

# Development Settings
DEBUG_MODE=true
LOG_LEVEL=debug
```

### Loading .env in Development

```dart
import 'package:flutter_dotenv/flutter_dotenv.dart';

Future<void> main() async {
  // Load .env file for desktop development
  if (Platform.isWindows || Platform.isLinux || Platform.isMacOS) {
    await dotenv.load(fileName: '.env');
  }

  // Validate configuration
  EnvConfig.validate();

  runApp(const MyApp());
}

// Accessing runtime config
class RuntimeConfig {
  static String get supabaseUrl =>
      dotenv.env['SUPABASE_URL'] ?? EnvConfig.supabaseUrl;

  static String get apiBaseUrl =>
      dotenv.env['API_BASE_URL'] ?? EnvConfig.apiBaseUrl;

  static bool get debugMode =>
      dotenv.env['DEBUG_MODE']?.toLowerCase() == 'true';
}
```

---

## Feature Flags

Feature flags control which features are enabled in a build. They are defined at compile-time.

### Available Feature Flags

| Flag | Description | Default |
|------|-------------|---------|
| `FEATURE_PROJECTS` | Project workspaces | `true` |
| `FEATURE_IMAGE_GEN` | AI image generation | `true` |
| `FEATURE_VOICE_MODE` | Voice input/output | `false` |
| `FEATURE_MEDIA_MANAGER` | Media library management | `true` |
| `FEATURE_ASSISTANTS` | Custom AI assistants | `false` |
| `FEATURE_WEB_SEARCH` | Web search integration | `false` |
| `FEATURE_CODE_EXEC` | Code execution sandbox | `false` |

### Build Command with Features

```bash
flutter build apk \
  --dart-define=SUPABASE_URL=https://xxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=xxx \
  --dart-define=API_BASE_URL=https://api.chuk.chat \
  --dart-define=FEATURE_PROJECTS=true \
  --dart-define=FEATURE_IMAGE_GEN=true \
  --dart-define=FEATURE_VOICE_MODE=true \
  --dart-define=FEATURE_MEDIA_MANAGER=true \
  --dart-define=FEATURE_ASSISTANTS=false
```

### Feature Flag Constants

```dart
// lib/core/config/feature_flags.dart

class FeatureFlags {
  /// Project workspaces with file context
  static const bool projects = bool.fromEnvironment(
    'FEATURE_PROJECTS',
    defaultValue: true,
  );

  /// AI image generation
  static const bool imageGeneration = bool.fromEnvironment(
    'FEATURE_IMAGE_GEN',
    defaultValue: true,
  );

  /// Voice input with transcription
  static const bool voiceMode = bool.fromEnvironment(
    'FEATURE_VOICE_MODE',
    defaultValue: false,
  );

  /// Media library for generated images
  static const bool mediaManager = bool.fromEnvironment(
    'FEATURE_MEDIA_MANAGER',
    defaultValue: true,
  );

  /// Custom AI assistants
  static const bool assistants = bool.fromEnvironment(
    'FEATURE_ASSISTANTS',
    defaultValue: false,
  );

  /// Web search integration
  static const bool webSearch = bool.fromEnvironment(
    'FEATURE_WEB_SEARCH',
    defaultValue: false,
  );

  /// Code execution sandbox
  static const bool codeExecution = bool.fromEnvironment(
    'FEATURE_CODE_EXEC',
    defaultValue: false,
  );
}
```

### Using Feature Flags

```dart
// In UI
Widget build(BuildContext context) {
  return Column(
    children: [
      // Always show chat
      ChatPanel(),

      // Conditionally show features
      if (FeatureFlags.projects)
        ProjectsPanel(),

      if (FeatureFlags.imageGeneration)
        ImageGenerationButton(),

      if (FeatureFlags.voiceMode)
        VoiceInputButton(),
    ],
  );
}

// In navigation
GoRouter get router => GoRouter(
  routes: [
    GoRoute(path: '/', builder: (_, __) => HomePage()),
    GoRoute(path: '/chat', builder: (_, __) => ChatPage()),

    if (FeatureFlags.projects)
      GoRoute(path: '/projects', builder: (_, __) => ProjectsPage()),

    if (FeatureFlags.mediaManager)
      GoRoute(path: '/media', builder: (_, __) => MediaPage()),
  ],
);
```

---

## API Configuration Service

The `ApiConfigService` provides runtime access to API configuration and health checking.

### Configuration Access

```dart
// lib/services/api_config_service.dart

class ApiConfigService {
  static final ApiConfigService _instance = ApiConfigService._internal();
  factory ApiConfigService() => _instance;
  ApiConfigService._internal();

  /// Base URL for API requests
  static String get apiBaseUrl => EnvConfig.apiBaseUrl;

  /// Current environment
  static String get environment => EnvConfig.environment;

  /// Current platform identifier
  static String get platform {
    if (Platform.isAndroid) return 'android';
    if (Platform.isIOS) return 'ios';
    if (Platform.isWindows) return 'windows';
    if (Platform.isMacOS) return 'macos';
    if (Platform.isLinux) return 'linux';
    return 'unknown';
  }

  /// Whether configuration is complete
  static bool get isConfigured {
    return EnvConfig.supabaseUrl.isNotEmpty &&
           EnvConfig.supabaseAnonKey.isNotEmpty;
  }

  /// Get all configuration as map (for debugging)
  static Map<String, dynamic> get configMap => {
    'apiBaseUrl': apiBaseUrl,
    'environment': environment,
    'platform': platform,
    'isConfigured': isConfigured,
    'features': {
      'projects': FeatureFlags.projects,
      'imageGeneration': FeatureFlags.imageGeneration,
      'voiceMode': FeatureFlags.voiceMode,
      'mediaManager': FeatureFlags.mediaManager,
      'assistants': FeatureFlags.assistants,
    },
  };
}
```

### API Health Check

```dart
// lib/services/api_status_service.dart

class ApiStatusService {
  final Dio _dio;

  ApiStatusService() : _dio = Dio();

  /// Check if API is reachable and healthy
  Future<ApiHealthStatus> checkHealth() async {
    try {
      final stopwatch = Stopwatch()..start();

      final response = await _dio.get(
        '${ApiConfigService.apiBaseUrl}/health',
        options: Options(
          sendTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      );

      stopwatch.stop();

      return ApiHealthStatus(
        isHealthy: response.statusCode == 200,
        latencyMs: stopwatch.elapsedMilliseconds,
        version: response.data?['version'],
        timestamp: DateTime.now(),
      );
    } on DioException catch (e) {
      return ApiHealthStatus(
        isHealthy: false,
        error: e.message,
        timestamp: DateTime.now(),
      );
    }
  }

  /// Monitor API health with periodic checks
  Stream<ApiHealthStatus> monitorHealth({
    Duration interval = const Duration(minutes: 1),
  }) async* {
    while (true) {
      yield await checkHealth();
      await Future.delayed(interval);
    }
  }
}

class ApiHealthStatus {
  final bool isHealthy;
  final int? latencyMs;
  final String? version;
  final String? error;
  final DateTime timestamp;

  ApiHealthStatus({
    required this.isHealthy,
    this.latencyMs,
    this.version,
    this.error,
    required this.timestamp,
  });

  @override
  String toString() {
    if (isHealthy) {
      return 'Healthy (${latencyMs}ms, v$version)';
    }
    return 'Unhealthy: $error';
  }
}
```

### Usage in Application

```dart
// Check health on app startup
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Validate configuration
  EnvConfig.validate();

  // Check API health
  final apiStatus = ApiStatusService();
  final health = await apiStatus.checkHealth();

  if (!health.isHealthy) {
    print('Warning: API is unreachable: ${health.error}');
  }

  runApp(const MyApp());
}

// Health indicator widget
class ApiHealthIndicator extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<ApiHealthStatus>(
      stream: ApiStatusService().monitorHealth(),
      builder: (context, snapshot) {
        final status = snapshot.data;

        if (status == null) {
          return const Icon(Icons.cloud_off, color: Colors.grey);
        }

        return Icon(
          status.isHealthy ? Icons.cloud_done : Icons.cloud_off,
          color: status.isHealthy ? Colors.green : Colors.red,
        );
      },
    );
  }
}
```

---

## Platform-Specific Configuration

### Android Configuration

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest>
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.RECORD_AUDIO"/>
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>

  <application
    android:networkSecurityConfig="@xml/network_security_config">
    <!-- ... -->
  </application>
</manifest>
```

```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<network-security-config>
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">api.chuk.chat</domain>
    <domain includeSubdomains="true">supabase.co</domain>
  </domain-config>
</network-security-config>
```

### iOS Configuration

```xml
<!-- ios/Runner/Info.plist -->
<dict>
  <key>NSMicrophoneUsageDescription</key>
  <string>Used for voice input</string>

  <key>NSPhotoLibraryUsageDescription</key>
  <string>Used to save generated images</string>

  <key>NSAppTransportSecurity</key>
  <dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
      <key>api.chuk.chat</key>
      <dict>
        <key>NSExceptionAllowsInsecureHTTPLoads</key>
        <false/>
        <key>NSExceptionMinimumTLSVersion</key>
        <string>TLSv1.2</string>
      </dict>
    </dict>
  </dict>
</dict>
```

### Desktop Configuration

```dart
// lib/core/config/desktop_config.dart

class DesktopConfig {
  static Future<void> initialize() async {
    if (!Platform.isWindows && !Platform.isLinux && !Platform.isMacOS) {
      return;
    }

    // Set window properties
    await windowManager.ensureInitialized();

    const windowOptions = WindowOptions(
      size: Size(1200, 800),
      minimumSize: Size(800, 600),
      center: true,
      title: 'chuk_chat',
    );

    await windowManager.waitUntilReadyToShow(windowOptions, () async {
      await windowManager.show();
      await windowManager.focus();
    });
  }
}
```

---

## Configuration Validation

### Startup Validation

```dart
class ConfigValidator {
  static List<String> validate() {
    final errors = <String>[];

    // Check required environment variables
    if (EnvConfig.supabaseUrl.isEmpty) {
      errors.add('SUPABASE_URL is not configured');
    } else if (!Uri.tryParse(EnvConfig.supabaseUrl)!.isAbsolute) {
      errors.add('SUPABASE_URL is not a valid URL');
    }

    if (EnvConfig.supabaseAnonKey.isEmpty) {
      errors.add('SUPABASE_ANON_KEY is not configured');
    }

    if (EnvConfig.apiBaseUrl.isEmpty) {
      errors.add('API_BASE_URL is not configured');
    }

    // Validate feature flag combinations
    if (FeatureFlags.voiceMode && !_hasMicrophonePermission()) {
      errors.add('Voice mode enabled but microphone permission not available');
    }

    return errors;
  }

  static bool _hasMicrophonePermission() {
    // Platform-specific permission check
    return true; // Simplified
  }
}

// Usage in main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final configErrors = ConfigValidator.validate();
  if (configErrors.isNotEmpty) {
    for (final error in configErrors) {
      print('Configuration Error: $error');
    }
    // Show error UI or exit
    return;
  }

  runApp(const MyApp());
}
```

---

## Best Practices

### 1. Never Hardcode Secrets

```dart
// Bad
const apiKey = 'sk-live-abc123';

// Good
const apiKey = String.fromEnvironment('API_KEY');
```

### 2. Use Separate Configurations per Environment

```bash
# Development
flutter run --dart-define-from-file=config/dev.env

# Production
flutter build apk --dart-define-from-file=config/prod.env
```

### 3. Validate Early

```dart
void main() async {
  // Validate before any other initialization
  EnvConfig.validate();

  // Then initialize services
  await Supabase.initialize(...);
}
```

### 4. Document Required Variables

```dart
/// Configuration requirements:
///
/// Required compile-time variables:
/// - SUPABASE_URL: Your Supabase project URL
/// - SUPABASE_ANON_KEY: Your Supabase anonymous key
/// - API_BASE_URL: Backend API URL
///
/// Optional variables:
/// - ENVIRONMENT: 'development' or 'production' (default: 'production')
/// - SENTRY_DSN: Sentry error tracking DSN
class EnvConfig { ... }
```
