# DRAFT Plan fuer uebernatuerliche Ziel-Active-Effects

## 1. Objective

Uebernatuerliche Talente koennen mehrere item-seitig gespeicherte `flags.Ilaris.preEffects[]`-Eintraege samt Ilaris-Zielmetadaten und ActiveEffect-Baudaten konfigurieren, und bei erfolgreichem `Ilaris.postAngriff` werden in Phase 1 nur Direktziel-Effekte owner-sicher auf die ausgewaehlten Ziel-Actors angewendet, waehrend Template-/Areal-Modi bereits modelliert, aber noch nicht ausgefuehrt werden.

## 2. Context & Research Summary

- Der kontrollierende Laufzeitpfad fuer uebernatuerliche Wuerfe verlaeuft ueber `scripts/dice/wuerfel.js` nach `scripts/combat/combat-api.js` und endet im aktiven Dialog `scripts/combat/dialogs/uebernatuerlich.js`; `scripts/skills/dialogs/uebernatuerlich.js` ist fuer diese Funktionalitaet kein verlaesslicher Einstiegspunkt.
- Der bestehende Hook `callIlarisHookAllWithGlobalMirror('Ilaris.postAngriff', rollResult, this)` in `scripts/combat/dialogs/uebernatuerlich.js` ist der richtige Erfolgs-Hook, weil dort der echte `dialog` und das echte `rollResult` vorliegen; der globale Mirror-Hook liefert nur zusammengefasste Payloads.
- `dialog.selectedActors` ist bereits das zentrale Ziel-Payload. Die automatische Zieluebernahme in `scripts/combat/dialogs/combat-dialog.js` enthaelt `tokenId`, `actorId` und `actorLink`, aber die manuelle Zielauswahl in `scripts/combat/dialogs/target-selection.js` verliert `actorLink`. Dieser Bruch muss vor jeder Effektanwendung behoben werden, damit unverbundene Token-Actors korrekt getroffen werden.
- Token-sichere Zielaufloesung und Owner-Routing existieren bereits fuer Schaden in `scripts/combat/dialogs/shared-dialog-helpers.js` und im Socket-Handlerblock von `scripts/core/init.js`. Die neue Effektanwendung soll denselben Mechanismus wiederverwenden statt einen parallelen Rechtepfad einzufuehren.
- Das System besitzt bereits eine aktive ActiveEffect-Infrastruktur mit eigener `IlarisActiveEffect`-Klasse in `scripts/core/documents/active-effect.js` und turn-basierter Ablaufverwaltung in `scripts/effects/active-effects.js`. Persistente Ziel-Effekte sollen deshalb weiterhin als echte Actor-embedded Active Effects erzeugt werden, aber erst zur Laufzeit auf dem Ziel-Actor.
- Der urspruengliche Plan, dafuer eingebettete Item-ActiveEffects wiederzuverwenden, wurde verworfen: fuer uebernatuerliche Talente sollen diese Ziel-Effekte auf dem Item bewusst keine echten ActiveEffect-Dokumente sein, damit kein irrefuehrender Transfer-/Owner-Pfad am Item entsteht.
- Die repo-konforme Loesung ist deshalb: das Item speichert ein reichhaltiges `flags.Ilaris.preEffects[]`-Array. Jeder Eintrag enthaelt sowohl Ilaris-spezifische Metadaten wie Zielmodus, Multiplikator, Startlogik und vorbereitete Template-/Areal-Infos als auch die benoetigten ActiveEffect-Baudaten (`name`, `icon`, `duration`, `changes`, `description`, `tint`), aus denen erst zur Laufzeit ein echter Actor-ActiveEffect gebaut wird.
- Die Effektverstaerkung haengt nicht pauschal am gesamten Effekt, sondern change-genau an einzelnen `changes[]`-Eintraegen. Markierte Changes koennen ueber den Casting-Kontext mitgegebenen Zaehlern wie `Maechtige Magie`, `Maechtige Liturgie`, `Maechtige Anrufung` oder `Hohe Qualitaet` skaliert werden, waehrend andere Changes unveraendert bleiben.
- Der Wirkpfad muss diese Casting-Zaehler deshalb explizit im Hook-Kontext mitgeben. Fuer uebernatuerliche Kampfdialoge ist das `Ilaris.postAngriff`-Payload; fuer allgemeine Wirk-/Skill-Hooks soll derselbe Zaehlervertrag ueber ein standardisiertes `castingModifiers`-Objekt verfuegbar sein.
- Die WFRP4e-Effektseiten sind als konzeptionelle Inspiration fuer Ziel-/Area-/Aura-Anwendungsarten nuetzlich, aber die Umsetzung soll Ilaris-spezifisch bleiben: keine Uebernahme des WFRP-Datenmodells, keine Kopplung an `computed.targetEffects` der Waffen und keine Mitnahme der Manoever in diesen ersten Plan.
- Da `scripts/items/model-data/models.js` bereits das aktuelle `system`-Schema repraesentiert und die neue Konfiguration bewusst unter `flags.Ilaris.preEffects[]` statt unter `system.*` abgelegt wird, ist fuer Phase 1 keine Erweiterung des uebernatuerlichen Talent-Datenmodells noetig.

