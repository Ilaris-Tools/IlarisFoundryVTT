Hier ist der **Feature-Plan für die Integration der Foundry Package Release API** in deinen bestehenden Build-Workflow.

### **Feature-Plan: Automatisierte Foundry-VTT-Package-Veröffentlichung**

**Ziel:** Erweitere den bestehenden GitHub Actions-Workflow (`build-packs.yml`), um nach der erfolgreichen Erstellung des Release-Assets auf GitHub dieses **automatisch über die offizielle Foundry-API** auf der Foundry-VTT-Package-Website zu veröffentlichen oder zu aktualisieren.

---

#### **1. Grundprinzip & Anforderungen**

- **Single Source of Truth:** Die `system.json` im GitHub-Release ist die maßgebliche Quelle für alle Metadaten (Version, Manifest-URL, Download-URL, Compatibility).
- **API-First Release:** Der Release-Prozess auf Foundry wird vollständig über deren REST-API (`https://foundryvtt.com/_api/packages/release_version/`) gesteuert, anstatt manuell im Package-Builder-Interface.
- **Kein Breaking des Bestehenden:** Der existierende Prozess (Erstellen des ZIP-Archivs, Taggen, GitHub-Release) bleibt unverändert und wird um den finalen API-Schritt erweitert.
- **Sicherheit:** Der Foundry-Package-Release-Token (`FOUNDRY_RELEASE_TOKEN`) wird als GitHub-Repository Secret gespeichert und niemals im Klartext im Workflow oder Logs ausgegeben.
- **Dry-Run für Pre-Releases:** Pre-Release-Builds (`pre_release: true`) triggern einen Dry-Run-API-Call zur Validierung ohne tatsächliche Veröffentlichung.
- **Rate Limiting:** Die API erlaubt maximal 1 Release pro 60 Sekunden. Bei `429 Too Many Requests` wird ein Retry nach 60s durchgeführt.

#### **2. Vorbereitung & Setup (Einmalig)**

| Schritt                             | Beschreibung                                                                                                                                           | Ort/Verantwortung     |
| :---------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------- |
| **1. Release-Token besorgen**       | Auf der Package-Seite im Foundry-Website-Builder das "Package Release Token" kopieren (Feld über "Save Package"-Button).                               | _Du (System-Admin)_   |
| **2. Secret in GitHub hinterlegen** | Den Token als **Repository Secret** unter `https://github.com/<user>/<repo>/settings/secrets/actions` mit dem Namen `FOUNDRY_RELEASE_TOKEN` eintragen. | _Du (Repo-Admin)_     |
| **3. Package-ID bestätigen**        | Sicherstellen, dass die `id` in der `system.json` exakt mit der **Package-ID** auf der Foundry-Website übereinstimmt (aktuell: `Ilaris`).              | _Systemkonfiguration_ |
| **4. Compatibility-Felder prüfen**  | `compatibility.minimum` und `compatibility.verified` müssen in `system.json` korrekt gesetzt sein (aktuell: minimum=12, verified=12).                  | _Systemkonfiguration_ |

#### **3. Erweiterung des GitHub Actions Workflows (`build-packs.yml`)**

Der Workflow erhält einen neuen, separaten Job `release-foundry`, der vom bestehenden `pack`-Job abhängt und **nach erfolgreichem GitHub-Release** ausgeführt wird.

