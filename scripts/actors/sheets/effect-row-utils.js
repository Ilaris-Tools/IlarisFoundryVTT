export function prepareEffectRows(effects) {
    return Array.from(effects || []).map((effect) => {
        const ownerTurns = effect.system?.ilarisTiming?.durationType === 'ownerTurns'
        const remaining = ownerTurns
            ? effect.system?.ilarisTiming?.remaining
            : effect.duration?.remaining
        return {
            _id: effect.id,
            name: effect.name,
            flags: effect.flags,
            system: effect.system,
            effectDurationLabel: Number.isFinite(remaining) ? `Dauer: ${remaining} Runden` : '',
            armedChargesLabel: Number.isFinite(effect.system?.ilarisArmedCombat?.remainingCharges)
                ? `Ladungen: ${effect.system.ilarisArmedCombat.remainingCharges}`
                : '',
        }
    })
}
