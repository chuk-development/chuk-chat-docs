---
title: Configuration Services
weight: 7
---

Configuration services manage API endpoints, network connectivity, and AI model metadata throughout the application lifecycle.

## Services

| Service | Purpose | Source |
|---------|---------|--------|
| [ApiConfigService](api-config-service) | Resolves the API base URL from environment variables with platform-aware fallbacks | `api_config_service.dart` |
| [ApiStatusService](api-status-service) | Probes the API health endpoint to determine if the backend is reachable | `api_status_service.dart` |
| [NetworkStatusService](network-status-service) | Detects general internet connectivity using parallel probes with failure thresholds | `network_status_service.dart` |
| [Model Services](model-services) | Cache, prefetch, and query capabilities of AI models | `model_cache_service.dart`, `model_prefetch_service.dart`, `model_capabilities_service.dart` |

## Architecture

Configuration services are all static utility classes with no instance state. They form a dependency chain during app startup:

```
App Start
  -> ApiConfigService          (resolve base URL)
  -> NetworkStatusService      (check internet)
  -> ApiStatusService          (check API health)
  -> ModelPrefetchService      (fetch & cache models)
     -> ModelCacheService      (persist to SharedPreferences)
     -> ModelCapabilitiesService (in-memory vision lookup)
```

`ApiConfigService` uses conditional exports to provide a platform-specific implementation: `api_config_service_io.dart` for native platforms (uses `dart:io` for `Platform` detection) and `api_config_service_stub.dart` for web (returns `'web'` as the platform name).
