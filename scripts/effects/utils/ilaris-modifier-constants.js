/**
 * Canonical identifiers for rule-aware Ilaris ActiveEffect modifiers.
 *
 * The identifiers are deliberately independent from Actor data paths.  A
 * contextual modifier must be resolved at the relevant roll boundary instead
 * of changing prepared actor data and accidentally cascading into derived
 * values.
 */
export const IlarisModifierPhase = Object.freeze({
    Prepare: 'prepare',
    Roll: 'roll',
})

export const IlarisModifierTarget = Object.freeze({
    GS: 'gs',
    MR: 'mr',
    AT: 'at',
    VT: 'vt',
    Damage: 'damage',
    Probe: 'probe',
    Talent: 'talent',
    MU: 'mu',
    KL: 'kl',
    IN: 'in',
    CH: 'ch',
    FF: 'ff',
    GE: 'ge',
    KO: 'ko',
    KK: 'kk',
})

export const IlarisModifierSource = Object.freeze({
    Ordinary: 'ordinary',
    Supernatural: 'uebernatuerlich',
})

export const IlarisModifierStacking = Object.freeze({
    Add: 'add',
    StrongestSupernatural: 'strongest-supernatural',
})

export const IlarisSupernaturalStackingMode = Object.freeze({
    Ilaris: 'ilaris',
    Foundry: 'foundry',
})

export const MAIN_ATTRIBUTE_TARGETS = new Set([
    IlarisModifierTarget.MU,
    IlarisModifierTarget.KL,
    IlarisModifierTarget.IN,
    IlarisModifierTarget.CH,
    IlarisModifierTarget.FF,
    IlarisModifierTarget.GE,
    IlarisModifierTarget.KO,
    IlarisModifierTarget.KK,
])

export const IlarisModifierTargetLabels = Object.freeze({
    [IlarisModifierTarget.GS]: 'GS',
    [IlarisModifierTarget.MR]: 'MR',
    [IlarisModifierTarget.AT]: 'AT',
    [IlarisModifierTarget.VT]: 'VT',
    [IlarisModifierTarget.Damage]: 'TP / Waffenschaden',
    [IlarisModifierTarget.Probe]: 'Probe',
    [IlarisModifierTarget.Talent]: 'Talent',
    [IlarisModifierTarget.MU]: 'MU',
    [IlarisModifierTarget.KL]: 'KL',
    [IlarisModifierTarget.IN]: 'IN',
    [IlarisModifierTarget.CH]: 'CH',
    [IlarisModifierTarget.FF]: 'FF',
    [IlarisModifierTarget.GE]: 'GE',
    [IlarisModifierTarget.KO]: 'KO',
    [IlarisModifierTarget.KK]: 'KK',
})

export const IlarisModifierPhaseLabels = Object.freeze({
    [IlarisModifierPhase.Prepare]: 'Vorbereitung',
    [IlarisModifierPhase.Roll]: 'Probe',
})

export const IlarisModifierSourceLabels = Object.freeze({
    [IlarisModifierSource.Ordinary]: 'Gewöhnlich',
    [IlarisModifierSource.Supernatural]: 'Übernatürlich',
})

export const IlarisModifierStackingLabels = Object.freeze({
    [IlarisModifierStacking.Add]: 'Addieren',
    [IlarisModifierStacking.StrongestSupernatural]: 'Stärkster übernatürlicher Effekt',
})

/** Map a legacy direct main-attribute ActiveEffect path to a roll-only target. */
export function targetFromMainAttributePath(path) {
    const match = /^system\.attribute\.(MU|KL|IN|CH|FF|GE|KO|KK)\.wert$/i.exec(path || '')
    return match?.[1]?.toLowerCase() || null
}

export function isMainAttributeTarget(target) {
    return MAIN_ATTRIBUTE_TARGETS.has(String(target || '').toLowerCase())
}

export function normalizeIlarisModifierTarget(target) {
    const normalized = String(target || '')
        .trim()
        .toLowerCase()
    if (normalized === 'tp' || normalized === 'waffenschaden') {
        return IlarisModifierTarget.Damage
    }
    return normalized
}
