import { openSkillDialog } from '../../skills/skills-api.js'
import { toArray } from './pre-effects-processor.js'

/**
 * Escape a string for safe interpolation into chat HTML.
 * @param {unknown} value
 * @returns {string}
 */
function escapeHTML(value) {
    return String(value ?? '').replace(
        /[&<>"']/g,
        (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
    )
}

/**
 * Resolve the target actor of a serialized resist payload.
 * Uses the UUID so synthetic actors of unlinked tokens resolve too —
 * their ids are not part of the world `game.actors` collection.
 * @param {object} preEffectData
 * @returns {Promise<Actor|null>}
 */
export async function resolveResistTargetActor(preEffectData) {
    if (preEffectData?.targetActorUuid) {
        const doc = await foundry.utils.fromUuid(preEffectData.targetActorUuid)
        if (doc) return doc
    }
    // Legacy payloads (pre-14.1 final) serialized only the world-actor id
    if (preEffectData?.targetActorId) {
        return game.actors.get(preEffectData.targetActorId) ?? null
    }
    return null
}

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
                        clickedButton.disabled = false
                        return
                    }

                    const actor = await resolveResistTargetActor(preEffectData)
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

/**
 * Handle a resist button click: open FertigkeitDialog and wait for result.
 */
async function handleResistClick(actor, preEffectData, button) {
    const avoidTest = preEffectData.avoidTest || {}
    const eventId = preEffectData.eventId
    const spellItemUuid = preEffectData.spellUuid
    const spellName = preEffectData.spellName || ''

    // Compute resist difficulty
    const maechtigeQs = preEffectData.maechtigeQs || 0
    const baseDifficulty = avoidTest.resistDifficulty || 12
    const resistDifficulty = baseDifficulty + maechtigeQs * 4

    // Resolve skill or attribute for the dialog
    let dialogOptions

    if (avoidTest.fertigkeit) {
        // Skill-based resist: find the skill by name in the actor's profan.fertigkeiten array
        const skill = actor.profan.fertigkeiten.find((f) => f.name === avoidTest.fertigkeit)

        if (!skill) {
            ui.notifications.warn(
                `Fertigkeit "${avoidTest.fertigkeit}" nicht auf diesem Akteur gefunden.`,
            )
            button.disabled = false
            return
        }

        // Build talent list from the skill's talents
        const talentList = {}
        const talente = skill.system.talente || []
        for (const [i, tal] of talente.entries()) {
            talentList[i] = tal.name
        }
        const initialTalent = resolveInitialResistTalent(talente, avoidTest.talent)

        dialogOptions = {
            probeType: 'fertigkeit',
            fertigkeitKey: skill.id,
            fertigkeitName: skill.name,
            pw: skill.system.pw,
            talentList,
            initialTalent,
            success_val: resistDifficulty,
            resistAgainst: spellName,
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

    if (resistSuccess) {
        const avoidTest = preEffectData.avoidTest || {}

        if (avoidTest.diminishedOnly) {
            // Apply diminished effect
            await applyDiminishedEffect(preEffectData)
        }
        // else: effect entirely avoided — do nothing
    } else {
        // Resist failed — apply full effect
        await applyPreEffectFromResist(preEffectData)
    }
}

/**
 * Apply the pre-effect with full values (resist failed).
 */
async function applyPreEffectFromResist(preEffectData) {
    const targetActor = await resolveResistTargetActor(preEffectData)
    if (!targetActor) {
        ui.notifications.warn('Ziel der Widerstandsprobe wurde nicht gefunden.')
        return
    }

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

    if (!spellItem || !caster) return

    await createActiveEffectFromPreEffect(
        targetActor,
        preEffect,
        caster,
        spellItem,
        effectiveDuration,
        maechtigeQs,
    )
}

/**
 * Apply diminished effect (resist succeeded with diminishedOnly).
 */
async function applyDiminishedEffect(preEffectData) {
    const targetActor = await resolveResistTargetActor(preEffectData)
    if (!targetActor) {
        ui.notifications.warn('Ziel der Widerstandsprobe wurde nicht gefunden.')
        return
    }

    const spellItem = await foundry.utils.fromUuid(preEffectData.spellUuid)
    const caster = await foundry.utils.fromUuid(preEffectData.casterUuid)

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
        }
        await applyInstantPreEffect(targetActor, diminishedPreEffect, maechtigeQs, speaker)
        return
    }

    if (!spellItem || !caster) return

    // Build diminished preEffect — use each change's own diminishedValue and diminishedMaechtigBonus
    const diminishedPreEffect = {
        ...preEffectData,
        changes: toArray(preEffectData.changes).map((change) => ({
            ...change,
            value: change.diminishedValue || change.value,
            maechtigBonus: change.diminishedMaechtigBonus || change.maechtigBonus || '',
        })),
    }

    await createActiveEffectFromPreEffect(
        targetActor,
        diminishedPreEffect,
        caster,
        spellItem,
        effectiveDuration,
        maechtigeQs,
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

    // Serialize preEffect data for the button. The UUID also resolves synthetic
    // actors of unlinked tokens, whose ids are not in the world actor collection.
    const serialized = encodeURIComponent(
        JSON.stringify({
            ...preEffect,
            eventId,
            targetActorUuid: targetActor.uuid,
            spellName,
        }),
    )

    const safeSpellName = escapeHTML(spellName)
    const safeTestName = escapeHTML(testName)
    const content = `
        <div class="ilaris-resist-prompt">
            <p><strong>${safeSpellName}</strong> — Widerstandsprobe (${safeTestName})</p>
            ${isDiminished ? '<p><em>Bei Erfolg: abgeschwächte Wirkung</em></p>' : '<p><em>Bei Erfolg: keine Wirkung</em></p>'}
            <button class="resist-button"
                data-pre-effect-data="${serialized}">
                <i class="fas fa-shield-alt"></i>
                Widerstand leisten (${safeTestName})
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
