---
title: ProjectMessageService
weight: 2
---

The `ProjectMessageService` composes AI system messages enriched with project context, including file contents, chat history, and custom prompts.

## Definition

```dart
// lib/services/project_message_service.dart

class ProjectMessageService {
  // Maximum text content injected into LLM context (~500KB, ~125k tokens)
  static const int maxTotalContentLength = 500000;
}
```

## Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `buildProjectSystemMessage(projectId)` | `Future<String>` | Build a full system message with project name, description, custom prompt, file contents, and chat history |
| `injectProjectContext(projectId, messages)` | `Future<List<Map<String, dynamic>>>` | Prepend a project context system message to a conversation's message list |
| `getProjectContextSummary(project)` | `String` | Human-readable summary for UI display (e.g., "Custom prompt - 3 files - 2 chats") |
| `hasContext(project)` | `bool` | Returns `true` if the project has a custom prompt, files, or linked chats |

## System Message Structure

`buildProjectSystemMessage` assembles a structured prompt sent to the LLM:

```
You are working in the project: "Research Paper"

Project Description:
Notes and drafts for ML paper

Custom System Prompt for this Project:
You are an expert in machine learning research.

---

Available Files in this Project:

### File: notes.txt
- Type: TXT
- Size: 12.5 KB
- Uploaded: 2025-01-15 10:30:00

**File Content:**
```txt
[decrypted file content here]
```

---

Previous Conversations in this Project:

### Chat: Training hyperparameters
(15 messages, 3 days ago)

**User:** What learning rate should I use?
**Assistant:** For transformer models...

---

Please use the above project context, files, chat history,
and custom instructions when responding to the user.
```

## File Content Strategy

The service uses different strategies depending on file type:

| File Type | Strategy |
|-----------|----------|
| Plain text (`.txt`, `.dart`, `.py`, etc.) | Decrypt and include full content in a code block |
| PDF / Office docs with markdown summary | Include the AI-generated markdown summary |
| PDF without markdown summary | Note that content is unavailable; suggest re-uploading |
| Images | Include metadata only (extension, size) |

Files are sorted by upload date (most recent first) and included until the cumulative content reaches `maxTotalContentLength` (500KB). Remaining files are noted as excluded.

## Chat History Inclusion

Linked chat conversations are summarized up to a separate 100KB limit (~25k tokens). Individual messages longer than 2,000 characters are truncated. The summary includes role labels and message content:

```dart
final chatSummary = _buildChatSummary(chat, remainingBudget);
// Output: "**User:** What is... \n\n **Assistant:** The answer..."
```

## Usage Examples

### Injecting Context into a Chat Request

```dart
// Original message list
final messages = [
  {'role': 'user', 'text': 'Summarize my research notes'},
];

// Inject project context as a system message
final enriched = await ProjectMessageService.injectProjectContext(
  projectId,
  messages,
);
// enriched[0] is the system message with all project context
// enriched[1] is the original user message
```

### Displaying Context Summary in UI

```dart
final project = ProjectStorageService.getProject(projectId)!;
final summary = ProjectMessageService.getProjectContextSummary(project);
// "Custom prompt - 3 files - 2 chats"

if (ProjectMessageService.hasContext(project)) {
  showContextBadge(summary);
}
```
