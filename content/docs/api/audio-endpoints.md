---
title: Audio Endpoints
weight: 4
---

The audio transcription endpoint converts spoken audio to text using Groq's high-performance Whisper implementation. This powers the voice input feature in Chuk Chat, enabling users to speak their messages instead of typing.

## Transcribe Audio Endpoint

```http
POST /protected/transcribe-audio
```

### Headers

```http
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

### Request

Send audio as a multipart form upload:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio_file` | binary | Yes | Audio file to transcribe |
| `prompt` | string | No | Context hint for better accuracy |
| `language` | string | No | ISO 639-1 language code |
| `temperature` | float | No | Model temperature (0.0-1.0) |

### Response

```json
{
  "text": "Hello, I would like to know more about quantum computing.",
  "x_groq": {
    "metadata": {
      "model": "whisper-large-v3",
      "duration": 4.52,
      "language": "en",
      "segments": [
        {
          "start": 0.0,
          "end": 2.1,
          "text": "Hello, I would like to know more"
        },
        {
          "start": 2.1,
          "end": 4.52,
          "text": "about quantum computing."
        }
      ]
    }
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `text` | string | Full transcription text |
| `x_groq.metadata.model` | string | Model used for transcription |
| `x_groq.metadata.duration` | number | Audio duration in seconds |
| `x_groq.metadata.language` | string | Detected or specified language |
| `x_groq.metadata.segments` | array | Time-stamped text segments |

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Invalid audio format or corrupted file |
| 401 | Unauthorized - invalid token |
| 413 | Audio file too large |
| 429 | Rate limited |
| 500 | Transcription service error |

---

## Supported Audio Formats

| Format | Extension | Max Duration | Notes |
|--------|-----------|--------------|-------|
| MP3 | `.mp3` | 25 minutes | Most common format |
| WAV | `.wav` | 25 minutes | Uncompressed, higher quality |
| M4A | `.m4a` | 25 minutes | Apple format, AAC codec |
| FLAC | `.flac` | 25 minutes | Lossless compression |
| OGG | `.ogg` | 25 minutes | Open format, Vorbis codec |
| WebM | `.webm` | 25 minutes | Web recording format |

{{< callout type="info" >}}
Maximum audio file size is 25 MB. For longer recordings, consider splitting into segments.
{{< /callout >}}

---

## Usage Examples

### Basic Transcription

```dart
import 'package:dio/dio.dart';

Future<String> transcribeAudio(File audioFile) async {
  final dio = Dio();

  final formData = FormData.fromMap({
    'audio_file': await MultipartFile.fromFile(
      audioFile.path,
      filename: audioFile.path.split('/').last,
    ),
  });

  final response = await dio.post(
    'https://api.chuk.chat/protected/transcribe-audio',
    data: formData,
    options: Options(
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
    ),
  );

  return response.data['text'] as String;
}
```

### With Language and Context

```dart
Future<TranscriptionResult> transcribeWithContext({
  required File audioFile,
  String? language,
  String? contextPrompt,
  double temperature = 0.0,
}) async {
  final dio = Dio();

  final formData = FormData.fromMap({
    'audio_file': await MultipartFile.fromFile(
      audioFile.path,
      filename: audioFile.path.split('/').last,
    ),
    if (language != null) 'language': language,
    if (contextPrompt != null) 'prompt': contextPrompt,
    'temperature': temperature,
  });

  final response = await dio.post(
    'https://api.chuk.chat/protected/transcribe-audio',
    data: formData,
    options: Options(
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
    ),
  );

  return TranscriptionResult.fromJson(response.data);
}

class TranscriptionResult {
  final String text;
  final double duration;
  final String language;
  final List<Segment> segments;

  TranscriptionResult({
    required this.text,
    required this.duration,
    required this.language,
    required this.segments,
  });

  factory TranscriptionResult.fromJson(Map<String, dynamic> json) {
    final metadata = json['x_groq']['metadata'];
    return TranscriptionResult(
      text: json['text'],
      duration: metadata['duration'],
      language: metadata['language'],
      segments: (metadata['segments'] as List)
          .map((s) => Segment.fromJson(s))
          .toList(),
    );
  }
}

class Segment {
  final double start;
  final double end;
  final String text;

  Segment({
    required this.start,
    required this.end,
    required this.text,
  });

  factory Segment.fromJson(Map<String, dynamic> json) {
    return Segment(
      start: json['start'],
      end: json['end'],
      text: json['text'],
    );
  }
}
```

---

## Voice Input Integration

### Recording and Transcribing

The voice input feature uses `record` package for audio recording:

```dart
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';

class VoiceInputService {
  final AudioRecorder _recorder = AudioRecorder();
  String? _recordingPath;

  Future<bool> get hasPermission async {
    return await _recorder.hasPermission();
  }

  Future<void> startRecording() async {
    if (!await hasPermission) {
      throw PermissionDeniedException('Microphone permission required');
    }

    final dir = await getTemporaryDirectory();
    _recordingPath = '${dir.path}/voice_${DateTime.now().millisecondsSinceEpoch}.m4a';

    await _recorder.start(
      RecordConfig(
        encoder: AudioEncoder.aacLc,
        bitRate: 128000,
        sampleRate: 44100,
      ),
      path: _recordingPath!,
    );
  }

  Future<String?> stopRecording() async {
    final path = await _recorder.stop();
    return path;
  }

  Future<String> transcribe(String audioPath) async {
    final file = File(audioPath);

    try {
      final result = await transcribeAudio(file);
      return result;
    } finally {
      // Clean up recording file
      await file.delete();
    }
  }

