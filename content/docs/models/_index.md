---
title: Data Models
weight: 8
---

Data models used throughout Chuk Chat for type-safe data handling.

## Overview

The `lib/models/` directory contains Dart classes that represent the application's data structures. All models use immutable patterns and provide JSON serialization.

## Core Models

| Model | File | Purpose |
|-------|------|---------|
| `ChatMessage` | `chat_message.dart` | Individual chat messages |
| `ChatModel` | `chat_model.dart` | AI model configuration |
| `ChatStreamEvent` | `chat_stream_event.dart` | Streaming response events |
| `ProjectModel` | `project_model.dart` | Project/workspace data |
| `StoredChat` | `stored_chat.dart` | Persisted conversation |
| `AppShellConfig` | `app_shell_config.dart` | Configuration object replacing 34 prop-drilled widget parameters |

## Model Patterns

### Immutability

All models are immutable with `copyWith` methods:

```dart
final message = ChatMessage(
  id: 'msg_1',
  content: 'Hello',
  role: MessageRole.user,
);

final updated = message.copyWith(content: 'Updated content');
```

### JSON Serialization

Models support JSON conversion for API and storage:

```dart
// From JSON
final message = ChatMessage.fromJson(jsonMap);

// To JSON
final json = message.toJson();
```

### Equality

Models implement equality for comparison:

```dart
final msg1 = ChatMessage(id: '1', content: 'Hi');
final msg2 = ChatMessage(id: '1', content: 'Hi');
print(msg1 == msg2); // true
```

## Model Documentation

### AppShellConfig

Added in February 2026, `AppShellConfig` is a configuration object that replaced 34 individually prop-drilled parameters passed through the widget tree. It bundles all shell-level configuration (selected chat, model, theme, callbacks) into a single typed object.

{{< cards >}}
  {{< card link="chat-message" title="ChatMessage" subtitle="Message structure" >}}
  {{< card link="chat-stream-event" title="ChatStreamEvent" subtitle="Stream events" >}}
  {{< card link="stored-chat" title="StoredChat" subtitle="Conversation storage" >}}
  {{< card link="project-models" title="Project Models" subtitle="Workspace data" >}}
  {{< card link="model-item" title="ModelItem" subtitle="AI model info" >}}
{{< /cards >}}
