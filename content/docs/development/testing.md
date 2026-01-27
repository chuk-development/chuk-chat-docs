---
title: Testing
weight: 6
---

Testing strategies and patterns for Chuk Chat.

## Test Types

| Type | Location | Purpose |
|------|----------|---------|
| Unit | `test/` | Individual functions and classes |
| Widget | `test/` | UI component behavior |
| Integration | `integration_test/` | Full app flows |

## Running Tests

```bash
# Run all tests
flutter test

# Run specific test file
flutter test test/services/chat_service_test.dart

# Run with coverage
flutter test --coverage

# Run integration tests
flutter test integration_test/
```

## Unit Testing

### Testing Services

```dart
// test/services/encryption_service_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:chuk_chat/services/encryption_service.dart';

void main() {
  late EncryptionService service;

  setUp(() {
    service = EncryptionService();
  });

  group('EncryptionService', () {
    test('encrypts and decrypts text correctly', () async {
      const plaintext = 'Hello, World!';
      const password = 'test_password';

      final encrypted = await service.encrypt(plaintext, password);
      final decrypted = await service.decrypt(encrypted, password);

      expect(decrypted, equals(plaintext));
    });

    test('produces different ciphertext for same input', () async {
      const plaintext = 'Hello';
      const password = 'password';

      final encrypted1 = await service.encrypt(plaintext, password);
      final encrypted2 = await service.encrypt(plaintext, password);

      expect(encrypted1, isNot(equals(encrypted2)));
    });

    test('throws on wrong password', () async {
      const plaintext = 'Secret';
      final encrypted = await service.encrypt(plaintext, 'correct');

      expect(
        () => service.decrypt(encrypted, 'wrong'),
        throwsA(isA<DecryptionException>()),
      );
    });
  });
}
```

### Testing Models

```dart
// test/models/chat_message_test.dart
void main() {
  group('ChatMessage', () {
    test('creates from JSON', () {
      final json = {
        'id': 'msg_1',
        'content': 'Hello',
        'role': 'user',
        'timestamp': '2024-01-15T10:30:00Z',
      };

      final message = ChatMessage.fromJson(json);

      expect(message.id, equals('msg_1'));
      expect(message.content, equals('Hello'));
      expect(message.role, equals(MessageRole.user));
    });

    test('converts to JSON', () {
      final message = ChatMessage(
        id: 'msg_1',
        content: 'Hello',
        role: MessageRole.user,
        timestamp: DateTime.utc(2024, 1, 15, 10, 30),
      );

      final json = message.toJson();

      expect(json['id'], equals('msg_1'));
      expect(json['content'], equals('Hello'));
    });

    test('copyWith creates modified copy', () {
      final original = ChatMessage(
        id: 'msg_1',
        content: 'Hello',
        role: MessageRole.user,
      );

      final modified = original.copyWith(content: 'Updated');

      expect(modified.id, equals(original.id));
      expect(modified.content, equals('Updated'));
    });

    test('equality works correctly', () {
      final msg1 = ChatMessage(id: '1', content: 'Hi', role: MessageRole.user);
      final msg2 = ChatMessage(id: '1', content: 'Hi', role: MessageRole.user);
      final msg3 = ChatMessage(id: '2', content: 'Hi', role: MessageRole.user);

      expect(msg1, equals(msg2));
      expect(msg1, isNot(equals(msg3)));
    });
  });
}
```

## Widget Testing

```dart
// test/widgets/message_bubble_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chuk_chat/widgets/message_bubble.dart';

void main() {
  group('MessageBubble', () {
    testWidgets('displays message content', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: MessageBubble(
              content: 'Hello, World!',
              isUser: true,
            ),
          ),
        ),
      );

      expect(find.text('Hello, World!'), findsOneWidget);
    });

    testWidgets('applies user styling when isUser is true', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: MessageBubble(content: 'Test', isUser: true),
          ),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container).first);
      // Verify alignment or color
    });

    testWidgets('calls onLongPress callback', (tester) async {
      var pressed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: MessageBubble(
              content: 'Test',
              isUser: true,
              onLongPress: () => pressed = true,
            ),
          ),
        ),
      );

      await tester.longPress(find.text('Test'));

      expect(pressed, isTrue);
    });
  });
}
```

## Mocking

### Using Mockito

```dart
// test/services/chat_service_test.dart
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';

@GenerateMocks([ApiService, StorageService])
void main() {
  late ChatService chatService;
  late MockApiService mockApi;
  late MockStorageService mockStorage;

  setUp(() {
    mockApi = MockApiService();
    mockStorage = MockStorageService();
    chatService = ChatService(mockApi, mockStorage);
  });

  test('sendMessage calls API and saves', () async {
    when(mockApi.send(any)).thenAnswer((_) async => Response.success());
    when(mockStorage.save(any)).thenAnswer((_) async {});

    await chatService.sendMessage('Hello');

    verify(mockApi.send(any)).called(1);
    verify(mockStorage.save(any)).called(1);
  });
}
```

## Test Coverage

```bash
# Generate coverage
flutter test --coverage

# View coverage report (requires lcov)
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what, not how
2. **Use descriptive test names** - `test('returns empty list when no messages')`
3. **Follow AAA pattern** - Arrange, Act, Assert
4. **Mock external dependencies** - API calls, storage, etc.
5. **Test edge cases** - Empty inputs, errors, boundaries
