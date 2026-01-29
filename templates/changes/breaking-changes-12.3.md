Bitte wie immer die Charaktere neu importieren, bei Charakteren aus neueren Sephrasto-Versionen 5.1.0 über den Import-Knopf, welcher jetzt beim **ersten** Import auch Custom-Waffen richtig importiert. Für die älteren Charaktere steht immer noch der Json-Import und der Aktualisierungs-Knopf im Charakter-Sheet zur Verfügung. Wir supporten gerne und relativ schnell, aber nur wenn die Instruktionen für die Breaking-Changes auch befolgt wurden.

##### Waffeneigenschaften-System komplett überarbeitet

-   Waffeneigenschaften werden jetzt als eigenständige Items verwaltet
-   Alle Waffen wurden migriert, um das neue Eigenschaften-System zu nutzen
-   Eigenschaften können jetzt dynamisch konfiguriert werden mit:
    -   Modifikatoren (z.B. AT +1, PA -2)
    -   Bedingungen (wann Eigenschaft aktiv ist)
    -   Zieleffekte (Effekte auf das Ziel)
    -   Führungsarten (Einhand, Zweihand, etc.)
-   **Migration erforderlich:** Bestehende Waffen werden automatisch migriert

##### Effekt-System Grundlage gelegt

-   Einführung eines Active Effect Systems
-   Vorbereitung für zukünftige dauerhafte Effekte und Buffs/Debuffs
-   Neue Effekt-Items als Basis für das System
