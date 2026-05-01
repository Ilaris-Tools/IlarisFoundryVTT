# E2E-004 Wunden Modifier Kampfdialog

## Metadaten

- ID: E2E-004
- Slug: e2e-004-wunden-modifier-kampfdialog
- Kategorie: Gesundheit / Wunden / Kampfdialog / Modifier
- Foundry-Version: v13
- Quelle: Benutzeranforderung 2026-04-15

## Login-Parameter

- Foundry-URL: `http://localhost:30000` (via `E2E_FOUNDRY_URL`)
- Accountname: `Gamemaster` (via `E2E_FOUNDRY_USER`)
- Weltname: `Vanilla Ilaris` (via `E2E_FOUNDRY_WORLD`)
- Passwortquelle: Kein Passwort erforderlich (lokal). Falls benoetigt: `E2E_FOUNDRY_PASSWORD` setzen — kein Klartext im Repo.

## Vorbedingungen (Given)

- Foundry ist erreichbar und bereit.
- Gamemaster-Account hat ausreichende Rechte fuer Login und Weltbeitritt.
- Actor `Testlauf-Held` existiert und besitzt mindestens eine Nahkampfwaffe im Kampf-Tab.
- Per API-Reset wird sichergestellt: `system.gesundheit.wunden = 0`, `system.gesundheit.erschoepfung = 0`, `system.gesundheit.wundenignorieren = false`, `system.modifikatoren.manuellermod = 0`, `system.furcht.furchtstufe = 0`.
- Die Welteinstellung `lepSystem` ist **deaktiviert** (Standard-Wundformel `-(einschraenkungen-2)*2`).
- Sidebar-Modifier zeigt `"-0 auf alle Proben"` (kein globaler Abzug).

## Testphasen und Schritte (When)

### Phase 1 — Wunden-Checkboxen anklicken, Sidebar-Modifier prüfen

1. `Testlauf-Held`-Sheet oeffnen.
2. Per Foundry-API Startzustand sicherstellen (alle Wunden = 0, ignorieren = false).
3. Wunden-Button 1 (Index 0) anklicken → state-0 → state-1 (Wunde).
4. Wunden-Button 2 (Index 1) anklicken → state-0 → state-1 (Wunde).
5. Nach 2 Wunden: Sidebar zeigt noch `"0 auf alle Proben"` (Schwelle liegt bei 3 Wunden).
6. Wunden-Button 3 (Index 2) anklicken → 3 Wunden → erste Erschwernis greift.
7. Sidebar: `-2 auf alle Proben` — Formel: `-(wunden-2)*2 = -(3-2)*2 = -2`.
8. Wunden-Button 4 (Index 3) → Sidebar: `-4 auf alle Proben`.
9. Wunden-Button 5 (Index 4) → Sidebar: `-6 auf alle Proben`.
10. Wunden-Button 6 (Index 5) → Sidebar: `-8 auf alle Proben`.
11. Wunden-Button 7 (Index 6) → Sidebar: `-10 auf alle Proben`.
12. Wunden-Button 8 (Index 7) → Sidebar: `-12 auf alle Proben` (alle 8 Wunden = Maximum).

### Phase 2 — Wundabzüge ignorieren aktivieren → Kampfdialog Kalte Wut (+12) prüfen

13. `Wundabzüge nicht ignorieren`-Schaltfläche anklicken → `wundenignorieren = true`.
14. Button-Text wechselt zu `"Wundabzüge ignorieren"` (Klasse `.true` aktiv).
15. Sidebar zeigt `"0 auf alle Proben"` (Wundabzuege werden ignoriert, globalermod = 0).
16. Kampf-Tab im Sheet anklicken.
17. Ersten `[data-rolltype="angriff_diag"]`-Button der ersten Waffe anklicken → Kampfdialog öffnet.
18. Angriffs-Zusammenfassung (`.modifier-summary.attack-summary`) enthaelt:
    - `"Bonus durch Kalte Wut oder ähnliches: +12 (im Globalenmod verrechnet)"`
19. Verteidigungs-Zusammenfassung (`.modifier-summary.defense-summary`) enthaelt:
    - `"Bonus durch Kalte Wut oder ähnliches: +12 (im Globalenmod verrechnet)"`
20. Dialog schliessen (Close-Button oder Escape).
21. Dialog ist nicht mehr sichtbar.

### Phase 3 — Wundabzüge wieder aktivieren → Kampfdialog Status-Abzug (-12) prüfen

21. `Wundabzüge ignorieren`-Schaltfläche erneut anklicken → `wundenignorieren = false`.
22. Button-Text wechselt zurueck zu `"Wundabzüge nicht ignorieren"`.
23. Kampfdialog erneut oeffnen (gleiche erste Waffe, im Kampf-Tab).
24. Angriffs-Zusammenfassung enthaelt: `"Status (Wunden/Furcht): -12"`.
25. Verteidigungs-Zusammenfassung enthaelt: `"Status (Wunden/Furcht): -12"`.
26. Dialog schliessen.
27. Dialog ist nicht mehr sichtbar.

