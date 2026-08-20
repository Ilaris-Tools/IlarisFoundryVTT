import {
    applyPendingInfiniteDotTicks,
    expireEffect,
    reduceEffectDurationForCombatant,
} from '../combat-turn-hooks.js'
import { IlarisActiveEffect } from '../active-effect.js'
import { reduceConditionSourcesForCombatant } from '../status-conditions.js'

describe('summoned item expiry', () => {
    it('deletes the linked summoned item before deleting its owner-turn marker', async () => {
        const actor = {
            items: new Map([['summoned-item', { id: 'summoned-item' }]]),
            deleteEmbeddedDocuments: jest.fn().mockResolvedValue([]),
        }
        const marker = {
            flags: { ilaris: { summonedItemId: 'summoned-item' } },
            delete: jest.fn().mockResolvedValue(undefined),
        }

        await expireEffect(actor, marker)

        expect(actor.deleteEmbeddedDocuments).toHaveBeenCalledWith('Item', ['summoned-item'])
        expect(marker.delete).toHaveBeenCalledTimes(1)
        expect(actor.deleteEmbeddedDocuments.mock.invocationCallOrder[0]).toBeLessThan(
            marker.delete.mock.invocationCallOrder[0],
        )
    })

    it('still deletes the marker when its linked item was removed beforehand', async () => {
        const actor = {
            items: new Map(),
            deleteEmbeddedDocuments: jest.fn(),
        }
        const marker = {
            flags: { ilaris: { summonedItemId: 'already-removed' } },
            delete: jest.fn().mockResolvedValue(undefined),
        }

        await expireEffect(actor, marker)

        expect(actor.deleteEmbeddedDocuments).not.toHaveBeenCalled()
        expect(marker.delete).toHaveBeenCalledTimes(1)
    })
})

describe('condition source expiry', () => {
    it('expires an automated source without removing its independent manual source', async () => {
        const effect = {
            id: 'condition',
            system: {
                ilarisCondition: {
                    statusId: 'Position4',
                    sources: [
                        { id: 'manual', type: 'manual' },
                        {
                            id: 'maneuver',
                            type: 'preEffect',
                            timing: {
                                durationType: 'ownerTurns',
                                expiresOn: 'turnEnd',
                                remaining: 1,
                            },
                        },
                    ],
                },
            },
            update: jest.fn().mockResolvedValue(undefined),
        }
        const actor = {
            effects: [effect],
            deleteEmbeddedDocuments: jest.fn().mockResolvedValue([]),
        }

        await reduceConditionSourcesForCombatant({ actor }, 'turnEnd')

        expect(effect.update).toHaveBeenCalledWith({
            'system.ilarisCondition.sources': [{ id: 'manual', type: 'manual' }],
        })
        expect(actor.deleteEmbeddedDocuments).not.toHaveBeenCalled()
    })
})

describe('infinite passive Zone DOT timing', () => {
    afterEach(() => jest.restoreAllMocks())

    it('ticks an infinite Zone DOT once without mutating timing and retains finite timing behavior', async () => {
        const infiniteDot = {
            id: 'zone-dot',
            disabled: false,
            isSuppressed: false,
            hasDotChanges: true,
            dotChanges: [{ key: 'system.gesundheit.wunden', type: 'dot', value: '2W6' }],
            system: { ilarisTiming: { durationType: 'infinite', remaining: 0 } },
            update: jest.fn(),
        }
        const finiteEffect = {
            id: 'finite',
            disabled: false,
            isSuppressed: false,
            hasDotChanges: false,
            system: {
                ilarisTiming: { durationType: 'ownerTurns', expiresOn: 'turnEnd', remaining: 2 },
            },
            update: jest.fn(),
        }
        const actor = {
            id: 'target',
            uuid: 'Actor.target',
            appliedEffects: [infiniteDot, finiteEffect],
        }
        const combatant = { actor }
        const applyDotDamage = jest
            .spyOn(IlarisActiveEffect, 'applyDotDamage')
            .mockResolvedValue(undefined)

        await reduceEffectDurationForCombatant(combatant)
        await applyPendingInfiniteDotTicks({ combatants: [combatant] })
        await applyPendingInfiniteDotTicks({ combatants: [combatant] })

        expect(applyDotDamage).toHaveBeenCalledTimes(1)
        expect(infiniteDot.update).not.toHaveBeenCalled()
        expect(infiniteDot.system.ilarisTiming.remaining).toBe(0)
        expect(finiteEffect.update).toHaveBeenCalledWith({
            'system.ilarisTiming._pendingDurationChange': true,
            'system.ilarisTiming._pendingExpiry': false,
        })
    })
})
