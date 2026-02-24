# Implementation Tasks: Automatisierte Foundry-VTT-Package-Veröffentlichung

## Kontext

Integration der Foundry Package Release API in den bestehenden GitHub Actions-Workflow (`build-packs.yml`), um nach erfolgreichem GitHub-Release automatisch das Package über die offizielle Foundry-API zu veröffentlichen.

---

## Task 1: Vorbereitung - GitHub Secret für Foundry Release Token einrichten

**Beschreibung:**
Stelle sicher, dass der Foundry Package Release Token als GitHub Repository Secret verfügbar ist.

**Anforderungen:**

- Der Token muss im Foundry-Website-Builder (Package-Seite) generiert/kopiert werden
- Secret-Name: `FOUNDRY_RELEASE_TOKEN`
- Speicherort: GitHub Repository Settings → Secrets and variables → Actions
- Der Token darf niemals im Klartext in Workflow-Dateien oder Logs erscheinen

**Akzeptanzkriterien:**

- [ ] Secret `FOUNDRY_RELEASE_TOKEN` ist in GitHub hinterlegt
- [ ] Token ist gültig und hat Berechtigung für Package-Releases
- [ ] Token ist nur über `${{ secrets.FOUNDRY_RELEASE_TOKEN }}` im Workflow zugänglich

**Hinweise:**

- Dies ist eine einmalige manuelle Aktion (kein Code)
- Verifiziere, dass die Package-ID in `system.json` (`Ilaris`) mit der Foundry-Website übereinstimmt

---

## Task 2: system.json Validierung - Compatibility-Felder prüfen

**Beschreibung:**
Stelle sicher, dass die `system.json` alle für die Foundry-API erforderlichen Felder korrekt enthält.

**Anforderungen:**

- `id` muss mit Package-ID auf Foundry-Website übereinstimmen (aktuell: `Ilaris`)
- `version` muss vorhanden sein (wird für Release-Version verwendet)
- `compatibility.minimum` muss vorhanden sein (aktuell: `12`)
- `compatibility.verified` muss vorhanden sein (aktuell: `12`)

**Akzeptanzkriterien:**

- [ ] Alle erforderlichen Felder sind in `system.json` vorhanden
- [ ] Die Werte entsprechen den aktuellen Foundry VTT Anforderungen
- [ ] `id` ist identisch mit der Package-ID auf foundryvtt.com

**Dateien:**

- `system.json`

**Hinweis:**

- Diese Task ist eine Validierung/Prüfung, keine Codeänderung erforderlich (außer wenn Felder fehlen)

---

## Task 3: Workflow-Dispatch erweitern - Optional skip_foundry_release Parameter hinzufügen

**Beschreibung:**
Erweitere den `workflow_dispatch` Trigger in `.github/workflows/build-packs.yml` um einen optionalen Parameter zum Überspringen des Foundry-Release-Steps.

**Anforderungen:**

- Neuer Input-Parameter: `skip_foundry_release`
- Typ: `boolean`
- Standard: `false`
- Beschreibung: "Skip Foundry API release step"
- Muss sowohl in `workflow_call` als auch `workflow_dispatch` verfügbar sein

**Akzeptanzkriterien:**

- [ ] Parameter `skip_foundry_release` ist in beiden Trigger-Definitionen vorhanden
- [ ] Standardwert ist `false` (Foundry-Release ist standardmäßig aktiv)
- [ ] Parameter ist im GitHub Actions UI beim manuellen Trigger sichtbar

**Dateien:**

- `.github/workflows/build-packs.yml`

**Beispiel-Code:**

```yaml
on:
    workflow_call:
        inputs:
            pre_release:
                description: Should be pre-release with hash
                type: boolean
                required: false
                default: true
            skip_foundry_release:
                description: Skip Foundry API release step
                type: boolean
                required: false
                default: false
    workflow_dispatch:
        inputs:
            pre_release:
                description: Should be pre-release with hash
                type: boolean
                required: false
                default: true
            skip_foundry_release:
                description: Skip Foundry API release step
                type: boolean
                required: false
                default: false
```

---

## Task 4: Neuen Job erstellen - release-foundry Job-Grundstruktur

**Beschreibung:**
Erstelle einen neuen Job `release-foundry` in `.github/workflows/build-packs.yml`, der nach dem erfolgreichen `pack`-Job ausgeführt wird.

**Anforderungen:**

- Job-Name: `release-foundry`
- Display-Name: "🚀 Release to Foundry VTT"
- Runner: `ubuntu-latest`
- Depends on: `pack` Job (via `needs: [pack]`)
- Conditional: `if: ${{ !inputs.skip_foundry_release }}`
- Erster Step: Checkout des Repositories

**Akzeptanzkriterien:**

