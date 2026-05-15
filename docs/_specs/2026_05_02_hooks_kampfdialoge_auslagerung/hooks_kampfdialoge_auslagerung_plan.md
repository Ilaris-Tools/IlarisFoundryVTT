# Plan: Auslagerung von Kampfdialog-Logik in Hook-Handler

_Erstellt: 2026-05-02_

## 1. Objective

Die verbleibende fachliche Logik der Kampfdialoge so in Hook-Handler auslagern, dass insbesondere Verteidigungsauslösung und Schadensanwendung an Verteidiger/ausgewählte Ziele außerhalb der Dialogklassen orchestriert werden und die Dialoge primär UI- und Roll-Erzeugung übernehmen.

## 2. Assumptions

- Die bereits eingeführten Hooks (`Ilaris.pre/postAngriff`, `Ilaris.pre/postVerteidigung`, `Ilaris.pre/postSchaden`, `Ilaris.preCombatDialog`, `Ilaris.combatDialogRendered`, Zielauswahl-Hooks) bleiben API-stabil und werden weiterverwendet.
- Bestehendes Verhalten bleibt unverändert: verdeckte Angriffs-/Verteidigungswürfe, Verteidiger-Whisper und Schadensanwendung müssen funktional identisch bleiben.
- Hook-Handler dürfen in eigenen Modulen unter `scripts/combat/hooks/` oder `scripts/combat/dialogs/` leben, solange Registrierung zentral und einmalig erfolgt.
- Bestehende Socket-Pfade zur Schadensanwendung (`applyDamage`) bleiben erhalten und werden nicht durch ein neues Netzwerkprotokoll ersetzt.
- Die Dialogklassen dürfen weiter Kontextobjekte (Actor, Item, selectedActors, attackRoll) bereitstellen, sollen aber keine Dispatch-Orchestrierung mehr enthalten.

## 3. Steps

1. **Was**: Ist-Analyse der Orchestrierungslogik durchführen und eine Extraktions-Matrix erstellen (Codepfad, Trigger-Hook, Zielmodul, Risiko, Testabdeckung).
   **Where**: `scripts/combat/dialogs/combat_dialog.js`, `scripts/combat/dialogs/angriff.js`, `scripts/combat/dialogs/fernkampf_angriff.js`, `scripts/combat/dialogs/defense_button_hook.js`, `scripts/combat/dialogs/shared_dialog_helpers.js`, `scripts/combat/dialogs/uebernatuerlich.js`
   **Who**: code
   **Depends on**: none

2. **Was**: Hook-Handler-Infrastruktur aufbauen: zentrale Registrierung für Ilaris-Combat-Hook-Handler (klar getrennt von Dialogklassen), inkl. Lebenszyklus in Combat-Feature-Hooks.
   **Where**: `scripts/combat/hooks.js`, neues Modul z. B. `scripts/combat/hooks/combat_dialog_handlers.js`
   **Who**: code
   **Depends on**: 1

3. **Was**: Logik „Verteidigung an Verteidiger senden“ aus `CombatDialog.handleTargetSelection` in einen `postAngriff`-Handler auslagern:
    - Ziel-Iteration
    - Verteidigungswaffen-Ermittlung
    - Rendern/Erzeugen der Defense-Prompt-Chatnachrichten
    - Akrobatik-Button für Fernkampf
      Dialogcode ruft danach nur noch Roll-Posting + Hook aus.
      **Where**: `scripts/combat/dialogs/combat_dialog.js`, neues Handler-Modul aus Schritt 2
      **Who**: code
      **Depends on**: 2

4. **Was**: Logik „Schaden an Verteidiger/Ziel senden“ aus `_schadenKlick()` in Nahkampf/Fernkampf in `postSchaden`-Handler auslagern:
    - Anwendung auf `selectedActors`
    - Delegation an `applyDamageToTarget`
    - Beibehaltung der Rechte-/Socket-Logik aus `shared_dialog_helpers.js`
      Dialogmethoden posten danach nur Roll + Hook.
      **Where**: `scripts/combat/dialogs/angriff.js`, `scripts/combat/dialogs/fernkampf_angriff.js`, neues Handler-Modul aus Schritt 2
      **Who**: code
      **Depends on**: 2

