import { applyPreEffects } from '../../effects/pre-effects/pre-effects-processor.js'
import { sendResistPrompt } from '../../effects/pre-effects/resist-handler.js'
import {
    removePassiveZoneEffects,
    removeZoneTraversalMarkers,
    removeZoneTraversalMarkersForRegion,
    upsertZoneTraversalMarker,
} from '../../effects/zone-effect-ownership.js'
import { resolveZoneTargets } from './zone-targets.js'

const FLAG_SCOPE = 'Ilaris'
const FLAG_KEY = 'zone'
const DRAFT_FLAG_KEY = 'zoneDraft'
const pendingTurnStartDispatches = new Map()
const pendingRoundStartDispatches = new Map()
const pendingTraversalDispatches = new Map()

function activeGM() {
    const gm = game.users.find((user) => user.active && user.isGM)
    return Boolean(gm?.id && gm.id === game.user.id)
}

function clone(value) {
    return globalThis.foundry?.utils?.deepClone
        ? foundry.utils.deepClone(value)
        : JSON.parse(JSON.stringify(value))
}

function zoneState(region) {
    return region?.flags?.[FLAG_SCOPE]?.[FLAG_KEY] || null
}

function draftState(region) {
    return region?.flags?.[FLAG_SCOPE]?.[DRAFT_FLAG_KEY] || null
}

function applicationId() {
    return globalThis.foundry?.utils?.randomID?.(16) || crypto.randomUUID()
}

function resolveZoneTargetsForSource(region, profile, casterTokenId, updatedToken = null) {
    const excludeTokenId = profile?.targeting?.includeCaster ? '' : casterTokenId || ''
    const targets = resolveZoneTargets(region, {
        excludeTokenId,
    })
    if (!updatedToken?.id || typeof updatedToken.testInsideRegion !== 'function') return targets

    // RegionDocument#tokens can still represent the preceding position during
    // updateToken. TokenDocument#testInsideRegion uses the token source and is
    // the authoritative v14 containment check for that one changed token.
    const withoutUpdatedToken = targets.filter((target) => target.tokenId !== updatedToken.id)
    if (updatedToken.id === excludeTokenId || !updatedToken.testInsideRegion(region))
        return withoutUpdatedToken
    const target = selectedTargetForToken(updatedToken)
    return target ? [...withoutUpdatedToken, target] : withoutUpdatedToken
}

function isPassiveZone(zone) {
    return zone?.profile?.effectMode === 'passive'
}

function hasTurnStartTrigger(zone) {
    return !isPassiveZone(zone) && zone?.profile?.trigger?.onTurnStart === true
}

function hasRoundStartTrigger(zone) {
    return !isPassiveZone(zone) && zone?.profile?.trigger?.onRoundStart === true
}

function hasTraversalTrigger(zone) {
    return (
        !isPassiveZone(zone) &&
        zone?.profile?.shape === 'rectangle' &&
        zone?.profile?.lifecycle === 'persistent' &&
        zone?.profile?.trigger?.onTraverse === true
    )
}

function isTeleportAction(action) {
    const actions =
        globalThis.CONFIG?.Token?.movement?.actions ||
        globalThis.CONST?.TOKEN_MOVEMENT_ACTIONS ||
        {}
    return actions?.[action]?.teleport === true
}

function serializeTraversalMovement(movement) {
    return {
        id: movement?.id || '',
        origin: movement?.origin || null,
        passed: {
            waypoints: (movement?.passed?.waypoints || []).map(({ x, y, action }) => ({
                x,
                y,
                action,
            })),
        },
    }
}

/** Classify one documented Foundry v14 movement path as a wall traversal attempt. */
export function classifyZoneTraversalMovement(region, token, movement) {
    const waypoints = movement?.passed?.waypoints || []
    if (!region?.id || !token?.id || !movement?.id || !movement?.origin || !waypoints.length)
        return null
    if (waypoints.some((waypoint) => isTeleportAction(waypoint?.action))) return null
    const segments =
        token.segmentizeRegionMovementPath?.(region, [movement.origin, ...waypoints]) || []
    const enter = globalThis.CONST?.REGION_MOVEMENT_SEGMENTS?.ENTER
    if (!segments.some((segment) => segment?.type === enter && !isTeleportAction(segment?.action)))
        return null
    return { window: [region.id, token.id, movement.id].join(':') }
}

