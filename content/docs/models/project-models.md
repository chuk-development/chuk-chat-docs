---
title: Project Models
weight: 4
---

Data models for the project workspace system, which groups chats, files, and custom system prompts into organized workspaces.

## Project

### Definition

```dart
class Project {
  final String id;
  final String name;
  final String? description;
  final String? customSystemPrompt;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isArchived;

  // Relationships (loaded separately via joins)
  final List<String> chatIds;
  final List<ProjectFile> files;

  Project({
    required this.id,
    required this.name,
    this.description,
    this.customSystemPrompt,
    required this.createdAt,
    required this.updatedAt,
    this.isArchived = false,
    this.chatIds = const [],
    this.files = const [],
  });
}
```

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `String` | Yes | Unique project identifier |
| `name` | `String` | Yes | Project display name |
| `description` | `String?` | No | Optional project description |
| `customSystemPrompt` | `String?` | No | Custom system prompt applied to all chats in this project |
| `createdAt` | `DateTime` | Yes | Timestamp when the project was created |
| `updatedAt` | `DateTime` | Yes | Timestamp of last modification |
| `isArchived` | `bool` | No | Whether the project is archived. Defaults to `false` |
| `chatIds` | `List<String>` | No | IDs of chats belonging to this project. Defaults to empty list |
| `files` | `List<ProjectFile>` | No | Files attached to this project. Defaults to empty list |

### JSON Serialization

#### fromJson

Maps snake_case database columns to camelCase Dart properties. Nested `files` are deserialized as `ProjectFile` instances.

```dart
factory Project.fromJson(Map<String, dynamic> json) {
  return Project(
    id: json['id'] as String,
    name: json['name'] as String,
    description: json['description'] as String?,
    customSystemPrompt: json['custom_system_prompt'] as String?,
    createdAt: DateTime.parse(json['created_at'] as String),
    updatedAt: DateTime.parse(json['updated_at'] as String),
    isArchived: (json['is_archived'] as bool?) ?? false,
    chatIds: json['chatIds'] != null
        ? List<String>.from(json['chatIds'] as List)
        : const [],
    files: json['files'] != null
        ? (json['files'] as List)
            .map((f) => ProjectFile.fromJson(f as Map<String, dynamic>))
            .toList()
        : const [],
  );
}
```

#### toJson

Optional fields (`description`, `customSystemPrompt`, `markdownSummary`) are conditionally included using Dart's collection-if syntax.

```dart
Map<String, dynamic> toJson() => {
  'id': id,
  'name': name,
  if (description != null) 'description': description,
  if (customSystemPrompt != null) 'custom_system_prompt': customSystemPrompt,
  'created_at': createdAt.toIso8601String(),
  'updated_at': updatedAt.toIso8601String(),
  'is_archived': isArchived,
  'chatIds': chatIds,
  'files': files.map((f) => f.toJson()).toList(),
};
```

### copyWith

All fields can be overridden including `id`, relationships (`chatIds`, `files`), and timestamps.

```dart
Project copyWith({
  String? id,
  String? name,
  String? description,
  String? customSystemPrompt,
  DateTime? createdAt,
  DateTime? updatedAt,
  bool? isArchived,
  List<String>? chatIds,
  List<ProjectFile>? files,
})
```

### Computed Properties

| Property | Type | Description |
|----------|------|-------------|
| `chatCount` | `int` | Number of chats in the project (`chatIds.length`) |
| `fileCount` | `int` | Number of files in the project (`files.length`) |
| `hasCustomPrompt` | `bool` | `true` if `customSystemPrompt` is non-null and non-empty |
| `totalFileSize` | `int` | Sum of all file sizes in bytes |
| `totalFileSizeFormatted` | `String` | Human-readable total size (e.g., `"2.5 MB"`) |

---

## ProjectFile

### Definition

