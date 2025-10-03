# Bug-Fix Prozess

## Übersicht

Dieses Dokument beschreibt den standardisierten Prozess für die Behebung und das Mergen von Bug-Fixes im Ilaris System.

## Versionierung

Für Bug-Fixes wird die **Patch-Version** (letzte Zahl) erhöht:

-   Beispiel: `1.2.3` → `1.2.4`
-   Format: `MAJOR.MINOR.PATCH`
-   Bug-Fixes ändern nur die PATCH-Nummer

## Merge-Prozess

Bug-Fixes werden **direkt in den aktuellen main-Branch** gemergt, nicht in einen separaten Release-Branch.

## Check-Liste für Bug-Fixes

### Vor dem Merge

-   [ ] **Bug reproduzieren**: Sicherstellen, dass der Bug tatsächlich existiert
-   [ ] **Fix implementieren**: Minimale Änderungen zur Behebung des Problems
-   [ ] **Versionsnummer anpassen**: PATCH-Version in `system.json` erhöhen
-   [ ] **Lokale Tests durchführen**:
    -   [ ] Bug ist behoben
    -   [ ] Keine neuen Probleme entstanden
    -   [ ] Grundfunktionalität funktioniert weiterhin
-   [ ] **CHANGELOG.md aktualisieren**:
    -   [ ] Neuer Unterabschnitt mit der Bug-Fix Version erstellen
    -   [ ] Kurze Beschreibung der behobenen Probleme hinzufügen

### Nach dem Merge

-   [ ] **Integration testen**: Sicherstellen, dass der Fix im main-Branch funktioniert
-   [ ] **Dokumentation**: Falls nötig, relevante Dokumentation aktualisieren

## CHANGELOG.md Format

```markdown
## Version 1.2.4 - Bug-Fixes

### Behobene Probleme

-   Beschreibung des behobenen Problems
-   Weitere behobene Issues falls vorhanden

## Version 1.2.3

...
```

## Wichtige Hinweise

-   **Minimale Änderungen**: Nur das Nötigste zur Behebung des Bugs ändern
-   **Keine Feature-Additions**: Bug-Fixes sollen keine neuen Features einführen
-   **Rückwärtskompatibilität**: Bestehende Funktionalität darf nicht beeinträchtigt werden
-   **Schnelle Bereitstellung**: Bug-Fixes sollen zeitnah released werden

## Test-Richtlinien

1. **Funktionaler Test**: Der spezifische Bug ist behoben
2. **Regressions-Test**: Keine bestehende Funktionalität ist betroffen
3. **Edge-Case Test**: Grenzfälle und spezielle Szenarien berücksichtigen