function invalidPassivePreEffects(preEffects = []) {
    const effects = Array.isArray(preEffects)
        ? preEffects
        : preEffects && typeof preEffects === 'object'
          ? Object.values(preEffects)
          : []
    return effects.some((preEffect) => preEffect?.instant || preEffect?.avoidTest?.enabled)
}

function passiveOwnership(zone, region, target, preEffectIndex) {
    const applicationId = `${zone.applicationId}:${target.tokenId}`
    return {
        regionId: region.id,
        applicationId,
        tokenId: target.tokenId,
        spellUuid: zone.spellUuid,
        preEffectIndex,
    }
}

function selectedTargetForToken(token) {
    if (!token?.actor) return null
    return {
        tokenId: token.id,
        actorId: token.actor.id,
        actorLink: token.actorLink ?? token.document?.actorLink ?? true,
        name: token.actor.name || token.name,
    }
}

function traversalOwnership(traversal) {
    return {
        regionId: traversal.regionId,
        applicationId: traversal.applicationId,
        tokenId: traversal.tokenId,
        spellUuid: traversal.spellUuid,
    }
}

function traversalRecipients(actor, token = null) {
    const ownerLevel = globalThis.CONST?.DOCUMENT_OWNERSHIP_LEVELS?.OWNER ?? 3
    return (game.users || [])
        .filter(
            (user) =>
                user.active &&
                (user.isGM ||
                    actor?.testUserPermission?.(user, ownerLevel) === true ||
                    token?.testUserPermission?.(user, ownerLevel) === true),
        )
        .map((user) => user.id)
}

async function sendTraversalFailureNotice(actor, traversal, token = null) {
    if (!globalThis.ChatMessage?.create) return
    const recipients = traversalRecipients(actor, token)
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        ...(recipients.length ? { whisper: recipients } : {}),
        content:
            '<div class="ilaris-zone-traversal-failure"><p><strong>Die Durchquerung ist misslungen.</strong> Bitte den Token vor der Wand platzieren; ein weiterer Durchquerungsversuch löst erneut GE 16 und 2W6 TP aus.</p></div>',
        flags: {
            ilaris: {
                zoneTraversalFailure: {
                    regionId: traversal.regionId,
                    tokenId: traversal.tokenId,
                },
            },
        },
    })
}

/** Resolve the table-managed success/failure result of one wall traversal prompt. */
export async function resolveZoneTraversalResistance(targetActor, traversal, success) {
    if (!targetActor || !traversal?.sceneId || !traversal?.regionId) return
    const region = game.scenes?.get?.(traversal.sceneId)?.regions?.get?.(traversal.regionId)
    if (!region) return
    const ownership = traversalOwnership(traversal)
    if (success) {
        await removeZoneTraversalMarkers(targetActor, ownership)
        return
    }
    await upsertZoneTraversalMarker(targetActor, ownership, {
        name: `${traversal.spellName || 'Zone'} – ${traversal.failureMarkerName || 'Durchquerung fehlgeschlagen'}`,
        origin: traversal.casterUuid || '',
    })
    const targetToken = region.parent?.tokens?.get?.(traversal.tokenId) || null
    await sendTraversalFailureNotice(targetActor, traversal, targetToken)
}

function zoneActors() {
    if (Array.isArray(game?.actors)) return game.actors
    return Array.from(game?.actors?.values?.() || [])
}

/** Classify a containment refresh without duplicating entry triggers. */
export function classifyZoneMembership(previousMembership = [], currentTargets = []) {
    const previous = new Set(previousMembership)
    const membership = currentTargets.map((target) => target.tokenId)
    return {
        entered: currentTargets.filter((target) => !previous.has(target.tokenId)),
        membership,
        changed:
            membership.length !== previous.size ||
            membership.some((tokenId) => !previous.has(tokenId)),
    }
}

/** Create an inert, visible Region draft owned by one casting dialog. */
export async function createZoneDraftRegion({ scene, regionData, draftId, ownerUserId, dialogId }) {
    if (!activeGM() || !scene || !regionData || !draftId || !ownerUserId || !dialogId) return null
    const [draft] = await scene.createEmbeddedDocuments('Region', [
        {
            ...regionData,
            _id: draftId,
            name: regionData.name || 'Ilaris Zonenplatzierung',
            flags: {
                ...(regionData.flags || {}),
                [FLAG_SCOPE]: {
                    ...(regionData.flags?.[FLAG_SCOPE] || {}),
                    [DRAFT_FLAG_KEY]: { ownerUserId, dialogId, draftId },
                },
            },
        },
    ])
    return draft || null
}

