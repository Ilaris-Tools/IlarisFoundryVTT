export function createItemTemplateFields(h) {
    return {
        gegenstandszustand: h.schema({
            haerte: h.number(0),
            beschaedigung: h.number(0),
        }),
        gegenstand: h.schema({
            aufbewahrungs_ort: h.string('mitfuehrend'),
            bewahrt_auf: h.arrayOfStrings(),
            gewicht_summe: h.number(0),
            gewicht: h.number(0),
            preis: h.number(0),
            quantity: h.number(1),
        }),
    }
}