- [ ] Job wird nur nach erfolgreichem Abschluss des `pack`-Jobs ausgeführt
- [ ] Job kann über `skip_foundry_release` Parameter übersprungen werden
- [ ] Job hat Zugriff auf das Repository (via checkout)

**Dateien:**

- `.github/workflows/build-packs.yml`

**Beispiel-Code:**

```yaml
release-foundry:
    name: 🚀 Release to Foundry VTT
    runs-on: ubuntu-latest
    needs: [pack]
    if: ${{ !inputs.skip_foundry_release }}
    steps:
        - uses: actions/checkout@v5
```

---

## Task 5: System.json lesen - Step zum Auslesen der Metadaten

**Beschreibung:**
Füge einen Step zum `release-foundry` Job hinzu, der die `system.json` liest und als Output verfügbar macht.

**Anforderungen:**

- Step-Name: "📖 Read system.json"
- Step-ID: `read-system-json`
- Verwendet `jq` zum Parsen der JSON-Datei
- Output: `SYSTEM_JSON` enthält die kompakte JSON-Struktur

**Akzeptanzkriterien:**

- [ ] `system.json` wird erfolgreich gelesen
- [ ] JSON ist als Output verfügbar für nachfolgende Steps
- [ ] Output ist kompakt (keine Formatierung)

**Dateien:**

- `.github/workflows/build-packs.yml`

**Beispiel-Code:**

```yaml
- name: 📖 Read system.json
  id: read-system-json
  run: echo "SYSTEM_JSON=$(jq -c . < system.json)" >> $GITHUB_OUTPUT
```

---

## Task 6: API-Daten vorbereiten - Step zum Extrahieren und Aufbereiten der Request-Daten

**Beschreibung:**
Füge einen Step hinzu, der aus der `system.json` alle für die Foundry-API erforderlichen Werte extrahiert und URLs generiert.

**Anforderungen:**

- Step-Name: "✍️ Prepare API Request Data"
- Step-ID: `api-data`
- Extrahiere: `id`, `version`, `compatibility.minimum`, `compatibility.verified`
- Bestimme Tag-Name basierend auf `pre_release` Input
- Generiere URLs für: `manifest` (system.json im Release), `notes` (Release-Notes)
- Setze `dry_run` auf `true` für Pre-Releases, sonst `false`

**Logik:**

- Für normale Releases: Tag = Version (z.B. `12.3.0`)
- Für Pre-Releases: Tag = Version + SHA (z.B. `12.3.0-abc123`), dry_run = true
- Manifest-URL: `https://github.com/<repo>/releases/download/<tag>/system.json`
- Notes-URL: `https://github.com/<repo>/releases/tag/<tag>`

**Akzeptanzkriterien:**

- [ ] Alle Werte werden korrekt aus `system.json` extrahiert
- [ ] Tag-Name wird korrekt basierend auf `pre_release` bestimmt
- [ ] URLs sind korrekt formatiert mit dem richtigen Repository und Tag
- [ ] `dry_run` ist `true` für Pre-Releases, sonst `false`
- [ ] Alle Werte sind als Outputs verfügbar

**Dateien:**

- `.github/workflows/build-packs.yml`

**Beispiel-Code:**

```yaml
- name: ✍️ Prepare API Request Data
  id: api-data
  run: |
      # Extrahiere Werte aus system.json
      id="${{fromJson(steps.read-system-json.outputs.SYSTEM_JSON).id}}"
      version="${{fromJson(steps.read-system-json.outputs.SYSTEM_JSON).version}}"
      comp_min="${{fromJson(steps.read-system-json.outputs.SYSTEM_JSON).compatibility.minimum}}"
      comp_ver="${{fromJson(steps.read-system-json.outputs.SYSTEM_JSON).compatibility.verified}}"

      # Bestimme Tag-Name (wie im pack-Job)
      if [ ${{ inputs.pre_release }} = false ]; then
        tag="${version}"
        dry_run="false"
      else
        tag="${version}-${{ github.sha }}"
        dry_run="true"
      fi

      # Baue URLs zum GitHub Release
      manifest_url="https://github.com/${{ github.repository }}/releases/download/${tag}/system.json"
      notes_url="https://github.com/${{ github.repository }}/releases/tag/${tag}"

      echo "ID=${id}" >> $GITHUB_OUTPUT
      echo "DRY_RUN=${dry_run}" >> $GITHUB_OUTPUT
      echo "VERSION=${version}" >> $GITHUB_OUTPUT
      echo "MANIFEST_URL=${manifest_url}" >> $GITHUB_OUTPUT
      echo "NOTES_URL=${notes_url}" >> $GITHUB_OUTPUT
      echo "COMP_MIN=${comp_min}" >> $GITHUB_OUTPUT
      echo "COMP_VER=${comp_ver}" >> $GITHUB_OUTPUT
```

---

## Task 7: Foundry API Call - Step zum Veröffentlichen auf Foundry VTT