/** Delete only the inert draft that belongs to the requesting dialog owner. */
export async function deleteZoneDraftRegion({ scene, draftId, ownerUserId, dialogId = '' }) {
    if (!activeGM() || !scene || !draftId || !ownerUserId) return false
    const matchesRequest = (region) => {
        const state = draftState(region)
        return (
            state?.ownerUserId === ownerUserId &&
            (!dialogId || state.dialogId === dialogId) &&
            (region.id === draftId || state.draftId === draftId)
        )
    }
    const regions = [scene.regions?.get?.(draftId), ...Array.from(scene.regions || [])]
    const draft =
        regions.find(matchesRequest) ||
        regions.find((region) => {
            const state = draftState(region)
            return state?.ownerUserId === ownerUserId && (!dialogId || state.dialogId === dialogId)
        }) ||
        null
    const state = draftState(draft)
    if (!state || state.ownerUserId !== ownerUserId || (dialogId && state.dialogId !== dialogId))
        return false
    await draft.delete()
    return true
}

/** Execute a player-issued inert draft creation request on the active GM client. */
export async function createZoneDraftRegionFromRequest(request) {
    if (!activeGM() || !request?.sceneId) return null
    const scene = game.scenes.get(request.sceneId)
    return createZoneDraftRegion({ scene, ...request })
}

/** Execute a player-issued inert draft deletion request on the active GM client. */
export async function deleteZoneDraftRegionFromRequest(request) {
    if (!activeGM() || !request?.sceneId) return false
    const scene = game.scenes.get(request.sceneId)
    return deleteZoneDraftRegion({ scene, ...request })
}

function zoneDialog(state, targets) {
    return {
        actor: state.casterActor,
        item: state.spellItem,
        speaker: ChatMessage.getSpeaker({ actor: state.casterActor }),
        selectedActors: targets,
        maneuverDurationBonus: state.maneuverDurationBonus || 0,
        maechtigeMagieQs: state.maechtigeMagieQs || 0,
    }
}

async function hydrateZoneState(zone) {
    const spellItem = await foundry.utils.fromUuid(zone.spellUuid)
    const casterActor = await foundry.utils.fromUuid(zone.casterUuid)
    if (!spellItem || !casterActor) return null
    return { ...zone, spellItem, casterActor }
}

async function dispatchZoneTrigger(region, trigger, targets) {
    const zone = await hydrateZoneState(zoneState(region))
    if (!zone || !targets.length) return
    await applyPreEffects(
        { success: true },
        zoneDialog(zone, targets),
        zone.armedInputValues || {},
        {
            preEffects: zone.preEffects,
            applicationId: `${zone.applicationId}:${trigger}`,
            spellModificationId: zone.spellModificationId || '',
            zoneRegionId: region.id,
        },
    )
}

async function dispatchZoneTraversal(region, token, window) {
    const zone = await hydrateZoneState(zoneState(region))
    const target = selectedTargetForToken(token)
    if (!zone || !target) return
    const applicationId = `${zone.applicationId}:traverse:${window}`
    const unconditionalPreEffects = (zone.preEffects || []).filter(
        (preEffect) => preEffect?.instant === true && !preEffect?.avoidTest?.enabled,
    )
    if (unconditionalPreEffects.length) {
        await applyPreEffects(
            { success: true },
            zoneDialog(zone, [target]),
            zone.armedInputValues || {},
            {
                preEffects: unconditionalPreEffects,
                applicationId,
                spellModificationId: zone.spellModificationId || '',
                zoneRegionId: region.id,
            },
        )
    }
    await sendResistPrompt(
        token.actor,
        {
            avoidTest: zone.profile.traversal.avoidTest,
            targetActorId: token.actor.id,
            target,
            traversal: {
                sceneId: region.parent?.id || token.parent?.id || '',
                regionId: region.id,
                tokenId: token.id,
                applicationId: zone.applicationId,
                spellUuid: zone.spellUuid,
                spellName: zone.spellItem.name,
                casterUuid: zone.casterUuid,
                failureMarkerName: zone.profile.traversal.failureMarker?.name || '',
            },
        },
        zone.spellItem.name,
        ChatMessage.getSpeaker({ actor: zone.casterActor }),
    )
}

