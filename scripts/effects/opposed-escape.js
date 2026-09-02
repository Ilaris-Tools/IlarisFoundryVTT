import { openSkillDialog } from '../skills/skills-api.js'

const ESCAPE_ATTRIBUTES = ['GE', 'KK']

function getEffect(actor, effectId) {
    return (
        actor?.effects?.get?.(effectId) ||
        actor?.appliedEffects?.find?.((effect) => effect.id === effectId)
    )
}

function getEscapeData(effect) {
    const ending = effect?.system?.ilarisEnding || {}
    const sourceActorUuid = ending.sourceActorUuid || effect?.flags?.ilaris?.sourceActorUuid
    if (ending.type !== 'opposedEscape' || !sourceActorUuid) return null
    return { sourceActorUuid, ending }
}

function canControl(actor) {
    return (
        game.user?.isGM ||
        actor?.testUserPermission?.(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
    )
}

export function getOpposedEscapeAttributeOptions(actor) {
    return ESCAPE_ATTRIBUTES.map((key) => ({
        key,
        label: CONFIG.ILARIS.label?.[key] || key,
        pw: actor.system?.attribute?.[key]?.pw,
    })).filter((option) => Number.isFinite(option.pw))
}

async function selectEscapeAttribute(actor, title) {
    const choices = getOpposedEscapeAttributeOptions(actor)
    if (!choices.length) {
        ui.notifications.warn('GE oder KK wurden auf diesem Akteur nicht gefunden.')
        return null
    }
    return foundry.applications.api.DialogV2.wait({
        window: { title },
        content: '<p>Wähle das Attribut für die Befreiungsprobe.</p>',
        buttons: choices.map((choice) => ({
            action: choice.key,
            label: `${choice.label} (PW ${choice.pw})`,
            callback: () => choice.key,
        })),
        rejectClose: false,
    })
}

async function openEscapeAttributeRoll(actor, attribute, context) {
    const pw = actor.system?.attribute?.[attribute]?.pw
    if (!Number.isFinite(pw)) return
    const dialog = await openSkillDialog(actor, {
        probeType: 'attribut',
        fertigkeitKey: attribute,
        fertigkeitName: CONFIG.ILARIS.label?.[attribute] || attribute,
        pw,
        success_val: 0,
        resistAgainst: context.effectName,
        attributeTargets: [attribute],
    })
    if (dialog) dialog._opposedEscapeContext = context
}

function validateAttempt(actor, effect, nonce, sourceActorUuid) {
    const escape = getEscapeData(effect)
    const attempt = effect?.flags?.ilaris?.opposedEscapeAttempt
    return Boolean(
        actor &&
        effect &&
        escape?.sourceActorUuid === sourceActorUuid &&
        attempt?.state === 'pending' &&
        attempt?.nonce === nonce,
    )
}

/** Start the target-side GE/KK selection for a persisted grapple effect. */
export async function startOpposedEscape(actor, effectId) {
    const effect = getEffect(actor, effectId)
    const escape = getEscapeData(effect)
    if (!effect || !escape || !canControl(actor)) {
        ui.notifications.warn('Diese Befreiungsprobe ist nicht verfügbar.')
        return
    }
    if (effect.flags?.ilaris?.opposedEscapeAttempt?.state === 'pending') {
        ui.notifications.warn('Für diesen Effekt läuft bereits eine Befreiungsprobe.')
        return
    }

    const attribute = await selectEscapeAttribute(actor, `Befreiungsprobe: ${effect.name}`)
    if (!attribute) return

    const nonce = foundry.utils.randomID(16)
    await effect.update({
        'flags.ilaris.opposedEscapeAttempt': {
            nonce,
            state: 'pending',
            targetActorUuid: actor.uuid,
            sourceActorUuid: escape.sourceActorUuid,
        },
    })
    await openEscapeAttributeRoll(actor, attribute, {
        nonce,
        effectId: effect.id,
        effectName: effect.name,
        targetActorUuid: actor.uuid,
        sourceActorUuid: escape.sourceActorUuid,
    })
}

export async function sendOpposedEscapeCounterPrompt(context, escapeRoll) {
    const targetActor = await foundry.utils.fromUuid(context.targetActorUuid)
    const sourceActor = await foundry.utils.fromUuid(context.sourceActorUuid)
    const effect = getEffect(targetActor, context.effectId)
    if (
        !validateAttempt(targetActor, effect, context.nonce, context.sourceActorUuid) ||
        !sourceActor
    )
        return

    const recipients = game.users
        .filter(
            (user) =>
                user.active &&
                sourceActor.testUserPermission(user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER),
        )
        .map((user) => user.id)
    if (!recipients.length) {
        const gm = game.users.find((user) => user.active && user.isGM)
        if (!gm) {
            ui.notifications.warn('Kein aktiver Benutzer für die Gegenprobe gefunden.')
            return
        }
        recipients.push(gm.id)
    }
    const serialized = encodeURIComponent(JSON.stringify({ ...context, escapeRoll }))
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: targetActor }),
        whisper: recipients,
        content: `<div class="ilaris-opposed-escape"><p><strong>${targetActor.name}</strong> versucht, sich aus <strong>${effect.name}</strong> zu befreien.</p><button type="button" class="ilaris-opposed-escape-button" data-escape-context="${serialized}">Gegenprobe würfeln</button></div>`,
        flags: { ilaris: { opposedEscape: { nonce: context.nonce, effectId: context.effectId } } },
    })
}