5. **Was**: Defense-Response-Fluss konsolidieren: Übergang vom Defense-Prompt-Button zur Verteidigungsdialog-Öffnung in Hook-Handler-Schicht verlagern, sodass `defense_button_hook.js` nur UI-Event-Delegation macht und die Kampflogik in dedizierten Handlern liegt.
   **Where**: `scripts/combat/dialogs/defense_button_hook.js`, Handler-Modul aus Schritt 2, ggf. `scripts/combat/combat-api.js`
   **Who**: code
   **Depends on**: 3

6. **Was**: Weitere auslagerbare Logik in den Kampfdialogen priorisieren und als Folge-Backlog dokumentieren (High/Medium/Low), inkl. Hook-Empfehlung pro Kandidat.
   **Where**: neue Analyse-Datei `docs/_specs/2026_05_02_hooks_kampfdialoge_auslagerung/combat_dialog_extraction_analysis.md`
   **Who**: docs
   **Depends on**: 1

7. **Was**: High-Priority-Kandidaten aus Schritt 6 direkt einplanen (ohne sofortige Umsetzung), um Hook-Grenzen festzuziehen:
    - Auflösung Angriff vs. Verteidigung (`resolveAttackVsDefense`) als Handler-Kandidat
    - Hidden-Roll/Whisper-Orchestrierung als Handler-Kandidat
    - Zielkandidaten-Filterung (ranged/melee) als Handler-Kandidat
      Ergebnis: verbindliche Entscheidung „im Dialog“ vs. „im Handler“ pro Block.
      **Where**: `scripts/combat/dialogs/angriff.js`, `scripts/combat/dialogs/combat_dialog.js`, Analyse-Datei aus Schritt 6
      **Who**: code
      **Depends on**: 6

8. **Was**: Hook-Dokumentation aktualisieren mit neuer Verantwortungsgrenze (Dialog erzeugt Würfe/UI; Handler orchestrieren Verteidigung/Schaden), inklusive Beispiel-Flow für Nahkampf und Fernkampf.
   **Where**: `docs/develop/hooks.md`
   **Who**: docs
   **Depends on**: 3, 4, 5, 7

## 4. Validation Plan

- `npm test` ausführen: Keine Regression in bestehenden Unit-Tests, insbesondere Combat-Dialog-nahe Specs.
- `npm run lint` ausführen: Keine neuen ESLint/Prettier-Verstöße.
- E2E Smoke für kritische Flows:
    - `e2e-001-nahkampf-angriffsdialog`
    - `e2e-005-nahkampf-patzer-triumph`
    - `e2e-008-fernkampf-angriffsdialog`
    - `e2e-009-uebernatuerlich-dialog`
    - `e2e-010-zielauswahl-verteidigung-schaden`
- Manuelle Hook-Checks in Browser-Konsole:
    - `Ilaris.postAngriff`: Verteidigungs-Prompts werden weiterhin korrekt erzeugt (Whisper-Empfänger und Buttons stimmen).
    - `Ilaris.postSchaden`: Schaden wird weiterhin auf alle ausgewählten Ziele angewandt (inkl. Socket-Delegation bei fehlenden Rechten).
    - Cancelable Hooks (`preAngriff`, `preSchaden`) blockieren weiterhin sauber ohne Seiteneffekte.
- Akzeptanzkriterium Gesamt:
    - Kein fachlicher Unterschied für Anwender.
    - Kampfdialogklassen enthalten keine direkte Dispatch-Orchestrierung für Verteidigungs-Prompts und Ziel-Schadensanwendung mehr.

## 5. Delegation Map

