---
title: API Referenz
weight: 2
---

## Übersicht

Diese API bietet verschiedene Endpunkte für die Interaktion mit dem System.

## Authentifizierung

{{< callout type="warning" >}}
  Alle API-Anfragen erfordern einen gültigen API-Schlüssel im Header.
{{< /callout >}}

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.example.com/v1/resource
```

## Endpunkte

### GET /api/v1/users

Gibt eine Liste aller Benutzer zurück.

{{< tabs items="Request,Response" >}}

{{< tab >}}
```bash
curl -X GET https://api.example.com/v1/users \
     -H "Authorization: Bearer YOUR_API_KEY"
```
{{< /tab >}}

{{< tab >}}
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Max Mustermann",
      "email": "max@example.com"
    },
    {
      "id": 2,
      "name": "Anna Schmidt",
      "email": "anna@example.com"
    }
  ]
}
```
{{< /tab >}}

{{< /tabs >}}

### POST /api/v1/users

Erstellt einen neuen Benutzer.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|--------------|--------------|
| `name` | string | Ja | Name des Benutzers |
| `email` | string | Ja | E-Mail-Adresse |
| `role` | string | Nein | Rolle (default: "user") |

## Fehlerbehandlung

Die API verwendet standardmäßige HTTP-Statuscodes:

| Code | Bedeutung |
|------|-----------|
| 200 | Erfolg |
| 400 | Ungültige Anfrage |
| 401 | Nicht autorisiert |
| 404 | Nicht gefunden |
| 500 | Serverfehler |
