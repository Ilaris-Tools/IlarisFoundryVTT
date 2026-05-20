import {
    resolveDamageExecutorUserId,
    resolveTargetActorForDamage,
} from '../combat/dialogs/shared-dialog-helpers.js'

export const SUPERNATURAL_ITEM_TYPES = Object.freeze(['zauber', 'liturgie', 'anrufung'])

const SUPERNATURAL_ITEM_TYPE_SET = new Set(SUPERNATURAL_ITEM_TYPES)

const SUPERNATURAL_PRE_EFFECT_DEFAULTS = Object.freeze({
    targetMode: 'direct',
    targetScope: 'selected',
    applicationType: 'persistent',
    multiplierStrategy: 'once',
    multiplierValue: 1,
    startLogic: 'onUse',
    template: Object.freeze({
        shape: 'circle',
        distance: '',
        width: '',
    }),
    area: Object.freeze({
        radius: '',
        disposition: 'enemies',
    }),
})

const SUPERNATURAL_PRE_EFFECT_OPTIONS = Object.freeze({
    targetModes: Object.freeze([
        { value: 'direct', label: 'Direktziel' },
        { value: 'template', label: 'Template' },
        { value: 'area', label: 'Areal' },
    ]),
    targetScopes: Object.freeze([
        { value: 'selected', label: 'Ausgewählte Ziele' },
        { value: 'all', label: 'Alle im Payload' },
    ]),
    applicationTypes: Object.freeze([
        { value: 'persistent', label: 'Dauerhaft als Active Effect' },
        { value: 'immediate', label: 'Sofortige einmalige Änderung' },
    ]),
    multiplierStrategies: Object.freeze([
        { value: 'once', label: 'Einmal anwenden' },
        { value: 'perTarget', label: 'Pro Ziel einmal' },
        { value: 'custom', label: 'Benutzerdefinierter Multiplikator' },
    ]),
    startLogics: Object.freeze([
        { value: 'onUse', label: 'Beim Wirken starten' },
        { value: 'turnStart', label: 'Start des Zielzuges (vorbereitet)' },
        { value: 'turnEnd', label: 'Ende des Zielzuges (vorbereitet)' },
    ]),
    templateShapes: Object.freeze([
        { value: 'circle', label: 'Kreis' },
        { value: 'cone', label: 'Kegel' },
        { value: 'ray', label: 'Strahl' },
        { value: 'rect', label: 'Rechteck' },
    ]),
    areaDispositions: Object.freeze([
        { value: 'enemies', label: 'Feindlich' },
        { value: 'allies', label: 'Freundlich' },
        { value: 'all', label: 'Alle' },
    ]),
})

function duplicate(data) {
    if (data == null) return data
    return foundry.utils.deepClone(data)
}

function getEffectSourceData(effect) {
    if (!effect) return null
    if (typeof effect.toObject === 'function') {
        return effect.toObject()
    }
    return duplicate(effect)
}

function mergePreEffectFlags(flags = {}, preEffect) {
    return {
        ...flags,
        Ilaris: {
            ...(flags.Ilaris || {}),
            preEffect,
        },
    }
}

function hasCombatDuration(duration = {}) {
    return Number(duration.rounds || 0) > 0 || Number(duration.turns || 0) > 0
}

function withEffectStart(duration = {}) {
    if (!hasCombatDuration(duration)) return duration
    if (duration.startRound != null || duration.startTurn != null || duration.startTime != null) {
        return duration
    }

    const effectStart = CONFIG.ActiveEffect.documentClass?.getEffectStart?.(game.combat)
    if (!effectStart) return duration

    return {
        ...duration,
        ...effectStart,
    }
}

function prepareTargetDescriptor(target, targetActor, actorLink) {
    return {
        actorId: target?.actorId || target?._id || targetActor.id,
        tokenId: target?.tokenId || null,
        actorLink,
    }
}

export function isSupernaturalTalentItem(item) {
    return Boolean(item?.type && SUPERNATURAL_ITEM_TYPE_SET.has(item.type))
}

export function getDefaultSupernaturalPreEffect() {
    return {
        ...duplicate(SUPERNATURAL_PRE_EFFECT_DEFAULTS),
        template: duplicate(SUPERNATURAL_PRE_EFFECT_DEFAULTS.template),
        area: duplicate(SUPERNATURAL_PRE_EFFECT_DEFAULTS.area),
    }
}

export function normalizeSupernaturalPreEffect(preEffect = {}) {
    const defaults = getDefaultSupernaturalPreEffect()
    return {
        ...defaults,
        ...duplicate(preEffect),
        template: {
            ...defaults.template,
            ...(duplicate(preEffect.template) || {}),
        },
        area: {
            ...defaults.area,
            ...(duplicate(preEffect.area) || {}),
        },
    }
}

export function getSupernaturalPreEffectOptions() {
    return duplicate(SUPERNATURAL_PRE_EFFECT_OPTIONS)
}

export function getNewEmbeddedEffectData(item) {
    const effectData = {
        name: 'Neuer Effekt',
        icon: 'icons/svg/aura.svg',
        disabled: false,
        duration: {},
        changes: [
            {
                key: '',
                mode: 2,
                value: '0',
                priority: 20,
            },
        ],
        transfer: true,
    }

    if (!isSupernaturalTalentItem(item)) {
        return effectData
    }

    return {
        ...effectData,
        origin: item?.uuid || null,
        flags: mergePreEffectFlags({}, getDefaultSupernaturalPreEffect()),
    }
}