### Phase 4 — Alle Wunden per API entfernen, Sidebar auf Null-Modifier prüfen

28. Wunden und Erschoepfung via Foundry-API auf 0 setzen
    (`system.gesundheit.wunden = 0`, `system.gesundheit.erschoepfung = 0`).
    (UI-Doppelklick-Ansatz ist durch AppV2-Re-Render-Race nicht robust.)
29. Nach Reset: `wunden = 0`, `erschoepfung = 0`.
30. Sidebar zeigt `"0 auf alle Proben"` (Null-Modifier bestaetigt).
31. Alle 8 `.triStateBtn` tragen CSS-Klasse `.state-0` (leer).

## Erwartete Ergebnisse (Then)

### Sidebar-Modifier (Phase 1)

| Klick Nr. | Wunden | Erwarteter Anzeigetext             |
| --------- | ------ | ---------------------------------- |
| 1         | 1      | `"0 auf alle Proben"` (kein Abzug) |
| 2         | 2      | `"0 auf alle Proben"` (kein Abzug) |
| 3         | 3      | `"-2 auf alle Proben"`             |
| 4         | 4      | `"-4 auf alle Proben"`             |
| 5         | 5      | `"-6 auf alle Proben"`             |
| 6         | 6      | `"-8 auf alle Proben"`             |
| 7         | 7      | `"-10 auf alle Proben"`            |
| 8         | 8      | `"-12 auf alle Proben"`            |

### Kampfdialog Phase 2 (ignorieren = true)

- Angriffs-Summary: `.modifier-summary.attack-summary .modifier-item.maneuver.positive` mit Text
  `"Bonus durch Kalte Wut oder ähnliches: +12 (im Globalenmod verrechnet)"`.
- Verteidigungs-Summary: `.modifier-summary.defense-summary .modifier-item.maneuver.positive` analog.
- `"Status (Wunden/Furcht)"` ist NICHT sichtbar (globalermod=0 → `_buildSignedModifierItem(0, ...)` liefert leer).

### Kampfdialog Phase 3 (ignorieren = false)

- Angriffs-Summary: `.modifier-summary.attack-summary .modifier-item.negative` mit Text
  `"Status (Wunden/Furcht): -12"` (Span-Inhalt `-12`).
- Verteidigungs-Summary: `.modifier-summary.defense-summary .modifier-item.negative` analog.
- `"Bonus durch Kalte Wut"` ist NICHT sichtbar.

### Abschluss (Phase 4)

- Sidebar-Label: `.hero-global-mod-label` enthaelt `"0 auf alle Proben"`.
- Alle 8 `.triStateBtn` tragen Klasse `.state-0` (leer).

## Negative Checks

- `"Status (Wunden/Furcht)"` darf in Phase 2 im Kampfdialog NICHT auftreten.
- `"Bonus durch Kalte Wut"` darf in Phase 3 im Kampfdialog NICHT auftreten.
- `"undefined"` darf in keinem Dialog-Inhalt auftreten.
- Sidebar-Modifier darf nach Phase 4 KEINE negative Zahl zeigen.

## Selektoren-Referenz

| Element                       | Selektor                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------- |
| Wunden-Buttons (alle 8)       | `#lebensleiste .triStateBtn` (innerhalb des Held-Sheets)                        |
| - **Button-Zustand aktiv**    | Klasse `.state-1` (wunden), `.state-2` (erschöpfung), `.state-0` (leer)         |
| Ignorieren-Schaltfläche       | `a.hero-wound-toggle[data-togglevariable="system.gesundheit.wundenignorieren"]` |
| Ignorieren aktiv (true)       | Klasse `.true` am Button; Text enthaelt NICHT `"nicht"`                         |
| Globalermod-Label             | `.hero-global-mod-label`                                                        |
| Kampf-Tab Navigation          | `nav [data-tab="kampf"]`                                                        |
| Angriffsdialog-Trigger        | `[data-action="rollable"][data-rolltype="angriff_diag"]`                        |
| Kampfdialog-Container         | `.application.angriff-dialog` (letztes sichtbares)                              |
| Angriffs-Zusammenfassung      | `.modifier-summary.attack-summary`                                              |
| Verteidigungs-Zusammenfassung | `.modifier-summary.defense-summary`                                             |
| Dialog schliessen             | `button[data-action="close"]` im Dialog                                         |

## Bekannte Risiken und Hinweise

- **300 ms Debounce**: Nach einem Wunden-Klick aktualisiert der Sheet den offenen Kampfdialog erst nach 300 ms. Da der Dialog hier aber frisch geoeffnet wird, ist das kein Problem.
- **Reaktive Sidebar-Updates**: `.hero-global-mod-label` wird nach jedem `actor.update()` reaktiv aktualisiert. Timeout 10 s ist ausreichend.
- **Testlauf-Held Startzustand**: API-Reset am Testbeginn stellt sicher, dass auch nach fehlgeschlagenen Vorgaenger-Tests der Held sauber startet.
- **Wunden-Formel**: `wundabzuege = -(wunden - 2) * 2` gilt ab `wunden >= 3`. Wunden 1–2 haben keinen Abzug.
