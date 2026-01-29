---
title: Utils
weight: 5
---

The `lib/utils/` directory contains utility classes, helpers, and platform stubs used across the application.

## Security & Networking

| File | Description |
|------|-------------|
| `certificate_pinning.dart` | TLS certificate pinning for Supabase and API connections using cryptographic hash verification. |
| `secure_token_handler.dart` | Secure handling of authentication tokens: masking in logs, safe storage patterns. |
| `input_validator.dart` | Password strength evaluation (`PasswordStrength` enum: weak, medium, strong) and input sanitization. |
| `file_upload_validator.dart` | Validates file uploads: checks archive contents, prevents zip bombs, enforces size limits. |

## Rate Limiting

| File | Description |
|------|-------------|
| `api_rate_limiter.dart` | API rate limiting configuration for different endpoint types (chat, file upload, etc.). |
| `api_request_queue.dart` | Request queue with concurrency control for API calls. |
| `upload_rate_limiter.dart` | Upload-specific rate limiter to prevent abuse via excessive file uploads. |
| `exponential_backoff.dart` | Exponential backoff with jitter for retry logic. |

## Logging

| File | Description |
|------|-------------|
| `privacy_logger.dart` | Privacy-aware logging for release builds: redacts sensitive data from log output. |
| `service_logger.dart` | Structured logging utility for service-layer operations. |
| `service_error_handler.dart` | Centralized error handling for Dio HTTP errors and service exceptions. |

## UI Helpers

| File | Description |
|------|-------------|
| `color_extensions.dart` | `Color` extension methods for hex conversion and manipulation. |
| `theme_extensions.dart` | `ThemeData` extensions for accessing custom icon colors. |
| `grain_overlay.dart` | Film grain visual overlay effect rendered as a custom painter. |
| `highlight_registry.dart` | Registers syntax highlighting languages (Dart, JSON, Python, etc.) for code blocks in chat messages. |
| `token_estimator.dart` | `TokenEstimator` class for approximating token counts from text length. |

## Platform Abstraction Stubs

These files provide conditional exports so the app compiles on all platforms (including web):

| File | Description |
|------|-------------|
| `io_helper.dart` | Conditional export: `dart:io` on native, stubs on web. |
| `io_helper_io.dart` | Native implementation: re-exports `File`, `Directory`, `Platform` from `dart:io`. |
| `io_helper_stub.dart` | Web stub: no-op implementations for `dart:io` types. |
| `path_provider_stub.dart` | Web stub for `package:path_provider`. |
| `permission_handler_stub.dart` | Web stub for `package:permission_handler`. |
| `record_stub.dart` | Web stub for `package:record` (audio recording). |
| `desktop_drop_stub.dart` | Web stub for `package:desktop_drop` (drag-and-drop). |
