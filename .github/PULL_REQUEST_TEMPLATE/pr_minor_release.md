## 🧾 Checkliste Minor Release

### 📋 Technische Vorbereitung

-   [ ] Neue Version in system.json (zB `x.1.x` auf `x.2.x`)
-   [ ] Prüfe den dazugehörigen Meilenstein und ob ggf. noch offene Issues auf die nächste version geschoben werden.
-   [ ] Updates im Changelog (Blick auf commits seit letztem eintrag und closed issues im Meilenstein)
-   [ ] Falls nötig werden Spielwelten automatisch migriert?
-   [ ] Sind die migrations getested und gut dokumentiert? Hinweise/Anleitungen?
-   [ ] Sind sonstige Anpassungen der Dokumentation nötig?
-   [ ] Ist das Update eine Erwähnung im Forum wert?

### 🧪 Manuelle Testfälle (falls für Release relevant)

#### Charaktererstellung und Import/Export

-   [ ] **Sephrasto Integration**: Umfangreichen Charakter (viele Vorteile, Waffen, Zauber etc.) in Sephrasto erstellen und ex-/importieren
-   [ ] **Foundry Charaktererstellung**: Neuen Charakter in Foundry anlegen und per Hand "skillen" und bearbeiten

#### Charaktersheet-Funktionalität

-   [ ] **Charaktersheet-Interaktionen**: In dem Charakter in jeden Tab im Sheet gehen und verschiedene Werte bearbeiten und wieder löschen
-   [ ] **Werte-Persistierung**: Gespeicherte Änderungen bleiben nach Neuladen bestehen

#### Kreaturenverwaltung

-   [ ] **Kompendium-Kreaturen**: 3-4 zufällige Kreaturen aus dem Kompendium in die Szene ziehen
-   [ ] **Kreaturenproben**: Mit den Kreaturen Proben würfeln
-   [ ] **Kreaturen-Sheets**: Im Kreaturen-Sheet verschiedene Werte ändern

#### Browser-Kompatibilität

-   [ ] **Browser-Test**: Foundry erfolgreich im Browser öffnen und grundlegende Funktionen testen

#### Kampfsystem (Grundfunktionen)

-   [ ] **Einfacher Kampf**: Mindestens einen einfachen Kampf durchführen mit Angriffen und Verteidigung
-   [ ] **Manöver-Modifikatoren**: Manöver verwenden und prüfen, dass Modifier beim Manöver mit denen im Chat übereinstimmen
-   [ ] **Energieverwaltung**: Prüfen, dass die richtige Menge an Energie abgezogen wird

### 🏷️ Labels

-   Release relevant: [ ] Ja [ ] Nein
