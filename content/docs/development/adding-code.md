---
title: Adding Code
weight: 3
---

Guidelines for adding new code to Chuk Chat.

## Adding a New Service

1. Create the service file in `lib/services/`:

```dart
// lib/services/my_new_service.dart
class MyNewService {
  // Dependencies
  final ApiService _apiService;
  final StorageService _storageService;

  MyNewService(this._apiService, this._storageService);

  // Public methods
  Future<Result> doSomething() async {
    // Implementation
  }
}
```

2. Follow naming conventions:
   - File: `snake_case_service.dart`
   - Class: `PascalCaseService`

3. Register in dependency injection if needed.

## Adding a New Model

1. Create in `lib/models/`:

```dart
// lib/models/my_model.dart
class MyModel {
  final String id;
  final String name;
  final DateTime createdAt;

  const MyModel({
    required this.id,
    required this.name,
    required this.createdAt,
  });

  // JSON serialization
  factory MyModel.fromJson(Map<String, dynamic> json) {
    return MyModel(
      id: json['id'] as String,
      name: json['name'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'created_at': createdAt.toIso8601String(),
  };

  // Copy with
  MyModel copyWith({
    String? id,
    String? name,
    DateTime? createdAt,
  }) {
    return MyModel(
      id: id ?? this.id,
      name: name ?? this.name,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  // Equality
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MyModel &&
          id == other.id &&
          name == other.name &&
          createdAt == other.createdAt;

  @override
  int get hashCode => Object.hash(id, name, createdAt);
}
```

## Adding a New Widget

1. Create in `lib/widgets/`:

```dart
// lib/widgets/my_widget.dart
class MyWidget extends StatelessWidget {
  final String title;
  final VoidCallback? onTap;

  const MyWidget({
    super.key,
    required this.title,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        child: Text(title),
      ),
    );
  }
}
```

## Adding a New Page

1. Create in `lib/pages/`:

```dart
// lib/pages/my_page.dart
class MyPage extends StatefulWidget {
  const MyPage({super.key});

  @override
  State<MyPage> createState() => _MyPageState();
}

class _MyPageState extends State<MyPage> {
  @override
  void initState() {
    super.initState();
    // Initialize
  }

  @override
  void dispose() {
    // Cleanup
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Page')),
      body: const Center(
        child: Text('Content'),
      ),
    );
  }
}
```

2. Add route if needed in navigation.

## Adding Platform-Specific Code

### Desktop vs Mobile

```dart
// lib/platform_specific/my_feature/
// ├── my_feature_desktop.dart
// └── my_feature_mobile.dart

// Desktop implementation
class MyFeatureDesktop extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(children: [/* Desktop layout */]);
  }
}

// Mobile implementation
class MyFeatureMobile extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(children: [/* Mobile layout */]);
  }
}
```

## Code Checklist

Before submitting:

- [ ] Follow naming conventions
- [ ] Add JSON serialization for models
- [ ] Include `copyWith` for immutable models
- [ ] Implement equality for models
- [ ] Use `const` constructors where possible
- [ ] Add documentation comments for public APIs
- [ ] Run `flutter analyze` with no issues
- [ ] Run `dart format .` for consistent formatting