  void dispose() {
    _recorder.dispose();
  }
}
```

### Complete Voice Input Flow

```dart
class VoiceInputController {
  final VoiceInputService _voiceService;
  final ChatService _chatService;

  VoiceInputState _state = VoiceInputState.idle;

  Future<void> handleVoiceButton() async {
    switch (_state) {
      case VoiceInputState.idle:
        await _startRecording();
        break;
      case VoiceInputState.recording:
        await _stopAndTranscribe();
        break;
      case VoiceInputState.transcribing:
        // Already processing, ignore
        break;
    }
  }

  Future<void> _startRecording() async {
    _state = VoiceInputState.recording;
    notifyListeners();

    try {
      await _voiceService.startRecording();
    } catch (e) {
      _state = VoiceInputState.idle;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> _stopAndTranscribe() async {
    _state = VoiceInputState.transcribing;
    notifyListeners();

    try {
      final audioPath = await _voiceService.stopRecording();
      if (audioPath == null) {
        throw Exception('Recording failed');
      }

      final text = await _voiceService.transcribe(audioPath);

      // Send as chat message
      if (text.isNotEmpty) {
        await _chatService.sendMessage(text);
      }
    } finally {
      _state = VoiceInputState.idle;
      notifyListeners();
    }
  }
}

enum VoiceInputState {
  idle,
  recording,
  transcribing,
}
```

---

## Language Support

Whisper supports 99+ languages. Common language codes:

| Language | Code | Language | Code |
|----------|------|----------|------|
| English | `en` | Spanish | `es` |
| French | `fr` | German | `de` |
| Italian | `it` | Portuguese | `pt` |
| Dutch | `nl` | Russian | `ru` |
| Japanese | `ja` | Korean | `ko` |
| Chinese | `zh` | Arabic | `ar` |

### Auto-Detection

When no language is specified, Whisper automatically detects the spoken language:

```dart
final result = await transcribeWithContext(
  audioFile: audioFile,
  // No language specified - auto-detect
);

print('Detected language: ${result.language}');
```

### Forcing a Language

For better accuracy when you know the language:

```dart
final result = await transcribeWithContext(
  audioFile: audioFile,
  language: 'ja', // Force Japanese
);
```

---

## Context Prompts

The `prompt` parameter helps improve transcription accuracy for specialized vocabulary:

### Technical Terms

```dart
final result = await transcribeWithContext(
  audioFile: audioFile,
  contextPrompt: 'Flutter, Dart, widget, StatelessWidget, BuildContext, Riverpod',
);
```

### Names and Proper Nouns

```dart
final result = await transcribeWithContext(
  audioFile: audioFile,
  contextPrompt: 'DeepSeek, OpenRouter, Supabase, PostgreSQL, chuk_chat',
);
```

### Domain-Specific Language

```dart
final result = await transcribeWithContext(
  audioFile: audioFile,
  contextPrompt: 'AI, LLM, GPT, tokens per second, context window, system prompt',
);
```

---

## Error Handling

### Complete Error Handling

```dart
class TranscriptionService {
  Future<String> transcribe(File audioFile) async {
    // Validate file before upload
    final size = await audioFile.length();
    if (size > 25 * 1024 * 1024) {
      throw TranscriptionException('Audio file too large (max 25 MB)');
    }

    final extension = audioFile.path.split('.').last.toLowerCase();
    if (!['mp3', 'wav', 'm4a', 'flac', 'ogg', 'webm'].contains(extension)) {
      throw TranscriptionException('Unsupported audio format: $extension');
    }

    try {
      final formData = FormData.fromMap({
        'audio_file': await MultipartFile.fromFile(audioFile.path),
      });

      final response = await _dio.post(
        '/protected/transcribe-audio',
        data: formData,
      );

      final text = response.data['text'] as String;
      if (text.isEmpty) {
        throw TranscriptionException('No speech detected in audio');
      }

      return text;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  TranscriptionException _handleDioError(DioException e) {
    switch (e.response?.statusCode) {
      case 400:
        return TranscriptionException('Invalid audio file');
      case 401:
        return TranscriptionException('Authentication required');
      case 413:
        return TranscriptionException('Audio file too large');
      case 429:
        return TranscriptionException('Too many requests, please wait');
      default:
        return TranscriptionException(
          'Transcription failed: ${e.message}',
        );
    }
  }
}

class TranscriptionException implements Exception {
  final String message;
  TranscriptionException(this.message);

  @override
  String toString() => message;
}
```

---

## Best Practices

### Audio Quality

1. **Sample rate**: 16kHz or higher recommended
2. **Bit depth**: 16-bit minimum
3. **Channels**: Mono is sufficient, stereo supported
4. **Background noise**: Minimize for better accuracy

### Performance Tips

1. **Compress audio**: Use AAC/M4A for smaller file sizes
2. **Trim silence**: Remove leading/trailing silence
3. **Segment long audio**: Split recordings over 5 minutes
4. **Use context prompts**: For specialized vocabulary

### Privacy Considerations

```dart
// Always delete temporary recordings
Future<void> cleanupRecording(String path) async {
  final file = File(path);
  if (await file.exists()) {
    await file.delete();
  }
}

// Secure temporary storage
Future<String> getSecureRecordingPath() async {
  final dir = await getApplicationSupportDirectory();
  final recordingsDir = Directory('${dir.path}/recordings');

  if (!await recordingsDir.exists()) {
    await recordingsDir.create(recursive: true);
  }

  return '${recordingsDir.path}/rec_${DateTime.now().millisecondsSinceEpoch}.m4a';
}
```
