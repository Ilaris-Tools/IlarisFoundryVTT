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

// ─── Plain-JS default factories ────────────────────────────────────────────────
// Mirror the TypeDataModel schemas defined in models.js.
// Item.create() / Item.createDocuments() only stores what is explicitly passed;
// TypeDataModel fills in defaults for the live document but NOT in the database.
// Keep these in sync with the schema definitions in models.js whenever fields change.

/**
 * Shared physical-item template field defaults.
 * Mirrors the return value of createItemTemplateFields().
 * @returns {Object}
 */
export function createItemTemplateDefaults() {
    return {
        haerte: 0,
        beschaedigung: 0,
        aufbewahrungs_ort: 'mitführend',
        bewahrt_auf: [],
        gewicht_summe: 0,
        gewicht: 0,
        preis: 0,
        quantity: 1,
    }
}

/**
 * Complete system defaults for nahkampfwaffe items.
 * @returns {Object}
 */
export function createNahkampfwaffeDefaults() {
    return {
        ...createItemTemplateDefaults(),
        tp: '',
        fertigkeit: '',
        talent: '',
        rw: 0,
        hauptwaffe: false,
        nebenwaffe: false,
        eigenschaften: [],
        text: '',
        manoverausgleich: { value: 0, overcomplicated: true },
        wm_at: 0,
        wm_vt: 0,
        rw_mod: 0,
    }
}

/**
 * Complete system defaults for fernkampfwaffe items.
 * @returns {Object}
 */
export function createFernkampfwaffeDefaults() {
    return {
        ...createItemTemplateDefaults(),
        tp: '',
        fertigkeit: '',
        talent: '',
        rw: 0,
        hauptwaffe: false,
        nebenwaffe: false,
        eigenschaften: [],
        text: '',
        manoverausgleich: { value: 0, overcomplicated: true },
        wm_fk: 0,
        lz: 0,
        rw_mod: 0,
    }
}

/**
 * Complete system defaults for ruestung items.
 * @returns {Object}
 */
export function createRuestungDefaults() {
    return {
        ...createItemTemplateDefaults(),
        rs: 0,
        be: 0,
        rs_beine: 0,
        rs_larm: 0,
        rs_rarm: 0,
        rs_bauch: 0,
        rs_brust: 0,
        rs_kopf: 0,
        aktiv: false,
        text: '',
    }
}

/**
 * Complete system defaults for aktion items.
 * Mirrors AktionItemDataModel.defineSchema().
 * @returns {Object}
 */
export function createAktionDefaults() {
    return {
        ...createItemTemplateDefaults(),
        text: '',
        aktionstyp: 'einfach',
        iniMod: 0,
        atMod: 0,
        vtMod: 0,
        bedingungen: {
            waffentyp: '',
            eigenschaften: [],
        },
    }
}

/**
 * Complete system defaults for manoever items.
 * @returns {Object}
 */
export function createManoeverDefaults() {
    return {
        voraussetzung: '',
        input: { label: 'Checkbox', field: 'CHECKBOX', min: 0, max: 0 },
        modifications: [],
        gruppe: 0,
        probe: '',
        gegenprobe: '',
        text: '',
        isBaseManoever: false,
    }
}

/**
 * Complete system defaults for abgeleiteterWert items.
 * Both system.key and system.name mirror the item name so that
 * preloadAbgeleiteteWerteDefinitions() can use the technical key directly.
 * @param {string} name - The item name used as technical key and display name.
 * @returns {Object}
 */
export function createAbgeleiteterWertDefaults(name = '') {
    return {
        key: name,
        name,
        formel: '',
        script: '',
        finalscript: '',
        text: '',
    }
}

/**
 * Complete system defaults for waffeneigenschaft items.
 * The nested category schemas (modifiers, wieldingRequirements, targetEffect,
 * actorModifiers) are intentionally omitted — TypeDataModel fills them in-memory.
 * @returns {Object}
 */
export function createWaffeneigenschaftDefaults() {
    return {
        sephrastoScript: '',
        foundryScript: '',
        text: '',
        kategorie: 'modifier',
        parameterSlots: [],
        customScript: '',
    }
}
