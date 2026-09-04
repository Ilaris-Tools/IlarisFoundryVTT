function getEffects(actor) {
    if (Array.isArray(actor?.effects)) return actor.effects
    return Array.from(actor?.effects?.values?.() || [])
}

function getStatusIds(effect) {
    if (effect?.statuses instanceof Set) return [...effect.statuses]
    if (Array.isArray(effect?.statuses)) return effect.statuses
    if (effect?._source?.statuses instanceof Set) return [...effect._source.statuses]
    if (Array.isArray(effect?._source?.statuses)) return effect._source.statuses
    const legacyId = effect?.flags?.core?.statusId
    return legacyId ? [legacyId] : []
}

export function getConditionSources(effect) {
    const sources = effect?.system?.ilarisCondition?.sources
    if (Array.isArray(sources)) return sources
    if (sources && typeof sources === 'object') return Object.values(sources)
    return []
}

export function findConditionEffect(actor, statusId) {
    return getEffects(actor).find(
        (effect) =>
            effect?.system?.ilarisCondition?.statusId === statusId ||
            getStatusIds(effect).includes(statusId),
    )
}

function getStatusTemplate(statusId) {
    return CONFIG.statusEffects?.[statusId] || null
}

function normalizeSource(source = {}) {
    return {
        id: source.id || foundry.utils.randomID(),
        type: source.type || 'preEffect',
        ...(source.origin ? { origin: source.origin } : {}),
        ...(source.sourceItemUuid ? { sourceItemUuid: source.sourceItemUuid } : {}),
        ...(source.spellUuid ? { spellUuid: source.spellUuid } : {}),
        ...(source.spellName ? { spellName: source.spellName } : {}),
        ...(source.casterUuid ? { casterUuid: source.casterUuid } : {}),
        ...(source.preEffectIndex !== undefined ? { preEffectIndex: source.preEffectIndex } : {}),
        ...(source.applicationId ? { applicationId: source.applicationId } : {}),
        ...(source.castSkill ? { castSkill: source.castSkill } : {}),
        ...(source.resistanceOutcome ? { resistanceOutcome: source.resistanceOutcome } : {}),
        ...(source.passiveZone ? { passiveZone: foundry.utils.deepClone(source.passiveZone) } : {}),
        ...(source.timing ? { timing: foundry.utils.deepClone(source.timing) } : {}),
    }
}

function getNormalizedSources(effect, statusId) {
    const sources = getConditionSources(effect)
    return sources.length ? sources : [{ id: `legacy-${statusId}`, type: 'manual' }]
}

const completedNachbrennenSources = new Set()

function nachbrennenCompletionKey(actor, effect, source) {
    return `${actor.uuid || actor.id || 'actor'}:${effect.id}:${source.id}`
}

function buildConditionData(statusId, source) {
    const template = foundry.utils.deepClone(getStatusTemplate(statusId))
    if (!template) throw new Error(`Unbekannter Status-Effekt: ${statusId}`)

    return {
        name: template.name || template.label || statusId,
        img: template.img || template.icon,
        changes: template.changes || [],
        statuses: [statusId],
        duration: {},
        system: {
            ilarisSource: 'ordinary',
            // Source-specific expiry is managed here. The shared condition
            // effect itself must not enter the ordinary turn-duration reducer.
            ilarisTiming: {
                durationType: 'infinite',
                expiresOn: 'turnEnd',
                remaining: 0,
                originalValue: 0,
            },
            ilarisCondition: {
                statusId,
                sources: [normalizeSource(source)],
            },
        },
        flags: { core: { statusId } },
    }
}

/** Add an independent source to an actor's canonical configured status effect. */
export async function addConditionSource(actor, statusId, source = {}) {
    const template = getStatusTemplate(statusId)
    if (!actor || !template) return undefined

    const normalizedSource = normalizeSource(source)
    const existing = findConditionEffect(actor, statusId)
    if (!existing) {
        const [created] = await ActiveEffect.createDocuments(
            [buildConditionData(statusId, normalizedSource)],
            {
                parent: actor,
            },
        )
        return created
    }

    const sources = getNormalizedSources(existing, statusId)
    if (!sources.some((entry) => entry.id === normalizedSource.id)) sources.push(normalizedSource)
    await existing.update({
        'system.ilarisCondition': { statusId, sources },
    })
    return existing
}