export function getApplicableSupernaturalEffectData(item, { targetMode = 'direct' } = {}) {
    if (!isSupernaturalTalentItem(item)) return []

    return Array.from(item.effects || [])
        .map((effect) => getEffectSourceData(effect))
        .filter((effectData) => {
            if (!effectData || effectData.disabled) return false
            const preEffect = normalizeSupernaturalPreEffect(effectData.flags?.Ilaris?.preEffect)
            return preEffect.targetMode === targetMode
        })
}

export function prepareSupernaturalActorEffectData(effectData, context = {}) {
    const prepared = getEffectSourceData(effectData)
    if (!prepared) return null

    delete prepared._id
    delete prepared.id

    const preEffect = normalizeSupernaturalPreEffect(prepared.flags?.Ilaris?.preEffect)

    prepared.transfer = false
    prepared.disabled = false
    prepared.origin = context.originUuid || prepared.origin || null
    prepared.duration = withEffectStart(prepared.duration || {})
    prepared.flags = mergePreEffectFlags(prepared.flags || {}, preEffect)

    return prepared
}

export async function applyImmediateSupernaturalEffect(targetActor, effectData, context = {}) {
    const prepared = prepareSupernaturalActorEffectData(effectData, context)
    if (!prepared) return {}

    const EffectDocument = CONFIG.ActiveEffect.documentClass
    if (!EffectDocument) return {}

    const transientEffect = new EffectDocument(prepared, { parent: targetActor })
    let updateData = {}

    for (const change of transientEffect.changes || []) {
        const changeResult = transientEffect.apply(targetActor, change)
        if (changeResult && typeof changeResult === 'object') {
            updateData = foundry.utils.mergeObject(updateData, changeResult)
        }
    }

    if (Object.keys(updateData).length > 0) {
        await targetActor.update(updateData)
    }

    return updateData
}

export async function applySupernaturalEffectsToTarget(targetActor, effectsData, context = {}) {
    const persistentEffects = []
    const immediateEffects = []

    for (const effectData of effectsData || []) {
        const preEffect = normalizeSupernaturalPreEffect(effectData?.flags?.Ilaris?.preEffect)

        if (preEffect.targetMode !== 'direct') {
            console.info(
                `[Ilaris] Uebernatuerlicher Effekt "${effectData?.name || 'Unbenannt'}" mit Zielmodus "${preEffect.targetMode}" wird in Phase 1 nicht ausgefuehrt.`,
            )
            continue
        }

        if (preEffect.applicationType === 'immediate') {
            immediateEffects.push(effectData)
        } else {
            const prepared = prepareSupernaturalActorEffectData(effectData, context)
            if (prepared) persistentEffects.push(prepared)
        }
    }

    let createdEffects = []
    if (persistentEffects.length > 0) {
        createdEffects = await targetActor.createEmbeddedDocuments(
            'ActiveEffect',
            persistentEffects,
        )
    }

    for (const effectData of immediateEffects) {
        await applyImmediateSupernaturalEffect(targetActor, effectData, context)
    }

    return { createdEffects, immediateCount: immediateEffects.length }
}

export async function routeSupernaturalEffectsToOwner(target, effectsData, context = {}) {
    if (!effectsData?.length) return

    const { targetActor, actorLink } = resolveTargetActorForDamage(target)
    if (!targetActor) {
        ui.notifications?.error('Zielakteur fuer uebernatuerliche Effekte wurde nicht gefunden.')
        return
    }

    const executorUserId = resolveDamageExecutorUserId(targetActor)
    if (!executorUserId) {
        ui.notifications?.error(
            `Effekte konnten nicht angewendet werden: Kein berechtigter Benutzer online fuer ${targetActor.name}.`,
        )
        return
    }

    const eventId = foundry.utils.randomID(16)
    const payload = {
        eventId,
        executorUserId,
        requesterUserId: game.user.id,
        timestamp: Date.now(),
        target: prepareTargetDescriptor(target, targetActor, actorLink),
        effectsData: effectsData.map((effectData) => getEffectSourceData(effectData)),
        context,
    }

    game?.socket?.emit('system.Ilaris', {
        type: 'applySupernaturalEffectsByOwner',
        data: payload,
    })

    if (executorUserId !== game.user.id) {
        return
    }

    if (!window._ilarisProcessedSupernaturalEffectEvents) {
        window._ilarisProcessedSupernaturalEffectEvents = new Set()
    }
    window._ilarisProcessedSupernaturalEffectEvents.add(eventId)

    await applySupernaturalEffectsToTarget(targetActor, payload.effectsData, payload.context)
}

export async function handleSupernaturalEffectsSocketEvent(data) {
    const { eventId, executorUserId, target, effectsData, context } = data || {}

    if (!eventId || !executorUserId || !target || !Array.isArray(effectsData)) return
    if (executorUserId !== game.user.id) return

    if (!window._ilarisProcessedSupernaturalEffectEvents) {
        window._ilarisProcessedSupernaturalEffectEvents = new Set()
    }
    if (window._ilarisProcessedSupernaturalEffectEvents.has(eventId)) return

    const { targetActor } = resolveTargetActorForDamage(target)
    if (!targetActor) {
        console.error(`[Ilaris] Effektziel nicht gefunden fuer Ereignis ${eventId}`)
        return
    }
    if (!targetActor.canUserModify(game.user, 'update')) {
        console.warn(
            `[Ilaris] Designierter Owner kann Ziel ${targetActor.name} nicht aktualisieren.`,
        )
        return
    }

    window._ilarisProcessedSupernaturalEffectEvents.add(eventId)
    if (window._ilarisProcessedSupernaturalEffectEvents.size > 1000) {
        const iterator = window._ilarisProcessedSupernaturalEffectEvents.values()
        const first = iterator.next().value
        window._ilarisProcessedSupernaturalEffectEvents.delete(first)
    }

    await applySupernaturalEffectsToTarget(targetActor, effectsData, context)
}
