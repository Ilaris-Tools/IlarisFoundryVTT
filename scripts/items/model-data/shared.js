export function createItemTemplateFields(h) {
    return {
        haerte: h.number(0),
        beschaedigung: h.number(0),
        aufbewahrungs_ort: h.string('mitführend'),
        bewahrt_auf: h.arrayOfStrings(),
        gewicht_summe: h.number(0),
        gewicht: h.number(0),
        preis: h.number(0),
        quantity: h.number(1),
    }
}
