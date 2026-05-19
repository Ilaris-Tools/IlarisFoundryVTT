# Plan fuer Hooks in Skill-Proben-Dialogen

_Erstellt: 2026-05-18_

---

## 1. Objective

Hooks in den Fertigkeitsdialog integrieren, sodass externe Module/Systeme das Oeffnen, Rendern, Zustandsaenderungen, Wuerfelwuerfe und Schips-Verbrauch des Dialogs abfangen und erweitern koennen, und der Dialog zusaetzlich ueber eine stabile API programmatisch geoeffnet werden kann.

## 2. Assumptions

- **[BESTAETIGT]** Der kontrollierende Oeffnungspfad fuer den Fertigkeitsdialog verlaeuft ueber `wuerfelwurf()` in `scripts/dice/wuerfel.js`, wo `FertigkeitDialog` aktuell direkt instanziiert wird.
- **[BESTAETIGT]** Im Repository ist das Kampfsystem das klare Vorbild fuer cancellable Pre-Hooks mit `Hooks.call(...) === false` und nicht-blockierende Post-Hooks mit `Hooks.callAll(...)`.
- **[BESTAETIGT]** Fuer den Fertigkeitsdialog existiert heute noch keine oeffentliche API analog zu `openCombatDialog()`.
- **[ANNAHME]** Eine neue Skills-API soll nach demselben Muster wie `scripts/combat/combat-api.js` aufgebaut werden, voraussichtlich als `scripts/skills/skills-api.js`.
- **[ANNAHME]** Modifier- und Preview-Hooks sollen mit normalisierten Berechnungsdaten feuern, nicht mit rohen DOM-Events.
- **[ENTSCHIEDEN]** Der Namensraum wird bewusst breiter fuer Skill-Proben-Dialoge angelegt und nicht auf `FertigkeitDialog` als einzelne Klasse verengt.
- **[ENTSCHIEDEN]** Der Post-Roll-Hook soll von Beginn an einen strukturierten Payload erhalten, aber unabhaengig vom Combat-System umgesetzt werden.

## 3. Steps

1. **What**: Hook-Namensraum und Hook-Konvention fuer Skill-Proben-Dialoge festlegen, inklusive Cancel-Semantik, Payload-Grundsaetzen und Referenzliste der geplanten Hook-Namen.
   **Where**: `docs/_specs/2026_05_18_fertigkeitsdialog_hooks/fertigkeit-hook-reference.md` (neu, temporaer), spaeter `docs/develop/hooks.md`
   **Who**: docs
   **Depends on**: none

2. **What**: Eine oeffentliche Skills-API zum Oeffnen des Dialogs erstellen, z. B. `openSkillDialog(actor, options)`, und dort einen cancelbaren Pre-Open-Hook einfuegen.
   **Where**: `scripts/skills/skills-api.js` (neu)
   **Who**: code
   **Depends on**: 1

3. **What**: Die direkten `new FertigkeitDialog(...).render(true)`-Aufrufe in `wuerfelwurf()` auf die neue API umstellen, damit alle Oeffnungspfade denselben Hook-Einstiegspunkt verwenden.
   **Where**: `scripts/dice/wuerfel.js`
   **Who**: code
   **Depends on**: 2

4. **What**: Einen Rendered-Hook fuer den Dialog einfuegen, der nach dem initialen Aufbau und nach der ersten Preview-Berechnung feuert, damit Verbraucher direkt auf einen voll initialisierten Dialog zugreifen koennen.
   **Where**: `scripts/skills/dialogs/fertigkeit.js`
   **Who**: code
   **Depends on**: 3

5. **What**: Einen Hook fuer normalisierte Zustands- und Modifier-Aenderungen einfuegen, der nach `_calculateModifiers()` bzw. nach der Preview-Aktualisierung feuert und die berechneten Werte als Payload liefert.
   **Where**: `scripts/skills/dialogs/fertigkeit.js`
   **Who**: code
   **Depends on**: 4

6. **What**: Einen cancelbaren Pre-Roll-Hook am Anfang von `_executeRoll()` einfuegen, damit Module den Wurf blockieren oder vor dem Ausfuehren Kontext erfassen koennen.
   **Where**: `scripts/skills/dialogs/fertigkeit.js`
   **Who**: code
   **Depends on**: 5

7. **What**: Einen eigenstaendigen strukturierten Post-Roll-Payload fuer Skill-Proben definieren und implementieren, ohne Abhaengigkeit von Combat-Code. Falls `roll_crit_message(...)` dafuer nicht ausreicht, die noetige Roll-Auswertung lokal fuer Skill-Proben erweitern oder in einen neutralen Helper auslagern.
   **Where**: `scripts/skills/dialogs/fertigkeit.js`, gegebenenfalls `scripts/dice/wuerfel_misc.js`
   **Who**: code
   **Depends on**: 6

8. **What**: Eigene Hooks rund um Schips-Verbrauch einfuegen, mindestens direkt vor und/oder nach `actor.update(...)`, damit Ressourcenverbrauch beobachtbar und bei Bedarf blockierbar wird.
   **Where**: `scripts/skills/dialogs/fertigkeit.js`
   **Who**: code
   **Depends on**: 6

9. **What**: Eine kleine Debug-/Beispieldatei fuer alle neuen Fertigkeitsdialog-Hooks erstellen, analog zur Combat-Referenz, ohne sie produktiv zu registrieren.
   **Where**: `scripts/skills/hooks-debug-example.js` (neu)
   **Who**: code
   **Depends on**: 7, 8