```yaml
# (Neuer Job, der dem Workflow hinzugefügt wird)
release-foundry:
    name: 🚀 Release to Foundry VTT
    runs-on: ubuntu-latest
    needs: [pack] # Hängt vom erfolgreichen Abschluss des 'pack'-Jobs ab
    steps:
        - uses: actions/checkout@v5

        - name: 📖 Read system.json
          id: read-system-json
          run: echo "SYSTEM_JSON=$(jq -c . < system.json)" >> $GITHUB_OUTPUT

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
                dry_run="true"  # Pre-Releases als Dry-Run
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

**Keine Änderungen am `pack`-Job erforderlich:**

- Der `release-foundry`-Job benötigt **keine Artifacts**, da die Foundry-API die Dateien selbst von den GitHub-Release-URLs herunterlädt.
- Der Job greift nur auf die bereits committete `system.json` zu, um Metadaten auszulesen.

#### **4. Behandlung von Versionierung & Konflikten**

- **Version-Konflikt:** Wenn die in der `system.json` angegebene Version bereits auf Foundry existiert, antwortet die API mit `400 Bad Request` und dem Fehler `"Package Version with this Package and Version Number already exists."`. Dies ist gewollt und schützt vor versehentlichen Überschreibungen.
- **Workflow-Reaktion:** Im Fehlerfall schlägt der `release-foundry`-Job fehl. Das GitHub-Release bleibt bestehen, aber die Veröffentlichung auf Foundry ist blockiert.
- **Manueller Retry:** Bei Fehler kann der Job manuell über `workflow_dispatch` erneut getriggert werden (siehe Abschnitt 6).
- **Rollback/Unpublish:** Die Foundry-API bietet **keine** `DELETE`- oder Unpublish-Funktion. Ein veröffentlichtes Release ist endgültig.
- **Pre-Release-Validierung:** Pre-Releases mit Hash-Version (`12.3.0-abc123`) werden als Dry-Run validiert, ohne tatsächlich auf Foundry veröffentlicht zu werden.

#### **5. Fehlerbehandlung & Monitoring**

- **HTTP-Status-Codes:**
    - `200 OK` → Erfolgreiche Veröffentlichung
    - `400 Bad Request` → Validierungsfehler (z.B. fehlende Felder, Versions-Duplikat, ungültige URLs)
    - `429 Too Many Requests` → Rate Limit (automatischer Retry nach 60s)
    - Andere Codes → Allgemeiner Fehler (Job schlägt fehl)
- **Fehler-Output:** Der vollständige API-Response wird im Job-Log ausgegeben, inkl. detaillierter Feld-Fehler bei `400`.
- **Benachrichtigung:** Bei Fehler des `release-foundry`-Jobs erscheint eine Workflow-Failure-Notification in GitHub.
- **Manueller Fallback:** Der manuelle Upload im Package-Builder bleibt als Fallback-Option verfügbar, falls die API unerwartet nicht erreichbar ist.

#### **6. Manueller Trigger (Workflow Dispatch)**

Falls der `release-foundry`-Job fehlschlägt (z.B. durch temporäre API-Probleme), kann der Workflow manuell erneut ausgelöst werden:

```yaml
# (Am Anfang der build-packs.yml hinzufügen)
on:
    workflow_call:
        inputs:
            pre_release:
                description: Should be pre-release with hash
                type: boolean
                required: false
                default: true
    workflow_dispatch: # Bereits vorhanden
        inputs:
            pre_release:
                description: Should be pre-release with hash
                type: boolean
                required: false
                default: true
            skip_foundry_release: # Neuer optionaler Parameter
                description: Skip Foundry API release step
                type: boolean
                required: false
                default: false
```

Der `release-foundry`-Job muss dann um die Condition erweitert werden:

```yaml
release-foundry:
    # ...
    if: ${{ !inputs.skip_foundry_release }} # Kann übersprungen werden
    # ...
```

#### **7. Akzeptanzkriterien (Definition of Done)**

- [ ] **AC1 (Automatisierung):** Bei Auslösung eines Workflows mit `pre_release: false` wird nach erfolgreichem GitHub-Release automatisch ein API-Call an Foundry gemacht.
- [ ] **AC2 (Sicherheit):** Der Foundry-Release-Token wird ausschließlich über das GitHub Secret `FOUNDRY_RELEASE_TOKEN` eingebunden und taucht in keinem Log auf.
- [ ] **AC3 (Robustheit):** Bei einer Versionskollision (Version bereits auf Foundry vorhanden) schlägt der Job mit aussagekräftiger Fehlermeldung fehl.
- [ ] **AC4 (Korrektheit):** Die Foundry-API erhält korrekte URLs zu `system.json` und ZIP-Archiv im GitHub-Release sowie korrekte Compatibility-Werte aus der `system.json`.
- [ ] **AC5 (Pre-Release/Dry-Run):** Workflows mit `pre_release: true` führen einen Dry-Run durch (Validierung ohne Veröffentlichung).
- [ ] **AC6 (Rate Limiting):** Bei HTTP 429 wartet der Job 60s und versucht es ein zweites Mal.
- [ ] **AC7 (Manueller Trigger):** Der Workflow kann manuell mit `workflow_dispatch` gestartet werden, um fehlgeschlagene Foundry-Releases zu wiederholen.
- [ ] **AC8 (Release Notes):** Die `notes`-URL verweist auf die GitHub Release Notes für diese Version.