| Step | Specialist | Input                                       | Expected Output                                         |
| ---- | ---------- | ------------------------------------------- | ------------------------------------------------------- |
| 1    | code       | Bestehende Combat-Dialogklassen und Helper  | Extraktions-Matrix mit klaren Auslagerungsgrenzen       |
| 2    | code       | Matrix aus Step 1                           | Registrierte Hook-Handler-Infrastruktur                 |
| 3    | code       | `postAngriff` + Zielkontext aus Dialog      | Verteidigungs-Prompt-Dispatch im Handler                |
| 4    | code       | `postSchaden` + Zielkontext aus Dialog      | Schadens-Dispatch im Handler                            |
| 5    | code       | Bestehender Defense-Button-Flow             | Entkoppelte UI-Events vs. Kampflogik                    |
| 6    | docs       | Ergebnisse Steps 1-5                        | Analyse-Dokument mit Priorisierung High/Medium/Low      |
| 7    | code       | Analyse aus Step 6                          | Verbindliche Folge-Roadmap für weitere Extraktion       |
| 8    | docs       | Finaler Hook-Flow und Verantwortungsgrenzen | Aktualisierte Entwicklerdoku in `docs/develop/hooks.md` |

## 6. Addendum (2026-05-02): Globaler Schaden-Hook mit Owner-Routing

### 6.1 Research (Researcher-Agent)

- Ergebnis: `Hooks.call` und `Hooks.callAll` sind lokal pro Client und nicht netzwerkweit.
- Konsequenz: „Globaler Hook“ fuer `postSchaden` muss ueber `game.socket` transportiert werden.
- Owner-Strategie: Schaden wird von einem deterministisch gewaehlten, aktiven Owner-Client ausgefuehrt.
- Fallback: Wenn kein aktiver Non-GM-Owner vorhanden ist, uebernimmt ein aktiver GM.

### 6.2 Architekturentscheidung

- Der Dialog feuert weiterhin `Ilaris.postSchaden` fuer lokale Erweiterbarkeit.
- Der `postSchaden`-Flow delegiert die effektive Schadensanwendung an ein Owner-geroutetes Socket-Event (`applyDamageByOwner`).
- Genau ein Client fuehrt den Schreibzugriff aus (idempotent ueber `eventId`).

### 6.3 Umgesetzte Implementierung

1. `applyDamageToTarget(...)` auf Owner-Routing umgestellt (`routeDamageToOwner(...)`).
2. Neue Helper:
    - `resolveTargetActorForDamage(...)`
    - `resolveDamageExecutorUserId(...)`
    - `routeDamageToOwner(...)`
3. Socket-Handling erweitert:
    - Neuer Socket-Typ `applyDamageByOwner`
    - Receiver-Guard auf `executorUserId`
    - Event-Deduplizierung ueber `window._ilarisProcessedDamageEvents`
4. Legacy-Pfad `applyDamage` beibehalten (GM-only), um Rueckwaertskompatibilitaet zu sichern.

### 6.4 Akzeptanzkriterium fuer dieses Addendum

- Schadensabzug erfolgt global robust ueber Socket-Routing.
- Der fachlich richtige Besitzer (oder GM-Fallback) fuehrt den Update aus.
- Kein doppelter Schadensabzug pro Event (`eventId`-Deduplizierung).

---

## 7. Addendum (2026-05-02): Globaler Verteidigungs-Prompt mit Owner-Routing

### 7.1 Problem

Der Verteidigungs-Prompt in `handlePostAngriff` wurde lokal erzeugt und nur an
den User zugestellt, dessen `character`-Feld mit dem Ziel-Akteur übereinstimmt.
Fehlt diese Verknüpfung (z. B. GM greift Player-3-Akteur an, Player-3 hat kein
character-Feld gesetzt), erscheint der Prompt bei Player 3 nicht.

### 7.2 Research (Researcher-Agent)

- `Hooks.callAll` ist lokal pro Client, kein Netzwerk-Broadcast.
- Owner-basierte Zustellung über `Actor.testUserPermission` statt `user.character`-Abgleich.
- Gleiche Socket/eventId-Strategie wie beim Schaden-Routing.

### 7.3 Architekturentscheidung

