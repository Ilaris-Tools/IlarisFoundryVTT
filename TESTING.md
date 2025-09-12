# Manueller Test-Leitfaden für das Ilaris System

## Würfelergebnis-Manipulation (für Tests)

### 1. Feste Würfelergebnisse über die Entwicklerkonsole

Entwicklerkonsole öffnen (F12) und einen dieser Befehle eingeben:

```javascript
// Immer hoch würfeln (nahe 20 bei W20)
CONFIG.Dice.randomUniform = () => 0.05

// Immer niedrig würfeln (nahe 1 bei W20)
CONFIG.Dice.randomUniform = () => 0.95

// Immer mittlere Werte (um 10 bei W20)
CONFIG.Dice.randomUniform = () => 0.5
```

**Zurücksetzen:** Einfach F5 drücken um Foundry neu zu laden und normales Würfelverhalten wiederherzustellen.

### 2. Kampfszenarien testen

-   Die festen Würfelergebnisse oben verwenden um kritische Treffer (hohe Würfe) oder Patzer (niedrige Würfe) zu testen
-   Angriffstaster, Fertigkeitsproben und Schadenswürfe mit vorhersagbaren Ergebnissen testen
-   Nützlich zur Überprüfung von Kampfberechnungen und Manövereffekten

### 3. Weitere Test-Optionen

-   **Dice So Nice! Modul**: Hat eingebaute Optionen für vorbestimmte Ergebnisse
-   **Let Me Roll That For You Modul**: Erlaubt manuelle Eingabe spezifischer Würfelergebnisse
-   **Makros**: Können erstellt werden um die Roll-Klasse temporär zu überschreiben

---

_Hinweis: Diese Methoden sind nur für Entwicklung und Tests gedacht. Stelle immer das normale Würfelverhalten für echtes Spielen wieder her._
