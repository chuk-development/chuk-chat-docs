---
title: Beispiele
weight: 3
---

## Codebeispiele

Hier findest du praktische Beispiele für häufige Anwendungsfälle.

### Benutzer abrufen

{{< tabs items="Python,JavaScript,Go" >}}

{{< tab >}}
```python
import requests

API_KEY = "your_api_key"
BASE_URL = "https://api.example.com/v1"

def get_users():
    headers = {"Authorization": f"Bearer {API_KEY}"}
    response = requests.get(f"{BASE_URL}/users", headers=headers)
    return response.json()

users = get_users()
for user in users["data"]:
    print(f"{user['name']} - {user['email']}")
```
{{< /tab >}}

{{< tab >}}
```javascript
const API_KEY = 'your_api_key';
const BASE_URL = 'https://api.example.com/v1';

async function getUsers() {
  const response = await fetch(`${BASE_URL}/users`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  });
  return response.json();
}

const users = await getUsers();
users.data.forEach(user => {
  console.log(`${user.name} - ${user.email}`);
});
```
{{< /tab >}}

{{< tab >}}
```go
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
)

const (
    apiKey  = "your_api_key"
    baseURL = "https://api.example.com/v1"
)

func getUsers() ([]User, error) {
    req, _ := http.NewRequest("GET", baseURL+"/users", nil)
    req.Header.Set("Authorization", "Bearer "+apiKey)

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result UsersResponse
    json.NewDecoder(resp.Body).Decode(&result)
    return result.Data, nil
}
```
{{< /tab >}}

{{< /tabs >}}

### Fehlerbehandlung

{{< callout type="error" >}}
  Behandle Fehler immer angemessen in deinem Code!
{{< /callout >}}

```python
try:
    users = get_users()
except requests.exceptions.HTTPError as e:
    if e.response.status_code == 401:
        print("Ungültiger API-Schlüssel")
    elif e.response.status_code == 429:
        print("Rate-Limit erreicht, bitte warten")
    else:
        print(f"Fehler: {e}")
```

## Projektstruktur

{{< filetree/container >}}
  {{< filetree/folder name="src" >}}
    {{< filetree/folder name="api" state="open" >}}
      {{< filetree/file name="client.py" >}}
      {{< filetree/file name="users.py" >}}
    {{< /filetree/folder >}}
    {{< filetree/folder name="utils" >}}
      {{< filetree/file name="helpers.py" >}}
    {{< /filetree/folder >}}
    {{< filetree/file name="main.py" >}}
  {{< /filetree/folder >}}
  {{< filetree/file name="requirements.txt" >}}
  {{< filetree/file name="README.md" >}}
{{< /filetree/container >}}
