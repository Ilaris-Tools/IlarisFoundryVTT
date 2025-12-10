/**
 * Constants and configuration for XML Rule Importer
 */

/**
 * Mapping of XML element names to Foundry item types
 */
export const XML_TO_FOUNDRY_TYPE = {
    Fertigkeit: 'fertigkeit',
    ÜbernatürlicheFertigkeit: 'uebernatuerliche_fertigkeit',
    Waffeneigenschaft: 'waffeneigenschaft',
    Waffe: 'waffe',
    Rüstung: 'ruestung',
    Talent: 'talent',
    Manöver: 'manoever',
    AbgeleiteterWert: 'abgeleiteter-wert',
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
 * Mapping of talent kategorie to übernatürliche talent type
 */
export const TALENT_KATEGORIE_TO_TYPE = {
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
