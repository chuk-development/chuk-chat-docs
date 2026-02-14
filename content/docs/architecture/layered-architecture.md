---
title: Layered Architecture
weight: 2
---

Chuk Chat implements a clean layered architecture that separates concerns and promotes maintainability.

## Architecture Layers

```
┌─────────────────────────────────────────────┐
│           Presentation Layer                 │
│     (Pages, Widgets, UI Components)          │
├─────────────────────────────────────────────┤
│            Service Layer                     │
│   (Business Logic, API Communication)        │
├─────────────────────────────────────────────┤
│             Data Layer                       │
│    (Models, Local Storage, Cache)            │
├─────────────────────────────────────────────┤
│           Platform Layer                     │
│   (Platform-Specific Implementations)        │
└─────────────────────────────────────────────┘
```

## Layer Responsibilities

### Presentation Layer

Located in `lib/pages/`, `lib/widgets/`, and `lib/platform_specific/`:

- UI rendering and user interaction
- State management for UI components
- Navigation and routing
- Platform-specific layouts

```dart
// Example: Page widget
class ChatPage extends StatefulWidget {
  @override
  State<ChatPage> createState() => _ChatPageState();
}
```

### Service Layer

Located in `lib/services/` with 51 service files:

- Business logic and validation
- API communication
- Data transformation
- Cross-cutting concerns (auth, encryption)

```dart
// Example: Service class
class ChatService {
  Future<void> sendMessage(String content) async {
    // Validation
    if (content.isEmpty) throw ValidationException('Empty message');

    // Business logic
    final encrypted = await _encryptionService.encrypt(content);
    await _apiService.send(encrypted);
  }
}
```

### Data Layer

Located in `lib/models/`:

- Data models and entities
- JSON serialization
- Local storage abstractions
- Cache management

```dart
// Example: Data model
class ChatMessage {
  final String id;
  final String content;
  final MessageRole role;
  final DateTime timestamp;

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ...
  Map<String, dynamic> toJson() => ...
}
```

### Platform Layer

Located in `lib/platform_specific/`:

- Platform detection
- Conditional implementations
- Native integrations
- Adaptive UI components

## Dependency Flow

Dependencies flow downward only:

```
Presentation → Service → Data
      ↓           ↓
   Platform   Platform
```

- **Presentation** depends on Service and Platform
- **Service** depends on Data and Platform
- **Data** has no dependencies on other layers
- **Platform** provides implementations to upper layers

## Benefits

| Benefit | Description |
|---------|-------------|
| **Testability** | Each layer can be tested in isolation |
| **Maintainability** | Changes in one layer don't affect others |
| **Reusability** | Services can be shared across UI components |
| **Scalability** | New features fit naturally into the structure |

## Code Organization

```
lib/
├── pages/              # Presentation: Full screens
├── widgets/            # Presentation: Reusable components
├── services/           # Service: Business logic
├── models/             # Data: Models and entities
├── platform_specific/  # Platform: Adaptive code
├── core/               # Shared infrastructure
├── constants/          # Configuration values
└── utils/              # Helper functions
```