/** Dispatch a traversal attempt only for a processed normal map movement through an eligible wall. */
export async function dispatchPersistentZoneTraversal(token, movement) {
    if (!token?.parent) return
    if (!activeGM()) {
        const hasTraversalZone = Array.from(token.parent.regions || []).some((region) => {
            const zone = zoneState(region)
            return !zone?.initializing && hasTraversalTrigger(zone)
        })
        if (
            hasTraversalZone &&
            movement?.id &&
            movement?.origin &&
            movement?.passed?.waypoints?.length
        )
            game.socket?.emit?.('system.Ilaris', {
                type: 'dispatchZoneTraversal',
                data: {
                    sceneId: token.parent.id,
                    tokenId: token.id,
                    userId: game.user.id,
                    movement: serializeTraversalMovement(movement),
                },
            })
        return
    }
    for (const region of token.parent.regions || []) {
        const zone = zoneState(region)
        if (zone?.initializing || !hasTraversalTrigger(zone)) continue
        const attempt = classifyZoneTraversalMovement(region, token, movement)
        if (!attempt) continue
        const pending = pendingTraversalDispatches.get(attempt.window)
        if (pending) {
            await pending
            continue
        }
        const dispatch = dispatchZoneTraversal(region, token, attempt.window)
        pendingTraversalDispatches.set(attempt.window, dispatch)
        try {
            await dispatch
        } finally {
            if (pendingTraversalDispatches.get(attempt.window) === dispatch)
                pendingTraversalDispatches.delete(attempt.window)
        }
    }
}

/** Execute a player-issued normal movement traversal request on the active GM client. */
export async function dispatchPersistentZoneTraversalFromRequest(request) {
    if (!activeGM() || !request?.sceneId || !request?.tokenId || !request?.userId) return
    const scene = game.scenes?.get?.(request.sceneId)
    const token = scene?.tokens?.get?.(request.tokenId)
    const user = game.users?.get?.(request.userId)
    const ownerLevel = globalThis.CONST?.DOCUMENT_OWNERSHIP_LEVELS?.OWNER ?? 3
    if (!token || !user || token.testUserPermission?.(user, ownerLevel) !== true) return
    await dispatchPersistentZoneTraversal(token, request.movement)
}

function resolveDestinationToken(combat, updateData = {}) {
    const turn = Number(updateData.turn)
    if (!Number.isInteger(turn) || turn < 0) return null
    const combatant = combat?.turns?.[turn]
    const tokenId = combatant?.tokenId || combatant?.token?.id || ''
    if (!tokenId) return null
    return combat?.scene?.tokens?.get?.(tokenId) || null
}

function turnStartWindow(combat, updateData, region, token) {
    return [combat?.id || '', updateData?.round, updateData?.turn, region.id, token.id].join(':')
}

function roundStartWindow(combat, updateData, region) {
    return [combat?.id || '', updateData?.round, region.id].join(':')
}

/** Dispatch one eligible persistent Zone for all current targets at a forward combat round. */
export async function dispatchPersistentZoneRoundStart(
    combat,
    updateData = {},
    updateOptions = {},
) {
    if (!activeGM() || !(Number(updateOptions?.direction) > 0)) return
    const scene = combat?.scene
    if (!scene) return

    for (const region of scene.regions || []) {
        const zone = zoneState(region)
        if (zone?.initializing || !hasRoundStartTrigger(zone)) continue

        const window = roundStartWindow(combat, updateData, region)
        if (zone.lastRoundStartWindow === window) continue
        const key = `${region.id}:${window}`
        const pending = pendingRoundStartDispatches.get(key)
        if (pending) {
            await pending
            continue
        }

        const dispatch = (async () => {
            // Claim even an empty Region window. A Token entering afterwards
            // waits for the next round instead of receiving a retroactive tick.
            await region.update({
                [`flags.${FLAG_SCOPE}.${FLAG_KEY}.lastRoundStartWindow`]: window,
            })
            const targets = resolveZoneTargetsForSource(region, zone.profile, zone.casterTokenId)
            if (targets.length) await dispatchZoneTrigger(region, `roundStart:${window}`, targets)
        })()
        pendingRoundStartDispatches.set(key, dispatch)
        try {
            await dispatch
        } finally {
            if (pendingRoundStartDispatches.get(key) === dispatch)
                pendingRoundStartDispatches.delete(key)
        }
    }
}

