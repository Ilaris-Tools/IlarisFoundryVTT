import { openSkillDialog } from '../../skills/skills-api.js'
import { toArray } from './pre-effects-processor.js'
import { resolveTargetActorForDamage } from '../../combat/dialogs/shared-dialog-helpers.js'

/**
 * Register the resist test system: socket listener, click delegation, and resolution.
 */
export function registerResistHandler() {
    // Click delegation for resist buttons
    if (!window._ilarisResistButtonHookRegistered) {
        window._ilarisResistButtonHookRegistered = true
        Hooks.on('renderChatMessageHTML', (message, htmlDOM) => {
            htmlDOM.querySelectorAll('.resist-button').forEach((button) => {
                button.addEventListener('click', async function () {
                    const clickedButton = this
                    clickedButton.disabled = true

                    let preEffectData
                    try {
                        preEffectData = JSON.parse(
                            decodeURIComponent(this.dataset.preEffectData || '{}'),
                        )
                    } catch (e) {
                        console.error('Failed to parse resist preEffect data:', e)
                        return
                    }

                    const { targetActor: actor } = resolveTargetActorForDamage(
                        preEffectData.target || { actorId: preEffectData.targetActorId },
                    )
                    if (!actor) {
                        ui.notifications.warn('Akteur wurde nicht gefunden.')
                        clickedButton.disabled = false
                        return
                    }

                    // Mark prompt as handled
                    const chatMessage = htmlDOM.closest('.chat-message')
                    chatMessage.classList.remove('ilaris-resist-prompt-highlight')
                    chatMessage.classList.add('resist-handled')
                    htmlDOM.querySelectorAll('.resist-button').forEach((b) => {
                        b.disabled = true
                    })

                    await handleResistClick(actor, preEffectData, clickedButton)
                })
            })
        })
    }
}

export function resolveInitialResistTalent(talents, configuredTalent) {
    return talents?.some((talent) => talent.name === configuredTalent) ? configuredTalent : ''
}

const DEFAULT_RESIST_DIFFICULTY = 12

function toFiniteNumber(value) {
    if (value === undefined || value === null || value === '') return null
    const number = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(number) ? number : null
}

/** Resolve the immutable difficulty of a resistance prompt. */
export function resolveResistDifficulty(preEffectData) {
    const avoidTest = preEffectData?.avoidTest || {}
    if (avoidTest.resistDifficultySource === 'triggeringRoll') {
        const triggeringRollTotal = toFiniteNumber(preEffectData?.triggeringRollTotal)
        if (triggeringRollTotal !== null) {
            return { difficulty: triggeringRollTotal, missingTriggeringRoll: false }
        }
        return { difficulty: DEFAULT_RESIST_DIFFICULTY, missingTriggeringRoll: true }
    }

    const baseDifficulty = toFiniteNumber(avoidTest.resistDifficulty) ?? DEFAULT_RESIST_DIFFICULTY
    const maechtigeQs = toFiniteNumber(preEffectData?.maechtigeQs) ?? 0
    return { difficulty: baseDifficulty + maechtigeQs * 4, missingTriggeringRoll: false }
}

/**
 * Handle a resist button click: open FertigkeitDialog and wait for result.
 */
