---
title: Overview
weight: 1
---

A secure, cross-platform chat application built with Flutter that puts privacy first. Chat with open-weight AI models while all conversations remain encrypted and under your control.

## Key Features

- **End-to-End Encryption** - AES-256-GCM with PBKDF2 key derivation
- **Cross-Platform** - Windows, macOS, Linux, Android, iOS
- **AI Chat** - Open-weight models via OpenRouter (DeepSeek, Llama, Mistral, Qwen, etc.)
- **Real-Time Streaming** - HTTP SSE and WebSocket
- **Offline Support** - Encrypted local cache
- **Projects** - Workspaces with system prompts and file context
- **Image Generation** - AI image generation via Z-Image Turbo

## Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | Flutter (Dart 3.9.2+) |
| Backend | Supabase (Auth, DB, Storage) |
| Encryption | AES-256-GCM |
| HTTP Client | Dio with Certificate Pinning |
| AI API | OpenRouter |

## Quick Navigation

{{< cards >}}
  {{< card link="architecture" title="Architecture" icon="template" >}}
  {{< card link="services" title="Services" icon="cog" >}}
  {{< card link="api" title="API Reference" icon="code" >}}
  {{< card link="database" title="Database" icon="database" >}}
  {{< card link="security" title="Security" icon="shield-check" >}}
  {{< card link="development" title="Development" icon="terminal" >}}
{{< /cards >}}