/** Dispatch one eligible persistent Zone for the combatant entering a forward turn. */
export async function dispatchPersistentZoneTurnStart(combat, updateData = {}, updateOptions = {}) {
    if (!activeGM() || !(Number(updateOptions?.direction) > 0)) return
    const scene = combat?.scene
    const token = resolveDestinationToken(combat, updateData)
    if (!scene || !token) return

    for (const region of scene.regions || []) {
        const zone = zoneState(region)
        if (zone?.initializing || !hasTurnStartTrigger(zone)) continue
        const targets = resolveZoneTargetsForSource(region, zone.profile, zone.casterTokenId)
        const target = targets.find((entry) => entry.tokenId === token.id)
        if (!target) continue

        const window = turnStartWindow(combat, updateData, region, token)
        if (zone.lastTurnStartWindow === window) continue
        const key = `${region.id}:${window}`
        const pending = pendingTurnStartDispatches.get(key)
        if (pending) {
            await pending
            continue
        }

        const dispatch = (async () => {
            // Persist before dispatch. The in-flight map above coalesces an
            // immediate duplicate hook while Foundry applies this update.
            await region.update({ [`flags.${FLAG_SCOPE}.${FLAG_KEY}.lastTurnStartWindow`]: window })
            await dispatchZoneTrigger(region, `turnStart:${window}`, [target])
        })()
        pendingTurnStartDispatches.set(key, dispatch)
        try {
            await dispatch
        } finally {
            if (pendingTurnStartDispatches.get(key) === dispatch)
                pendingTurnStartDispatches.delete(key)
        }
    }
}

/** Apply a Region-owned, non-expiring effect to each contained Token exactly once. */
async function applyPassiveZoneEffects(region, targets) {
    const zone = await hydrateZoneState(zoneState(region))
    if (!zone || !targets.length || invalidPassivePreEffects(zone.preEffects)) return
    await applyPreEffects(
        { success: true },
        zoneDialog(zone, targets),
        zone.armedInputValues || {},
        {
            preEffects: zone.preEffects,
            spellModificationId: zone.spellModificationId || '',
            zoneRegionId: region.id,
            passiveZone: { regionId: region.id, applicationId: zone.applicationId },
        },
    )
}

async function removePassiveEffectsForTarget(region, zone, target, actor = null) {
    const targetActor = actor || target?.actor
    if (!targetActor || !target?.tokenId) return
    for (const [preEffectIndex] of (zone.preEffects || []).entries())
        await removePassiveZoneEffects(
            targetActor,
            passiveOwnership(zone, region, target, preEffectIndex),
        )
}

/** Remove every passive application owned by this Region without touching another cast or manual effect. */
export async function cleanupPassiveZoneEffects(region, token = null) {
    const zone = zoneState(region)
    if (!isPassiveZone(zone)) return
    const targets = new Map()
    for (const contained of region.tokens || []) {
        const target = selectedTargetForToken(contained)
        if (target) targets.set(target.tokenId, { target, actor: contained.actor })
    }
    if (token) {
        const target = selectedTargetForToken(token)
        if (target) targets.set(target.tokenId, { target, actor: token.actor })
    }
    for (const tokenId of zone.membership || []) {
        const tokenDocument = region.parent?.tokens?.get?.(tokenId)
        const target = selectedTargetForToken(tokenDocument)
        if (target) targets.set(target.tokenId, { target, actor: tokenDocument.actor })
    }
    for (const { target, actor } of targets.values())
        await removePassiveEffectsForTarget(region, zone, target, actor)

    // Linked Actors may no longer have a Scene Token when a Region is deleted.
    // The matcher remains narrow enough to make this safe for all world Actors.
    for (const actor of zoneActors()) {
        for (const [preEffectIndex] of (zone.preEffects || []).entries()) {
            const effects = Array.isArray(actor.effects)
                ? actor.effects
                : Array.from(actor.effects?.values?.() || [])
            const tokenIds = new Set(
                effects
                    .filter((effect) => effect?.flags?.ilaris?.zoneRegionId === region.id)
                    .map((effect) => effect?.flags?.ilaris?.targetTokenId)
                    .filter(Boolean),
            )
            for (const tokenId of tokenIds)
                await removePassiveZoneEffects(
                    actor,
                    passiveOwnership(zone, region, { tokenId }, preEffectIndex),
                )
        }
    }
}

