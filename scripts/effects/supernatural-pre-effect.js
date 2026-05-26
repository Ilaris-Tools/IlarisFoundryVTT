import {
    resolveDamageExecutorUserId,
    resolveTargetActorForDamage,
} from '../combat/dialogs/shared-dialog-helpers.js'

export const SUPERNATURAL_ITEM_TYPES = Object.freeze(['zauber', 'liturgie', 'anrufung'])

const SUPERNATURAL_ITEM_TYPE_SET = new Set(SUPERNATURAL_ITEM_TYPES)

const SUPERNATURAL_PRE_EFFECT_DEFAULTS = Object.freeze({
    id: '',
    name: 'Neuer Zieleffekt',
    icon: 'icons/svg/aura.svg',
    description: '',
    tint: '',
    disabled: false,
    duration: Object.freeze({
        rounds: '',
        turns: '',
        seconds: '',
    }),
    changes: Object.freeze([
        Object.freeze({
            key: '',
            mode: 2,
            value: '0',
            priority: 20,
        }),
    ]),
    targetMode: 'direct',
    targetScope: 'selected',
    applicationType: 'persistent',
    multiplierStrategy: 'none',
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
        { value: 'none', label: 'Kein Effektmodifikator' },
        { value: 'maechtigeMagie', label: 'Mächtige Magie' },
        { value: 'maechtigeLiturgie', label: 'Mächtige Liturgie' },
        { value: 'maechtigeAnrufung', label: 'Mächtige Anrufung' },
        { value: 'hoheQualitaet', label: 'Hohe Qualität' },
        { value: 'custom', label: 'Benutzerdefinierter Modifikator' },
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

function getPreEffectMetadata(preEffect) {
    return {
        id: preEffect.id,
        targetMode: preEffect.targetMode,
        targetScope: preEffect.targetScope,
        applicationType: preEffect.applicationType,
        multiplierStrategy: preEffect.multiplierStrategy,
        multiplierValue: preEffect.multiplierValue,
        startLogic: preEffect.startLogic,
        template: duplicate(preEffect.template),
        area: duplicate(preEffect.area),
    }
}

function mergePreEffectFlags(flags = {}, preEffect) {
    return {
        ...flags,
        Ilaris: {
            ...(flags.Ilaris || {}),
            preEffect: getPreEffectMetadata(preEffect),
        },
    }
}

function sanitizeNumericField(value) {
    if (value === '' || value == null) return ''
    const numericValue = Number(value)
    return Number.isNaN(numericValue) ? '' : numericValue
}

function normalizeChanges(changes = []) {
    if (!Array.isArray(changes) || changes.length === 0) {
        return duplicate(SUPERNATURAL_PRE_EFFECT_DEFAULTS.changes)
    }

    return changes.map((change) => ({
        key: change?.key || '',
        mode: Number(change?.mode ?? 2),
        value: change?.value == null ? '0' : String(change.value),
        priority: Number(change?.priority ?? 20),
        applyEffectModifier: Boolean(change?.applyEffectModifier),
    }))
}

function normalizeMultiplierStrategy(multiplierStrategy) {
    if (
        !multiplierStrategy ||
        multiplierStrategy === 'once' ||
        multiplierStrategy === 'perTarget'
    ) {
        return 'none'
    }

    return multiplierStrategy
}

function sanitizeModifierCount(value) {
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue) || numericValue <= 0) return 0
    return numericValue
}

function getCastingModifierCount(preEffect, context = {}) {
    const castingModifiers = context.castingModifiers || {}

    switch (preEffect.multiplierStrategy) {
        case 'maechtigeMagie':
            return sanitizeModifierCount(castingModifiers.maechtigeMagie)
        case 'maechtigeLiturgie':
            return sanitizeModifierCount(castingModifiers.maechtigeLiturgie)
        case 'maechtigeAnrufung':
            return sanitizeModifierCount(castingModifiers.maechtigeAnrufung)
        case 'hoheQualitaet':
            return sanitizeModifierCount(castingModifiers.hoheQualitaet)
        case 'custom':
            return sanitizeModifierCount(
                context.effectModifierCount ?? castingModifiers.effectModifierCount,
            )
        default:
            return 0
    }
}

