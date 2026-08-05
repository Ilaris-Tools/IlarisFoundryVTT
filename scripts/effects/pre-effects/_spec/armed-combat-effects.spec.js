import {
    getArmedAttackBonus,
    getArmedAttackContext,
    getArmedDamageFormula,
    materializeArmedCombat,
    resolveArmedAttack,
} from '../armed-combat-effects.js'

const nineStrokes = {
    enabled: true,
    trigger: 'nextSuccessfulAttack',
    scope: 'any',
    inputs: [{ key: 'previousHits', default: 0, min: 0, max: 8 }],
    damage: { input: 'previousHits', perInput: 'W6' },
    charges: { base: 1, amplifiedByMaechtigeMagie: true, maechtigBonus: 1 },
}

describe('armed combat effects', () => {
    it('clamps submitted inputs and only amplifies charges when configured', () => {
        expect(materializeArmedCombat(nineStrokes, { previousHits: 12 }, 2)).toMatchObject({
            inputs: { previousHits: 8 },
            remainingCharges: 3,
            damage: { units: 8, perInput: 'W6' },
        })
        expect(
            materializeArmedCombat({ ...nineStrokes, charges: { base: 1 } }, {}, 9)
                .remainingCharges,
        ).toBe(1)
    })

    it('snapshots only matching effects and retains hit-only damage separately', () => {
        const actor = {
            appliedEffects: [
                {
                    id: 'armed',
                    system: {
                        ilarisArmedCombat: {
                            scope: 'ranged',
                            remainingCharges: 2,
                            attackBonus: 4,
                            damage: { units: 5, perInput: 'W6' },
                        },
                    },
                },
            ],
        }
        const context = getArmedAttackContext(actor, 'ranged')
        expect(getArmedAttackBonus(context)).toBe(4)
        expect(getArmedDamageFormula(context)).toBe('5W6')
        expect(getArmedAttackContext(actor, 'melee').effects).toEqual([])
    })

    it('consumes one snapshotted charge on a miss and deletes only the final charge', async () => {
        const effect = { id: 'armed', system: { ilarisArmedCombat: { remainingCharges: 2 } } }
        const actor = {
            effects: new Map([['armed', effect]]),
            updateEmbeddedDocuments: jest.fn(),
            deleteEmbeddedDocuments: jest.fn(),
        }
        const context = { effects: [{ effectId: 'armed', damage: { units: 3, perInput: 'W6' } }] }
        await expect(resolveArmedAttack(actor, context, { confirmedHit: false })).resolves.toBe('')
        expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', [
            { _id: 'armed', 'system.ilarisArmedCombat.remainingCharges': 1 },
        ])
        effect.system.ilarisArmedCombat.remainingCharges = 1
        await expect(resolveArmedAttack(actor, context, { confirmedHit: true })).resolves.toBe(
            '3W6',
        )
        expect(actor.deleteEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', ['armed'])
    })
})