/** Remove all neutral traversal markers owned by an expiring or deleted wall Region. */
export async function cleanupZoneTraversalMarkers(region) {
    const zone = zoneState(region)
    if (!hasTraversalTrigger(zone)) return
    for (const actor of zoneActors())
        await removeZoneTraversalMarkersForRegion(actor, {
            regionId: region.id,
            applicationId: zone.applicationId,
            spellUuid: zone.spellUuid,
        })
}

/** Create the persistent Region only after its originating cast has succeeded. */
export async function createPersistentZone({ scene, regionData, dialog, zone, preEffects }) {
    if (!activeGM() || !scene || !regionData || !zone?.duration) return null
    if (zone.effectMode === 'passive' && invalidPassivePreEffects(preEffects)) {
        ui?.notifications?.error(
            'Passive Zonen dÃ¼rfen keine Sofort- oder Widerstands-Pre-Effects enthalten.',
        )
        return null
    }
    const state = {
        applicationId: applicationId(),
        spellUuid: dialog.item.uuid,
        casterUuid: dialog.actor.uuid,
        casterTokenId: dialog.zoneCasterTokenId || '',
        spellModificationId: dialog.getSelectedSpellModificationId?.() || '',
        profile: clone(zone),
        preEffects: clone(preEffects || []),
        armedInputValues: clone(dialog.armedInputValues || {}),
        maneuverDurationBonus: dialog.maneuverDurationBonus || 0,
        maechtigeMagieQs: dialog.maechtigeMagieQs || 0,
        durationType: zone.lifecycle === 'persistent' ? 'sceneRounds' : '',
        remaining: zone.duration.remaining,
        originalValue: zone.duration.originalValue,
        membership: [],
        // Region creation may refresh token containment before initial
        // membership is persisted. Ignore that transient update so the
        // explicit creation trigger remains the sole initial application.
        initializing: true,
    }
    const [region] = await scene.createEmbeddedDocuments('Region', [
        {
            ...regionData,
            flags: {
                ...(regionData.flags || {}),
                [FLAG_SCOPE]: {
                    ...(regionData.flags?.[FLAG_SCOPE] || {}),
                    [FLAG_KEY]: state,
                },
            },
        },
    ])
    if (!region) return null

    const occupants = resolveZoneTargetsForSource(region, zone, state.casterTokenId)
    state.membership = occupants.map((target) => target.tokenId)
    await region.update({
        [`flags.${FLAG_SCOPE}.${FLAG_KEY}.membership`]: state.membership,
        [`flags.${FLAG_SCOPE}.${FLAG_KEY}.initializing`]: false,
    })
    if (zone.trigger?.triggerOnCreate !== false) {
        if (zone.effectMode === 'passive') await applyPassiveZoneEffects(region, occupants)
        else await dispatchZoneTrigger(region, 'create', occupants)
    }
    return region
}

/** Execute a player-issued persistent zone request on the active GM client. */
export async function createPersistentZoneFromRequest(request) {
    if (!activeGM() || !request?.sceneId) return null
    const scene = game.scenes.get(request.sceneId)
    if (!scene) return null
    const region = await createPersistentZone({
        scene,
        regionData: request.regionData,
        zone: request.zone,
        preEffects: request.preEffects,
        dialog: {
            item: { uuid: request.spellUuid },
            actor: { uuid: request.casterActorUuid },
            zoneCasterTokenId: request.casterTokenId,
            armedInputValues: request.armedInputValues,
            maneuverDurationBonus: request.maneuverDurationBonus,
            maechtigeMagieQs: request.maechtigeMagieQs,
            getSelectedSpellModificationId: () => request.spellModificationId || '',
        },
    })
    if (region && request.draftRegionId)
        await deleteZoneDraftRegion({
            scene,
            draftId: request.draftRegionId,
            ownerUserId: request.draftOwnerUserId,
            dialogId: request.dialogId,
        })
    return region
}

/** Resolve an instant zone after a successful cast without persisting it. */
export async function resolveInstantZoneTargets(regionData, { zone, casterTokenId = '' } = {}) {
    const region = new CONFIG.Region.documentClass(regionData, { parent: canvas.scene })
    return resolveZoneTargetsForSource(region, zone, casterTokenId)
}