function formatNumericChangeValue(value) {
    if (Number.isInteger(value)) return String(value)
    return String(value)
}

function applyEffectModifierToChange(change, preEffect, context = {}) {
    if (!change.applyEffectModifier) {
        return {
            key: change.key,
            mode: change.mode,
            value: change.value,
            priority: change.priority,
        }
    }

    const modifierCount = getCastingModifierCount(preEffect, context)
    const multiplierValue = Number(preEffect.multiplierValue ?? 1)
    const numericValue = Number(change.value)

    if (modifierCount <= 0 || !Number.isFinite(multiplierValue) || !Number.isFinite(numericValue)) {
        return {
            key: change.key,
            mode: change.mode,
            value: change.value,
            priority: change.priority,
        }
    }

    const scaledValue = numericValue * (1 + modifierCount * multiplierValue)

    return {
        key: change.key,
        mode: change.mode,
        value: formatNumericChangeValue(scaledValue),
        priority: change.priority,
    }
}

function applyEffectModifierToChanges(preEffect, context = {}) {
    return normalizeChanges(preEffect.changes).map((change) =>
        applyEffectModifierToChange(change, preEffect, context),
    )
}

function normalizeDuration(duration = {}) {
    return {
        rounds: sanitizeNumericField(duration?.rounds),
        turns: sanitizeNumericField(duration?.turns),
        seconds: sanitizeNumericField(duration?.seconds),
    }
}

function parseChangesJson(changesJson) {
    if (!changesJson?.trim()) {
        return duplicate(SUPERNATURAL_PRE_EFFECT_DEFAULTS.changes)
    }

    const parsed = JSON.parse(changesJson)
    return normalizeChanges(parsed)
}

export function stringifySupernaturalChanges(changes = []) {
    return JSON.stringify(normalizeChanges(changes), null, 2)
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
        duration: duplicate(SUPERNATURAL_PRE_EFFECT_DEFAULTS.duration),
        changes: duplicate(SUPERNATURAL_PRE_EFFECT_DEFAULTS.changes),
        template: duplicate(SUPERNATURAL_PRE_EFFECT_DEFAULTS.template),
        area: duplicate(SUPERNATURAL_PRE_EFFECT_DEFAULTS.area),
    }
}

