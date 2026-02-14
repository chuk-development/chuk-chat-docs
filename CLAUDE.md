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

## Workflow

- **Always commit and push** after completing changes. Do not leave uncommitted work.

### "Update the docs" Procedure

When the user says **"update the docs"**, follow this exact workflow:

1. **Find the time boundary**
   - `git log -1 --format='%H %ai'` in `/home/user/git/docs-site` to get the last docs commit hash and date.

2. **Gather chuk_chat changes since that date**
   - `git log --since="<date>" --oneline --reverse` in `/home/user/git/chuk_chat` to list all new commits.
   - If there are no new commits, tell the user "docs are already up to date" and stop.

3. **Analyze the changes**
   - Use a Task agent to run `git show --stat <hash>` for each significant commit and `git diff <last-docs-hash>..HEAD --stat` to understand overall scope.
   - Also check `ls lib/services/`, `ls lib/models/`, `ls lib/utils/`, `ls lib/pages/` for new/deleted files.
   - Categorize changes into: new features, security, architecture/refactoring, bug fixes, testing, API/backend, new/renamed/deleted files.

4. **Map changes to documentation sections**
   - Read the affected `_index.md` and detail pages to understand current content.
   - Determine which pages need updates based on the categorized changes.

5. **Update documentation pages**
   - Edit existing pages — do NOT create new pages unless a wholly new feature/service has no page at all.
   - Update counts (service count, file count, test count, model count) in `architecture/_index.md` and `architecture/layered-architecture.md`.
   - Update file reference tables in `files/lib/` when files are added/removed/renamed.
   - Add callouts for significant architectural changes with dates.

6. **Commit and push**
   - Use commit message format: `docs: sync documentation with chuk_chat changes since <date>`
   - Include a bullet summary of major changes in the commit body.

## Known Issues

- ~~44 detail pages in services/, files/, models/ subsections are truncated~~ (Resolved -- all pages now have full body content)

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
