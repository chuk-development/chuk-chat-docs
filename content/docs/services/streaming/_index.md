---
title: Streaming Services
weight: 3
---

Streaming services handle real-time AI response delivery using Server-Sent Events (SSE), with support for multiple concurrent streams and background processing.

## Overview

Chuk Chat streams AI responses token-by-token to provide instant feedback. The streaming architecture consists of three layers:

| Service | Responsibility |
|---------|---------------|
| [`StreamingManager`](./streaming-manager) | Orchestrates multiple concurrent streams, buffers content, manages lifecycle and background notifications |
| [`StreamingChatService`](./http-streaming) | Low-level SSE client that sends requests and yields `ChatStreamEvent` objects |
| [`StreamingForegroundService`](./foreground-service) | Android foreground service to keep streams alive when the app is backgrounded |

## Event Flow

```
StreamingChatService.sendStreamingChat()
  -> yields ChatStreamEvent (content, reasoning, tps, usage, error, done)
    -> StreamingManager.startStream() listens to the event stream
      -> ContentEvent: appends to buffer, calls onUpdate callback
      -> ReasoningEvent: appends to reasoning buffer, calls onUpdate
      -> TpsEvent: stores tokens-per-second metric
      -> DoneEvent: calls onComplete, shows notification if backgrounded
      -> ErrorEvent: calls onError, cleans up stream
```

## Platform Variants

`StreamingManager` uses conditional exports for platform-specific behavior:

- **`streaming_manager_io.dart`** (Android/iOS/desktop) -- Integrates with `StreamingForegroundService` and `NotificationService` for background streaming notifications
- **`streaming_manager_stub.dart`** (Web) -- Same core logic without platform notification APIs

## Related

- [ChatStreamEvent Model](/docs/models/) -- Event types emitted during streaming
- [Chat Services](/docs/services/chat/) -- Higher-level chat orchestration that uses streaming
