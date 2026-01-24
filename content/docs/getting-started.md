---
title: Schnellstart
weight: 1
---

## Installation

Folge diesen Schritten, um das Projekt zu installieren:

{{< steps >}}

### Voraussetzungen prüfen

Stelle sicher, dass die folgenden Tools installiert sind:

- Git
- Node.js (v18 oder höher)
- npm oder yarn

### Repository klonen

```bash
git clone https://github.com/example/project.git
cd project
```

### Abhängigkeiten installieren

```bash
npm install
```

### Projekt starten

```bash
npm run dev
```

{{< /steps >}}

## Konfiguration

{{< callout type="info" >}}
  Die Konfigurationsdatei befindet sich unter `config/settings.yaml`.
{{< /callout >}}

### Beispiel-Konfiguration

```yaml
server:
  port: 3000
  host: localhost

database:
  type: postgresql
  host: localhost
  port: 5432
  name: myapp
```

## Nächste Schritte

{{< cards >}}
  {{< card link="../api-reference" title="API Referenz" subtitle="Lerne die API kennen" icon="code" >}}
  {{< card link="../examples" title="Beispiele" subtitle="Praktische Codebeispiele" icon="book-open" >}}
{{< /cards >}}
