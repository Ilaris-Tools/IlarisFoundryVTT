# DRAFT Plan fuer uebernatuerliche Ziel-Active-Effects

## 1. Objective

Uebernatuerliche Talente koennen mehrere eingebettete Active Effects samt Ilaris-Pre-Effect-Metadaten konfigurieren, und bei erfolgreichem `Ilaris.postAngriff` werden in Phase 1 nur Direktziel-Effekte owner-sicher auf die ausgewaehlten Ziel-Actors angewendet, waehrend Template-/Areal-Modi bereits modelliert, aber noch nicht ausgefuehrt werden.

## 2. Context & Research Summary

- Der kontrollierende Laufzeitpfad fuer uebernatuerliche Wuerfe verlaeuft ueber `scripts/dice/wuerfel.js` nach `scripts/combat/combat-api.js` und endet im aktiven Dialog `scripts/combat/dialogs/uebernatuerlich.js`; `scripts/skills/dialogs/uebernatuerlich.js` ist fuer diese Funktionalitaet kein verlaesslicher Einstiegspunkt.
- Der bestehende Hook `callIlarisHookAllWithGlobalMirror('Ilaris.postAngriff', rollResult, this)` in `scripts/combat/dialogs/uebernatuerlich.js` ist der richtige Erfolgs-Hook, weil dort der echte `dialog` und das echte `rollResult` vorliegen; der globale Mirror-Hook liefert nur zusammengefasste Payloads.
- `dialog.selectedActors` ist bereits das zentrale Ziel-Payload. Die automatische Zieluebernahme in `scripts/combat/dialogs/combat-dialog.js` enthaelt `tokenId`, `actorId` und `actorLink`, aber die manuelle Zielauswahl in `scripts/combat/dialogs/target-selection.js` verliert `actorLink`. Dieser Bruch muss vor jeder Effektanwendung behoben werden, damit unverbundene Token-Actors korrekt getroffen werden.
- Token-sichere Zielaufloesung und Owner-Routing existieren bereits fuer Schaden in `scripts/combat/dialogs/shared-dialog-helpers.js` und im Socket-Handlerblock von `scripts/core/init.js`. Die neue Effektanwendung soll denselben Mechanismus wiederverwenden statt einen parallelen Rechtepfad einzufuehren.
- Das System besitzt bereits eine aktive ActiveEffect-Infrastruktur mit eigener `IlarisActiveEffect`-Klasse in `scripts/core/documents/active-effect.js` und turn-basierter Ablaufverwaltung in `scripts/effects/active-effects.js`. Persistente Ziel-Effekte sollten deshalb als echte Actor-embedded Active Effects erzeugt werden.
- Mehrere Effekte pro Item sind technisch schon vorhanden: `scripts/effects/effects-manager.js` und `scripts/effects/templates/effects-section.hbs` erlauben das Erstellen, Bearbeiten und Loeschen eingebetteter Item-Active-Effects. Das ist bereits auf Vorteilen im Einsatz und ist die sauberste Basis fuer uebernatuerliche Talente.
- Fuer die geforderten zusaetzlichen „Pre-Effect“-Infos reicht das nackte ActiveEffect-Payload nicht aus. Die repo-konforme Loesung ist deshalb: der eingebettete Item-ActiveEffect bleibt das vollstaendige Foundry-Effektpayload, und Ilaris-spezifische Metadaten wie Zielmodus, Multiplikator, Startlogik und vorbereitete Template-/Areal-Infos werden unter `flags.Ilaris.preEffect` gespeichert.
- Die WFRP4e-Effektseiten sind als konzeptionelle Inspiration fuer Ziel-/Area-/Aura-Anwendungsarten nuetzlich, aber die Umsetzung soll Ilaris-spezifisch bleiben: keine Uebernahme des WFRP-Datenmodells, keine Kopplung an `computed.targetEffects` der Waffen und keine Mitnahme der Manoever in diesen ersten Plan.
- Da `scripts/items/model-data/models.js` bereits das aktuelle Datenschema repraesentiert und mehrere Effekte ueber Embedded Documents statt ueber `system.*` gespeichert werden, ist fuer Phase 1 voraussichtlich keine Erweiterung des uebernatuerlichen Item-`system`-Schemas noetig.

