---
title: Pages
weight: 3
---

The `lib/pages/` directory contains full-screen page widgets rendered within the app's navigation shell.

## Files

| File | Widget | Description |
|------|--------|-------------|
| `login_page.dart` | `LoginPage` | Email/password authentication with signup, password strength validation, and Supabase auth integration. |
| `settings_page.dart` | `SettingsPage` | Main settings hub: account, theme, customization, system prompt, data export/import, and logout. |
| `account_settings_page.dart` | `AccountSettingsPage` | Account management: email display, password change, and multi-step account deletion with password re-entry. |
| `theme_page.dart` | `ThemePage` | Theme customization: light/dark/system mode, accent color, icon color, background color, film grain toggle. |
| `customization_page.dart` | `CustomizationPage` | Behavior toggles: auto-send voice transcription, reasoning tokens, model info display, TPS counter, image generation settings. |
| `system_prompt_page.dart` | `SystemPromptPage` | Edit the global system prompt, stored encrypted in `user_preferences`. |
| `projects_page.dart` | `ProjectsPage` | Project workspace listing: create, archive, delete projects. Expanded with artifact workspace support. |
| `project_detail_page.dart` | `ProjectDetailPage` | Single project view: manage assigned chats, uploaded files, and artifacts. |
| `project_management_page.dart` | `ProjectManagementPage` | Extended project management with file upload, conversion, editing, and artifact management. |
| `media_manager_page.dart` | `MediaManagerPage` | Browse and manage generated images stored in Supabase Storage. |
| `pricing_page.dart` | `PricingPage` | Credit purchase and pricing display with payment integration. |
| `about_page.dart` | `AboutPage` | App version info, licenses, and links. |
| `coming_soon_page.dart` | `ComingSoonPage` | Placeholder page for unreleased features. |
| `tool_calling_settings_page.dart` | `ToolCallingSettingsPage` | Configure tool calling: enable/disable tools, set approval requirements, toggle tool call visibility. |
| `diagnostics_settings_page.dart` | `DiagnosticsSettingsPage` | Diagnostics and developer options: view logs, export diagnostics reports, toggle developer features. |
| `fullscreen_map_page.dart` | `FullscreenMapPage` | Full-screen interactive map with numbered tappable markers and route polylines from tool call results. |
| `usage_details_page.dart` | `UsageDetailsPage` | Detailed usage analytics with charts showing message counts, token usage, and model breakdown. |

### model_selector/ subdirectory

| File | Description |
|------|-------------|
| `models/model_info.dart` | `ModelInfo` data class for the model selector UI. |
