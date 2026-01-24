---
title: Services
weight: 3
---

# Service Layer

Die Business-Logik ist in über 38 Services organisiert.

## Auth & Security

### SupabaseService

Singleton für Supabase-Client-Initialisierung.

```dart
// Initialisierung
await SupabaseService.initialize();

// Zugriff
final client = SupabaseService.client;
final auth = SupabaseService.auth;

// Session Refresh
await SupabaseService.refreshSession();
```

### AuthService

Benutzerauthentifizierung.

```dart
// Login
await AuthService.signInWithPassword(email, password);

// Registrierung
await AuthService.signUpWithPassword(email, password, displayName);

// Logout
await AuthService.signOut();
```

### EncryptionService

AES-256-GCM Verschlüsselung mit PBKDF2.

```dart
// Key aus Passwort ableiten
await EncryptionService.loadKeyFromPassword(password);

// Verschlüsseln
final encrypted = await EncryptionService.encryptString(plaintext);

// Entschlüsseln
final decrypted = await EncryptionService.decryptString(encrypted);

// Key löschen
await EncryptionService.clearKey();
```

{{< callout type="info" >}}
Verschlüsselung läuft in einem **Background Isolate** um die UI nicht zu blockieren.
{{< /callout >}}

**Verschlüsselungsformat:**
```json
{
  "v": "1.0",
  "nonce": "base64-encoded-nonce",
  "ciphertext": "base64-encoded-data",
  "mac": "base64-encoded-mac"
}
```

---

## Chat Storage

### ChatStorageService

Zentrale Fassade für Chat-Operationen.

```dart
// Chats laden
await ChatStorageService.loadSavedChatsForSidebar();  // Nur Titel
await ChatStorageService.loadFullChat(chatId);         // Mit Messages

// Chat speichern
await ChatStorageService.saveChat(messages, chatId);
await ChatStorageService.updateChat(chatId, messages);

// Chat löschen
await ChatStorageService.deleteChat(chatId);

// State
final chats = ChatStorageService.savedChats;
final selected = ChatStorageService.selectedChatId;

// Changes Stream
ChatStorageService.changes.listen((chatId) {
  // UI aktualisieren
});
```

### ChatSyncService

Background-Sync alle 5 Sekunden.

```dart
// Starten
ChatSyncService.start();

// Stoppen
ChatSyncService.stop();
```

**Sync-Algorithmus:**
1. Fetch lightweight metadata (id, updated_at)
2. Vergleich mit lokalem State
3. Nur geänderte Chats vollständig laden
4. Decrypt im Background Isolate
5. In lokalen State mergen

---

## Streaming

### StreamingChatService

HTTP Server-Sent Events (SSE).

```dart
final stream = StreamingChatService.sendStreamingChat(
  accessToken: token,
  message: "Hello",
  modelId: "deepseek/deepseek-chat",
  providerSlug: "deepseek",
  history: previousMessages,
  systemPrompt: "You are helpful.",
  maxTokens: 512,
  temperature: 0.7,
);

await for (final event in stream) {
  switch (event) {
    case ContentEvent(:final text):
      // Nachrichteninhalt
    case ReasoningEvent(:final text):
      // Denkprozess
    case TpsEvent(:final tps):
      // Tokens/Sekunde
    case DoneEvent():
      // Fertig
  }
}
```

### WebSocketChatService

Alternative für mobile Geräte.

```dart
final stream = WebSocketChatService.sendStreamingChat(
  accessToken: token,
  message: "Hello",
  modelId: "deepseek/deepseek-chat",
  providerSlug: "deepseek",
  images: ["data:image/jpeg;base64,..."],  // Optional
);
```

### StreamingManager

Verwaltet gleichzeitige Streams.

```dart
final manager = StreamingManager();

manager.startStream(
  chatId: chatId,
  messageIndex: index,
  stream: chatStream,
  onUpdate: (content, reasoning) => updateUI(),
  onComplete: (content, reasoning, tps) => persist(),
  onError: (error) => showError(),
);

// Status prüfen
manager.isStreaming(chatId);
manager.hasActiveStreams;

// Abbrechen
manager.cancelStream(chatId);
manager.cancelAllStreams();
```

---

## Projects

### ProjectStorageService

CRUD für Projekt-Workspaces.

```dart
// Erstellen
await ProjectStorageService.createProject(name, description);

// Aktualisieren
await ProjectStorageService.updateProject(id, name, description);

// Löschen
await ProjectStorageService.deleteProject(id);

// Dateien
await ProjectStorageService.addProjectFile(projectId, file);
await ProjectStorageService.removeProjectFile(projectId, fileId);

// Chat zuweisen
await ProjectStorageService.assignChatToProject(chatId, projectId);

// Alle Projekte
final projects = ProjectStorageService.projects;
final active = ProjectStorageService.activeProjects;
```

---

## Media

### ImageStorageService

Verschlüsselte Bildspeicherung.

```dart
// Upload
final path = await ImageStorageService.uploadEncryptedImage(bytes);

// Download
final bytes = await ImageStorageService.downloadAndDecryptImage(path);

// Löschen
await ImageStorageService.deleteImage(storagePath);

// Cache
final cached = ImageStorageService.getCached(storagePath);
ImageStorageService.clearCache();

// Deletion Events
ImageStorageService.onImageDeleted.listen((path) {
  // UI aktualisieren
});
```

### ImageGenerationService

AI-Bildgenerierung.

```dart
final result = await ImageGenerationService.generateImage(
  prompt: "A sunset over mountains",
  sizePreset: "landscape_16_9",  // oder customWidth/customHeight
  storeEncrypted: true,
);

// result.imageUrl, result.width, result.height, result.billing
```

**Size Presets:**
- `square_hd`: 1024x1024
- `square`: 512x512
- `portrait_4_3`: 768x1024
- `portrait_16_9`: 576x1024
- `landscape_4_3`: 1024x768
- `landscape_16_9`: 1024x576

---

## Weitere Services

| Service | Beschreibung |
|---------|--------------|
| `TitleGenerationService` | Auto-generierte Chat-Titel |
| `FileConversionService` | Dokumente → Markdown |
| `ThemeSettingsService` | Theme-Sync (lokal ↔ Supabase) |
| `CustomizationPreferencesService` | Benutzereinstellungen |
| `NotificationService` | Lokale Push-Notifications |
| `NetworkStatusService` | Konnektivitätsprüfung |
| `PasswordRevisionService` | Passwortänderungen erkennen |
| `ModelPrefetchService` | Model-Liste cachen |
