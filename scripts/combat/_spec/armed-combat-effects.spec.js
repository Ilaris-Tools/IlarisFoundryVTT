import {
    getArmedAttackContext,
    resolveArmedAttack,
} from '../../effects/pre-effects/armed-combat-effects.js'

describe('armed combat attack resolution', () => {
    function createActor(remainingCharges = 1) {
        const effect = {
            id: 'armed-effect',
            system: {
                ilarisArmedCombat: {
                    scope: 'melee',
                    remainingCharges,
                    attackBonus: 2,
                    damage: { units: 4, perInput: 'W6' },
                },
            },
        }
        return {
            effect,
            actor: {
                effects: new Map([[effect.id, effect]]),
                appliedEffects: [effect],
                updateEmbeddedDocuments: jest.fn().mockResolvedValue(undefined),
                deleteEmbeddedDocuments: jest.fn().mockResolvedValue(undefined),
            },
        }
    }

    it('only consumes matching snapshotted effects, including misses and successful defenses', async () => {
        const { actor } = createActor(2)
        const context = getArmedAttackContext(actor, 'melee')
        await expect(resolveArmedAttack(actor, context, { confirmedHit: false })).resolves.toBe('')
        expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', [
            { _id: 'armed-effect', 'system.ilarisArmedCombat.remainingCharges': 1 },
        ])

        await expect(
            resolveArmedAttack(actor, { effects: [] }, { confirmedHit: false }),
        ).resolves.toBe('')
        expect(actor.updateEmbeddedDocuments).toHaveBeenCalledTimes(1)
    })

    it('retains hit-only damage after consuming and removes the final charge once', async () => {
        const { actor } = createActor(1)
        const context = getArmedAttackContext(actor, 'melee')
        await expect(resolveArmedAttack(actor, context, { confirmedHit: true })).resolves.toBe(
            '4W6',
        )
        expect(actor.deleteEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', ['armed-effect'])
        expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled()
    })
})
