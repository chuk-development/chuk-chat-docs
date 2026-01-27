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

| Category | Base Path | Description |
|----------|-----------|-------------|
| Chat | `/protected/chat` | Message streaming and completions |
| Audio | `/protected/transcribe-audio` | Speech-to-text transcription |
| Models | `/api/models` | Available AI models |
| Health | `/health` | Service status |

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
  {{< card link="configuration" title="Configuration" subtitle="Models and settings" >}}
  {{< card link="error-handling" title="Error Handling" subtitle="Error codes and responses" >}}
{{< /cards >}}
