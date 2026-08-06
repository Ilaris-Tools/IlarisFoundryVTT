import {
    IlarisModifierPhase,
    IlarisModifierSource,
    IlarisModifierStacking,
    IlarisSupernaturalStackingMode,
    normalizeIlarisModifierTarget,
} from './ilaris-modifier-constants.js'

function toArray(value) {
    if (Array.isArray(value)) return value
    if (value && typeof value === 'object') return Object.values(value)
    return []
}

function toSelectorList(value) {
    if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean)
    return String(value || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
}

function selectorMatches(selectorValue, contextValue) {
    const choices = toSelectorList(selectorValue)
    if (!choices.length) return true
    if (Array.isArray(contextValue)) {
        return contextValue.some((value) => choices.includes(String(value)))
    }
    return choices.includes(String(contextValue || ''))
}

function effectIsVorteil(effect) {
    return effect?.parent?.type === 'vorteil' || effect?.flags?.ilaris?.sourceType === 'vorteil'
}

function effectSource(effect) {
    if (effectIsVorteil(effect)) return IlarisModifierSource.Ordinary
    const source = effect?.system?.ilarisSource || effect?.flags?.ilaris?.sourceType
    return source === IlarisModifierSource.Supernatural
        ? IlarisModifierSource.Supernatural
        : IlarisModifierSource.Ordinary
}

/**
 * Parse a safe, additive Ilaris modifier. Numeric values and linear XW3, XW6,
 * or XW20 terms (+ a fixed offset) are intentionally the only supported
 * shapes. The resulting dice formula remains separate so callers can append
 * it after maneuvers.
 */
export function parseIlarisModifierValue(value) {
    const raw = String(value ?? '')
        .trim()
        .replace(/\s+/g, '')
    if (!raw) {
        throw new TypeError(`Unsupported Ilaris modifier value: ${value}`)
    }

    let position = 0
    let numericValue = 0
    let expectedValue = 0
    const diceTerms = []
    const token = /([+-]?)(?:(\d*)[Ww](3|6|20)|(\d+(?:\.\d+)?))/y
    while (position < raw.length) {
        token.lastIndex = position
        const match = token.exec(raw)
        if (!match || match.index !== position) {
            throw new TypeError(`Unsupported Ilaris modifier value: ${value}`)
        }
        const sign = match[1] === '-' ? -1 : 1
        if (match[2] !== undefined) {
            const diceCount = Number(match[2] || 1)
            if (!Number.isFinite(diceCount) || diceCount < 1) {
                throw new TypeError(`Unsupported Ilaris modifier value: ${value}`)
            }
            const dieSize = Number(match[3])
            const dieExpectedValue = { 3: 2, 6: 3.5, 20: 10.5 }[dieSize]
            expectedValue += sign * diceCount * dieExpectedValue
            diceTerms.push(`${match[1] || ''}${match[2] || '1'}W${dieSize}`)
        } else {
            const fixed = Number(match[4])
            numericValue += sign * fixed
            expectedValue += sign * fixed
        }
        position = token.lastIndex
    }

    return {
        raw,
        numericValue,
        diceFormula: diceTerms.join(''),
        expectedValue,
    }
}

export function getIlarisComparisonMagnitude(modifier) {
    const comparisonValue = modifier?.comparisonValue
    if (comparisonValue !== undefined && comparisonValue !== null && comparisonValue !== '') {
        return Math.abs(parseIlarisModifierValue(comparisonValue).expectedValue)
    }
    return Math.abs(parseIlarisModifierValue(modifier?.value).expectedValue)
}

function getEffects(actor) {
    if (typeof actor?.allApplicableEffects === 'function') {
        return Array.from(actor.allApplicableEffects())
    }
    return Array.from(actor?.appliedEffects || actor?.effects || [])
}