export function normalizeSupernaturalPreEffect(preEffect = {}) {
    const defaults = getDefaultSupernaturalPreEffect()
    return {
        ...defaults,
        ...duplicate(preEffect),
        id: preEffect?.id || foundry.utils.randomID(16),
        name: preEffect?.name || defaults.name,
        icon: preEffect?.icon || defaults.icon,
        description: preEffect?.description || '',
        tint: preEffect?.tint || '',
        disabled: Boolean(preEffect?.disabled),
        multiplierStrategy: normalizeMultiplierStrategy(preEffect?.multiplierStrategy),
        multiplierValue: Number(preEffect?.multiplierValue ?? defaults.multiplierValue),
        duration: normalizeDuration(preEffect?.duration),
        changes: normalizeChanges(preEffect?.changes),
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

export function getSupernaturalPreEffects(item) {
    const preEffects =
        item?.getFlag?.('Ilaris', 'preEffects') ?? item?.flags?.Ilaris?.preEffects ?? []
    return Array.isArray(preEffects)
        ? preEffects.map((preEffect) => normalizeSupernaturalPreEffect(preEffect))
        : []
}

export function getSupernaturalPreEffectById(item, preEffectId) {
    return getSupernaturalPreEffects(item).find((preEffect) => preEffect.id === preEffectId) ?? null
}

export function createNewSupernaturalPreEffect(item) {
    const defaultPreEffect = getDefaultSupernaturalPreEffect()
    return normalizeSupernaturalPreEffect({
        ...defaultPreEffect,
        id: foundry.utils.randomID(16),
        name: item ? `${item.name}: Zieleffekt` : defaultPreEffect.name,
    })
}

export async function saveSupernaturalPreEffect(item, preEffectInput) {
    const preEffect = normalizeSupernaturalPreEffect(preEffectInput)
    const preEffects = getSupernaturalPreEffects(item)
    const index = preEffects.findIndex((entry) => entry.id === preEffect.id)

    if (index >= 0) {
        preEffects[index] = preEffect
    } else {
        preEffects.push(preEffect)
    }

    await item.update({ 'flags.Ilaris.preEffects': preEffects })
    return preEffect
}

export async function deleteSupernaturalPreEffect(item, preEffectId) {
    const preEffects = getSupernaturalPreEffects(item).filter((entry) => entry.id !== preEffectId)
    await item.update({ 'flags.Ilaris.preEffects': preEffects })
}

export async function toggleSupernaturalPreEffect(item, preEffectId) {
    const preEffects = getSupernaturalPreEffects(item).map((entry) =>
        entry.id === preEffectId ? { ...entry, disabled: !entry.disabled } : entry,
    )
    await item.update({ 'flags.Ilaris.preEffects': preEffects })
}

export async function createSupernaturalPreEffect(item) {
    const preEffect = createNewSupernaturalPreEffect(item)
    await saveSupernaturalPreEffect(item, preEffect)
    return preEffect
}

export function getApplicableSupernaturalEffectData(item, { targetMode = 'direct' } = {}) {
    if (!isSupernaturalTalentItem(item)) return []

    return getSupernaturalPreEffects(item).filter(
        (preEffect) => !preEffect.disabled && preEffect.targetMode === targetMode,
    )
}

export function prepareSupernaturalActorEffectData(preEffectInput, context = {}) {
    const preEffect = normalizeSupernaturalPreEffect(preEffectInput)

    return {
        name: preEffect.name,
        icon: preEffect.icon,
        description: preEffect.description,
        tint: preEffect.tint || null,
        disabled: false,
        origin: context.originUuid || null,
        duration: withEffectStart(normalizeDuration(preEffect.duration)),
        changes: applyEffectModifierToChanges(preEffect, context),
        transfer: false,
        flags: mergePreEffectFlags({}, preEffect),
    }
}

export function buildSupernaturalPreEffectFromForm(formData, fallback = {}) {
    const expanded = foundry.utils.expandObject(formData)
    const combined = {
        ...fallback,
        ...expanded,
        duration: {
            ...(fallback.duration || {}),
            ...(expanded.duration || {}),
        },
        template: {
            ...(fallback.template || {}),
            ...(expanded.template || {}),
        },
        area: {
            ...(fallback.area || {}),
            ...(expanded.area || {}),
        },
    }

    combined.changes = parseChangesJson(formData.changesJson || fallback.changesJson || '')
    delete combined.changesJson

    return normalizeSupernaturalPreEffect(combined)
}

export async function applyImmediateSupernaturalEffect(targetActor, preEffect, context = {}) {
    const prepared = prepareSupernaturalActorEffectData(preEffect, context)
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

    for (const preEffectInput of effectsData || []) {
        const preEffect = normalizeSupernaturalPreEffect(preEffectInput)

        if (preEffect.targetMode !== 'direct') {
            console.info(
                `[Ilaris] Uebernatuerlicher Effekt "${preEffect?.name || 'Unbenannt'}" mit Zielmodus "${preEffect.targetMode}" wird in Phase 1 nicht ausgefuehrt.`,
            )
            continue
        }

        if (preEffect.applicationType === 'immediate') {
            immediateEffects.push(preEffect)
        } else {
            const prepared = prepareSupernaturalActorEffectData(preEffect, context)
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

    for (const preEffect of immediateEffects) {
        await applyImmediateSupernaturalEffect(targetActor, preEffect, context)
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
        effectsData: effectsData.map((preEffect) => normalizeSupernaturalPreEffect(preEffect)),
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