/** Remove only the requested source, deleting the condition once it has no sources. */
export async function removeConditionSource(actor, effect, sourceId) {
    if (!actor || !effect || !sourceId) return false
    const sources = getConditionSources(effect)
    const remaining = sources.filter((source) => source.id !== sourceId)
    if (remaining.length === sources.length) return false

    if (remaining.length) {
        await effect.update({ 'system.ilarisCondition.sources': remaining })
        return true
    }
    await actor.deleteEmbeddedDocuments('ActiveEffect', [effect.id])
    return true
}

/** Implement documented Actor#toggleStatusEffect semantics for manual Ilaris sources. */
export async function toggleManualCondition(actor, statusId, options = {}) {
    const effect = findConditionEffect(actor, statusId)
    const isActive = options.active ?? !effect
    if (isActive) {
        return addConditionSource(actor, statusId, { type: 'manual' })
    }
    if (!effect) return undefined

    if (!effect.system?.ilarisCondition?.statusId) {
        await actor.deleteEmbeddedDocuments('ActiveEffect', [effect.id])
        return false
    }

    const manual = getConditionSources(effect).find((source) => source.type === 'manual')
    if (!manual) {
        const label = getStatusTemplate(statusId)?.name || statusId
        ui?.notifications?.warn(
            `${label.replace(/^Sehr schlechte Position \((.*)\)$/, '$1')} bleibt durch einen automatischen Effekt aktiv.`,
        )
        return undefined
    }
    await removeConditionSource(actor, effect, manual.id)
    return false
}

/** Reduce owner-turn condition sources without letting one source expire the whole condition. */
export async function reduceConditionSourcesForCombatant(combatant, expiresOn) {
    const actor = combatant?.actor
    if (!actor) return

    for (const effect of getEffects(actor)) {
        const condition = effect?.system?.ilarisCondition
        if (!condition?.statusId) continue
        const sources = getConditionSources(effect)
        const nextSources = []
        const completedSources = []
        let changed = false
        for (const source of sources) {
            const timing = source.timing
            if (timing?.durationType !== 'ownerTurns' || timing.expiresOn !== expiresOn) {
                nextSources.push(source)
                continue
            }
            const remaining = Number(timing.remaining || 0) - 1
            changed = true
            if (remaining > 0) {
                nextSources.push({ ...source, timing: { ...timing, remaining } })
            } else if (source.type === 'nachbrennen') {
                const key = nachbrennenCompletionKey(actor, effect, source)
                if (!completedNachbrennenSources.has(key)) {
                    completedNachbrennenSources.add(key)
                    completedSources.push(source)
                }
            }
        }
        if (!changed) continue
        if (nextSources.length) {
            await effect.update({ 'system.ilarisCondition.sources': nextSources })
        } else {
            await actor.deleteEmbeddedDocuments('ActiveEffect', [effect.id])
        }
        for (const source of completedSources) {
            const { completeNachbrennen } = await import('./nachbrennen-effect.js')
            await completeNachbrennen(actor, source)
        }
    }
}

/** Wrap Foundry's documented public toggle API once, leaving non-Ilaris statuses untouched. */
export function registerStatusConditionLifecycle() {
    if (Actor.prototype._ilarisStatusConditionLifecycle) return
    const originalToggle = Actor.prototype.toggleStatusEffect
    if (typeof originalToggle !== 'function') return

    Actor.prototype._ilarisStatusConditionLifecycle = true
    Actor.prototype.toggleStatusEffect = async function (statusId, options = {}) {
        if (!getStatusTemplate(statusId)) return originalToggle.call(this, statusId, options)
        return toggleManualCondition(this, statusId, options)
    }
}
