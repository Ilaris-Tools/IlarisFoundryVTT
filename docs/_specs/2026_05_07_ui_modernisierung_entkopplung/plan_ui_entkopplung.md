# Plan: UI modernisieren und entkoppeln (Schritt 4)

## Ziel

UI-Schicht konsistent auf das aktuelle ModelData-System ausrichten, Altmodell-Pfade aus Sheets/Dialogen entfernen und direkte Datenmutationen reduzieren.

## Problemstellung

Die TypeDataModel-Umstellung ist abgeschlossen, aber in der UI existieren noch Restkopplungen:

1. Alias-Felder aus Altmodell (`voraussetzungen`, `wm`) werden noch mitgefuehrt.
2. Mehrere Sheets mutieren `document.system` direkt statt ueber kanonische Update-Pfade.
3. Legacy-Pfade sind teils noch in Sheet-Logik versteckt.

## Umsetzungsstrategie

### Phase A (sofort): Kanonische Felder erzwingen

1. Manoever nur noch ueber `system.voraussetzung`.
2. Angriff nur noch ueber `system.wm_at`.
3. Alias-Bruecken aus UI- und Item-Logik entfernen.

### Phase B (sofort): Direkte Mutationen in Kern-Sheets abbauen

1. `scripts/items/sheets/angriff.js`: Listenoperationen ohne direkte Mutation auf `this.document.system`.
2. `scripts/actors/sheets/actor.js`: Stil-Auswahl direkt per `actor.update`, ohne Vorab-Mutation.
3. `scripts/waffe/sheets/*`: Legacy-Schadensdarstellung in den Context ableiten statt Dokument im Renderpfad zu mutieren.

### Phase C (naechster Batch): Dialoge und Legacy-Apps

1. Combat-Dialoge mit Altmustern (`getData`/`activateListeners`) inventarisieren und auf AppV2 angleichen.
2. Uebernatuerlich-Dialog von direkter `item.system.manoever`-Mutation auf lokalen Dialog-State oder kontrollierte Updates umstellen.

## Betroffene Dateien (Phase A+B)

- `scripts/items/model-data/models.js`
- `scripts/items/sheets/manoever.js`
- `scripts/items/data/manoever.js`
- `scripts/items/_spec/manoever.spec.js`
- `scripts/items/sheets/angriff.js`
- `scripts/actors/sheets/actor.js`
- `scripts/waffe/sheets/waffe.js`
- `scripts/waffe/sheets/nahkampfwaffe.js`
- `scripts/waffe/sheets/fernkampfwaffe.js`

## Validierung

1. `npm test -- --testPathPattern="manoever|type-data-models"`
2. `npm test`
3. E2E-Stichprobe fuer Kampfdialoge und Item-Sheets

## Definition of Done

1. Keine UI-Nutzung von `system.voraussetzungen` oder `system.wm` mehr.
2. Keine direkten Mutationen in den geaenderten Sheet-Pfaden vor `update()`.
3. Relevante Tests gruen.
4. Doku und Plan fuer Restarbeiten (Phase C) hinterlegt.
