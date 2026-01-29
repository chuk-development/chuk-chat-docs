---
title: Media Services
weight: 6
---

Chuk Chat provides a suite of media services for image storage, generation, compression, and file conversion -- all designed with privacy-first encryption and efficient resource usage.

## Services

{{< cards >}}
  {{< card link="image-storage-service" title="ImageStorageService" subtitle="Encrypted image upload, download, caching, and lifecycle management via Supabase Storage" >}}
  {{< card link="image-generation-service" title="ImageGenerationService" subtitle="AI image generation from text prompts with automatic encrypted storage" >}}
  {{< card link="image-compression-service" title="ImageCompressionService" subtitle="Background isolate JPEG compression with adaptive quality and dimension scaling" >}}
  {{< card link="file-conversion-service" title="FileConversionService" subtitle="Binary file to markdown conversion with rate limiting, validation, and certificate pinning" >}}
{{< /cards >}}

## Architecture

Media services form a layered pipeline:

1. **ImageCompressionService** compresses raw image bytes to JPEG in a background isolate
2. **ImageStorageService** encrypts compressed images with AES-256-GCM and stores them in Supabase Storage
3. **ImageGenerationService** generates images via the Z-Image Turbo API and delegates storage to `ImageStorageService`
4. **FileConversionService** converts binary documents (PDF, Office, audio, e-books) to markdown for use in chat context

All image data is encrypted client-side before leaving the device. File conversion uses certificate pinning and secure token handling.
