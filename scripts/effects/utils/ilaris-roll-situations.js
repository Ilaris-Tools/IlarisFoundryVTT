import {
    IlarisModifierPhase,
    IlarisModifierTarget,
    normalizeIlarisModifierTarget,
} from './ilaris-modifier-constants.js'

/** Stable contextual tags used by semantic Ilaris modifiers and roll dialogs. */
export const IlarisRollSituation = Object.freeze({
    SocialDuel: 'sozialesDuell',
    SocialDuelWaited: 'sozialesDuellAbwartend',
    InvestigationResearch: 'ermittlungRecherche',
    DestroyObject: 'gegenstandZerstoeren',
    CompatibleLocation: 'passenderOrt',
    SelectedSpellModification: 'zauberModifikation',
    SelectedTarget: 'passendesZiel',
    AvailableResource: 'passendeRessource',
    Kraftlinie2: 'kraftlinie2',
    Kraftlinie3: 'kraftlinie3',
    Kraftlinie4: 'kraftlinie4',
})

const definitions = Object.freeze([
    {
        id: IlarisRollSituation.SocialDuel,
        label: 'Rededuell',
        dialogs: ['fertigkeit', 'uebernatuerlich'],
    },
    {
        id: IlarisRollSituation.SocialDuelWaited,
        label: 'Rededuell – abwartend',
        dialogs: ['fertigkeit', 'uebernatuerlich'],
        parents: [IlarisRollSituation.SocialDuel],
    },
    {
        id: IlarisRollSituation.InvestigationResearch,
        label: 'Ermittlung & Recherche',
        dialogs: ['fertigkeit', 'uebernatuerlich'],
    },
    {
        id: IlarisRollSituation.DestroyObject,
        label: 'Gegenstand zerstören/durchbrechen',
        dialogs: ['fertigkeit', 'uebernatuerlich'],
    },
    {
        id: IlarisRollSituation.CompatibleLocation,
        label: 'Passender Ort / passende Umgebung',
        dialogs: ['uebernatuerlich'],
    },
    {
        id: IlarisRollSituation.SelectedSpellModification,
        label: 'Passende Zaubermodifikation gewählt',
        dialogs: ['uebernatuerlich'],
    },
    {
        id: IlarisRollSituation.SelectedTarget,
        label: 'Vorausgesetztes Ziel gewählt',
        dialogs: ['uebernatuerlich'],
    },
    {
        id: IlarisRollSituation.AvailableResource,
        label: 'Vorausgesetzte Ressource verfügbar',
        dialogs: ['uebernatuerlich'],
    },
    {
        id: IlarisRollSituation.Kraftlinie2,
        label: 'Kraftlinie / -knoten: +2',
        dialogs: ['uebernatuerlich'],
        exclusiveGroup: 'kraftlinie',
    },
    {
        id: IlarisRollSituation.Kraftlinie3,
        label: 'Kraftlinie / -knoten: +3',
        dialogs: ['uebernatuerlich'],
        exclusiveGroup: 'kraftlinie',
    },
    {
        id: IlarisRollSituation.Kraftlinie4,
        label: 'Kraftlinie / -knoten: +4',
        dialogs: ['uebernatuerlich'],
        exclusiveGroup: 'kraftlinie',
    },
])

const definitionById = new Map(definitions.map((definition) => [definition.id, definition]))

export const IlarisSkillSituationOptions = Object.freeze(
    definitions.filter((definition) => definition.dialogs.includes('fertigkeit')),
)

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

function isVorteilEffect(effect) {
    return effect?.parent?.type === 'vorteil' || effect?.flags?.ilaris?.sourceType === 'vorteil'
}

function getEffects(actor) {
    if (typeof actor?.allApplicableEffects === 'function') {
        return Array.from(actor.allApplicableEffects())
    }
    return Array.from(actor?.appliedEffects || actor?.effects || [])
}

/** Expand selected contextual tags with their declared parents, preserving order. */
export function getIlarisSituationTags(selection) {
    const selected = Array.isArray(selection) ? selection : [selection]
    const tags = []
    const append = (id) => {
        const normalized = String(id || '').trim()
        if (!normalized || tags.includes(normalized)) return
        tags.push(normalized)
        for (const parent of definitionById.get(normalized)?.parents || []) append(parent)
    }
    selected.forEach(append)
    return tags
}

/**
 * Discover manual supernatural condition controls that can affect the current
 * probe. Only transferred Vorteil effects are considered, leaving unrelated
 * effects and undeclared condition IDs out of the dialog.
 */
export function getRelevantSupernaturalSituationControls(actor, context = {}) {
    const ids = new Set()

    for (const effect of getEffects(actor)) {
        if (effect?.disabled || effect?.isSuppressed || !isVorteilEffect(effect)) continue
        for (const modifier of toArray(effect?.system?.ilarisModifiers)) {
            if ((modifier?.phase || IlarisModifierPhase.Roll) !== IlarisModifierPhase.Roll) continue
            if (normalizeIlarisModifierTarget(modifier?.target) !== IlarisModifierTarget.Probe) {
                continue
            }
            const selector = modifier?.selector || {}
            if (
                !selectorMatches(selector.fertigkeit, context.fertigkeit) ||
                !selectorMatches(selector.talent, context.talent)
            ) {
                continue
            }
            for (const id of toSelectorList(selector.situation)) {
                const definition = definitionById.get(id)
                if (definition?.dialogs.includes('uebernatuerlich')) ids.add(id)
            }
        }
    }

    const selected = definitions.filter((definition) => ids.has(definition.id))
    const boolean = selected.filter((definition) => !definition.exclusiveGroup)
    const groupIds = [
        ...new Set(selected.map((definition) => definition.exclusiveGroup).filter(Boolean)),
    ]
    const exclusive = groupIds.map((id) => {
        const options = selected.filter((definition) => definition.exclusiveGroup === id)
        return {
            id,
            label: id === 'kraftlinie' ? 'Kraftlinienmagie' : id,
            optionIds: options.map((option) => option.id),
            options,
        }
    })

    return { boolean, exclusive }
}