/** Recalculate membership following a token update and dispatch entry/re-entry once. */
export async function updatePersistentZoneMembership(scene, updatedToken = null) {
    if (!activeGM() || !scene) return
    for (const region of scene.regions) {
        const zone = zoneState(region)
        if (zone?.initializing) continue
        if (!isPassiveZone(zone) && !zone?.profile?.trigger?.onEnter) continue
        const current = resolveZoneTargetsForSource(
            region,
            zone.profile,
            zone.casterTokenId,
            updatedToken,
        )
        const membershipUpdate = classifyZoneMembership(zone.membership || [], current)
        const { entered, membership } = membershipUpdate
        if (isPassiveZone(zone)) {
            const currentIds = new Set(membership)
            const left = (zone.membership || []).filter((tokenId) => !currentIds.has(tokenId))
            for (const tokenId of left) {
                const token = scene.tokens?.get?.(tokenId)
                const target = selectedTargetForToken(token)
                if (target) await removePassiveEffectsForTarget(region, zone, target, token.actor)
            }
            if (entered.length) await applyPassiveZoneEffects(region, entered)
        } else if (entered.length) await dispatchZoneTrigger(region, 'enter', entered)
        if (membershipUpdate.changed)
            await region.update({ [`flags.${FLAG_SCOPE}.${FLAG_KEY}.membership`]: membership })
    }
}

/** Decrement every persistent zone on the combat scene exactly once per forward round. */
export async function reducePersistentZoneDurations(combat, updateOptions = {}) {
    if (!activeGM() || updateOptions.direction === -1) return
    const scene = combat?.scene
    if (!scene) return
    for (const region of scene.regions) {
        const zone = zoneState(region)
        if ((zone?.durationType || zone?.profile?.duration?.type) !== 'sceneRounds') continue
        const remaining = Number(zone.remaining) - 1
        if (remaining <= 0) {
            await cleanupPassiveZoneEffects(region)
            await cleanupZoneTraversalMarkers(region)
            await region.delete()
        } else await region.update({ [`flags.${FLAG_SCOPE}.${FLAG_KEY}.remaining`]: remaining })
    }
}

/** Keep periodic ticks ahead of scene-round expiry without changing turn-start dispatch. */
export async function runPersistentZoneRoundLifecycle(combat, updateData = {}, updateOptions = {}) {
    await dispatchPersistentZoneRoundStart(combat, updateData, updateOptions)
    await reducePersistentZoneDurations(combat, updateOptions)
}

/** Recreate only missing passive effects for the active Scene after canvas setup. */
export async function reconcilePersistentPassiveZones(scene) {
    if (!activeGM() || !scene) return
    for (const region of scene.regions || []) {
        const zone = zoneState(region)
        if (!isPassiveZone(zone) || zone.initializing) continue
        const current = resolveZoneTargetsForSource(region, zone.profile, zone.casterTokenId)
        await applyPassiveZoneEffects(region, current)
        const membership = current.map((target) => target.tokenId)
        if (
            membership.length !== (zone.membership || []).length ||
            membership.some((tokenId) => !(zone.membership || []).includes(tokenId))
        )
            await region.update({ [`flags.${FLAG_SCOPE}.${FLAG_KEY}.membership`]: membership })
    }
}

export function registerZoneLifecycleHooks() {
    if (globalThis.window?._ilarisZoneLifecycleRegistered) return
    window._ilarisZoneLifecycleRegistered = true
    Hooks.on('updateToken', (token) => updatePersistentZoneMembership(token.parent, token))
    Hooks.on('deleteToken', async (token) => {
        for (const region of token.parent?.regions || [])
            await cleanupPassiveZoneEffects(region, token)
        await updatePersistentZoneMembership(token.parent)
    })
    Hooks.on('deleteRegion', async (region) => {
        await cleanupPassiveZoneEffects(region)
        await cleanupZoneTraversalMarkers(region)
    })
    Hooks.on('moveToken', (token, movement) => dispatchPersistentZoneTraversal(token, movement))
    Hooks.on('canvasReady', () => reconcilePersistentPassiveZones(canvas?.scene))
    Hooks.on('combatRound', (combat, updateData, updateOptions) =>
        runPersistentZoneRoundLifecycle(combat, updateData, updateOptions),
    )
    Hooks.on('combatTurn', (combat, updateData, updateOptions) =>
        dispatchPersistentZoneTurnStart(combat, updateData, updateOptions),
    )
    Hooks.on('combatRound', (combat, updateData, updateOptions) =>
        dispatchPersistentZoneTurnStart(combat, updateData, updateOptions),
    )
}
