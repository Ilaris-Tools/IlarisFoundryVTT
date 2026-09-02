export function prepareEffectRows(effects) {
    return Array.from(effects || []).map((effect) => {
        const ownerTurns = effect.system?.ilarisTiming?.durationType === 'ownerTurns'
        const remaining = ownerTurns
            ? effect.system?.ilarisTiming?.remaining
            : effect.duration?.remaining
        const conditionSources = effect.system?.ilarisCondition?.sources
        const sourceEntries = Array.isArray(conditionSources)
            ? conditionSources
            : Object.values(conditionSources || {})
        const conditionSourcesLabel = sourceEntries.length
            ? `Quellen: ${sourceEntries
                  .map((source) => {
                      if (source.type === 'manual') return 'manuell'
                      if (!source.spellName) return 'automatisch'
                      return source.castSkill
                          ? `${source.spellName} (${source.castSkill})`
                          : source.spellName
                  })
                  .join(', ')}`
            : ''
        return {
            _id: effect.id,
            name: effect.name,
            flags: effect.flags,
            system: effect.system,
            effectDurationLabel: Number.isFinite(remaining) ? `Dauer: ${remaining} Runden` : '',
            armedChargesLabel: Number.isFinite(effect.system?.ilarisArmedCombat?.remainingCharges)
                ? `Ladungen: ${effect.system.ilarisArmedCombat.remainingCharges}`
                : '',
            conditionSourcesLabel,
        }
    })
}