## 3. Affected Files

| File                                                               | Action    | Reason                                                                                                          |
| ------------------------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------- |
| `scripts/effects/supernatural-pre-effect.js`                       | create    | Gemeinsame Logik fuer `flags.Ilaris.preEffect`, Effekt-Klonen, Sofort-/Daueranwendung und Owner-Routing kapseln |
| `scripts/effects/active-effect-config.js`                          | create    | Foundry-ActiveEffect-Konfiguration fuer uebernatuerliche Item-Effekte um Ilaris-Pre-Effect-Felder erweitern     |
| `scripts/effects/templates/supernatural-pre-effect-fields.hbs`     | create    | Wiederverwendbare Zusatz-UI fuer Zielmodus, Multiplikator, Start und vorbereitete Area-/Template-Daten          |
| `scripts/combat/hooks/supernatural_target_effect_handlers.js`      | create    | Erfolgs-Gating auf `Ilaris.postAngriff` fuer uebernatuerliche Talente von der Dialog-UI trennen                 |
| `scripts/combat/_spec/supernatural_target_effect_handlers.spec.js` | create    | Erfolgs-, Ziel- und Owner-Routing automatisiert absichern                                                       |
| `scripts/items/_spec/uebernatuerlich_talent_sheet.spec.js`         | create    | Sheet-Integration und Default-Pre-Effect-Verhalten absichern                                                    |
| `scripts/combat/hooks.js`                                          | modify    | Neuen Handler beim Combat-Hook-Start registrieren                                                               |
| `scripts/core/init.js`                                             | modify    | Socket-Case fuer owner-geroutete Effektanwendung und ggf. uebernatuerliche Sheet-Registrierung erweitern        |
| `scripts/effects/hooks.js`                                         | modify    | ActiveEffect-Config-Erweiterung initialisieren                                                                  |
| `scripts/effects/effects-manager.js`                               | modify    | Item-spezifische Defaultdaten fuer neu angelegte Effekte ermoeglichen, ohne Vorteile zu regressieren            |
| `scripts/effects/styles/effects.css`                               | modify    | Zusatzfelder im Effektdialog lesbar layouten                                                                    |
| `scripts/items/sheets/uebernatuerlich-talent.js`                   | modify    | Effekte-Sektion aktivieren und uebernatuerliche Effekt-Defaults in den Sheet-Kontext einspeisen                 |
| `scripts/items/templates/uebernatuerlich_talent.hbs`               | modify    | Mehrere Effekte pro uebernatuerlichem Talent im Item-Sheet bearbeitbar machen                                   |
| `scripts/combat/dialogs/target-selection.js`                       | modify    | `actorLink` in manuell gewaelten Zielpayloads erhalten                                                          |
| `docs/develop/hooks.md`                                            | modify    | Neues Laufzeitverhalten, Hook-Nutzung und Phase-1-Grenzen dokumentieren                                         |
| `scripts/combat/dialogs/uebernatuerlich.js`                        | reference | Liefert Erfolgszustand, `dialog.item` und den relevanten `Ilaris.postAngriff`-Hook                              |
| `scripts/combat/dialogs/combat-dialog.js`                          | reference | Definiert das normale Zielpayload fuer automatische Zieluebernahme                                              |
| `scripts/combat/dialogs/shared-dialog-helpers.js`                  | reference | Bestehende token-sichere Zielaufloesung und Owner-Dispatch-Muster wiederverwenden                               |
| `scripts/combat/hooks/combat_dialog_handlers.js`                   | reference | Bestehendes Muster fuer post-roll-orientierte Combat-Hook-Services                                              |
| `scripts/core/documents/active-effect.js`                          | reference | Bestehende Ilaris-ActiveEffect-Erweiterungen und Formelauswertung beachten                                      |
| `scripts/effects/templates/effects-section.hbs`                    | reference | Bereits vorhandene Multi-Effekt-UI fuer Item-Sheets wiederverwenden                                             |
| `scripts/items/model-data/models.js`                               | reference | Bestaetigt, dass keine `template.json`-Erweiterung mehr vorgesehen ist                                          |

