---
title: API Referenz
weight: 4
---

# API Referenz

## Backend API

Base URL: `https://api.chuk.chat`

### Chat Streaming (HTTP SSE)

```
POST /v1/ai/chat
```

**Headers:**
```
Authorization: Bearer {accessToken}
Accept: text/event-stream
```

**Request (Multipart):**
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `model_id` | string | Model-Identifier |
| `message` | string | Benutzernachricht |
| `max_tokens` | int | Max Response-Tokens |
| `temperature` | float | Response-Temperatur |
| `provider` | string | Provider-Name |
| `provider_slug` | string | Provider-Identifier |
| `history` | JSON | Chat-History |
| `system_prompt` | string | System-Prompt (optional) |
| `metadata` | JSON | Request-Metadata |

**Response Stream:**
```
data: {"content": "Hello"}
data: {"reasoning": "I think..."}
data: {"usage": {"prompt_tokens": 10, "completion_tokens": 20}}
data: {"meta": {"model": "deepseek-chat"}}
data: {"tps": 45.2}
data: [DONE]
```

---

### Chat Streaming (WebSocket)

```
WS /v1/ai/chat/ws
```

**Request:**
```json
{
  "token": "accessToken",
  "message": "user message",
  "model_id": "model-slug",
  "provider_slug": "provider-slug",
  "max_tokens": 512,
  "temperature": 0.7,
  "history": [...],
  "system_prompt": "...",
  "images": ["base64-data-urls"]
}
```

**Response Events:**
```json
{"content": "Hello"}
{"reasoning": "Thinking..."}
{"usage": {...}}
{"tps": 42.5}
{"done": true}
```

---

### File Conversion

```
POST /v1/ai/convert-file
```

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request:** Multipart mit Datei

**Response:**
```json
{
  "markdown": "# Converted Content\n..."
}
```

**Unterstützte Formate:**
- Dokumente: PDF, DOCX, DOC, PPTX, PPT, XLSX, XLS
- Bilder: JPG, PNG, GIF, BMP, WEBP, TIFF
- Audio: MP3, WAV, M4A, FLAC, OGG
- Archive: ZIP
- E-Books: EPUB
- E-Mail: MSG, EML

{{< callout type="warning" >}}
Max. Dateigröße: 10 MB
{{< /callout >}}

---

### Image Generation

```
POST /v1/ai/generate-image
```

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `prompt` | string | Bildbeschreibung |
| `image_size` | string | Preset-Größe |
| `custom_width` | int | Benutzerdefinierte Breite |
| `custom_height` | int | Benutzerdefinierte Höhe |

**Response:**
```json
{
  "success": true,
  "image_url": "https://...",
  "width": 1024,
  "height": 1024,
  "seed": 12345,
  "billing": {
    "cost_eur": 0.05
  }
}
```

**Error:** `402` = Nicht genug Credits

---

### Audio Transcription

```
POST /protected/transcribe-audio
```

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request:**
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `audio_file` | file | Audiodatei |
| `prompt` | string | Kontext (optional) |
| `language` | string | Sprachcode (optional) |
| `temperature` | float | Temperatur (optional) |

**Response:**
```json
{
  "text": "Transkribierter Text",
  "x_groq": { "metadata": {...} }
}
```

---

## Datenmodelle

### ChatMessage

```dart
class ChatMessage {
  final String id;
  final String role;        // 'user' | 'assistant'
  final String content;
  final DateTime timestamp;
  final String? modelId;
  final String? provider;
}
```

### StoredChat

```dart
class StoredChat {
  final String id;
  final String title;
  final String? customName;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isStarred;
  final List<ChatMessage> messages;
}
```

### ChatStreamEvent

```dart
sealed class ChatStreamEvent {
  factory ChatStreamEvent.content(String text) = ContentEvent;
  factory ChatStreamEvent.reasoning(String text) = ReasoningEvent;
  factory ChatStreamEvent.usage(Map<String, dynamic> data) = UsageEvent;
  factory ChatStreamEvent.meta(Map<String, dynamic> data) = MetaEvent;
  factory ChatStreamEvent.tps(double tps) = TpsEvent;
  factory ChatStreamEvent.error(String message) = ErrorEvent;
  factory ChatStreamEvent.done() = DoneEvent;
}
```

### Project

```dart
class Project {
  String id;
  String name;
  String? description;
  DateTime createdAt;
  bool isArchived;
  List<ProjectFile> files;
  List<String> assignedChatIds;
}

class ProjectFile {
  String id;
  String name;
  String content;
  DateTime uploadedAt;
}
```

---

## Konfiguration

### Environment Variables

**Compile-Time (--dart-define):**
```bash
flutter build apk \
  --dart-define=SUPABASE_URL=https://xxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=xxx \
  --dart-define=API_BASE_URL=https://api.chuk.chat
```

**Runtime (.env):**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Feature Flags

```bash
--dart-define=FEATURE_PROJECTS=true
--dart-define=FEATURE_IMAGE_GEN=true
--dart-define=FEATURE_VOICE_MODE=true
--dart-define=FEATURE_MEDIA_MANAGER=true
--dart-define=FEATURE_ASSISTANTS=true
```

### API Configuration Service

```dart
ApiConfigService.apiBaseUrl        // API-URL
ApiConfigService.environment       // 'development' | 'production'
ApiConfigService.platform          // 'android', 'ios', 'windows', etc.
ApiConfigService.isConfigured      // Ist konfiguriert?
```
