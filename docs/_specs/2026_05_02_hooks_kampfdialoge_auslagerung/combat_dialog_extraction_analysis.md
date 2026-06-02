# Extraktions-Analyse: Kampfdialog-Orchestrierung

_Erstellt: 2026-05-02 | Status: Abgeschlossen (Steps 1–5)_

## Hintergrund

Dieses Dokument begleitet den Plan
`hooks_kampfdialoge_auslagerung_plan.md` (2026-05-02) und fasst zusammen,
welche Logik bereits ausgelagert wurde und welche Kandidaten für spätere
Sprints priorisiert sind.

---

## Abgeschlossene Extraktionen

| #   | Codepfad (vorher)                                               | Ausgelagert nach                                                | Trigger-Hook         | Risiko  | Testabdeckung          |
| --- | --------------------------------------------------------------- | --------------------------------------------------------------- | -------------------- | ------- | ---------------------- |
| 1   | `CombatDialog.handleTargetSelection` – Verteidigungsprompt-Loop | `handlePostAngriff` in `combat/hooks/combat_dialog_handlers.js` | `Ilaris.postAngriff` | Mittel  | E2E (e2e-010)          |
| 2   | `AngriffDialog._schadenKlick` – `applyDamageToTarget`-Loop      | `handlePostSchaden` in `combat/hooks/combat_dialog_handlers.js` | `Ilaris.postSchaden` | Mittel  | E2E (e2e-001, e2e-010) |
| 3   | `FernkampfAngriffDialog._schadenKlick` – ditto                  | `handlePostSchaden` (wie oben)                                  | `Ilaris.postSchaden` | Mittel  | E2E (e2e-008, e2e-010) |
| 4   | `defense_button_hook.js` – `handleAkrobatikDefense`             | `combat-api.js`                                                 | DOM-Event            | Niedrig | –                      |
| 5   | `defense_button_hook.js` – Waffensuche + Dialog-Öffnung         | `openDefenseForTarget` in `combat-api.js`                       | DOM-Event            | Niedrig | E2E (e2e-008)          |

### Neue Verantwortungsgrenze (nach Refactoring)

```
┌─────────────────────────┐          ┌───────────────────────────────────────┐
│   Kampf-Dialogklassen   │          │   Hook-Handler (combat_dialog_handlers)│
│  (angriff.js, etc.)     │          │                                       │
│                         │  Hook    │  handlePostAngriff:                   │
│  1. Manöver auslesen    │─────────▶│  • Ziel-Iteration                     │
│  2. Würfelformel bauen  │  Ilaris  │  • Waffenermittlung                   │
│  3. Würfeln             │  .post   │  • Verteidigungsprompt-Chat-Msg       │
│  4. Roll ins Chat posten│  Angriff │  • Akrobatik-Button (Fernkampf)       │
│  5. Hook feuern ────────┼─────────▶│                                       │
│                         │  Ilaris  │  handlePostSchaden:                   │
│  _schadenKlick:         │  .post   │  • Schaden auf Ziele anwenden         │
│  1. Würfeln             │  Schaden │  • applyDamageToTarget für jedes Ziel │
│  2. Roll ins Chat posten│─────────▶│                                       │
│  3. Hook feuern ────────┘          └───────────────────────────────────────┘
```

---

## Weitere Kandidaten (Backlog)

### High Priority

| Kandidat                            | Trigger-Hook (Empfehlung) | Codepfad                                              | Begründung                                                                                   |
| ----------------------------------- | ------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `resolveAttackVsDefense`            | `Ilaris.postVerteidigung` | `AngriffDialog.resolveAttackVsDefense`                | Enthält vollständige Kampfergebnis-Auflösung (Patzer/Triumpf) – zu fachlich für Dialogklasse |
| Hidden-Roll-/Whisper-Orchestrierung | `Ilaris.preAngriff`       | `CombatDialog.handleTargetSelection` (hideRoll-Logik) | Rollensichtbarkeit ist orthogonale Concern; könnte durch Handler konfigurierbar werden       |

### Medium Priority

| Kandidat                                  | Trigger-Hook (Empfehlung)   | Codepfad                                 | Begründung                                                                              |
| ----------------------------------------- | --------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------- |
| Zielkandidaten-Filterung (melee/ranged)   | `Ilaris.preTargetSelection` | `handlePostAngriff` – Waffenfilter-Logik | Bereits im Handler, aber eng mit `attackType` verknüpft; könnte eigener Sub-Hook werden |
| Schips-Stern-Abzug (`_updateSchipsStern`) | `Ilaris.postAngriff`        | `CombatDialog._updateSchipsStern`        | Ressourcenverwaltung gehört konzeptionell nicht in die Dialogklasse                     |

### Low Priority

| Kandidat                | Trigger-Hook (Empfehlung)     | Codepfad                             | Begründung                                        |
| ----------------------- | ----------------------------- | ------------------------------------ | ------------------------------------------------- |
| Modifier-Display-Update | `Ilaris.combatDialogRendered` | `CombatDialog.updateModifierDisplay` | UI-only, kein fachlicher Gewinn durch Auslagerung |
| `eigenschaftenText()`   | `Ilaris.preAngriff`           | `CombatDialog.eigenschaftenText`     | Kleines Hilfsmethode; Auslagerung wenig Mehrwert  |

---

## Verbindliche Entscheidungen (High Priority, Step 7)

### `resolveAttackVsDefense` – im Dialog oder im Handler?

**Entscheidung: Folge-Sprint (Handler)**

- Die Methode enthält die gesamte Patzer/Triumph-Auflösungslogik und erstellt Chat-Nachrichten.
- Sie ist semantisch ein _postVerteidigung_-Handler und sollte über `Hooks.on('Ilaris.postVerteidigung', ...)` angehängt werden.
- Blockiert durch: Dialog muss `attackRoll` weiterhin an den Handler übergeben (über `dialog.attackRoll`).
- Risiko: Mittel – Abwärtskompatibilität mit Modulen, die `resolveAttackVsDefense` direkt aufrufen.

### Hidden-Roll-/Whisper-Orchestrierung – im Dialog oder im Handler?

**Entscheidung: Im Dialog lassen (kein akuter Handlungsbedarf)**

- `handleTargetSelection` entscheidet anhand von `attackType` und `selectedActors`, ob der Wurf
  verborgen wird. Diese Logik ist eng mit dem Dialog-Zustand (Speaker, rollMode) verknüpft.
- Die Steuerbarkeit durch externe Module ist über `Ilaris.preAngriff` (cancelable) ausreichend.
- Kandidat für späteren Refactor, wenn Hide-Roll per Setting konfigurierbar werden soll.
