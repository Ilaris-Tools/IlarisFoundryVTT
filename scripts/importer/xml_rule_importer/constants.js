/**
 * Constants and configuration for XML Rule Importer
 */

/**
 * Mapping of XML element names to Foundry item types
 */
export const XML_TO_FOUNDRY_TYPE = {
    Fertigkeit: 'fertigkeit',
    ÜbernatürlicheFertigkeit: 'uebernatuerlicheFertigkeit',
    Waffeneigenschaft: 'waffeneigenschaft',
    Waffe: 'waffe',
    Rüstung: 'ruestung',
    Talent: 'talent',
    Manöver: 'manoever',
    AbgeleiteterWert: 'abgeleiteterWert',
}

/**
 * Pack definitions for compendium creation
 */
export const PACK_DEFINITIONS = [
    {
        key: 'fertigkeiten',
        label: 'Fertigkeiten',
        type: 'Item',
        xmlElement: 'Fertigkeit',
    },
    {
        key: 'uebernatuerlicheFertigkeiten',
        label: 'Übernatürliche Fertigkeiten',
        type: 'Item',
        xmlElement: 'ÜbernatürlicheFertigkeit',
    },
    {
        key: 'waffeneigenschaften',
        label: 'Waffeneigenschaften',
        type: 'Item',
        xmlElement: 'Waffeneigenschaft',
    },
    {
        key: 'waffen',
        label: 'Waffen',
        type: 'Item',
        xmlElement: 'Waffe',
    },
    {
        key: 'ruestungen',
        label: 'Rüstungen',
        type: 'Item',
        xmlElement: 'Rüstung',
    },
    {
        key: 'talente',
        label: 'Talente',
        type: 'Item',
        xmlElement: 'Talent',
    },
    {
        key: 'uebernatuerlicheTalente',
        label: 'Übernatürliche Talente',
        type: 'Item',
        xmlElement: 'TalentÜbernatürlich',
    },
    {
        key: 'manoever',
        label: 'Manöver',
        type: 'Item',
        xmlElement: 'Manöver',
    },
    {
        key: 'vorteile',
        label: 'Vorteile',
        type: 'Item',
        xmlElement: 'Vorteil',
    },
    {
        key: 'abgeleiteteWerte',
        label: 'Abgeleitete Werte',
        type: 'Item',
        xmlElement: 'AbgeleiteterWert',
    },
]

/**
 * Default values for weapon items
 */
export const DEFAULT_WEAPON_VALUES = {
    rw_mod: 0,
    hauptwaffe: false,
    nebenwaffe: false,
    manoverausgleich: {
        value: 0,
        overcomplicated: true,
    },
}

/**
 * Default values for armor items
 */
export const DEFAULT_ARMOR_VALUES = {
    rs: 0,
    be: 0,
    aktiv: false,
}

/**
 * Default values for skill items
 */
export const DEFAULT_SKILL_VALUES = {
    basis: 0,
    fw: 0,
    pw: 0,
    pwt: 0,
}

/**
 * Default values for talent items
 */
export const DEFAULT_TALENT_VALUES = {
    pw: 0,
    gruppe: 0,
}

/**
 * Default attribute string for skills
 */
export const DEFAULT_ATTRIBUTES = 'KO|KO|KO'

/**
 * Supported Manöver types
 */
export const SUPPORTED_MANOEVER_TYPES = [0, 1, 2, 3, 6]

/**
 * Mapping of talent kategorie to talent type
 * kategorie 0: normal talent
 * kategorie 1: zauber (spell)
 * kategorie 2: liturgie (liturgy)
 * kategorie 3: anrufung (invocation)
 */
export const TALENT_KATEGORIE_TO_TYPE = {
    0: 'talent',
    1: 'zauber',
    2: 'liturgie',
    3: 'anrufung',
}

/**
 * Default Foundry item structure properties
 */
export const DEFAULT_FOUNDRY_ITEM_PROPS = {
    img: 'systems/Ilaris/assets/images/skills/profan-skill.svg',
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    _stats: {
        coreVersion: '12.331',
        systemId: null,
        systemVersion: null,
        createdTime: null,
        modifiedTime: null,
        lastModifiedBy: null,
        compendiumSource: null,
        duplicateSource: null,
    },
    ownership: {
        default: 0,
    },
}

/**
 * Field mappings for übernatürliche Talent text parsing
 */
export const UEBERNATUERLICH_TALENT_FIELD_MAPPINGS = {
    Probenschwierigkeit: 'schwierigkeit',
    Modifikationen: 'modifikationen',
    Vorbereitungszeit: 'vorbereitung',
    Ziel: 'ziel',
    Reichweite: 'reichweite',
    Wirkungsdauer: 'wirkungsdauer',
    Kosten: 'kosten',
    Erlernen: 'erlernen',
}

/**
 * Mächtige field names for übernatürliche Talente
 */
export const MAECHTIG_FIELD_NAMES = ['Mächtige Magie', 'Mächtige Liturgie', 'Mächtige Anrufung']

// ─── Item defaults factories ───────────────────────────────────────────────────
// These mirror the TypeDataModel schemas in scripts/items/model-data/models.js.
// Item.create() / Item.createDocuments() only stores what is explicitly passed;
// TypeDataModel fills in defaults for the live document but NOT in the database.
// Always use these factories so that every schema field is present in the stored record.

/**
 * Shared physical-item template fields
 * (mirrors createItemTemplateFields in scripts/items/model-data/shared.js)
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
 * Both system.key and system.name are populated from the XML name attribute so that
 * preloadAbgeleiteteWerteDefinitions() can use the technical key directly.
 * @param {string} name - The item name (used as technical key and display name)
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
 * Note: the nested schemas (modifiers, wieldingRequirements, targetEffect, actorModifiers)
 * are intentionally omitted — TypeDataModel fills them in-memory when the item is loaded.
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