## 4. Steps

1. **What**: Einen kanonischen Ilaris-Pre-Effect-Vertrag auf Embedded-Item-ActiveEffects festlegen und als gemeinsame Helper-Logik ausformulieren: `flags.Ilaris.preEffect` soll mindestens Zielmodus (`direct`, `template`, `area`), Zielumfang, Multiplikator-Strategie, Anwendungsart (`persistent`, `immediate`), Startlogik und vorbereitete Template-/Area-Metadaten enthalten, waehrend das eigentliche Foundry-ActiveEffect-Payload unveraendert im Effekt selbst bleibt.
   **Where**: `scripts/effects/supernatural-pre-effect.js`
   **Who**: code
   **Depends on**: none
   **Reference**: `scripts/core/documents/active-effect.js`, `scripts/items/model-data/models.js`, Foundry ActiveEffect API, WFRP-Effekt-Doku als reine Konzeptreferenz

2. **What**: Die uebernatuerlichen Talent-Sheets auf die bestehende Multi-Effekt-UI aufsetzen und das Anlegen neuer Effekte so erweitern, dass neue Embedded Effects fuer uebernatuerliche Talente sofort mit sinnvollen `flags.Ilaris.preEffect`-Defaults starten, ohne die Effektverwaltung auf Vorteilen zu veraendern. Dabei dieselbe Sheet-Oberflaeche fuer alle in Phase 1 unterstuetzten uebernatuerlichen Talenttypen aktivieren.
   **Where**: `scripts/items/sheets/uebernatuerlich-talent.js`, `scripts/items/templates/uebernatuerlich_talent.hbs`, `scripts/effects/effects-manager.js`, `scripts/core/init.js`
   **Who**: code
   **Depends on**: 1
   **Reference**: `scripts/items/templates/vorteil.hbs`, `scripts/effects/templates/effects-section.hbs`, `scripts/core/init.js`

3. **What**: Die Foundry-ActiveEffect-Konfiguration fuer eingebettete Effekte auf uebernatuerlichen Talenten erweitern, damit Anwender neben allen nativen ActiveEffect-Feldern auch die Ilaris-Pre-Effect-Metadaten bearbeiten koennen. Phase 1 soll Direktziel-Anwendung ausfuehren; Template- und Areal-Felder werden bereits speicherbar und validierbar gemacht, aber noch nicht vollstaendig runtime-wirksam.
   **Where**: `scripts/effects/active-effect-config.js`, `scripts/effects/templates/supernatural-pre-effect-fields.hbs`, `scripts/effects/hooks.js`, `scripts/effects/styles/effects.css`
   **Who**: code
   **Depends on**: 1, 2
   **Reference**: Foundry ActiveEffect API, `scripts/effects/hooks.js`, `scripts/effects/styles/effects.css`

4. **What**: Das Zielpayload fuer manuelle Zielauswahl auf denselben token-sicheren Standard wie die automatische Zieluebernahme bringen, insbesondere `actorLink` erhalten und den Payload so normalisieren, dass spaetere Effektanwendung denselben Resolver wie Schaden nutzen kann.
   **Where**: `scripts/combat/dialogs/target-selection.js`
   **Who**: code
   **Depends on**: none
   **Reference**: `scripts/combat/dialogs/combat-dialog.js`, `scripts/combat/dialogs/shared-dialog-helpers.js`

5. **What**: Einen owner-gerouteten Effektanwendungsdienst implementieren, der aus eingebetteten uebernatuerlichen Item-Effects Actor-Zieleffekte erzeugt. Persistente und turnbasierte Effekte sollen als echte Actor-embedded Active Effects angelegt werden; `immediate`-Effekte sollen als einmalige Aenderung ausgefuehrt werden, ohne als dauerhafte Actor-Effects liegenzubleiben. Template-/Areal-Modi werden in dieser Phase erkannt und bewusst nicht ausgefuehrt, sondern nur protokolliert bzw. uebersprungen.
   **Where**: `scripts/effects/supernatural-pre-effect.js`, `scripts/core/init.js`
   **Who**: code
   **Depends on**: 1, 3, 4
   **Reference**: `scripts/items/data/effect-item.js`, `scripts/combat/dialogs/shared-dialog-helpers.js`, Foundry Document/ActiveEffect API

