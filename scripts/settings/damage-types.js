const DEFAULT_BEHAVIOR = {
    healing: false,
    targetsErschoepfung: false,
    bypassesArmor: false,
    elementalSideEffect: null,
}

const DEFAULT_DAMAGE_TYPE_DEFINITIONS = [
    ['PROFAN', 'Profan (Wunden)'],
    ['STUMPF', 'Stumpf (Erschöpfung)', { targetsErschoepfung: true }],
    ['MAGISCH', 'Magisch'],
    ['GEWEIHT', 'Geweiht'],
    ['DAEMONISCH', 'Dämonisch'],
    ['FEUER', 'Feuer', { elementalSideEffect: 'nachbrennen' }],
    ['EIS', 'Eis'],
    ['ERZ', 'Erz'],
    ['HUMUS', 'Humus'],
    ['LUFT', 'Luft'],
    ['WASSER', 'Wasser'],
    ['HEALING_WOUND', 'Heilung (Wunden)', { healing: true }],
    ['HEALING_EXHAUSTION', 'Heilung (Erschöpfung)', { healing: true, targetsErschoepfung: true }],
    ['TRUE_DAMAGE', 'SP-Schaden', { bypassesArmor: true }],
]

export const DEFAULT_DAMAGE_TYPES = DEFAULT_DAMAGE_TYPE_DEFINITIONS.map(
    ([value, label, behavior = {}]) => ({
        value,
        label,
        behavior: { ...DEFAULT_BEHAVIOR, ...behavior },
    }),
)

/** Normalize the editor's flat dialog payload into the persisted registry shape. */
export function normalizeDamageType(type = {}) {
    const sideEffect = type.elementalSideEffect?.trim?.() || null
    return {
        value: type.value?.trim?.() || '',
        label: type.label?.trim?.() || '',
        behavior: {
            healing: type.healing === true || type.healing === 'on',
            targetsErschoepfung:
                type.targetsErschoepfung === true || type.targetsErschoepfung === 'on',
            bypassesArmor: type.bypassesArmor === true || type.bypassesArmor === 'on',
            elementalSideEffect: sideEffect,
        },
    }
}

export function serializeDefaultDamageTypes() {
    return JSON.stringify(DEFAULT_DAMAGE_TYPES)
}
