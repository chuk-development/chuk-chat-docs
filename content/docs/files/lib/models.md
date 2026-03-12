---
title: Models
weight: 2
---

The `lib/models/` directory contains data classes that represent the core domain objects in Chuk Chat.

## Files

| File | Class(es) | Description |
|------|-----------|-------------|
| `chat_message.dart` | `ChatMessage` | A single message in a conversation, with role, text, optional reasoning tokens, images, content blocks, and attachments. |
| `chat_model.dart` | `ModelItem` | Represents an AI model available for selection: display name, model ID (slug), optional icon URL and badge. |
| `chat_stream_event.dart` | `ChatStreamEvent` (sealed) | Sealed class hierarchy for all streaming events: text chunks, reasoning tokens, errors, completion signals. Used by both HTTP and WebSocket streaming. |
| `project_model.dart` | `Project`, `ProjectFile` | `Project` holds workspace metadata (name, description, system prompt, archive status) plus lists of chat IDs and files. `ProjectFile` stores file metadata (name, path, type, size, markdown summary). |
| `stored_chat.dart` | `StoredChat` | A persisted chat with metadata. Supports lazy loading: initially loads only the title, with messages loaded on demand. |
| `app_shell_config.dart` | `AppShellConfig` | Configuration object that bundles prop-drilled parameters (selected chat, model, theme, callbacks) into a single typed object passed through the widget tree. |
| `artifact.dart` | `Artifact` | Artifact workspace object with content, type, metadata, and diff tracking for project-level artifacts. |
| `client_tool.dart` | `ClientTool` | Tool definition model describing a tool's name, description, parameters, and schema for the tool registry. |
| `content_block.dart` | `ContentBlock` | Interleaved content block model with `text`, `toolCalls`, and `reasoning` types for multi-pass tool call rendering. |
| `tool_call.dart` | `ToolCall` | Tool call request/response model tracking tool name, arguments, status, and result. |

Additionally, `lib/pages/model_selector/models/` contains:

| File | Class(es) | Description |
|------|-----------|-------------|
| `model_info.dart` | `ModelInfo` | Extended model information used by the model selector page. |