**Beschreibung:**
Füge den Haupt-Step hinzu, der den API-Request an die Foundry Package Release API sendet.

**Anforderungen:**

- Step-Name: "🚀 Publish to Foundry Package API"
- Verwendet `FOUNDRY_RELEASE_TOKEN` aus GitHub Secrets (über env-Variable)
- Baut JSON-Request-Body mit `jq`
- Sendet POST-Request an `https://foundryvtt.com/_api/packages/release_version/`
- Implementiert Retry-Logik bei HTTP 429 (Rate Limit)
- Gibt aussagekräftige Logs aus (Request-Body, HTTP-Status, Response)

**Request-Body-Struktur:**

```json
{
  "id": "<package-id>",
  "dry-run": <true|false>,
  "release": {
    "version": "<version>",
    "manifest": "<manifest-url>",
    "notes": "<notes-url>",
    "compatibility": {
      "minimum": "<comp-min>",
      "verified": "<comp-ver>"
    }
  }
}
```

**Fehlerbehandlung:**

- HTTP 200: Erfolg → Exit 0
- HTTP 429: Rate Limit → Warte 60s und versuche erneut (max. 2 Versuche)
- Andere Codes: Fehler → Exit 1

**Akzeptanzkriterien:**

- [ ] API-Request wird mit korrekten Headers gesendet (Content-Type, Authorization)
- [ ] Request-Body enthält alle erforderlichen Felder mit korrekten Werten
- [ ] Bei HTTP 429 erfolgt automatischer Retry nach 60s
- [ ] Bei Erfolg (HTTP 200) wird "Successfully published" ausgegeben
- [ ] Bei Fehler schlägt der Step fehl (Exit 1)
- [ ] Request-Body und Response werden im Log ausgegeben (außer Token)

**Dateien:**

- `.github/workflows/build-packs.yml`

**Beispiel-Code:**

```yaml
- name: 🚀 Publish to Foundry Package API
  env:
      FOUNDRY_RELEASE_TOKEN: ${{ secrets.FOUNDRY_RELEASE_TOKEN }}
  run: |
      # Baue JSON-Request-Body
      REQUEST_BODY=$(jq -n \
        --arg id "${{ steps.api-data.outputs.ID }}" \
        --arg dry_run "${{ steps.api-data.outputs.DRY_RUN }}" \
        --arg version "${{ steps.api-data.outputs.VERSION }}" \
        --arg manifest "${{ steps.api-data.outputs.MANIFEST_URL }}" \
        --arg notes "${{ steps.api-data.outputs.NOTES_URL }}" \
        --arg comp_min "${{ steps.api-data.outputs.COMP_MIN }}" \
        --arg comp_ver "${{ steps.api-data.outputs.COMP_VER }}" \
        '{
          "id": $id,
          "dry-run": ($dry_run == "true"),
          "release": {
            "version": $version,
            "manifest": $manifest,
            "notes": $notes,
            "compatibility": {
              "minimum": $comp_min,
              "verified": $comp_ver
            }
          }
        }')

      echo "Request Body:"
      echo "$REQUEST_BODY" | jq .

      # Sende API-Request mit Retry bei 429
      attempt=1
      max_attempts=2
      while [ $attempt -le $max_attempts ]; do
        response=$(curl -s -w "\n%{http_code}" -X POST \
          -H "Content-Type: application/json" \
          -H "Authorization: $FOUNDRY_RELEASE_TOKEN" \
          -d "$REQUEST_BODY" \
          "https://foundryvtt.com/_api/packages/release_version/")
        
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')
        
        echo "HTTP Status: $http_code"
        echo "Response Body:"
        echo "$body" | jq . || echo "$body"
        
        if [ "$http_code" = "200" ]; then
          echo "✅ Successfully published to Foundry VTT"
          exit 0
        elif [ "$http_code" = "429" ] && [ $attempt -lt $max_attempts ]; then
          echo "⏳ Rate limit hit. Waiting 60 seconds before retry..."
          sleep 60
          attempt=$((attempt + 1))
        else
          echo "❌ API request failed with status $http_code"
          exit 1
        fi
      done
```

---

## Task 8: Integration Testing - Workflow mit allen Tasks testen

**Beschreibung:**
Teste den vollständigen Workflow mit verschiedenen Szenarien.

**Test-Szenarien:**

1. **Pre-Release mit Dry-Run:** Trigger Workflow mit `pre_release: true`
    - Erwartung: Dry-Run wird durchgeführt, keine tatsächliche Veröffentlichung
2. **Normales Release:** Trigger Workflow mit `pre_release: false`
    - Erwartung: Package wird auf Foundry veröffentlicht
3. **Skip Foundry Release:** Trigger Workflow mit `skip_foundry_release: true`
    - Erwartung: `release-foundry` Job wird übersprungen
