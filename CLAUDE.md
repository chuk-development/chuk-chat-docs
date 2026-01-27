# CLAUDE.md

## Project Overview

Documentation site for **Chuk Chat** — a privacy-first, cross-platform Flutter chat application with E2E encryption for open-weight AI models. Built with Hugo using the [Hextra](https://github.com/imfing/hextra) theme.

## Key Setup

- **Hugo theme**: Hextra, loaded via Hugo module with local replacement (`github.com/imfing/hextra -> /hextra`)
- **Dev server**: `docker-compose up` — runs Hugo on port 1313, mounts local hextra from `../hextra`
- **Language**: English only (German docs were removed)
- **Output formats**: HTML, llms.txt (homepage), Markdown (pages/sections)

## Content Structure

```
content/docs/
├── _index.md              # Overview with quick navigation cards
├── architecture/          # Layered architecture, patterns, platform abstraction
├── api/                   # Chat, audio, file, image endpoints + error handling
├── database/              # Tables, RLS, functions, storage buckets
├── development/           # Build commands, code style, testing, debugging
├── files/                 # File reference (lib/, platform-specific/)
├── models/                # ChatMessage, StoredChat, ChatStreamEvent
├── security/              # Encryption, auth, certificate pinning
└── services/              # Auth, chat, config, media, preferences, projects, streaming
```

## Configuration

- `hugo.yaml` — Main config (module imports, menu, theme params, context menu)
- `docker-compose.yaml` — Hugo server with hextra volume mount
- `data/icons.yaml` — Custom SVG icons (currently: claude icon, unused)

## Known Issues

- ~44 detail pages in services/, files/, models/ subsections are truncated (only have front matter, no body content) due to a script error. Main section index pages are complete.
- GitHub URL in navbar is a placeholder (`your-username/chuk-chat`)

## Chuk Chat Tech Stack (documented app)

| Component | Technology |
|-----------|------------|
| Framework | Flutter (Dart 3.9.2+) |
| Backend | Supabase (Auth, DB, Storage) |
| Encryption | AES-256-GCM with PBKDF2 |
| HTTP Client | Dio with Certificate Pinning |
| AI API | OpenRouter (DeepSeek, Llama, Mistral, Qwen) |
| Audio | Groq Whisper for transcription |
| Source | `/home/user/git/chuk_chat` |
