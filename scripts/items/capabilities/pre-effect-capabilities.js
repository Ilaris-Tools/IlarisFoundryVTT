/**
 * Pre-Effect authoring capabilities per item type and editor context.
 *
 * The shared pre-effect editor is used by several item types. Not every type
 * supports every feature; the editor context (base item vs. structured
 * spell-modification form) further restricts what may be offered. These flags
 * are authoring-UI concerns and intentionally live outside CONFIG.ILARIS.
 */

/** Base capabilities shared by supernatural talent types. */
const SUPERNATURAL_CAPABILITIES = {
    allowActivationTrigger: false,
    allowZone: true,
    allowArmedCombat: true,
    allowSummonItem: true,
    allowSummonCreature: true,
    allowResistance: true,
    allowIlarisModifiers: true,
    allowMarker: true,
    allowRawChanges: true,
    allowCondition: true,
    allowInstant: true,
    allowDuration: true,
    allowSpellModifications: true,
}

/**
 * Capability flag sets per item type.
 * @type {Record<string, Record<string, boolean>>}
 */
export const PRE_EFFECT_CAPABILITIES = {
    zauber: { ...SUPERNATURAL_CAPABILITIES },
    liturgie: { ...SUPERNATURAL_CAPABILITIES },
    anrufung: { ...SUPERNATURAL_CAPABILITIES },
    manoever: {
        allowActivationTrigger: true,
        allowZone: false,
        allowArmedCombat: true,
        allowSummonItem: true,
        allowSummonCreature: true,
        allowResistance: true,
        allowIlarisModifiers: true,
        allowMarker: true,
        allowRawChanges: true,
        allowCondition: true,
        allowInstant: true,
        allowDuration: true,
        allowSpellModifications: false,
    },
}

/**
 * Resolve the capability flags for an item type in a given editor context.
 * @param {string} itemType  Item type key (e.g. 'zauber', 'manoever').
 * @param {'base'|'form'} [context] Editor context; 'form' restricts the
 * feature set available inside structured spell-modification forms.
 * @returns {Record<string, boolean>} Capability flags (unknown types yield none).
 */
export function getPreEffectCapabilities(itemType, context = 'base') {
    const base = PRE_EFFECT_CAPABILITIES[itemType] || {}
    if (context !== 'form') return { ...base }
    return {
        ...base,
        allowZone: false,
        allowArmedCombat: false,
        allowIlarisModifiers: false,
        allowMarker: false,
        allowRawChanges: false,
        allowSpellModifications: false,
    }
}

/** Feature ids offered by the "+ Automatisierung hinzufügen" menu. */
export const PRE_EFFECT_FEATURES = [
    { id: 'activationTrigger', label: 'Manöver-Auslöser', flag: 'allowActivationTrigger' },
    { id: 'damage', label: 'Schaden / Wirkung', flag: 'allowRawChanges' },
    { id: 'status', label: 'Zustand / Effekt', flag: 'allowCondition' },
    { id: 'resistance', label: 'Widerstandsprobe', flag: 'allowResistance' },
    { id: 'summonItem', label: 'Gegenstand beschwören', flag: 'allowSummonItem' },
    { id: 'summonCreature', label: 'Kreatur beschwören', flag: 'allowSummonCreature' },
    { id: 'armedCombat', label: 'Bewaffneter Kampfeffekt', flag: 'allowArmedCombat' },
]