4. **Versionskollision:** Trigger Release mit bereits existierender Version
    - Erwartung: API gibt HTTP 400 zurück, Job schlägt fehl mit aussagekräftiger Fehlermeldung
5. **Rate Limit Test:** (Falls möglich simulieren)
    - Erwartung: Automatischer Retry nach 60s

**Akzeptanzkriterien:**

- [ ] Alle Test-Szenarien werden erfolgreich durchlaufen
- [ ] Fehler werden korrekt behandelt und geloggt
- [ ] Pre-Releases führen nur Dry-Run durch
- [ ] Normale Releases werden tatsächlich auf Foundry veröffentlicht
- [ ] Skip-Parameter funktioniert wie erwartet

**Hinweis:**

- Verwende zunächst Pre-Releases/Dry-Runs für Tests
- Prüfe Foundry-Package-Seite nach erfolgreichem Release

---

## Task 9: Dokumentation - README/Docs aktualisieren

**Beschreibung:**
Aktualisiere die Projekt-Dokumentation mit Informationen zum neuen automatisierten Release-Prozess.

**Anforderungen:**

- Beschreibe den automatisierten Foundry-Release-Prozess
- Erkläre, wie das `FOUNDRY_RELEASE_TOKEN` Secret eingerichtet wird
- Dokumentiere die Parameter `pre_release` und `skip_foundry_release`
- Beschreibe Fehlerszenarien und wie man damit umgeht
- Erkläre den manuellen Fallback über Package-Builder

**Akzeptanzkriterien:**

- [ ] Dokumentation ist vollständig und verständlich
- [ ] Setup-Schritte sind klar beschrieben
- [ ] Fehlerbehandlung ist dokumentiert
- [ ] Beispiele für manuelle Workflow-Trigger sind vorhanden

**Dateien:**

- `README.md` und/oder `CONTRIBUTING.md`

---

## Finale Akzeptanzkriterien (Alle Tasks)

Die folgenden Kriterien müssen nach Abschluss aller Tasks erfüllt sein:

- [ ] **AC1 (Automatisierung):** Bei Auslösung eines Workflows mit `pre_release: false` wird nach erfolgreichem GitHub-Release automatisch ein API-Call an Foundry gemacht.
- [ ] **AC2 (Sicherheit):** Der Foundry-Release-Token wird ausschließlich über das GitHub Secret `FOUNDRY_RELEASE_TOKEN` eingebunden und taucht in keinem Log auf.
- [ ] **AC3 (Robustheit):** Bei einer Versionskollision (Version bereits auf Foundry vorhanden) schlägt der Job mit aussagekräftiger Fehlermeldung fehl.
- [ ] **AC4 (Korrektheit):** Die Foundry-API erhält korrekte URLs zu `system.json` und ZIP-Archiv im GitHub-Release sowie korrekte Compatibility-Werte aus der `system.json`.
- [ ] **AC5 (Pre-Release/Dry-Run):** Workflows mit `pre_release: true` führen einen Dry-Run durch (Validierung ohne Veröffentlichung).
- [ ] **AC6 (Rate Limiting):** Bei HTTP 429 wartet der Job 60s und versucht es ein zweites Mal.
- [ ] **AC7 (Manueller Trigger):** Der Workflow kann manuell mit `workflow_dispatch` gestartet werden, um fehlgeschlagene Foundry-Releases zu wiederholen.
- [ ] **AC8 (Release Notes):** Die `notes`-URL verweist auf die GitHub Release Notes für diese Version.

---

## Wichtige Hinweise für den Coding Agent

### Reihenfolge beachten

- Tasks 1-2 sind Voraussetzungen (teilweise manuell)
- Tasks 3-7 bauen aufeinander auf und sollten in dieser Reihenfolge implementiert werden
- Task 8 (Testing) erst nach Abschluss aller Code-Tasks
- Task 9 (Dokumentation) zum Schluss

### Dateien

- Hauptdatei: `.github/workflows/build-packs.yml`
- Validierung: `system.json`
- Dokumentation: `README.md` / `CONTRIBUTING.md`

### Sicherheitsaspekte

- Token niemals im Klartext im Code
- Nur über `${{ secrets.FOUNDRY_RELEASE_TOKEN }}` referenzieren
- Keine Token-Ausgabe in Logs

### API-Spezifikation

- Endpoint: `https://foundryvtt.com/_api/packages/release_version/`
- Methode: POST
- Header: `Content-Type: application/json`, `Authorization: <token>`
- Rate Limit: Max. 1 Request pro 60 Sekunden

### Fehlerbehandlung

- HTTP 200 = Erfolg
- HTTP 400 = Validierungsfehler (z.B. Versionsduplikat)
- HTTP 429 = Rate Limit → Retry nach 60s
- Andere = Fehler