## 3. Affected Files

| File                                                               | Action    | Reason                                                                                                                                           |
| ------------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scripts/effects/supernatural-pre-effect.js`                       | create    | Gemeinsame Logik fuer `flags.Ilaris.preEffects[]`, Runtime-Bau von Actor-Effekten, Sofort-/Daueranwendung und Owner-Routing kapseln              |
| `scripts/effects/supernatural-pre-effect-sheet.js`                 | create    | Eigenen ApplicationV2-Editor fuer einen PreEffect-Eintrag auf uebernatuerlichen Talenten bereitstellen                                           |
| `scripts/effects/templates/supernatural-pre-effect-fields.hbs`     | create    | Wiederverwendbare Zusatz-UI fuer Zielmodus, Multiplikator, Start und vorbereitete Area-/Template-Daten                                           |
| `scripts/effects/templates/supernatural-pre-effect-config.hbs`     | create    | Formularrahmen fuer die Bearbeitung eines PreEffect-Eintrags inkl. ActiveEffect-Baudaten                                                         |
| `scripts/effects/templates/supernatural-pre-effects-section.hbs`   | create    | Eigene Listen-Section fuer Erstellen, Bearbeiten, Aktivieren und Loeschen gespeicherter PreEffects                                               |
| `scripts/combat/hooks/supernatural_target_effect_handlers.js`      | create    | Erfolgs-Gating auf `Ilaris.postAngriff` fuer uebernatuerliche Talente von der Dialog-UI trennen                                                  |
| `scripts/combat/_spec/supernatural_target_effect_handlers.spec.js` | create    | Erfolgs-, Ziel- und Owner-Routing automatisiert absichern                                                                                        |
| `scripts/items/_spec/uebernatuerlich_talent_sheet.spec.js`         | create    | Sheet-Integration und Default-Pre-Effect-Verhalten absichern                                                                                     |
| `scripts/combat/hooks.js`                                          | modify    | Neuen Handler beim Combat-Hook-Start registrieren                                                                                                |
| `scripts/core/init.js`                                             | modify    | Socket-Case fuer owner-geroutete Effektanwendung und ggf. uebernatuerliche Sheet-Registrierung erweitern                                         |
| `scripts/effects/hooks.js`                                         | modify    | Obsolet gewordene ActiveEffectConfig-Integration entfernen und nur verbleibende Effects-Hooks laden                                              |
| `scripts/effects/styles/effects.css`                               | modify    | Zusatzfelder im Effektdialog lesbar layouten                                                                                                     |
| `scripts/items/sheets/uebernatuerlich-talent.js`                   | modify    | PreEffects-Sektion aktivieren und uebernatuerliche Effekt-Defaults in den Sheet-Kontext einspeisen                                               |
| `scripts/items/templates/uebernatuerlich_talent.hbs`               | modify    | Gespeicherte PreEffects pro uebernatuerlichem Talent im Item-Sheet bearbeitbar machen                                                            |
| `scripts/combat/dialogs/target-selection.js`                       | modify    | `actorLink` in manuell gewaelten Zielpayloads erhalten                                                                                           |
| `docs/develop/hooks.md`                                            | modify    | Neues Laufzeitverhalten, Hook-Nutzung und Phase-1-Grenzen dokumentieren                                                                          |
| `scripts/combat/dialogs/uebernatuerlich.js`                        | reference | Liefert Erfolgszustand, `dialog.item` und den relevanten `Ilaris.postAngriff`-Hook                                                               |
| `scripts/combat/dialogs/combat-dialog.js`                          | reference | Definiert das normale Zielpayload fuer automatische Zieluebernahme                                                                               |
| `scripts/combat/dialogs/shared-dialog-helpers.js`                  | reference | Bestehende token-sichere Zielaufloesung und Owner-Dispatch-Muster wiederverwenden                                                                |
| `scripts/combat/hooks/combat_dialog_handlers.js`                   | reference | Bestehendes Muster fuer post-roll-orientierte Combat-Hook-Services                                                                               |
| `scripts/core/documents/active-effect.js`                          | reference | Bestehende Ilaris-ActiveEffect-Erweiterungen und Formelauswertung beachten                                                                       |
| `scripts/items/model-data/models.js`                               | reference | Bestaetigt, dass fuer uebernatuerliche Talente kein neues `system.preEffects[]` noetig ist, weil die Daten in `flags.Ilaris.preEffects[]` liegen |

## 4. Steps

1. **What**: Einen kanonischen Ilaris-Pre-Effect-Vertrag auf item-seitig gespeicherten `flags.Ilaris.preEffects[]` festlegen und als gemeinsame Helper-Logik ausformulieren: jeder Eintrag soll mindestens Zielmodus (`direct`, `template`, `area`), Zielumfang, Multiplikator-Strategie, Anwendungsart (`persistent`, `immediate`), Startlogik und vorbereitete Template-/Area-Metadaten enthalten sowie genug ActiveEffect-Baudaten mitbringen, damit daraus zur Laufzeit ein echter Actor-Effect gebaut werden kann. Zusaetzlich muessen einzelne `changes[]` optional als verstaerkbar markierbar sein, damit Casting-Zaehler nur die fachlich gemeinten Teilwerte eines Effekts skalieren.
   **Where**: `scripts/effects/supernatural-pre-effect.js`
   **Who**: code
   **Depends on**: none
   **Reference**: `scripts/core/documents/active-effect.js`, `scripts/items/model-data/models.js`, Foundry ActiveEffect API, WFRP-Effekt-Doku als reine Konzeptreferenz

2. **What**: Die uebernatuerlichen Talent-Sheets um eine eigene PreEffects-Sektion erweitern und das Anlegen neuer Eintraege so umsetzen, dass neue Zieleffekte fuer uebernatuerliche Talente sofort mit sinnvollen `flags.Ilaris.preEffects[]`-Defaults starten, ohne die bestehende Effekte-Verwaltung auf Vorteilen zu veraendern. Dabei dieselbe Sheet-Oberflaeche fuer alle in Phase 1 unterstuetzten uebernatuerlichen Talenttypen aktivieren.
   **Where**: `scripts/items/sheets/uebernatuerlich-talent.js`, `scripts/items/templates/uebernatuerlich_talent.hbs`, `scripts/effects/templates/supernatural-pre-effects-section.hbs`, `scripts/core/init.js`
   **Who**: code
   **Depends on**: 1
   **Reference**: `scripts/items/templates/vorteil.hbs`, `scripts/core/init.js`

3. **What**: Einen dedizierten ApplicationV2-Editor fuer PreEffects bereitstellen, damit Anwender die Ilaris-Pre-Effect-Metadaten und die noetigen ActiveEffect-Baudaten auf dem Item pflegen koennen, ohne dafuer ein echtes Item-ActiveEffect-Dokument zu erzeugen. Phase 1 soll Direktziel-Anwendung ausfuehren; Template- und Areal-Felder werden bereits speicherbar und validierbar gemacht, aber nur beim jeweils passenden Zielmodus sichtbar gezeigt.
   **Where**: `scripts/effects/supernatural-pre-effect-sheet.js`, `scripts/effects/templates/supernatural-pre-effect-config.hbs`, `scripts/effects/templates/supernatural-pre-effect-fields.hbs`, `scripts/effects/styles/effects.css`, `scripts/effects/hooks.js`
   **Who**: code
   **Depends on**: 1, 2
   **Reference**: Foundry ApplicationV2 API, `scripts/effects/styles/effects.css`

4. **What**: Das Zielpayload fuer manuelle Zielauswahl auf denselben token-sicheren Standard wie die automatische Zieluebernahme bringen, insbesondere `actorLink` erhalten und den Payload so normalisieren, dass spaetere Effektanwendung denselben Resolver wie Schaden nutzen kann.
   **Where**: `scripts/combat/dialogs/target-selection.js`
   **Who**: code
   **Depends on**: none
   **Reference**: `scripts/combat/dialogs/combat-dialog.js`, `scripts/combat/dialogs/shared-dialog-helpers.js`

5. **What**: Einen owner-gerouteten Effektanwendungsdienst implementieren, der aus den item-seitig gespeicherten uebernatuerlichen `preEffects[]` echte Actor-Zieleffekte erzeugt. Persistente und turnbasierte Effekte sollen als echte Actor-embedded Active Effects angelegt werden; `immediate`-Effekte sollen als einmalige Aenderung ausgefuehrt werden, ohne als dauerhafte Actor-Effects liegenzubleiben. Template-/Areal-Modi werden in dieser Phase erkannt und bewusst nicht ausgefuehrt, sondern nur protokolliert bzw. uebersprungen. Die Change-Anwendung muss dabei den mitgegebenen `castingModifiers`-Kontext beruecksichtigen, um nur markierte Changes je nach `Maechtige Magie`/`Maechtige Liturgie`/`Hohe Qualitaet` zu verstaerken.
   **Where**: `scripts/effects/supernatural-pre-effect.js`, `scripts/core/init.js`
   **Who**: code
   **Depends on**: 1, 3, 4
   **Reference**: `scripts/items/data/effect-item.js`, `scripts/combat/dialogs/shared-dialog-helpers.js`, Foundry Document/ActiveEffect API

6. **What**: Einen dedizierten Combat-Hook-Handler registrieren, der auf `Ilaris.postAngriff` lauscht, strikt auf `dialog.attackType === 'supernatural'` und `rollResult.success === true` gate’t, nur item-seitig gespeicherte `preEffects[]` vom gerade verwendeten uebernatuerlichen Item verarbeitet und weder Waffen-`targetEffects` noch Manoever einbezieht. Fuer Phase 1 soll nur `direct`-Targeting sofort ueber den Dienst aus Schritt 5 ausgefuehrt werden. Das Hook-Payload muss dafuer ein standardisiertes `castingModifiers`-Objekt mit den beim Wirken gewaehlten Zaehlern mitgeben.
   **Where**: `scripts/combat/hooks/supernatural_target_effect_handlers.js`, `scripts/combat/hooks.js`
   **Who**: code
   **Depends on**: 4, 5
   **Reference**: `scripts/combat/dialogs/uebernatuerlich.js`, `scripts/combat/hooks/combat_dialog_handlers.js`, `docs/develop/hooks.md`

7. **What**: Den automatisierten Testschutz erweitern: Sheet-Tests fuer die Effekte-Sektion und Default-Flags, Hook-/Handler-Tests fuer Erfolg vs. Misserfolg, mehrere Effekte pro Item, owner-geroutete Anwendung auf unverbundene Token-Actors, `immediate` vs. `persistent` und das bewusste Nicht-Ausfuehren von Template-/Areal-Metadaten in Phase 1.
   **Where**: `scripts/items/_spec/uebernatuerlich_talent_sheet.spec.js`, `scripts/combat/_spec/supernatural_target_effect_handlers.spec.js`
   **Who**: code
   **Depends on**: 2, 3, 5, 6
   **Reference**: `scripts/combat/_spec/uebernatuerlich_roll.spec.js`, `scripts/waffe/properties/processors/_spec/target-effect-processor.spec.js`

8. **What**: Die Hook- und Entwicklerdokumentation aktualisieren: beschreiben, dass uebernatuerliche Talent-Effekte ueber `flags.Ilaris.preEffects[]` auf dem Item modelliert werden, dass daraus erst zur Laufzeit echte Actor-ActiveEffects gebaut werden, dass `Ilaris.postAngriff` der Anwendungszeitpunkt ist, dass in Phase 1 nur Direktziele runtime-wirksam sind und dass Waffen-`targetEffects` sowie Manoever explizit ausserhalb dieses Plans liegen.
   **Where**: `docs/develop/hooks.md`
   **Who**: docs
   **Depends on**: 3, 6, 7
   **Reference**: `docs/develop/hooks.md`, `docs/_specs/2026_05_18_fertigkeitsdialog_hooks/fertigkeitsdialog_hooks_plan.md`

## 5. Validation Plan

- **Schritt 2**: Uebernatuerliches Talent-Item oeffnen, mehrere Effekte anlegen, bearbeiten und loeschen.
  **Checks**: Zauber-, Liturgie- und Anrufung-Sheets zeigen die PreEffects-Sektion; neu angelegte Eintraege erhalten Defaultwerte unter `flags.Ilaris.preEffects[]`; bestehende Vorteil-Sheets verhalten sich unveraendert.
  **Expected**: Keine Regression bestehender Effekte-Verwaltung; uebernatuerliche Talente koennen mehrere Zieleffekte komfortabel verwalten.
- **Schritt 3**: PreEffect-Editor eines uebernatuerlichen Talents oeffnen.
  **Checks**: Der Editor zeigt Ilaris-Pre-Effect-Felder und die noetigen ActiveEffect-Baudaten (`name`, `icon`, `duration`, `changes`); `Template-Vorbereitung` ist nur bei Zielmodus `template` sichtbar, `Areal-Vorbereitung` nur bei Zielmodus `area`; Speichern schreibt verlustfrei in `flags.Ilaris.preEffects[]` und erzeugt kein echtes Item-ActiveEffect.
  **Expected**: Die Konfiguration bleibt voll auf dem Item als Datenobjekt gespeichert; echte Effects entstehen erst spaeter zur Laufzeit auf dem Actor.
- **Schritt 4**: Manuelle Zielauswahl mit einem unverbundenen Token testen.
  **Checks**: Das resultierende Zielpayload enthaelt `tokenId`, `actorId` und `actorLink`; spaetere Resolver treffen dieselbe Actor-Instanz wie bei Schaden.
  **Expected**: Keine versehentliche Anwendung auf alle Instanzen desselben Actors.
- **Schritt 5**: Owner-geroutete Effektanwendung isoliert testen.
  **Checks**: Persistente Effekte werden aus `flags.Ilaris.preEffects[]` auf dem Ziel-Actor als Embedded ActiveEffects erzeugt; `immediate`-Effekte schreiben genau eine Actor-Aenderung; Template-/Area-Modi erzeugen noch keine Laufzeitwirkung; nur `applyEffectModifier`-markierte Changes werden mit den uebergebenen `castingModifiers` skaliert.
  **Expected**: Rechtepfad entspricht dem Schaden-Routing; unberechtigte Clients erzeugen keine direkten Actor-Updates.
- **Schritt 6**: Uebernatuerlichen Dialog mit Erfolg und Misserfolg durchspielen.
  **Checks**: Bei `rollResult.success === false` wird kein Ziel-Effekt angewendet; bei Erfolg werden nur `preEffects[]` des aktuell verwendeten uebernatuerlichen Items und nur fuer ausgewaehlte Direktziele angewendet; das Hook-Payload enthaelt die beim Wirken gewaehlten Zaehler in `castingModifiers`; Waffen-`targetEffects` bleiben unberuehrt.
  **Expected**: Das Erfolgs-Gating haengt ausschliesslich am uebernatuerlichen `Ilaris.postAngriff`-Pfad.
- **Schritt 7**: Fokus-Tests ausfuehren.
  **Commands**: `npm test -- scripts/combat/_spec/supernatural_target_effect_handlers.spec.js scripts/items/_spec/uebernatuerlich_talent_sheet.spec.js`
  **Expected**: Alle neuen Tests bestehen; bestehende uebernatuerliche Rolltests bleiben gruen.
- **Alle Code-Schritte**: `npm test`
  **Expected**: Keine Regressionsfehler in Combat-, Effects- oder Item-Suites.
- **Alle Code-Schritte**: `npm run lint`
  **Expected**: Keine neuen ESLint-/Prettier-Verstoesse.
- **Gesamtergebnis manuell in Foundry**: Erfolgreichen Zauber oder Liturgie mit mehreren Ziel-Effekten auf ein verlinktes und ein unverlinktes Ziel sprechen.
  **Checks**: Ein unendlicher Effekt bleibt bestehen; ein turnbasierter Effekt startet mit korrekten Foundry-Duration-Feldern; ein `immediate`-Effekt fuehrt genau eine Aenderung aus; nicht ausgewaehlte Tokens bleiben unveraendert.
  **Expected**: Die Phase-1-Funktionalitaet ist fuer Direktziele vollstaendig nutzbar und erzeugt keine Seiteneffekte auf Waffen- oder Manoeversysteme.

## 6. Assumptions & Open Questions

- **Assumption**: Die uebernatuerlichen Talenttypen dieser Phase sollen denselben Sheet- und Hook-Pfad verwenden wie der aktuelle `UebernatuerlichDialog`; der Plan koppelt deshalb bewusst an den Combat-Dialog und nicht an den alten Skills-Dialog.
- **Assumption**: Mehrere Zieleffekte pro Item werden ueber `flags.Ilaris.preEffects[]` modelliert; es wird weder ein neues `system.preEffects[]` in `scripts/items/model-data/models.js` noch eine `template.json`-Erweiterung eingefuehrt.
- **Assumption**: `template`- und `area`-Modi werden in Phase 1 voll konfigurierbar gespeichert, aber noch nicht ausgefuehrt; das erfuellt die Anforderung „Datenmodell vorbereiten, noch keine komplette Feldlogik“.
- **Assumption**: `immediate` bedeutet in dieser Phase eine einmalige Ziel-Aenderung ohne liegenbleibendes Actor-Effect-Dokument.
- **Assumption**: Das Data Model der uebernatuerlichen Talente bleibt unveraendert, weil `preEffects[]` bewusst ausserhalb des `system`-Schemas in Flags gespeichert werden.
- **Open Question**: `anrufung` existiert im Item-Datenmodell, ist aber aktuell nicht in derselben Sheet-Registrierung wie `zauber` und `liturgie` eingetragen. Falls sich bei der Implementierung zeigt, dass `anrufung` einen abweichenden Editor- oder Rollpfad besitzt, muss entschieden werden, ob die Sheet-Registrierung in dieser Phase erweitert oder `anrufung` explizit auf den Folgeplan verschoben wird.

## 7. Delegation Map

| Step | Specialist | Input                                                                                 | Expected Output                                                                        |
| ---- | ---------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1    | code       | Bestehende ActiveEffect-Infrastruktur, Foundry-API, Zielanforderungen aus diesem Plan | Gemeinsamer `flags.Ilaris.preEffects[]`-Vertrag und Helper-Modul                       |
| 2    | code       | Schritt 1, uebernatuerliche Item-Sheets                                               | Uebernatuerliche Talent-Sheets mit PreEffects-Sektion und passenden Defaultdaten       |
| 3    | code       | Schritt 1-2, Foundry ApplicationV2, bestehende Effects-Styles                         | Dedizierter PreEffect-Editor fuer uebernatuerliche Items                               |
| 4    | code       | Bestehender TargetSelectionDialog und CombatDialog-Payload                            | Normalisiertes manuelles Zielpayload mit `actorLink`                                   |
| 5    | code       | Schritte 1, 3 und 4, bestehendes Owner-Routing fuer Schaden                           | Owner-gerouteter Dienst fuer persistente und sofortige Ziel-Effekte aus `preEffects[]` |
| 6    | code       | Schritt 5, `Ilaris.postAngriff`, bestehendes Combat-Hook-Handler-Muster               | Dedizierter Erfolgs-Handler fuer uebernatuerliche Direktziel-Effekte                   |
| 7    | code       | Schritte 2-6, bestehende Combat- und Item-Tests                                       | Automatisierte Regressionstests fuer Sheet, Hook-Gating und Zielanwendung              |
| 8    | docs       | Finale Hook-Namen, Flag-Schema, Data-Model-Abgrenzung, Phase-1-Grenzen                | Aktualisierte Entwicklerdoku in `docs/develop/hooks.md`                                |