function modifierMatchesContext(modifier, context) {
    const target = normalizeIlarisModifierTarget(modifier?.target)
    if (target !== normalizeIlarisModifierTarget(context.target)) return false
    if ((modifier?.phase || IlarisModifierPhase.Roll) !== context.phase) return false

    const selector = modifier?.selector || {}
    return (
        selectorMatches(selector.fertigkeit, context.fertigkeit) &&
        selectorMatches(selector.talent, context.talent) &&
        selectorMatches(selector.situation, context.situation)
    )
}

function readStackingMode(context) {
    if (context.stackingMode) return context.stackingMode
    try {
        return (
            game.settings.get('Ilaris', 'supernaturalEffectStacking') ||
            IlarisSupernaturalStackingMode.Ilaris
        )
    } catch (_error) {
        return IlarisSupernaturalStackingMode.Ilaris
    }
}

function compareCandidates(left, right) {
    if (right.comparisonMagnitude !== left.comparisonMagnitude) {
        return right.comparisonMagnitude - left.comparisonMagnitude
    }
    return String(left.sourceName).localeCompare(String(right.sourceName), 'de')
}

/**
 * Resolve matching semantic ActiveEffect components without mutating effects or
 * actor data. The ledger is intentionally component-local: a partially
 * suppressed ActiveEffect can still apply its other matching components.
 */
export function resolveIlarisModifiers(context) {
    const matching = []
    const invalid = []

    for (const effect of getEffects(context.actor)) {
        if (effect?.disabled || effect?.isSuppressed) continue
        const source = effectSource(effect)
        for (const [index, modifier] of toArray(effect?.system?.ilarisModifiers).entries()) {
            if (!modifierMatchesContext(modifier, context)) continue
            try {
                const parsed = parseIlarisModifierValue(modifier.value)
                matching.push({
                    effect,
                    modifier,
                    index,
                    source,
                    sourceName: effect.name || effect.label || 'Unbenannter Effekt',
                    parsed,
                    comparisonMagnitude: getIlarisComparisonMagnitude(modifier),
                    stacking:
                        effectIsVorteil(effect) || source !== IlarisModifierSource.Supernatural
                            ? IlarisModifierStacking.Add
                            : modifier.stacking || IlarisModifierStacking.Add,
                })
            } catch (error) {
                invalid.push({
                    effect,
                    modifier,
                    index,
                    reason: error.message,
                })
            }
        }
    }

    const selected = []
    const suppressed = []
    const mode = readStackingMode(context)
    const supernatural = []

    for (const candidate of matching) {
        if (
            mode === IlarisSupernaturalStackingMode.Ilaris &&
            candidate.source === IlarisModifierSource.Supernatural &&
            candidate.stacking === IlarisModifierStacking.StrongestSupernatural
        ) {
            supernatural.push(candidate)
        } else {
            selected.push(candidate)
        }
    }

    if (supernatural.length) {
        const positive = supernatural
            .filter((candidate) => candidate.parsed.expectedValue >= 0)
            .sort(compareCandidates)
        const negative = supernatural
            .filter((candidate) => candidate.parsed.expectedValue < 0)
            .sort(compareCandidates)
        const winners = new Set([positive[0], negative[0]].filter(Boolean))

        for (const candidate of supernatural) {
            if (winners.has(candidate)) {
                selected.push(candidate)
            } else {
                suppressed.push({
                    ...candidate,
                    reason: 'Ein stärkerer übernatürlicher Effekt wirkt bereits.',
                })
            }
        }
    }

    const numericValue = selected.reduce(
        (total, candidate) => total + candidate.parsed.numericValue,
        0,
    )
    const diceFormulas = selected.map((candidate) => candidate.parsed.diceFormula).filter(Boolean)

    return {
        value: numericValue,
        diceFormulas,
        selected,
        suppressed,
        invalid,
        hasSuppression: suppressed.length > 0,
        ledger: [
            ...selected.map((candidate) => ({ ...candidate, status: 'applied' })),
            ...suppressed.map((candidate) => ({ ...candidate, status: 'suppressed' })),
            ...invalid.map((candidate) => ({ ...candidate, status: 'invalid' })),
        ],
    }
}
