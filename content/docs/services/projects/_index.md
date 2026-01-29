---
title: Project Services
weight: 4
---

Project services manage workspace-based organization of chats and files, enabling users to group related conversations and documents under named projects with optional custom system prompts.

## Overview

Chuk Chat supports **project workspaces** that allow users to:

- Create named projects with descriptions and custom AI instructions
- Assign chats to projects for topical grouping
- Upload encrypted files that provide context to AI conversations
- Archive projects without deleting them

## Architecture

Project functionality is split across two services:

| Service | Responsibility |
|---------|---------------|
| [`ProjectStorageService`](./project-storage-service) | CRUD operations for projects, chat assignments, and encrypted file management via Supabase |
| [`ProjectMessageService`](./project-message-service) | Composing AI system messages with project context (files, chat history, custom prompts) |

## Data Flow

```
User creates project
  -> ProjectStorageService.createProject()
    -> Supabase 'projects' table
    -> Local cache (SharedPreferences)

User uploads file
  -> Encrypt with AES-256-GCM
  -> Upload to Supabase Storage ('project-files' bucket)
  -> Save metadata to 'project_files' table
  -> Optionally generate markdown summary via API

User sends message in project context
  -> ProjectMessageService.buildProjectSystemMessage()
    -> Gather project description, custom prompt, file contents, chat history
    -> Inject as system message into LLM request
```

## Related

- [Project Model](/docs/models/) -- `Project` and `ProjectFile` data classes
- [Encryption Service](/docs/security/) -- AES-256-GCM encryption used for project files
- [Chat Storage](/docs/services/chat/) -- Chat data referenced by project assignments
