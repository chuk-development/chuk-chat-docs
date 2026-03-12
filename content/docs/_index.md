---
title: Overview
weight: 1
---

A secure, cross-platform chat application built with Flutter that puts privacy first. Chat with open-weight AI models while all conversations remain encrypted and under your control.

## Key Features

- **End-to-End Encryption** - AES-256-GCM with PBKDF2 key derivation
- **Cross-Platform** - Windows, macOS, Linux, Android, iOS, Web
- **AI Chat** - Open-weight models via OpenRouter (DeepSeek, Llama, Mistral, Qwen, etc.)
- **Tool Calling** - Extensible tool system with 14 built-in handlers (maps, QR, weather, web search, calculators, etc.)
- **Artifact Workspace** - Project-level artifact storage with diff tracking
- **Real-Time Streaming** - HTTP SSE and WebSocket with certificate pinning
- **Offline Support** - Encrypted local cache with offline fallback
- **Projects** - Workspaces with system prompts, file context, and artifacts
- **Interactive Maps** - Inline map rendering with numbered markers and route display
- **Image Generation** - AI image generation via Z-Image Turbo
- **In-App Updates** - Platform-specific update checks via GitHub Releases
- **Desktop System Tray** - Minimize-to-tray on desktop platforms

## Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | Flutter (Dart 3.9.2+) |
| Backend | Supabase (Auth, DB, Storage) |
| Encryption | AES-256-GCM |
| HTTP Client | Dio with Certificate Pinning |
| AI API | OpenRouter |

## Architecture Diagram

<div style="position:relative;width:100%;height:600px;border:1px solid;border-radius:8px;overflow:hidden;margin-bottom:8px;">
  <iframe src="/architecture-diagram/" style="width:100%;height:100%;border:none;"></iframe>
</div>
<a href="/architecture-diagram/" target="_blank" style="font-family:monospace;font-size:12px;">Open in new tab</a>

## Quick Navigation

{{< cards >}}
  {{< card link="architecture" title="Architecture" icon="template" >}}
  {{< card link="services" title="Services" icon="cog" >}}
  {{< card link="api" title="API Reference" icon="code" >}}
  {{< card link="database" title="Database" icon="database" >}}
  {{< card link="security" title="Security" icon="shield-check" >}}
  {{< card link="development" title="Development" icon="terminal" >}}
{{< /cards >}}
