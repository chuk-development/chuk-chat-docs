---
title: API Reference
weight: 4
---

Complete API documentation for the Chuk Chat backend services. All endpoints use HTTPS and require authentication unless otherwise noted.

## Base URL

```
https://api.chuk.chat
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```http
Authorization: Bearer {accessToken}
```

Tokens are obtained through Supabase authentication and should be refreshed before expiration.

## Endpoints Overview

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (status, active_connections) |
| GET | `/` | Root/info |
| GET | `/v1/models_info` | Public models info (no auth required) |

### Protected Endpoints (Bearer Token)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/ai/chat` | Chat streaming (SSE) |
| WS | `/v1/ai/chat/ws` | Chat streaming (WebSocket) |
| GET | `/v1/ai/models` | List available AI models |
| GET | `/v1/ai/config` | AI configuration (optional `model_id` query param) |
| POST | `/v1/ai/convert-file` | File to markdown conversion |
| POST | `/v1/ai/generate-image` | Image generation |
| POST | `/v1/ai/transcribe-audio` | Audio transcription (Groq Whisper) |
| GET | `/v1/user/status` | Subscription and credit status |
| DELETE | `/v1/user/delete-account` | Account deletion |
| POST | `/v1/stripe/create-checkout-session` | Start subscription |
| POST | `/v1/stripe/create-portal-session` | Manage subscription |
| POST | `/v1/stripe/sync-subscription` | Sync subscription state |

### Webhook Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhooks/stripe` | Stripe webhook handler |

## Response Format

All responses use JSON format with consistent structure:

**Success Response:**
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": { ... }
  }
}
```

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Chat completions | 60 requests | 1 minute |
| Audio transcription | 30 requests | 1 minute |
| Image generation | 10 requests | 1 minute |

## API Sections

{{< cards >}}
  {{< card link="chat-endpoints" title="Chat Endpoints" subtitle="Streaming and completions" >}}
  {{< card link="audio-endpoints" title="Audio Endpoints" subtitle="Speech transcription" >}}
  {{< card link="file-endpoints" title="File Endpoints" subtitle="File to markdown conversion" >}}
  {{< card link="image-endpoints" title="Image Endpoints" subtitle="Image generation" >}}
  {{< card link="configuration" title="Configuration" subtitle="Models and settings" >}}
  {{< card link="models-endpoint" title="Models" subtitle="Available AI models" >}}
  {{< card link="tts-endpoint" title="Text-to-Speech" subtitle="Inworld TTS" >}}
  {{< card link="user-endpoints" title="User & Billing" subtitle="Subscriptions and account" >}}
  {{< card link="error-handling" title="Error Handling" subtitle="Error codes and responses" >}}
{{< /cards >}}
