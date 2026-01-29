---
title: Web Deployment
weight: 9
---

Chuk Chat can be deployed as a web application using Docker with an nginx reverse proxy. This page covers the Docker build process, nginx configuration, credential handling, and feature flags for web builds.

## Docker Build

The web deployment uses a two-stage Docker build defined in `Dockerfile.web`:

1. **Build stage** -- Flutter 3.38.8 SDK compiles the app to JavaScript
2. **Serve stage** -- `nginx:alpine` serves the compiled output

### Why `web_env.dart` Is Generated at Build Time

Dart's `--dart-define` values are not reliably embedded by `dart2js` in release builds. To work around this, `Dockerfile.web` generates a `lib/web_env.dart` file at build time containing Supabase credentials as plain Dart constants. The app's credential resolution logic picks these up when `--dart-define` values are empty.

### Build Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |

### Feature Flags

The Dockerfile passes feature flags via `--dart-define`:

| Flag | Value | Reason |
|------|-------|--------|
| `FEATURE_PROJECTS` | `false` | Not yet optimized for web |
| `FEATURE_IMAGE_GEN` | `false` | Disabled for web |
| `FEATURE_VOICE_MODE` | `false` | MediaRecorder works but UI not ready |
| `FEATURE_MEDIA_MANAGER` | `true` | Enabled |

### Build Command

```bash
docker build -f Dockerfile.web \
  --build-arg SUPABASE_URL=https://xxx.supabase.co \
  --build-arg SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs... \
  -t chuk-chat-web .
```

---

## Nginx Configuration

The nginx configuration (`nginx.web.conf`) is tuned for Flutter web apps deployed behind Cloudflare or served directly.

### Cache Headers

**No-cache** headers are set on entry points that change with every deploy:

- `index.html`
- `flutter_service_worker.js`
- `flutter_bootstrap.js`
- `main.dart.js`
- `version.json`
- `manifest.json`

**Long-lived cache** (1 year) is set for static assets that include content hashes in their filenames (CSS, images, fonts, WASM).

### Compression

Gzip compression is enabled for the following MIME types:

- `text/plain`, `text/html`, `text/css`, `text/xml`
- `application/javascript`, `application/json`
- `application/wasm`

### SPA Routing

All requests that do not match an existing file are served `index.html`, enabling Flutter's client-side routing.

### Security

- Dotfile access (e.g., `.env`, `.git`) is blocked and returns 404.

### Cloudflare Considerations

`main.dart.js` does not include a content hash in its filename. Without explicit `no-cache` headers, Cloudflare may serve a stale version of this file after a new deploy. The nginx configuration prevents this by setting `Cache-Control: no-cache` on `main.dart.js`.

---

## Credential Handling (`web_env.dart`)

Chuk Chat resolves Supabase credentials using a 4-tier priority system:

| Priority | Source | Used By |
|----------|--------|---------|
| 1 | `--dart-define` compile-time constants | Mobile and desktop release builds |
| 2 | Generated `web_env.dart` constants | Web Docker builds |
| 3 | Runtime `.env` file | Desktop development |
| 4 | Placeholder fallback | Catches missing config at startup |

The app checks each source in order and uses the first non-empty value. This allows the same codebase to work across all platforms without conditional imports for configuration.

---

## Web Feature Flags

The following table summarizes feature availability in web builds:

| Feature Flag | Web Status | Notes |
|--------------|------------|-------|
| `FEATURE_PROJECTS` | Disabled | Not yet optimized for web |
| `FEATURE_IMAGE_GEN` | Disabled | Not available on web |
| `FEATURE_VOICE_MODE` | Disabled | MediaRecorder API works but UI is not ready |
| `FEATURE_MEDIA_MANAGER` | Enabled | Fully functional on web |

These flags are set in `Dockerfile.web` and compiled into the build. See [Configuration]({{< relref "/docs/api/configuration" >}}) for the full list of feature flags and how they are accessed in code.