async function handleResistClick(actor, preEffectData, button) {
    const avoidTest = { ...(preEffectData.avoidTest || {}) }
    const eventId = preEffectData.eventId
    const spellItemUuid = preEffectData.spellUuid
    const spellName = preEffectData.spellName || ''

    const { difficulty: resistDifficulty, missingTriggeringRoll } =
        resolveResistDifficulty(preEffectData)
    if (missingTriggeringRoll) {
        ui?.notifications?.warn(
            'Die auslösende Probe ist nicht verfügbar. Widerstandsschwierigkeit ist 12.',
        )
    }

    const attributeChoices = (avoidTest.attributChoices || []).filter(
        (attribute) => actor.system?.attribute?.[attribute]?.pw !== undefined,
    )
    if (attributeChoices.length > 1) {
        const selectedAttribute = await foundry.applications.api.DialogV2.wait({
            window: { title: 'Widerstandsprobe' },
            content: '<p>Wähle das Attribut für die Widerstandsprobe.</p>',
            buttons: attributeChoices.map((attribute) => ({
                action: attribute,
                label: `${CONFIG.ILARIS.label?.[attribute] || attribute} (PW ${actor.system.attribute[attribute].pw})`,
                callback: () => attribute,
            })),
            rejectClose: false,
        })
        if (!selectedAttribute) {
            button.disabled = false
            return
        }
        avoidTest.attribut = selectedAttribute
    }

    // Resolve skill or attribute for the dialog
    let dialogOptions

    if (avoidTest.fertigkeit) {
        // Skill-based resist: find the skill by name in the actor's profan.fertigkeiten array
        const skillIndex = actor.profan.fertigkeiten.findIndex(
            (f) => f.name === avoidTest.fertigkeit,
        )

        if (skillIndex === -1) {
            ui.notifications.warn(
                `Fertigkeit "${avoidTest.fertigkeit}" nicht auf diesem Akteur gefunden.`,
            )
            button.disabled = false
            return
        }

        const skill = actor.profan.fertigkeiten[skillIndex]

        // Build talent list from the skill's talents
        const talentList = {}
        const talente = skill.system.talente || []
        for (const [i, tal] of talente.entries()) {
            talentList[i] = tal.name
        }
        const initialTalent = resolveInitialResistTalent(talente, avoidTest.talent)

        dialogOptions = {
            probeType: 'fertigkeit',
            fertigkeitKey: skillIndex,
            fertigkeitName: skill.name,
            pw: skill.system.pw,
            talentList,
            initialTalent,
            success_val: resistDifficulty,
            resistAgainst: spellName,
            attributeTargets: [
                skill.system.attribut_0,
                skill.system.attribut_1,
                skill.system.attribut_2,
            ],
        }
    } else if (avoidTest.attribut) {
        // Attribute-based resist: compute PW from actor's attribute
        const attributKey = avoidTest.attribut
        const attributValue = actor.system.attribute[attributKey]?.pw
        const attributLabel = CONFIG.ILARIS.label[attributKey] || attributKey

        if (attributValue === undefined) {
            ui.notifications.warn(`Attribut "${attributKey}" nicht auf diesem Akteur gefunden.`)
            button.disabled = false
            return
        }

        dialogOptions = {
            probeType: 'attribut',
            fertigkeitKey: attributKey,
            fertigkeitName: attributLabel,
            pw: attributValue,
            success_val: resistDifficulty,
            resistAgainst: spellName,
            attributeTargets: [attributKey],
        }
    } else {
        // Fallback: neither fertigkeit nor attribut configured
        ui.notifications.warn('Keine Fertigkeit oder Attribut für Widerstandsprobe konfiguriert.')
        button.disabled = false
        return
    }

    // Open FertigkeitDialog for resist test
    const dialog = await openSkillDialog(actor, dialogOptions)

    if (!dialog) {
        button.disabled = false
        return
    }

    // Attach resist context for the resolution hook
    dialog._resistContext = {
        eventId,
        preEffectData,
        spellUuid: spellItemUuid,
    }
}

/**
 * Register the postSkillRoll listener that processes resist test results.
 */
export function registerResistResolutionListener() {
    if (!window._ilarisResistResolutionRegistered) {
        window._ilarisResistResolutionRegistered = true
        Hooks.on('Ilaris.postSkillRoll', async (dialog, payload) => {
            if (!dialog._resistContext) return

            const { eventId, preEffectData, spellUuid } = dialog._resistContext

            try {
                await processResistResult(dialog, payload, preEffectData)
            } catch (e) {
                console.error('Ilaris | Failed to process resist result:', e)
            }

            // Clean up
            delete dialog._resistContext
        })
    }
}

/**
 * Process a resist test result: apply or skip the pre-effect.
 */
