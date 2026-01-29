---
title: Widgets
weight: 4
---

The `lib/widgets/` directory contains reusable UI components shared across desktop and mobile layouts.

## Files

| File | Widget | Description |
|------|--------|-------------|
| `message_bubble.dart` | `MessageBubble` | Renders a single chat message with markdown, code blocks, copy/edit actions, and attachment previews. Also exports `MessageBubbleAction` and `DocumentAttachment`. |
| `markdown_message.dart` | `MarkdownMessage` | Renders markdown content with syntax highlighting, LaTeX support, and selectable text. |
| `attachment_preview_bar.dart` | `AttachmentPreviewBar` | Horizontal bar showing pending file attachments before sending, with remove buttons. |
| `model_selection_dropdown.dart` | `ModelSelectionDropdown` | Dropdown for selecting the AI model, with icons, badges, and provider info. |
| `auth_gate.dart` | `AuthGate` | Listens to Supabase auth state changes and routes between login and the main app. |
| `credit_display.dart` | `CreditDisplay` | Shows the user's remaining credits and free messages in the sidebar. |
| `free_message_display.dart` | `FreeMessageDisplay` | Displays free message count and usage status. |
| `password_strength_meter.dart` | `PasswordStrengthMeter` | Visual password strength indicator using `InputValidator`. |
| `encrypted_image_widget.dart` | `EncryptedImageWidget` | Decrypts and displays an E2E-encrypted image from Supabase Storage. |
| `image_viewer.dart` | `ImageViewer` | Full-screen image viewer with zoom and pan. |
| `document_viewer.dart` | `DocumentViewer` | Displays document content (text, markdown) in a scrollable viewer. |
| `project_panel.dart` | `ProjectPanel` | Side panel for project context: shows assigned files and system prompt during chat. |
| `project_file_viewer.dart` | `ProjectFileViewer` | Displays and edits project file content with markdown preview. |
| `project_selection_dropdown.dart` | `ProjectSelectionDropdown` | Dropdown for assigning the current chat to a project workspace. |
