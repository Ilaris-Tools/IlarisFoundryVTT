import {
    getApplicableSupernaturalEffectData,
    isSupernaturalTalentItem,
    routeSupernaturalEffectsToOwner,
} from '../../effects/supernatural-pre-effect.js'

function canFallbackToCastingActor(item) {
    const ziel = item?.system?.ziel
    if (typeof ziel !== 'string') return false

    const normalizedZiel = ziel.trim().toLowerCase()
    return (
        normalizedZiel.includes('selbst') ||
        normalizedZiel.includes('einzelperson') ||
        normalizedZiel.includes('einzelwesen')
    )
}

function getFallbackSelfTargets(dialog) {
    if (!dialog?.actor || !canFallbackToCastingActor(dialog.item)) return []

    const activeToken = dialog.actor.getActiveTokens?.()[0] ?? dialog.actor.token ?? null
    return [
        {
            actorId: dialog.actor.id,
            tokenId: activeToken?.id ?? null,
            actorLink: activeToken?.document?.actorLink ?? activeToken?.actorLink ?? true,
            name: dialog.actor.name,
        },
    ]
}

export function getSupernaturalEffectTargets(dialog) {
    return dialog.selectedActors?.length ? dialog.selectedActors : getFallbackSelfTargets(dialog)
}

export async function handleSupernaturalPostAngriff(rollResult, dialog) {
    if (!rollResult?.success) return
    if (dialog?.attackType !== 'supernatural') return
    if (!dialog?.item || !isSupernaturalTalentItem(dialog.item)) return

    const targets = getSupernaturalEffectTargets(dialog)
    if (!targets.length) return

    const effectsData = getApplicableSupernaturalEffectData(dialog.item, { targetMode: 'direct' })
    if (!effectsData.length) return

    const context = {
        originUuid: dialog.item.uuid,
        sourceItemName: dialog.item.name,
        sourceActorName: dialog.actor?.name,
        castingModifiers: foundry.utils.deepClone(
            dialog.castingModifiers || rollResult?.castingModifiers || {},
        ),
    }

    for (const target of targets) {
        await routeSupernaturalEffectsToOwner(target, effectsData, context)
    }
}

export function registerSupernaturalTargetEffectHandlers() {
    if (window._ilarisSupernaturalTargetEffectHandlersRegistered) return
    window._ilarisSupernaturalTargetEffectHandlersRegistered = true

    Hooks.on('Ilaris.postAngriff', handleSupernaturalPostAngriff)
}
