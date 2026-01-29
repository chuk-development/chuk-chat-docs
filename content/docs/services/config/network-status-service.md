---
title: NetworkStatusService
weight: 3
---

`NetworkStatusService` detects general internet connectivity by running parallel probes against well-known endpoints, with consecutive-failure thresholds to avoid false offline states on slow networks.

## Definition

```dart
// lib/services/network_status_service.dart

class NetworkStatusService {
  static const Duration _defaultTimeout = Duration(seconds: 10);
  static const Duration _quickTimeout = Duration(seconds: 6);
  static const Duration _perProbeTimeout = Duration(seconds: 8);
  static const int _failuresRequiredForOffline = 2;

  static ValueListenable<bool> get isOnlineListenable;
  static bool get isOnline;

  static Future<bool> hasInternetConnection({
    Duration timeout,
    bool useCache,
  }) async { ... }

  static Future<bool> quickCheck() async { ... }
  static void resetFailureCount() { ... }
  static void setOffline() { ... }
  static void setOnline() { ... }
  static bool isNetworkError(dynamic error) { ... }
}
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `isOnline` | `bool` | Current network status (synchronous read) |
| `isOnlineListenable` | `ValueListenable<bool>` | Reactive notifier for observing network status changes in the UI |

## Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `hasInternetConnection({timeout, useCache})` | `Future<bool>` | Run parallel probes; returns `true` if any probe succeeds. Results are cached for 10 seconds |
| `quickCheck()` | `Future<bool>` | Shortcut with a 6-second timeout and no cache |
| `resetFailureCount()` | `void` | Reset the consecutive failure counter (call before user-initiated actions) |
| `setOffline()` | `void` | Manually set status to offline (for testing or explicit offline mode) |
| `setOnline()` | `void` | Manually set status to online (for testing) |
| `isNetworkError(error)` | `bool` | Returns `true` if the error string matches common network error patterns (socket exception, DNS failure, timeout, etc.) |

## Connectivity Probes

Three probes run in parallel. The first success short-circuits the result:

| Probe | URL | Expected Status |
|-------|-----|-----------------|
| Cloudflare DNS | `https://cloudflare-dns.com/dns-query?name=cloudflare.com&type=A` | 200 |
| Google 204 | `https://www.google.com/generate_204` | 204 |
| Cloudflare Trace | `https://1.1.1.1/cdn-cgi/trace` | 200 |

## Failure Threshold

The service requires **2 consecutive failures** before changing the reactive status to offline. This prevents brief network slowdowns from triggering UI offline indicators. Individual check results still return `false` immediately when all probes fail.

## Caching

Results are cached for 10 seconds. Passing `useCache: false` (or using `quickCheck()`) bypasses the cache.

## Usage Examples

### Checking Before a Network Call

```dart
final online = await NetworkStatusService.hasInternetConnection();
if (!online) {
  return showOfflineBanner();
}
```

### Listening for Status Changes

```dart
ValueListenableBuilder<bool>(
  valueListenable: NetworkStatusService.isOnlineListenable,
  builder: (context, isOnline, child) {
    return isOnline
        ? const SizedBox.shrink()
        : const OfflineBanner();
  },
);
```

### Classifying Errors

```dart
try {
  await fetchData();
} catch (e) {
  if (NetworkStatusService.isNetworkError(e)) {
    showSnackBar('Network error. Please check your connection.');
  } else {
    showSnackBar('Something went wrong.');
  }
}
```