async function processResistResult(dialog, payload, preEffectData) {
    const resistSuccess = payload?.rollResult?.success

    if (preEffectData?.traversal) {
        const { targetActor } = resolveTargetActorForDamage(
            preEffectData.target || { actorId: preEffectData.targetActorId },
        )
        if (!targetActor) return
        const { resolveZoneTraversalResistance } =
            await import('../../combat/zones/zone-lifecycle.js')
        await resolveZoneTraversalResistance(targetActor, preEffectData.traversal, resistSuccess)
        return
    }

    if (preEffectData?.zoneMovementResistance) {
        const { targetActor } = resolveTargetActorForDamage(
            preEffectData.target || { actorId: preEffectData.targetActorId },
        )
        if (!targetActor) return
        const { resolveZoneMovementResistance } =
            await import('../../combat/zones/zone-lifecycle.js')
        await resolveZoneMovementResistance(
            targetActor,
            preEffectData.zoneMovementResistance,
            resistSuccess,
        )
        return
    }

    if (resistSuccess && hasResistanceOutcome(preEffectData, 'success')) {
        await applyPreEffectFromResist(selectResistanceOutcome(preEffectData, 'success'))
    } else if (resistSuccess) {
        const avoidTest = preEffectData.avoidTest || {}

        if (avoidTest.diminishedOnly) {
            // Apply diminished effect
            await applyDiminishedEffect(preEffectData)
        }
        // else: effect entirely avoided — do nothing
    } else if (hasResistanceOutcome(preEffectData, 'failure')) {
        await applyPreEffectFromResist(selectResistanceOutcome(preEffectData, 'failure'))
    } else {
        // Resist failed — apply full effect
        await applyPreEffectFromResist(preEffectData)
    }
}

const RESISTANCE_OUTCOME_FIELDS = [
    'changes',
    'ilarisModifiers',
    'marker',
    'condition',
    'tableManagedDisplacement',
]

function hasResistanceOutcome(preEffectData, outcome) {
    const selected = preEffectData?.resistanceOutcomes?.[outcome]
    if (selected?.enabled !== true) return false
    if (selected.marker?.enabled && (!selected.marker.id || !selected.marker.label)) {
        ui?.notifications?.warn(
            'Ein Hinweis-Effekt für eine Widerstandsprobe benötigt Marker-ID und Anzeige.',
        )
        return false
    }
    if (
        selected.tableManagedDisplacement?.enabled === true &&
        (selected.marker?.enabled !== true || !selected.marker.id || !selected.marker.label)
    ) {
        ui?.notifications?.warn(
            'Zurückstoßen (Spielleitung) benötigt einen aktivierten Hinweis-Effekt mit Marker-ID und Anzeige.',
        )
        return false
    }
    return true
}

/** Create a result-only copy without mutating serialized source data. */
export function selectResistanceOutcome(preEffectData, outcome) {
    const selected = preEffectData?.resistanceOutcomes?.[outcome]
    if (!selected?.enabled) return preEffectData

    const effective = foundry.utils.deepClone(preEffectData)
    for (const field of RESISTANCE_OUTCOME_FIELDS) {
        const fallback =
            field === 'marker' || field === 'condition'
                ? {}
                : field === 'tableManagedDisplacement'
                  ? { enabled: false }
                  : []
        effective[field] = foundry.utils.deepClone(selected[field] || fallback)
    }
    effective.resistanceOutcome = outcome
    return effective
}

/**
 * Apply the pre-effect with full values (resist failed).
 */
