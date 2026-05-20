import {
    getApplicableSupernaturalEffectData,
    isSupernaturalTalentItem,
    routeSupernaturalEffectsToOwner,
} from '../../effects/supernatural-pre-effect.js'

export async function handleSupernaturalPostAngriff(rollResult, dialog) {
    if (!rollResult?.success) return
    if (dialog?.attackType !== 'supernatural') return
    if (!dialog?.item || !isSupernaturalTalentItem(dialog.item)) return
    if (!dialog.selectedActors?.length) return

    const effectsData = getApplicableSupernaturalEffectData(dialog.item, { targetMode: 'direct' })
    if (!effectsData.length) return

    const context = {
        originUuid: dialog.item.uuid,
        sourceItemName: dialog.item.name,
        sourceActorName: dialog.actor?.name,
    }

    for (const target of dialog.selectedActors) {
        await routeSupernaturalEffectsToOwner(target, effectsData, context)
    }
}

export function registerSupernaturalTargetEffectHandlers() {
    if (window._ilarisSupernaturalTargetEffectHandlersRegistered) return
    window._ilarisSupernaturalTargetEffectHandlersRegistered = true

    Hooks.on('Ilaris.postAngriff', handleSupernaturalPostAngriff)
}
