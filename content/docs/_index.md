---
title: Übersicht
weight: 1
---

# chuk_chat

Eine sichere, plattformübergreifende Chat-Anwendung mit Flutter, die Datenschutz an erste Stelle setzt. Chatte mit Open-Weight AI-Modellen während alle Konversationen verschlüsselt und unter deiner Kontrolle bleiben.

## Hauptfeatures

- **Ende-zu-Ende-Verschlüsselung** - AES-256-GCM mit PBKDF2 Key-Derivation
- **Cross-Platform** - Windows, macOS, Linux, Android, iOS
- **AI Chat** - Open-Weight Models via OpenRouter (DeepSeek, Llama, Mistral, Qwen, etc.)
- **Echtzeit-Streaming** - HTTP SSE und WebSocket
- **Offline-Support** - Verschlüsselter lokaler Cache
- **Projekte** - Workspaces mit System-Prompts und Datei-Kontext
- **Bildgenerierung** - AI-Bildgenerierung via Z-Image Turbo

## Technologie-Stack

| Komponente | Technologie |
|------------|-------------|
| Framework | Flutter (Dart 3.9.2+) |
| Backend | Supabase (Auth, DB, Storage) |
| Verschlüsselung | AES-256-GCM |
| HTTP Client | Dio mit Certificate Pinning |
| AI API | OpenRouter |

## Schnellnavigation

{{< cards >}}
  {{< card link="architektur" title="Architektur" icon="template" >}}
  {{< card link="services" title="Services" icon="cog" >}}
  {{< card link="api" title="API Referenz" icon="code" >}}
  {{< card link="datenbank" title="Datenbank" icon="database" >}}
  {{< card link="sicherheit" title="Sicherheit" icon="shield-check" >}}
  {{< card link="entwicklung" title="Entwicklung" icon="terminal" >}}
{{< /cards >}}