```dart
class ProjectFile {
  final String id;
  final String projectId;
  final String fileName;
  final String storagePath;
  final String fileType;
  final int fileSize;
  final DateTime uploadedAt;
  final String? markdownSummary;

  ProjectFile({
    required this.id,
    required this.projectId,
    required this.fileName,
    required this.storagePath,
    required this.fileType,
    required this.fileSize,
    required this.uploadedAt,
    this.markdownSummary,
  });
}
```

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `String` | Yes | Unique file identifier |
| `projectId` | `String` | Yes | ID of the parent project |
| `fileName` | `String` | Yes | Original file name with extension |
| `storagePath` | `String` | Yes | Path in Supabase storage |
| `fileType` | `String` | Yes | MIME type or file type identifier |
| `fileSize` | `int` | Yes | File size in bytes |
| `uploadedAt` | `DateTime` | Yes | Upload timestamp |
| `markdownSummary` | `String?` | No | AI-generated Markdown summary of file contents |

### JSON Serialization

#### fromJson

```dart
factory ProjectFile.fromJson(Map<String, dynamic> json) {
  return ProjectFile(
    id: json['id'] as String,
    projectId: json['project_id'] as String,
    fileName: json['file_name'] as String,
    storagePath: json['storage_path'] as String,
    fileType: json['file_type'] as String,
    fileSize: json['file_size'] as int,
    uploadedAt: DateTime.parse(json['uploaded_at'] as String),
    markdownSummary: json['markdown_summary'] as String?,
  );
}
```

#### toJson

```dart
Map<String, dynamic> toJson() => {
  'id': id,
  'project_id': projectId,
  'file_name': fileName,
  'storage_path': storagePath,
  'file_type': fileType,
  'file_size': fileSize,
  'uploaded_at': uploadedAt.toIso8601String(),
  if (markdownSummary != null) 'markdown_summary': markdownSummary,
};
```

### copyWith

All fields can be overridden.

```dart
ProjectFile copyWith({
  String? id,
  String? projectId,
  String? fileName,
  String? storagePath,
  String? fileType,
  int? fileSize,
  DateTime? uploadedAt,
  String? markdownSummary,
})
```

### Computed Properties

| Property | Type | Description |
|----------|------|-------------|
| `hasMarkdownSummary` | `bool` | `true` if `markdownSummary` is non-null and non-empty |
| `fileSizeFormatted` | `String` | Human-readable file size (e.g., `"1.5 MB"`) |
| `fileIcon` | `IconData` | Material icon based on file extension (code, text, PDF, image, etc.) |
| `isPreviewable` | `bool` | Whether the file is a plain text file that can be previewed in-app |
| `isTextFile` | `bool` | Alias for `isPreviewable` |
| `extension` | `String` | Lowercase file extension extracted from `fileName` |
| `isImage` | `bool` | Whether the file is an image (png, jpg, gif, webp, svg) |
| `isPdf` | `bool` | Whether the file extension is `pdf` |

The `fileIcon` getter returns Material icons mapped by extension:

| Extensions | Icon |
|-----------|------|
| `dart`, `js`, `ts`, `py`, `java`, `cpp`, `c`, `h`, `rs`, `go`, `rb`, `php`, `swift`, `kt` | `Icons.code` |
| `txt`, `md`, `markdown` | `Icons.description` |
| `json`, `yaml`, `yml`, `toml`, `xml`, `csv` | `Icons.data_object` |
| `pdf` | `Icons.picture_as_pdf` |
| `doc`, `docx` | `Icons.article` |
| `html`, `htm`, `css`, `scss` | `Icons.web` |
| `png`, `jpg`, `jpeg`, `gif`, `webp`, `svg` | `Icons.image` |
| All others | `Icons.insert_drive_file` |

## Usage Examples

```dart
// Create a project from API response
final project = Project.fromJson(supabaseRow);

// Access computed properties
print(project.chatCount);             // 3
print(project.totalFileSizeFormatted); // "4.2 MB"
print(project.hasCustomPrompt);        // true

// Add a chat to the project
final updated = project.copyWith(
  chatIds: [...project.chatIds, 'new-chat-id'],
  updatedAt: DateTime.now(),
);

// Work with project files
final file = project.files.first;
print(file.fileSizeFormatted); // "256.0 KB"
print(file.extension);         // "dart"
print(file.fileIcon);          // Icons.code
print(file.isPreviewable);     // true
print(file.isPdf);             // false
```

## Related

- [AttachedFile](../attached-file) -- per-message file attachments (distinct from project files)
- [ChatMessage](../chat-message) -- messages within project chats
