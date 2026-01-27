---
title: Code Style
weight: 4
---

Coding standards and style guidelines for Chuk Chat.

## Dart Style Guide

Follow the [Effective Dart](https://dart.dev/effective-dart) guidelines.

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `ChatMessage`, `UserService` |
| Files | snake_case | `chat_message.dart`, `user_service.dart` |
| Variables | camelCase | `userName`, `messageCount` |
| Constants | camelCase or SCREAMING_CAPS | `defaultTimeout`, `API_URL` |
| Private | prefix with `_` | `_privateField`, `_helperMethod` |

### File Organization

```dart
// 1. Imports (sorted)
import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:dio/dio.dart';

import '../models/chat_message.dart';
import '../services/chat_service.dart';

// 2. Part directives (if any)
part 'chat_state.dart';

// 3. Class definition
class ChatWidget extends StatefulWidget {
  // 4. Static fields
  static const defaultPadding = 16.0;

  // 5. Instance fields
  final String title;
  final VoidCallback? onClose;

  // 6. Constructor
  const ChatWidget({
    super.key,
    required this.title,
    this.onClose,
  });

  // 7. Methods
  @override
  State<ChatWidget> createState() => _ChatWidgetState();
}
```

### Constructor Style

```dart
// Prefer named parameters
class MyWidget extends StatelessWidget {
  final String title;
  final int count;
  final bool isEnabled;

  const MyWidget({
    super.key,
    required this.title,
    this.count = 0,
    this.isEnabled = true,
  });
}
```

### Formatting

```dart
// Line length: 80 characters max

// Multi-line function calls
final result = someFunction(
  firstArgument,
  secondArgument,
  thirdArgument,
);

// Multi-line collections
final list = [
  'item1',
  'item2',
  'item3',
];

// Trailing commas (enforced by formatter)
Container(
  padding: const EdgeInsets.all(16),
  child: Text('Hello'),
);
```

## Documentation

### Class Documentation

```dart
/// A service that manages chat message operations.
///
/// This service handles:
/// - Sending and receiving messages
/// - Message persistence
/// - Real-time synchronization
///
/// Example:
/// ```dart
/// final service = ChatService();
/// await service.sendMessage('Hello');
/// ```
class ChatService {
  // ...
}
```

### Method Documentation

```dart
/// Sends a message to the current chat.
///
/// The [content] must not be empty. If [attachments] are provided,
/// they will be uploaded before the message is sent.
///
/// Returns the sent [ChatMessage] on success.
///
/// Throws [ValidationException] if content is empty.
/// Throws [NetworkException] if the request fails.
Future<ChatMessage> sendMessage(
  String content, {
  List<Attachment>? attachments,
}) async {
  // ...
}
```

## Best Practices

### Prefer const

```dart
// Good
const padding = EdgeInsets.all(16);
const Text('Hello');

// Avoid
var padding = EdgeInsets.all(16);
Text('Hello');
```

### Use final

```dart
// Good
final name = user.name;
final List<String> items = [];

// Avoid
var name = user.name;
List<String> items = [];
```

### Avoid dynamic

```dart
// Good
Map<String, Object> data = {};
List<String> names = [];

// Avoid
Map data = {};
List names = [];
dynamic value;
```

### Null Safety

```dart
// Use null-aware operators
final name = user?.name ?? 'Anonymous';
user?.updateProfile();

// Avoid null checks when possible
if (user != null) {
  print(user.name); // Unnecessary if using ?.
}
```

## Linting

The project uses `flutter_lints` with custom rules in `analysis_options.yaml`:

```yaml
include: package:flutter_lints/flutter.yaml

linter:
  rules:
    - prefer_const_constructors
    - prefer_const_declarations
    - prefer_final_locals
    - avoid_dynamic_calls
    - avoid_print
```

Run analysis:

```bash
flutter analyze
```