6. **What**: Einen dedizierten Combat-Hook-Handler registrieren, der auf `Ilaris.postAngriff` lauscht, strikt auf `dialog.attackType === 'supernatural'` und `rollResult.success === true` gate’t, nur eingebettete Pre-Effects vom gerade verwendeten uebernatuerlichen Item verarbeitet und weder Waffen-`targetEffects` noch Manoever einbezieht. Fuer Phase 1 soll nur `direct`-Targeting sofort ueber den Dienst aus Schritt 5 ausgefuehrt werden.
   **Where**: `scripts/combat/hooks/supernatural_target_effect_handlers.js`, `scripts/combat/hooks.js`
   **Who**: code
   **Depends on**: 4, 5
   **Reference**: `scripts/combat/dialogs/uebernatuerlich.js`, `scripts/combat/hooks/combat_dialog_handlers.js`, `docs/develop/hooks.md`

7. **What**: Den automatisierten Testschutz erweitern: Sheet-Tests fuer die Effekte-Sektion und Default-Flags, Hook-/Handler-Tests fuer Erfolg vs. Misserfolg, mehrere Effekte pro Item, owner-geroutete Anwendung auf unverbundene Token-Actors, `immediate` vs. `persistent` und das bewusste Nicht-Ausfuehren von Template-/Areal-Metadaten in Phase 1.
   **Where**: `scripts/items/_spec/uebernatuerlich_talent_sheet.spec.js`, `scripts/combat/_spec/supernatural_target_effect_handlers.spec.js`
   **Who**: code
   **Depends on**: 2, 3, 5, 6
   **Reference**: `scripts/combat/_spec/uebernatuerlich_roll.spec.js`, `scripts/waffe/properties/processors/_spec/target-effect-processor.spec.js`

8. **What**: Die Hook- und Entwicklerdokumentation aktualisieren: beschreiben, dass uebernatuerliche Talent-Effekte ueber eingebettete Active Effects plus `flags.Ilaris.preEffect` modelliert werden, dass `Ilaris.postAngriff` der Anwendungszeitpunkt ist, dass in Phase 1 nur Direktziele runtime-wirksam sind und dass Waffen-`targetEffects` sowie Manoever explizit ausserhalb dieses Plans liegen.
   **Where**: `docs/develop/hooks.md`
   **Who**: docs
   **Depends on**: 3, 6, 7
   **Reference**: `docs/develop/hooks.md`, `docs/_specs/2026_05_18_fertigkeitsdialog_hooks/fertigkeitsdialog_hooks_plan.md`

## 5. Validation Plan

- **Schritt 2**: Uebernatuerliches Talent-Item oeffnen, mehrere Effekte anlegen, bearbeiten und loeschen.
  **Checks**: Zauber- und Liturgie-Sheets zeigen die Effekte-Sektion; neu angelegte Effekte erhalten Defaultwerte unter `flags.Ilaris.preEffect`; bestehende Vorteil-Sheets verhalten sich unveraendert.
  **Expected**: Keine Regression der generischen Effekte-Verwaltung; uebernatuerliche Talente koennen mehrere Effekte komfortabel verwalten.
- **Schritt 3**: Effekt-Konfiguration eines auf einem uebernatuerlichen Talent eingebetteten Active Effects oeffnen.
  **Checks**: Alle nativen Foundry-ActiveEffect-Felder bleiben verfuegbar; zusaetzlich erscheinen Ilaris-Pre-Effect-Felder fuer Zielmodus, Multiplikator, Start und vorbereitete Area-/Template-Daten.
  **Expected**: Der Effekt ist voll als Active Effect editierbar; Ilaris-Metadaten werden verlustfrei unter `flags.Ilaris.preEffect` gespeichert.
