---
title: Text-to-Speech Endpoint
weight: 7
---


The text-to-speech endpoint converts text into audio using the Inworld TTS service.

## Generate Speech

```http
POST /v1/ai/inworld-tts
```

Converts text to audio and returns an audio stream.

### Headers

```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Request Body

```json
{
  "text": "Hello, how can I help you today?",
  "voice_id": "Ashley",
  "model_id": "inworld-tts-1",
  "audio_encoding": "LINEAR16",
  "sample_rate_hz": 48000
}
```

### Request Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `text` | string | Yes | — | Text content to convert to speech |
| `voice_id` | string | No | `"Ashley"` | Voice identifier |
| `model_id` | string | No | `"inworld-tts-1"` | TTS model identifier |
| `audio_encoding` | string | No | `"LINEAR16"` | Audio encoding format |
| `sample_rate_hz` | integer | No | `48000` | Audio sample rate in Hz |

### Response

Returns an audio stream in the specified encoding format.

### Example

```dart
Future<Uint8List> generateSpeech({
  required String text,
  String voiceId = 'Ashley',
}) async {
  final dio = Dio();
  final response = await dio.post(
    'https://api.chuk.chat/v1/ai/inworld-tts',
    data: {
      'text': text,
      'voice_id': voiceId,
      'model_id': 'inworld-tts-1',
      'audio_encoding': 'LINEAR16',
      'sample_rate_hz': 48000,
    },
    options: Options(
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
      responseType: ResponseType.bytes,
    ),
  );

  return Uint8List.fromList(response.data);
}
```