10. **What**: Die Hook-Referenz in die Entwicklerdokumentation ueberfuehren, inklusive Hook-Namen, Parameter, Cancelbarkeit und kurzem Nutzungsbeispiel.
    **Where**: `docs/develop/hooks.md` oder bestehende Hook-Doku erweitern
    **Who**: docs
    **Depends on**: 7, 8, 9

11. **What**: Bestehende E2E-Faelle fuer profane Fertigkeiten, freie Fertigkeiten, Attributsproben und Kreaturen-Proben als Regressionsschutz verwenden und bei Bedarf um gezielte Hook-Checks ergaenzen.
    **Where**: `e2e/cases/e2e-006-fertigkeit-wuerfeldialog-profan/`, `e2e/cases/e2e-019-freie-fertigkeit-dialog/`, `e2e/cases/e2e-007-heldensheet-header-sidebar/`, `e2e/cases/e2e-024-kreaturen-kompendium-belastungstest/`
    **Who**: code
    **Depends on**: 3, 4, 5, 6, 7, 8

## 4. Validation Plan

- **Schritt 2-3**: `npm test`
  **Erwartet**: Bestehende Unit-Tests bleiben gruen; es entstehen keine Regressionsfehler durch die neue Skills-API.
- **Schritt 2-3**: Dialog oeffnen ueber bestehende UI-Einstiege fuer Attribut, profane Fertigkeit und freie Fertigkeit.
  **Erwartet**: Alle bisherigen Oeffnungspfade funktionieren unveraendert, jetzt aber ueber den gemeinsamen API-Einstiegspunkt.
- **Schritt 4**: Manuell `Hooks.on('Ilaris.skillProbeDialogRendered', (dialog) => console.log(dialog))` oder entsprechend finalem Namen registrieren und einen Fertigkeitsdialog oeffnen.
  **Erwartet**: Die Dialog-Instanz wird einmalig nach initialem Rendern inklusive erster Preview-Berechnung gemeldet.
- **Schritt 5**: Manuell einen Modifier, Talentwechsel oder Schips-Option im Dialog aendern und den State-Hook beobachten.
  **Erwartet**: Der Hook feuert mit normalisiertem Payload (`diceFormula`, `finalPW`, `effectivePW`, `label`, Schips-/Talent-Status).
- **Schritt 6**: Manuell einen Pre-Roll-Hook registrieren, der `false` zurueckgibt, und dann im Dialog den Wurf ausloesen.
  **Erwartet**: Kein Wurf, keine Chat-Nachricht, kein Ressourcenverbrauch.
- **Schritt 7**: Manuell einen Post-Roll-Hook registrieren und danach einen regulaeren Wurf ausloesen.
  **Erwartet**: Der Hook erhaelt einen strukturierten Skill-Proben-Payload, z. B. mit `roll`, `formula`, `label`, `finalPW`, Crit/Fumble-Informationen und optionalen Chat-Metadaten.
- **Schritt 8**: Einen Wurf mit aktivem Schips-Verbrauch ausfuehren und Pre-/Post-Schips-Hooks beobachten.
  **Erwartet**: Der Ressourcenverbrauch ist fuer Erweiterungen sichtbar; bei cancelbarer Pre-Variante kann der Verbrauch verhindert werden.
- **Schritt 11**: Relevante E2E-Faelle fuer Fertigkeitsdialoge ausfuehren.
  **Erwartet**: Bestehendes Verhalten bleibt stabil; Preview, Roll-Modus, Talente und freie Fertigkeiten funktionieren weiterhin.
- **Alle Schritte**: `npm run lint`
  **Erwartet**: Keine neuen ESLint- oder Prettier-Verstoesse.

## 5. Delegation Map

| Step | Specialist | Input                                                                                                    | Expected Output                                                            |
| ---- | ---------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1    | docs       | Bestehender Combat-Hook-Stil, Fertigkeitsdialog-Anker, Entscheidung fuer breiten Skill-Proben-Namensraum | Temporaere Hook-Referenz mit Namensraum und Payload-Regeln                 |
| 2    | code       | Hook-Konvention aus Schritt 1                                                                            | `scripts/skills/skills-api.js` mit stabilem API-Einstieg und Pre-Open-Hook |
| 3    | code       | Neue Skills-API, bestehende Aufrufe in `wuerfel.js`                                                      | Alle Oeffnungspfade auf die API umgestellt                                 |
| 4    | code       | Dialog-Lifecycle in `FertigkeitDialog`                                                                   | Rendered-Hook an stabiler Stelle                                           |
| 5    | code       | Berechnungslogik in `_calculateModifiers()` und `_updateModifierDisplay()`                               | State-/Modifier-Hook mit normalisiertem Payload                            |
| 6    | code       | Roll-Einstiegspunkt in `_executeRoll()`                                                                  | Cancelbarer Pre-Roll-Hook                                                  |
| 7    | code       | Entscheidung fuer eigenstaendigen strukturierten Skill-Proben-Payload, aktueller Dialog-Wurf             | Post-Roll-Hook mit neutralem, nicht an Combat gekoppeltem Payload          |
| 8    | code       | Schips-Update-Stelle in `_executeRoll()`                                                                 | Beobachtbare bzw. cancelbare Schips-Hooks                                  |
| 9    | code       | Finale Hook-Namen aus 1 sowie Implementierung aus 4-8                                                    | `scripts/skills/hooks-debug-example.js` als Referenz                       |
| 10   | docs       | Finale Hook-Liste und Payloads                                                                           | Entwicklerdoku fuer neue Fertigkeitsdialog-Hooks                           |
| 11   | code       | Bestehende E2E-Faelle fuer Fertigkeitsdialoge                                                            | Verifizierte Regressionstests, ggf. mit Hook-spezifischer Ergaenzung       |
