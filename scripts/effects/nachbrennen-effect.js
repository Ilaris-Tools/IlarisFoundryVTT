import { openSkillDialog } from '../skills/skills-api.js'
import { addConditionSource } from './status-conditions.js'

export const NACHBRENNEN_STATUS_ID = 'Nachbrennen'
export const NACHBRENNEN_DURATION = 4
const warnedUnknownSideEffects = new Set()

function canResolveCountercheck(actor) {
    return Number.isFinite(actor?.system?.attribute?.KO?.pw)
}

/** Open the target-owned KO-20 countercheck after a resolved fire-damage application. */
export async function requestNachbrennenCountercheck(targetActor) {
    if (!canResolveCountercheck(targetActor)) {
        ui?.notifications?.warn(`${targetActor?.name || 'Das Ziel'} kann keine KO-Probe ablegen.`)
        return
    }

    const sourceId = foundry.utils.randomID(16)
    const dialog = await openSkillDialog(targetActor, {
        probeType: 'attribut',
        fertigkeitKey: 'KO',
        fertigkeitName: CONFIG.ILARIS.label?.KO || 'KO',
        pw: targetActor.system.attribute.KO.pw,
        success_val: 20,
        resistAgainst: 'Nachbrennen',
        attributeTargets: ['KO'],
    })
    if (!dialog) return
    dialog._nachbrennenContext = { targetActor, sourceId }
}

/** Dispatch a configured elemental side effect without hard-coding a damage type. */
export async function resolveElementalSideEffect(targetActor, elementalSideEffect) {
    if (!elementalSideEffect) return
    if (elementalSideEffect === 'nachbrennen') {
        await requestNachbrennenCountercheck(targetActor)
        return
    }
    if (!warnedUnknownSideEffects.has(elementalSideEffect)) {
        warnedUnknownSideEffects.add(elementalSideEffect)
        console.warn(`Ilaris | Unbekannter elementarer Nebeneffekt: ${elementalSideEffect}`)
    }
}

/** Persist the target-owned pending source after the KO-20 countercheck fails. */
export async function addPendingNachbrennen(targetActor, sourceId = foundry.utils.randomID(16)) {
    return addConditionSource(targetActor, NACHBRENNEN_STATUS_ID, {
        id: sourceId,
        type: 'nachbrennen',
        timing: {
            durationType: 'ownerTurns',
            expiresOn: 'turnStart',
            remaining: NACHBRENNEN_DURATION,
        },
    })
}

/** Apply the one-shot consequence after the fourth target owner phase. */
export async function completeNachbrennen(targetActor) {
    const currentWounds = Number(targetActor?.system?.gesundheit?.wunden || 0)
    await targetActor.update({ 'system.gesundheit.wunden': currentWounds + 1 })
    await ChatMessage.create({
        content: `<p><strong>Nachbrennen</strong>: ${targetActor.name} erleidet 1 Wunde.</p>`,
        speaker: ChatMessage.getSpeaker({ actor: targetActor }),
        style: CONST.CHAT_MESSAGE_STYLES.OTHER,
    })
}

/** Register the target-side roll result listener once at init. */
export function registerNachbrennenEffect() {
    if (window._ilarisNachbrennenRegistered) return
    window._ilarisNachbrennenRegistered = true
    Hooks.on('Ilaris.postSkillRoll', async (dialog, payload) => {
        const context = dialog._nachbrennenContext
        if (!context) return
        delete dialog._nachbrennenContext
        if (payload?.rollResult?.success) return
        await addPendingNachbrennen(context.targetActor, context.sourceId)
    })
}
