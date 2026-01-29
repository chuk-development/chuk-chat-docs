---
title: ProjectStorageService
weight: 1
---

The `ProjectStorageService` manages CRUD operations for project workspaces, including chat assignments and encrypted file uploads to Supabase Storage.

## Definition

```dart
// lib/services/project_storage_service.dart

class ProjectStorageService {
  static const String bucketName = 'project-files';

  // In-memory cache (single source of truth)
  static final Map<String, Project> _projectsById = {};
  static bool _cacheLoaded = false;

  // Currently selected project for chat UI context
  static String? selectedProjectId;

  // Change notification stream with debouncing
  static Stream<void> get changes;

  // Sorted project lists
  static List<Project> get projects;       // All projects, most recent first
  static List<Project> get activeProjects;  // Non-archived only
  static List<Project> get archivedProjects;
}
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `bucketName` | `String` | Supabase Storage bucket name (`project-files`) |
| `selectedProjectId` | `String?` | Currently active project in the chat UI |
| `projects` | `List<Project>` | All projects sorted by creation date (descending) |
| `activeProjects` | `List<Project>` | Non-archived projects |
| `archivedProjects` | `List<Project>` | Archived projects only |
| `changes` | `Stream<void>` | Broadcast stream emitting on any data change (debounced at 100ms) |

## Methods

### Cache Management

| Method | Return Type | Description |
|--------|-------------|-------------|
| `loadFromCache()` | `Future<void>` | Load projects from `SharedPreferences` for instant UI |
| `loadProjects()` | `Future<void>` | Cache-first load: reads local cache, then syncs from Supabase |
| `loadProjectsForSidebar()` | `Future<void>` | Load projects only if the in-memory map is empty |

### Project CRUD

| Method | Return Type | Description |
|--------|-------------|-------------|
| `createProject(name, {description, customSystemPrompt})` | `Future<Project>` | Insert a new project into Supabase and local cache |
| `updateProject(projectId, {name, description, customSystemPrompt})` | `Future<Project>` | Update project fields; preserves existing chat and file associations |
| `deleteProject(projectId)` | `Future<void>` | Delete project (cascades to `project_chats` and `project_files` via DB) |
| `archiveProject(projectId, archived)` | `Future<void>` | Toggle archive status without deleting |
| `getProject(projectId)` | `Project?` | Look up a project by ID from the in-memory cache |

### Chat Management

| Method | Return Type | Description |
|--------|-------------|-------------|
| `addChatToProject(projectId, chatId)` | `Future<void>` | Link a chat to a project (ignores duplicate constraint violations) |
| `removeChatFromProject(projectId, chatId)` | `Future<void>` | Unlink a chat from a project |
| `getProjectChats(projectId)` | `Future<List<StoredChat>>` | Get all `StoredChat` objects assigned to a project |
| `getChatProjects(chatId)` | `List<Project>` | Get all projects that contain a given chat |

### File Management

| Method | Return Type | Description |
|--------|-------------|-------------|
| `uploadFile(projectId, fileName, fileBytes, fileType, {...})` | `Future<ProjectFile>` | Encrypt and upload a file; optionally generates a markdown summary |
| `deleteFile(projectId, fileId)` | `Future<void>` | Remove file from database and Supabase Storage |
| `getProjectFiles(projectId)` | `List<ProjectFile>` | Get all files for a project from cache |
| `decryptFile(fileId)` | `Future<String>` | Download and decrypt a file, returning its text content |
| `downloadFile(projectId, fileId)` | `Future<Uint8List>` | Download and decrypt a file, returning raw bytes |
| `updateFileContent(projectId, fileId, newBytes)` | `Future<void>` | Re-encrypt and replace a file's content in storage |
| `updateFileMarkdown(projectId, fileId, markdown)` | `Future<void>` | Update a file's markdown summary in the database |

### State Management

| Method | Return Type | Description |
|--------|-------------|-------------|
| `reset()` | `Future<void>` | Clear all state on logout |

## File Upload Pipeline

The `uploadFile` method performs a multi-step encrypted upload:

```dart
final file = await ProjectStorageService.uploadFile(
  projectId,
  'notes.txt',
  fileBytes,
  'txt',
  filePath: '/path/to/notes.txt',
  generateMarkdown: true,
  onUploadProgress: (progress) => print('${(progress * 100).toInt()}%'),
  onConversionStart: () => print('Converting to markdown...'),
);
```

**Steps:**
1. **Encrypt** file content with `EncryptionService` (AES-256-GCM) -- 0-20% progress
2. **Upload** encrypted bytes to Supabase Storage at `{userId}/{uuid}.enc` -- 20-90%
3. **Generate markdown** summary -- plain text files are wrapped directly; binary files (PDF, Office) are sent to the `convert-file` API. Files exceeding 40k tokens are rejected.
4. **Save metadata** to the `project_files` table (file name, storage path, type, size, markdown summary)

## Cache-First Loading Pattern

```dart
// Fast startup: load from SharedPreferences
await ProjectStorageService.loadFromCache();
// UI renders immediately with cached data

// Background sync: fetch latest from Supabase
await ProjectStorageService.loadProjects();
// UI updates via changes stream if data differs
```

The service prevents concurrent `loadProjects()` calls using a `Completer`. If a load is already in progress, subsequent calls await the existing future.

## Usage Examples

### Creating a Project

```dart
final project = await ProjectStorageService.createProject(
  'Research Paper',
  description: 'Notes and drafts for ML paper',
  customSystemPrompt: 'You are an expert in machine learning research.',
);
```

### Managing Chat Assignments

```dart
// Add a chat to a project
await ProjectStorageService.addChatToProject(project.id, chatId);

// Find which projects a chat belongs to
final projects = ProjectStorageService.getChatProjects(chatId);

// Remove a chat from a project
await ProjectStorageService.removeChatFromProject(project.id, chatId);
```

### Listening for Changes

```dart
ProjectStorageService.changes.listen((_) {
  // Rebuild UI with updated project list
  setState(() {
    _projects = ProjectStorageService.activeProjects;
  });
});
```