- `handlePostAngriff` baut weiterhin den Prompt-HTML-Inhalt und ermittelt Waffen.
- Zustellung erfolgt ueber `routeDefensePromptToOwner(targetActor, content)`:
    1. Owner-Executor ermitteln (Non-GM-Owner → GM → requester).
    2. Socket-Event `createDefensePromptByOwner` mit `eventId` senden.
    3. Nur der Executor-Client erstellt die `ChatMessage`.
- Whisper-Empfaenger: Executor + alle aktiven GMs.

### 7.4 Umgesetzte Implementierung

1. `handlePostAngriff` delegiert pro Ziel an `routeDefensePromptToOwner`.
2. Neue Helfer in `combat_dialog_handlers.js`:
    - `routeDefensePromptToOwner(targetActor, content)`
    - `getDefensePromptWhisperRecipients(executorUserId)`
    - `handleDefensePromptSocketEvent(data)` (export fuer Socket-Handler)
3. Neuer Socket-Typ `createDefensePromptByOwner` in `core/init.js`.
4. Sichtbarkeitslogik in `renderChatMessageHTML` auf `Actor.testUserPermission` umgestellt.

### 7.5 Akzeptanzkriterium

- Verteidigungs-Prompt erscheint bei Spielern, die den Ziel-Akteur besitzen,
  auch ohne `character`-Feld-Verknüpfung.
- Kein doppelter Prompt durch `eventId`-Deduplizierung.
- GM sieht den Prompt immer (Oversight).

---

## 8. Addendum (2026-05-02): Alle Combat-Dialog-Hooks global spiegeln

### 8.1 Problem

Die Combat-Dialog-Hooks (`pre/postAngriff`, `pre/postSchaden`,
`pre/postVerteidigung`, Zielauswahl-, Render- und Dialog-Start-Hooks) wurden
bisher lokal via `Hooks.call`/`Hooks.callAll` ausgeloest. Externe Clients
konnten Hook-Ereignisse anderer Nutzer daher nicht beobachten.

### 8.2 Architekturentscheidung

- Lokale Hook-Semantik bleibt unveraendert (inkl. Cancellable-Verhalten bei
  `pre*`-Hooks).
- Zusaetzlich wird fuer jeden relevanten Combat-Dialog-Hook ein globaler
  Mirror-Hook ueber Socket gespiegelt.
- Mirror-Namensschema: `Ilaris.global.<OriginalNameOhnePrefix>`
    - Beispiel: `Ilaris.preAngriff` -> `Ilaris.global.preAngriff`
- Mirror-Payload ist serialisiert (`argsSummary`) statt Live-Objekte, um
  zyklische Referenzen und Nebenwirkungen zu vermeiden.

### 8.3 Umgesetzte Implementierung

1. Neues Hook-Utility: `scripts/combat/hooks/global_combat_hooks.js`
    - `callIlarisHookWithGlobalMirror(...)`
    - `callIlarisHookAllWithGlobalMirror(...)`
    - `handleBroadcastCombatHookRequest(...)`
2. Alle Hook-Aufrufe in Combat-Dialogen/API auf Wrapper umgestellt:
    - `scripts/combat/combat-api.js`
    - `scripts/combat/dialogs/combat_dialog.js`
    - `scripts/combat/dialogs/angriff.js`
    - `scripts/combat/dialogs/fernkampf_angriff.js`
    - `scripts/combat/dialogs/uebernatuerlich.js`
3. Socket-Transport erweitert:
    - Neuer Socket-Typ `broadcastCombatHook` in `scripts/core/init.js`
    - Receiver feuert nur Mirror-Hook (kein erneutes lokales Original-Hook).
4. Idempotenz fuer Broadcast-Events:
    - Deduplizierung ueber `window._ilarisProcessedCombatHookEvents`.

### 8.4 Akzeptanzkriterium

- Jeder Combat-Dialog-Hook wird weiterhin lokal korrekt ausgefuehrt.
- Zusaetzlich wird pro Hook-Event ein globaler Mirror-Hook auf allen Clients
  ausgeliefert.
- Keine doppelte Verarbeitung desselben Broadcast-Events.