- **Schritt 4**: Manuelle Zielauswahl mit einem unverbundenen Token testen.
  **Checks**: Das resultierende Zielpayload enthaelt `tokenId`, `actorId` und `actorLink`; spaetere Resolver treffen dieselbe Actor-Instanz wie bei Schaden.
  **Expected**: Keine versehentliche Anwendung auf alle Instanzen desselben Actors.
- **Schritt 5**: Owner-geroutete Effektanwendung isoliert testen.
  **Checks**: Persistente Effekte werden auf dem Ziel-Actor als Embedded ActiveEffects erzeugt; `immediate`-Effekte schreiben genau eine Actor-Aenderung; Template-/Area-Modi erzeugen noch keine Laufzeitwirkung.
  **Expected**: Rechtepfad entspricht dem Schaden-Routing; unberechtigte Clients erzeugen keine direkten Actor-Updates.
- **Schritt 6**: Uebernatuerlichen Dialog mit Erfolg und Misserfolg durchspielen.
  **Checks**: Bei `rollResult.success === false` wird kein Ziel-Effekt angewendet; bei Erfolg werden nur Effekte des aktuell verwendeten uebernatuerlichen Items und nur fuer ausgewaehlte Direktziele angewendet; Waffen-`targetEffects` bleiben unberuehrt.
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
- **Assumption**: Mehrere Effekte pro Item werden ueber eingebettete Active Effects modelliert; es wird kein neues `system.preEffects[]` in `scripts/items/model-data/models.js` eingefuehrt.
- **Assumption**: `template`- und `area`-Modi werden in Phase 1 voll konfigurierbar gespeichert, aber noch nicht ausgefuehrt; das erfuellt die Anforderung „Datenmodell vorbereiten, noch keine komplette Feldlogik“.
- **Assumption**: `immediate` bedeutet in dieser Phase eine einmalige Ziel-Aenderung ohne liegenbleibendes Actor-Effect-Dokument.
- **Open Question**: `anrufung` existiert im Item-Datenmodell, ist aber aktuell nicht in derselben Sheet-Registrierung wie `zauber` und `liturgie` eingetragen. Falls sich bei der Implementierung zeigt, dass `anrufung` einen abweichenden Editor- oder Rollpfad besitzt, muss entschieden werden, ob die Sheet-Registrierung in dieser Phase erweitert oder `anrufung` explizit auf den Folgeplan verschoben wird.

## 7. Delegation Map

| Step | Specialist | Input                                                                                 | Expected Output                                                                   |
| ---- | ---------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1    | code       | Bestehende ActiveEffect-Infrastruktur, Foundry-API, Zielanforderungen aus diesem Plan | Gemeinsamer `flags.Ilaris.preEffect`-Vertrag und Helper-Modul                     |
| 2    | code       | Schritt 1, bestehende Effekte-Sektion, uebernatuerliche Item-Sheets                   | Uebernatuerliche Talent-Sheets mit Multi-Effekt-UI und passenden Default-Effekten |
| 3    | code       | Schritt 1-2, Foundry ActiveEffectConfig, bestehende Effects-Hooks                     | Erweiterte Effekt-Konfiguration fuer uebernatuerliche Item-Effects                |
| 4    | code       | Bestehender TargetSelectionDialog und CombatDialog-Payload                            | Normalisiertes manuelles Zielpayload mit `actorLink`                              |
| 5    | code       | Schritte 1, 3 und 4, bestehendes Owner-Routing fuer Schaden                           | Owner-gerouteter Dienst fuer persistente und sofortige Ziel-Effekte               |
| 6    | code       | Schritt 5, `Ilaris.postAngriff`, bestehendes Combat-Hook-Handler-Muster               | Dedizierter Erfolgs-Handler fuer uebernatuerliche Direktziel-Effekte              |
| 7    | code       | Schritte 2-6, bestehende Combat- und Item-Tests                                       | Automatisierte Regressionstests fuer Sheet, Hook-Gating und Zielanwendung         |
| 8    | docs       | Finale Hook-Namen, Flag-Schema, Phase-1-Grenzen                                       | Aktualisierte Entwicklerdoku in `docs/develop/hooks.md`                           |
