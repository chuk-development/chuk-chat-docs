---
title: Development
weight: 7
---

Guide for setting up the development environment and contributing to Chuk Chat.

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Flutter | 3.9.2+ | Framework |
| Dart | 3.9.2+ | Language |
| Git | Latest | Version control |
| VS Code / Android Studio | Latest | IDE |

## Quick Start

```bash
# Clone repository
git clone https://github.com/your-username/chuk-chat.git
cd chuk-chat

# Install dependencies
flutter pub get

# Run on desktop
flutter run -d macos  # or windows, linux

# Run on mobile
flutter run -d ios    # or android
```

## Environment Setup

Create a `.env` file in the project root:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
OPENROUTER_API_KEY=your_api_key
```

## Project Structure

```
chuk_chat/
├── lib/
│   ├── constants/      # App constants
│   ├── core/           # Core utilities
│   ├── models/         # Data models
│   ├── pages/          # Screen widgets
│   ├── platform_specific/  # Platform code
│   ├── services/       # Business logic
│   ├── utils/          # Helpers
│   └── widgets/        # UI components
├── test/               # Tests
└── pubspec.yaml        # Dependencies
```

## Development Workflow

1. **Create feature branch** from `main`
2. **Implement changes** following code style
3. **Write tests** for new functionality
4. **Run linting** with `flutter analyze`
5. **Submit PR** with description

## Development Sections

{{< cards >}}
  {{< card link="build-commands" title="Build Commands" subtitle="Flutter build scripts" >}}
  {{< card link="code-style" title="Code Style" subtitle="Formatting guidelines" >}}
  {{< card link="testing" title="Testing" subtitle="Test strategies" >}}
  {{< card link="debugging" title="Debugging" subtitle="Debug techniques" >}}
  {{< card link="dependencies" title="Dependencies" subtitle="Package management" >}}
  {{< card link="git-workflow" title="Git Workflow" subtitle="Branch strategy" >}}
  {{< card link="web-deployment" title="Web Deployment" subtitle="Docker + nginx for web" >}}
{{< /cards >}}