async function applyPreEffectFromResist(preEffectData) {
    const { targetActor } = resolveTargetActorForDamage(
        preEffectData.target || { actorId: preEffectData.targetActorId },
    )
    if (!targetActor) return

    const spellItem = await foundry.utils.fromUuid(preEffectData.spellUuid)
    const caster = await foundry.utils.fromUuid(preEffectData.casterUuid)

    const effectiveDuration =
        preEffectData.baseDuration +
        (preEffectData.maneuverBonus || 0) +
        (preEffectData.isSelfCast ? 1 : 0)
    const maechtigeQs = preEffectData.maechtigeQs || 0

    const { createActiveEffectFromPreEffect, applyInstantPreEffect } =
        await import('./pre-effects-processor.js')

    // Build the preEffect object from serialized data
    const preEffect = {
        ...preEffectData,
        changes: preEffectData.changes || [],
    }

    if (preEffectData.instant) {
        // Instant damage — apply directly, no ActiveEffect
        const speaker = ChatMessage.getSpeaker({ actor: targetActor })
        await applyInstantPreEffect(targetActor, preEffect, maechtigeQs, speaker)
        return
    }

    await createActiveEffectFromPreEffect(
        targetActor,
        preEffect,
        caster,
        spellItem,
        effectiveDuration,
        maechtigeQs,
        preEffectData.preEffectIndex,
        preEffectData.applicationId,
        preEffectData.armedInputValues || {},
        preEffectData.sourceType || 'uebernatuerlich',
        preEffectData.spellModificationId || '',
        preEffectData.zoneRegionId || '',
    )
    await sendTableManagedDisplacementNotice(targetActor, preEffectData, spellItem)
}

/**
 * Tell the target owner and active GMs that a rules outcome requires table-managed
 * displacement. This intentionally never updates a Token document.
 */
async function sendTableManagedDisplacementNotice(targetActor, preEffectData, spellItem) {
    if (preEffectData.tableManagedDisplacement?.enabled !== true) return

    const whisper = game.users
        .filter(
            (user) =>
                user.active &&
                (user.isGM ||
                    targetActor.testUserPermission(user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)),
        )
        .map((user) => user.id)
    if (whisper.length === 0) return

    await ChatMessage.create({
        content: `<div class="ilaris-table-managed-displacement"><p><strong>Zurückstoßen (Spielleitung)</strong></p><p>${targetActor.name} hat der Widerstandsprobe gegen ${spellItem?.name || 'den Zauber'} nicht standgehalten. Zustand und Hinweis-Effekt wurden angewendet. Die Spielleitung positioniert den Token nach den Regeln für Zurückstoßen manuell neu.</p></div>`,
        speaker: ChatMessage.getSpeaker({ actor: targetActor }),
        whisper,
        flags: {
            ilaris: {
                tableManagedDisplacement: true,
                spellUuid: preEffectData.spellUuid || '',
                spellModificationId: preEffectData.spellModificationId || '',
                targetActorUuid: targetActor.uuid || '',
                targetTokenId: preEffectData.target?.tokenId || preEffectData.targetTokenId || '',
            },
        },
    })
}

/**
 * Apply diminished effect (resist succeeded with diminishedOnly).
 */
async function applyDiminishedEffect(preEffectData) {
    const { targetActor } = resolveTargetActorForDamage(
        preEffectData.target || { actorId: preEffectData.targetActorId },
    )
    if (!targetActor) return

    const spellItem = await foundry.utils.fromUuid(preEffectData.spellUuid)
    const caster = await foundry.utils.fromUuid(preEffectData.casterUuid)
    if (!spellItem || !caster) return

    const effectiveDuration =
        preEffectData.baseDuration +
        (preEffectData.maneuverBonus || 0) +
        (preEffectData.isSelfCast ? 1 : 0)
    const maechtigeQs = preEffectData.maechtigeQs || 0
    const avoidTest = preEffectData.avoidTest || {}

    const { createActiveEffectFromPreEffect, applyInstantPreEffect } =
        await import('./pre-effects-processor.js')

    if (preEffectData.instant) {
        // Diminished instant damage
        const speaker = ChatMessage.getSpeaker({ actor: targetActor })
        const diminishedPreEffect = {
            ...preEffectData,
            changes: toArray(preEffectData.changes).map((change) => ({
                ...change,
                value: change.diminishedValue || change.value,
                maechtigBonus: change.diminishedMaechtigBonus || change.maechtigBonus || '',
            })),
            ilarisModifiers: toArray(preEffectData.ilarisModifiers).map((modifier) => ({
                ...modifier,
                value: modifier.diminishedValue || modifier.value,
                maechtigBonus: modifier.diminishedMaechtigBonus || modifier.maechtigBonus || '',
                comparisonValue:
                    modifier.diminishedComparisonValue || modifier.comparisonValue || '',
            })),
        }
        await applyInstantPreEffect(targetActor, diminishedPreEffect, maechtigeQs, speaker)
        return
    }

    // Build diminished preEffect — use each change's own diminishedValue and diminishedMaechtigBonus
    const diminishedPreEffect = {
        ...preEffectData,
        changes: toArray(preEffectData.changes).map((change) => ({
            ...change,
            value: change.diminishedValue || change.value,
            maechtigBonus: change.diminishedMaechtigBonus || change.maechtigBonus || '',
        })),
        ilarisModifiers: toArray(preEffectData.ilarisModifiers).map((modifier) => ({
            ...modifier,
            value: modifier.diminishedValue || modifier.value,
            maechtigBonus: modifier.diminishedMaechtigBonus || modifier.maechtigBonus || '',
            comparisonValue: modifier.diminishedComparisonValue || modifier.comparisonValue || '',
        })),
    }

    await createActiveEffectFromPreEffect(
        targetActor,
        diminishedPreEffect,
        caster,
        spellItem,
        effectiveDuration,
        maechtigeQs,
        preEffectData.preEffectIndex,
        preEffectData.applicationId,
        preEffectData.armedInputValues || {},
        preEffectData.sourceType || 'uebernatuerlich',
        preEffectData.spellModificationId || '',
        preEffectData.zoneRegionId || '',
    )
}

