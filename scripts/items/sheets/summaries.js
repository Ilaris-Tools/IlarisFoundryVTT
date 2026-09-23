/**
 * Derived German summaries for accordion headers of the pre-effect editor.
 *
 * Summaries are computed from persisted data on the fly and are never stored.
 * All functions are pure and unit-testable; missing values fall back to '—'.
 */

const FALLBACK = '—'

/** Label lookup for zone shapes. */
const SHAPE_LABELS = {
    circle: 'Kreis',
    cone: 'Kegel',
    rectangle: 'Wand/Rechteck',
}

/** Label lookup for zone placement anchors. */
const ANCHOR_LABELS = {
    caster: 'beim Zaubernden',
    free: 'frei platzierbar',
}

const DURATION_SOURCE_LABELS = {
    fixed: 'feste Runden',
    casterAttribute: 'Hauptattribut',
}

/**
 * Summarize a zone profile, e.g. "Kegel · 8 Schritt · beim Zaubernden".
 * @param {object} zone Zone data object (may be null/undefined).
 * @param {{shape?: Record<string,string>, anchor?: Record<string,string>}} [labels]
 * @returns {string}
 */
export function summarizeZone(zone, labels = {}) {
    if (!zone || typeof zone !== 'object') return FALLBACK
    const shapeLabels = labels.shape || SHAPE_LABELS
    const anchorLabels = labels.anchor || ANCHOR_LABELS
    const parts = [shapeLabels[zone.shape] || zone.shape || FALLBACK]
    if (zone.distance != null && zone.distance !== '') parts.push(`${zone.distance} Schritt`)
    if (zone.angle != null && zone.angle !== '') parts.push(`${zone.angle}°`)
    if (zone.width != null && zone.width !== '') parts.push(`${zone.width} breit`)
    const anchor = zone.placement?.anchor
    parts.push(anchorLabels[anchor] || anchor || FALLBACK)
    return parts.join(' · ')
}

/**
 * Summarize a damage change, e.g. "4W6 Feuer · Mächtig +2W6".
 * @param {object} change A changes[] entry.
 * @param {{damageTypes: Record<string,string>}} [labels] Maps damageType values to labels.
 * @returns {string}
 */
export function summarizeDamage(change, labels = {}) {
    if (!change || typeof change !== 'object') return FALLBACK
    const label = labels.damageTypes?.[change.damageType] || change.damageType || ''
    const parts = [change.value || FALLBACK]
    if (label) parts.push(label)
    if (change.amplifiedByMaechtigeMagie && change.maechtigBonus) {
        parts.push(`Mächtig ${change.maechtigBonus}`)
    }
    return parts.join(' · ')
}

/**
 * Summarize a resistance (avoidTest) configuration, e.g. "KO · Schwierigkeit 12".
 * @param {object} avoidTest Avoid-test object.
 * @returns {string}
 */
export function summarizeResistance(avoidTest) {
    if (!avoidTest || typeof avoidTest !== 'object') return FALLBACK
    const parts = []
    const test = avoidTest.attribut || avoidTest.fertigkeit || FALLBACK
    parts.push(test)
    if (avoidTest.resistDifficultySource === 'triggeringRoll') {
        parts.push('Schwierigkeit aus Probe')
    } else if (avoidTest.resistDifficulty != null && avoidTest.resistDifficulty !== '') {
        parts.push(`Schwierigkeit ${avoidTest.resistDifficulty}`)
    }
    if (avoidTest.diminishedOnly) parts.push('nur abgeschwächt')
    return parts.join(' · ')
}

/**
 * Summarize an armed-combat effect, e.g. "Nächster erfolgreicher Angriff · Nahkampf · AT +2".
 * @param {object} armedCombat Armed-combat object.
 * @returns {string}
 */
export function summarizeArmedCombat(armedCombat) {
    if (!armedCombat || typeof armedCombat !== 'object') return FALLBACK
    const triggerLabels = { nextSuccessfulAttack: 'Nächster erfolgreicher Angriff' }
    const scopeLabels = { any: 'beliebig', melee: 'Nahkampf', ranged: 'Fernkampf' }
    const parts = [
        triggerLabels[armedCombat.trigger] || armedCombat.trigger || FALLBACK,
        scopeLabels[armedCombat.scope] || armedCombat.scope || FALLBACK,
    ]
    if (armedCombat.attackBonus != null && armedCombat.attackBonus !== 0) {
        parts.push(`AT ${armedCombat.attackBonus > 0 ? '+' : ''}${armedCombat.attackBonus}`)
    }
    if (armedCombat.charges?.base != null) {
        parts.push(
            `${armedCombat.charges.base} Ladung${armedCombat.charges.base === 1 ? '' : 'en'}`,
        )
    }
    return parts.join(' · ')
}

/**
 * Summarize a condition application, e.g. "Brennend · 3 Runden".
 * @param {object} condition Condition object.
 * @param {Record<string,string>} [statusLabels] Maps statusId to German display name.
 * @returns {string}
 */
export function summarizeCondition(condition, statusLabels = {}) {
    if (!condition || typeof condition !== 'object' || !condition.enabled) return FALLBACK
    const parts = [statusLabels[condition.statusId] || condition.statusId || FALLBACK]
    return parts.join(' · ')
}

/**
 * Summarize a marker effect.
 * @param {object} marker Marker object.
 * @returns {string}
 */
export function summarizeMarker(marker) {
    if (!marker || typeof marker !== 'object' || !marker.enabled) return FALLBACK
    return marker.label || marker.id || FALLBACK
}

/**
 * Summarize a whole pre-effect card by joining active feature summaries.
 * @param {object} preEffect Pre-effect object.
 * @param {{damageTypes?: Record<string,string>, statusLabels?: Record<string,string>}} [labels]
 * @returns {string}
 */
export function summarizePreEffect(preEffect, labels = {}) {
    if (!preEffect || typeof preEffect !== 'object') return FALLBACK
    const parts = []
    for (const change of preEffect.changes || []) {
        parts.push(summarizeDamage(change, labels))
    }
    const condition = summarizeCondition(preEffect.condition, labels.statusLabels)
    if (condition !== FALLBACK) parts.push(condition)
    const marker = summarizeMarker(preEffect.marker)
    if (marker !== FALLBACK) parts.push(marker)
    if (preEffect.avoidTest?.enabled) parts.push(summarizeResistance(preEffect.avoidTest))
    if (preEffect.armedCombat?.enabled) {
        parts.push(summarizeArmedCombat(preEffect.armedCombat))
    }
    if (preEffect.summonItem?.enabled) parts.push('Gegenstand beschwören')
    if (preEffect.summonCreature?.enabled) parts.push('Kreatur beschwören')
    return parts.length ? parts.join(' · ') : FALLBACK
}