async function handleCounterClick(button) {
    let context
    try {
        context = JSON.parse(decodeURIComponent(button.dataset.escapeContext || ''))
    } catch (_error) {
        return
    }
    const sourceActor = await foundry.utils.fromUuid(context.sourceActorUuid)
    const targetActor = await foundry.utils.fromUuid(context.targetActorUuid)
    const effect = getEffect(targetActor, context.effectId)
    if (
        !sourceActor ||
        !canControl(sourceActor) ||
        !validateAttempt(targetActor, effect, context.nonce, context.sourceActorUuid)
    ) {
        ui.notifications.warn('Diese Befreiungsprobe ist nicht mehr gültig.')
        return
    }
    button.disabled = true
    const attribute = await selectEscapeAttribute(sourceActor, `Gegenprobe: ${effect.name}`)
    if (!attribute) {
        button.disabled = false
        return
    }
    await openEscapeAttributeRoll(sourceActor, attribute, { ...context, counterCheck: true })
}

export async function resolveOpposedEscapeCounterCheck(context, counterRoll) {
    const targetActor = await foundry.utils.fromUuid(context.targetActorUuid)
    const effect = getEffect(targetActor, context.effectId)
    if (!validateAttempt(targetActor, effect, context.nonce, context.sourceActorUuid)) return

    const escapeRoll = context.escapeRoll || {}
    const escapeWins =
        (escapeRoll.crit && !counterRoll.crit) ||
        (!escapeRoll.fumble && counterRoll.fumble) ||
        (!escapeRoll.crit &&
            !counterRoll.crit &&
            !escapeRoll.fumble &&
            !counterRoll.fumble &&
            Number(escapeRoll.roll?.total) > Number(counterRoll.roll?.total))
    if (escapeWins) await targetActor.deleteEmbeddedDocuments('ActiveEffect', [effect.id])
    else await effect.update({ 'flags.ilaris.opposedEscapeAttempt.state': 'resolved' })
}

/** Register effect-row, chat, and skill-result interactions once at init. */
export function registerOpposedEscapeHandler() {
    if (window._ilarisOpposedEscapeRegistered) return
    window._ilarisOpposedEscapeRegistered = true
    Hooks.on('renderChatMessageHTML', (_message, htmlDOM) => {
        htmlDOM
            .querySelectorAll('.ilaris-opposed-escape-button')
            .forEach((button) => button.addEventListener('click', () => handleCounterClick(button)))
    })
    Hooks.on('Ilaris.postSkillRoll', async (dialog, payload) => {
        const context = dialog._opposedEscapeContext
        if (!context) return
        delete dialog._opposedEscapeContext
        if (context.counterCheck)
            await resolveOpposedEscapeCounterCheck(context, payload?.rollResult || {})
        else await sendOpposedEscapeCounterPrompt(context, payload?.rollResult || {})
    })
}