/**
 * Send a resist prompt to a target actor.
 * @param {Actor} targetActor
 * @param {object} preEffect - Full pre-effect data (serializable)
 * @param {string} spellName
 * @param {object} speaker
 */
export async function sendResistPrompt(targetActor, preEffect, spellName, speaker) {
    const avoidTest = preEffect.avoidTest || {}
    const testName = avoidTest.fertigkeit || avoidTest.attribut || 'Widerstand'
    const isDiminished = avoidTest.diminishedOnly
    const eventId = foundry.utils.randomID(16)

    // Serialize preEffect data for the button
    const serialized = encodeURIComponent(
        JSON.stringify({
            ...preEffect,
            eventId,
            targetActorId: targetActor.id,
            spellName,
        }),
    )

    const content = `
        <div class="ilaris-resist-prompt">
            <p><strong>${spellName}</strong> — Widerstandsprobe (${testName})</p>
            ${isDiminished ? '<p><em>Bei Erfolg: abgeschwächte Wirkung</em></p>' : '<p><em>Bei Erfolg: keine Wirkung</em></p>'}
            <button class="resist-button"
                data-actor-id="${targetActor.id}"
                data-pre-effect-data="${serialized}">
                <i class="fas fa-shield-alt"></i>
                Widerstand leisten (${testName})
            </button>
        </div>
    `

    // Route to the target's owner client
    await routeResistPromptToOwner(targetActor, content, eventId, speaker)
}

/**
 * Route a resist prompt to the target's controlling client.
 */
async function routeResistPromptToOwner(targetActor, content, eventId, speaker) {
    const executorUserId = resolveResistExecutorUserId(targetActor)
    if (!executorUserId) return

    const whisperUserIds = [executorUserId]
    // Add active GMs
    for (const user of game.users) {
        if (user.active && user.isGM && !whisperUserIds.includes(user.id)) {
            whisperUserIds.push(user.id)
        }
    }

    const messageData = {
        content,
        speaker,
        whisper: whisperUserIds,
        flags: {
            ilaris: {
                resistPrompt: true,
                eventId,
            },
        },
    }

    await ChatMessage.create(messageData)
}

/**
 * Resolve the user who should receive the resist prompt.
 */
function resolveResistExecutorUserId(targetActor) {
    if (!targetActor) return null

    const activeNonGmOwners = game.users.filter(
        (user) =>
            user.active &&
            !user.isGM &&
            targetActor.testUserPermission(user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER),
    )

    if (activeNonGmOwners.length > 0) return activeNonGmOwners[0].id

    const activeGms = game.users.filter((user) => user.active && user.isGM)
    if (activeGms.length > 0) return activeGms[0].id

    return null
}
