import { prepareEffectRows } from '../sheets/effect-row-utils.js'

describe('Held effect rows', () => {
    it('shows owner-turn and native duration independently from armed charges', () => {
        const [ownerTurns, condition, nativeDuration, indefinite] = prepareEffectRows([
            {
                id: 'owner',
                name: 'Owner turns',
                system: {
                    ilarisTiming: { durationType: 'ownerTurns', remaining: 3 },
                    ilarisArmedCombat: { remainingCharges: 2 },
                },
                duration: { remaining: 12 },
            },
            {
                id: 'condition',
                name: 'Sehr schlechte Position (Liegend)',
                system: {
                    ilarisCondition: {
                        statusId: 'Position4',
                        sources: [
                            { id: 'manual', type: 'manual' },
                            { id: 'maneuver', type: 'preEffect' },
                        ],
                    },
                },
                duration: {},
            },
            { id: 'native', name: 'Native', system: {}, duration: { remaining: 4 } },
            { id: 'indefinite', name: 'Indefinite', system: {}, duration: {} },
        ])

        expect(ownerTurns).toMatchObject({
            effectDurationLabel: 'Dauer: 3 Runden',
            armedChargesLabel: 'Ladungen: 2',
        })
        expect(condition.conditionSourcesLabel).toBe('Quellen: manuell, automatisch')
        expect(nativeDuration.effectDurationLabel).toBe('Dauer: 4 Runden')
        expect(nativeDuration.armedChargesLabel).toBe('')
        expect(indefinite.effectDurationLabel).toBe('')
        expect(indefinite.armedChargesLabel).toBe('')
    })
})
