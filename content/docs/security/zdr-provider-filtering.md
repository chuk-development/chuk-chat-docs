---
title: ZDR Provider Filtering
weight: 3
---

# Zero Data Retention (ZDR) Provider Filtering

chuk_chat implements automatic filtering to ensure all AI model providers support **Zero Data Retention (ZDR)**. This means your conversations are never used to train AI models.

## What is ZDR?

Zero Data Retention is a privacy guarantee from AI infrastructure providers that:

- **No Training**: Your prompts and responses are never used to train or improve AI models
- **No Storage**: Conversation data is not retained after the request is completed
- **No Logging**: Sensitive content is not logged for analysis
- **Privacy First**: Your data remains your data

{{< callout type="info" >}}
chuk_chat automatically filters out any provider that does not guarantee Zero Data Retention. This happens transparently - you only see privacy-respecting providers.
{{< /callout >}}

## How It Works

The API server automatically fetches the list of ZDR-compliant providers from OpenRouter and filters all model responses accordingly.

```
┌─────────────────────────────────────────────────────────────┐
│                    API Server Startup                        │
│                                                              │
│  1. Fetch all available models from OpenRouter               │
│  2. Fetch ZDR-compliant providers list                       │
│  3. Filter: Keep only providers with ZDR guarantee           │
│  4. Cache filtered results                                   │
│  5. Refresh every 10 minutes                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Client Request                            │
│                                                              │
│  GET /v1/ai/models                                          │
│                                                              │
│  Response: Only ZDR-compliant providers per model            │
└─────────────────────────────────────────────────────────────┘
```

## Blocked Providers

The following providers are automatically blocked because they do **not** guarantee Zero Data Retention:

| Provider | Reason |
|----------|--------|
| Chutes | May use data for training |
| Alibaba Cloud | May use data for training |
| Friendli | No ZDR guarantee |
| Weights & Biases (wandb) | May log/analyze data |
| Crusoe | No ZDR guarantee |
| nCompass | No ZDR guarantee |

## Allowed Providers

These providers have committed to Zero Data Retention and are available in chuk_chat:

| Provider | Locations | Notes |
|----------|-----------|-------|
| SiliconFlow | Singapore | High availability |
| AtlasCloud | US | Fast inference |
| DeepInfra | US | Multiple quantizations |
| Google Vertex | US | Enterprise-grade |
| NovitaAI | US | Cost-effective |
| Together | US | Wide model support |
| Fireworks | US | Low latency |
| Groq | US | Ultra-fast inference |
| Cerebras | US | Wafer-scale inference |
| SambaNova | US | Enterprise inference |
| Nebius | Netherlands | EU data residency |
| Parasail | US | Multiple quantizations |
| Baseten | US | Custom deployments |
| Hyperbolic | US | Research-focused |
| Mancer | - | Open models |
| Amazon Bedrock | US | AWS integration |
| MiniMax | Singapore | Specialized models |
| Moonshot AI | - | Kimi models |
| Venice | - | Privacy-focused |
| Z.ai | Singapore | GLM models |

## Implementation Details

### Automatic Filtering

The filtering happens in the `ModelRegistry` service:

```python
# ZDR endpoints are fetched from OpenRouter
zdr_providers = await self._fetch_zdr_endpoints()

# Each provider is checked against the ZDR list
for provider in providers_data:
    provider_slug = provider.get("provider_slug", "")

    # Only include providers that support ZDR
    if (model_id, provider_slug) not in zdr_filter:
        continue  # Skip non-ZDR providers

    # Include ZDR-compliant provider
    transformed_providers.append(provider_entry)
```

### Cache Refresh

The ZDR provider list is refreshed automatically:

- **On startup**: Fresh ZDR data is fetched
- **Every 10 minutes**: Background refresh to catch new providers
- **On model list change**: Immediate refresh when models are added/removed

### Fallback Behavior

If the ZDR endpoint is temporarily unavailable:

1. The server continues with the last known ZDR list
2. No non-ZDR providers are ever accidentally exposed
3. Logging alerts operators to the connectivity issue

## API Response Format

When you request available models, only ZDR-compliant providers are returned:

```json
{
  "id": "qwen/qwen3-32b",
  "name": "Qwen: Qwen3 32B",
  "providers": [
    {
      "slug": "groq",
      "name": "Groq (US)",
      "pricing": { "prompt": 0.00000029, "completion": 0.00000059 }
    },
    {
      "slug": "siliconflow/fp8",
      "name": "SiliconFlow (SG)",
      "pricing": { "prompt": 0.00000014, "completion": 0.00000028 }
    }
    // Only ZDR providers shown - Chutes, nCompass etc. are filtered out
  ]
}
```

## Verification

You can verify ZDR filtering is active by checking the server logs:

```
[ModelRegistry] Fetching ZDR endpoints from: https://openrouter.ai/api/v1/endpoints/zdr
[ModelRegistry] Loaded 564 ZDR-compliant model/provider combinations.
[ModelRegistry] ZDR filtering: removed 32 non-ZDR provider(s), skipped 0 model(s) with no ZDR providers.
```

## Privacy Guarantees

With ZDR filtering enabled, chuk_chat provides these privacy guarantees:

| Guarantee | Description |
|-----------|-------------|
| No AI Training | Your conversations never train AI models |
| No Data Retention | Providers delete data after processing |
| Automatic Enforcement | No user action required - always active |
| Continuous Updates | ZDR list refreshed every 10 minutes |
| Transparent Selection | Only privacy-respecting providers shown |

{{< callout type="warning" >}}
ZDR filtering is **always enabled** and cannot be disabled. This is a core privacy feature of chuk_chat.
{{< /callout >}}

## Related Documentation

- [Threat Model](/security/threat-model) - Security threat analysis
- [Encryption](/security/encryption) - End-to-end encryption details
- [Chat Endpoints](/api/chat-endpoints) - API usage for chat
- [Configuration](/api/configuration) - Server configuration options
