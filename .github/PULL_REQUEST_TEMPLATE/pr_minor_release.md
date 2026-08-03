## 🧾 Checkliste Minor Release

### 📋 Technische Vorbereitung

- [ ] Neue Version in system.json (zB `x.1.x` auf `x.2.x`)
- [ ] Prüfe den dazugehörigen Meilenstein und ob ggf. noch offene Issues auf die nächste version geschoben werden.
- [ ] Updates im Changelog (Blick auf commits seit letztem eintrag und closed issues im Meilenstein)
- [ ] Falls nötig werden Spielwelten automatisch migriert?
- [ ] Sind die migrations getested und gut dokumentiert? Hinweise/Anleitungen?
- [ ] Sind sonstige Anpassungen der Dokumentation nötig?
- [ ] Ist das Update eine Erwähnung im Forum wert?

### 🧪 Manuelle Testfälle (falls für Release relevant)

#### Charaktererstellung und Import/Export

- [ ] **Sephrasto Integration**: Umfangreichen Charakter (viele Vorteile, Waffen, Zauber etc.) in Sephrasto erstellen und ex-/importieren. **Automatisiert:** E2E-016 (XML-Import); **manuell:** Sephrasto-Export selbst erzeugen und Ergebnis fachlich prüfen.
- [ ] **Foundry Charaktererstellung**: Neuen Charakter in Foundry anlegen und per Hand "skillen" und bearbeiten. **Manuell:** Neuerstellungs- und Bearbeitungsfluss sind nicht als Nutzerfluss automatisiert.

#### Charaktersheet-Funktionalität

- [ ] **Charaktersheet-Interaktionen**: In dem Charakter in jeden Tab im Sheet gehen und verschiedene Werte bearbeiten und wieder löschen. **Automatisiert:** E2E-007, E2E-013 bis E2E-015, E2E-018 und E2E-019; **manuell:** vollständiger Bedienfluss und Sichtprüfung.
- [ ] **Werte-Persistierung**: Gespeicherte Änderungen bleiben nach Neuladen bestehen. **Automatisiert:** E2E-024 (Kreaturenänderung); **manuell:** übrige Sheet-Bereiche und Sitzungsende.

#### Kreaturenverwaltung

- [ ] **Kompendium-Kreaturen**: 3-4 zufällige Kreaturen aus dem Kompendium in die Szene ziehen. **Automatisiert:** E2E-024.
- [ ] **Kreaturenproben**: Mit den Kreaturen Proben würfeln. **Automatisiert:** E2E-024.
- [ ] **Kreaturen-Sheets**: Im Kreaturen-Sheet verschiedene Werte ändern. **Automatisiert:** E2E-002 und E2E-024; **manuell:** weitere Werte.

#### Browser-Kompatibilität

- [ ] **Browser-Test**: Foundry erfolgreich im Browser öffnen und grundlegende Funktionen testen. **Manuell:** Die E2E-Suite ersetzt keinen Kompatibilitätstest verschiedener Browser.

#### Kampfsystem (Grundfunktionen)

- [ ] **Einfacher Kampf**: Mindestens einen einfachen Kampf durchführen mit Angriffen und Verteidigung. **Automatisiert:** E2E-001, E2E-010 und E2E-011.
- [ ] **Manöver-Modifikatoren**: Manöver verwenden und prüfen, dass Modifier beim Manöver mit denen im Chat übereinstimmen. **Automatisiert:** E2E-003, E2E-012 und E2E-017.
- [ ] **Energieverwaltung**: Prüfen, dass die richtige Menge an Energie abgezogen wird. **Automatisiert:** E2E-009; **manuell:** Sonderfälle mehrerer Energiearten.

### 🏷️ Labels

- Release relevant: [ ] Ja [ ] Nein
