---
title: Architecture
weight: 2
---

# Project Architecture

Chuk Chat follows a layered architecture pattern designed for maintainability, testability, and cross-platform compatibility. The application separates concerns across distinct layers while maintaining clean boundaries between platform-specific and shared code.

## Architecture Principles

The codebase adheres to several key architectural principles:

- **Separation of Concerns** - UI, business logic, and data access are clearly separated
- **Platform Abstraction** - Conditional imports enable platform-specific implementations without code duplication
- **Composition over Inheritance** - Handler patterns and service composition provide flexibility
- **Cache-First Architecture** - Local data is displayed immediately while background sync keeps it fresh
- **Type Safety** - Sealed classes and strong typing prevent runtime errors

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  - Pages (15 screens)                                        │
│  - Widgets (14 reusable components)                          │
│  - Platform-specific UI variants                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Service Layer                           │
│  - 51 services handling business logic                       │
│  - Authentication, Chat, Encryption, Streaming               │
│  - Projects, Files, Preferences                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                       Data Layer                             │
│  - Models (ChatMessage, StoredChat, Project, etc.)           │
│  - Local cache (SharedPreferences, SecureStorage)            │
│  - Remote storage (Supabase)                                 │
└─────────────────────────────────────────────────────────────┘
```

## Documentation Sections

{{< cards >}}
  {{< card link="directory-structure" title="Directory Structure" icon="folder-open" >}}
  {{< card link="layered-architecture" title="Layered Architecture" icon="template" >}}
  {{< card link="platform-abstraction" title="Platform Abstraction" icon="device-mobile" >}}
  {{< card link="handler-pattern" title="Handler Pattern" icon="puzzle" >}}
  {{< card link="state-management" title="State Management" icon="refresh" >}}
  {{< card link="design-patterns" title="Design Patterns" icon="beaker" >}}
{{< /cards >}}

## Quick Reference

| Aspect | Approach |
|--------|----------|
| **UI Framework** | Flutter with platform-specific variants |
| **State Management** | ValueNotifier + Streams (no external packages) |
| **Dependency Injection** | Static services with singleton pattern |
| **Navigation** | Flutter Navigator 2.0 with programmatic routing |
| **Data Persistence** | Supabase + encrypted local cache |
| **Concurrency** | Dart Isolates for heavy operations |

## Code Statistics

| Category | Count | Description |
|----------|-------|-------------|
| Dart Files | 126 | Total source files |
| Services | 51 | Business logic components |
| Pages | 15 | Application screens |
| Widgets | 14 | Reusable UI components |
| Handlers | 5 | Mobile composition handlers |
| Models | 7 | Core data models (including AppShellConfig) |
| Unit Tests | 444+ | Across services, models, and utils |
| E2E Flows | 4 | Maestro smoke tests |

## Related Documentation

- [Services](../services) - Detailed service documentation
- [Security](../security) - Encryption and authentication details
- [Database](../database) - Schema and RLS policies
- [Development](../development) - Build and development workflow
