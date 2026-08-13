import {
    addConditionSource,
    removeConditionSource,
    toggleManualCondition,
} from '../status-conditions.js'

function createActor(overrides = {}) {
    return {
        id: 'target',
        effects: [],
        deleteEmbeddedDocuments: jest.fn().mockResolvedValue([]),
        ...overrides,
    }
}

beforeEach(() => {
    global.foundry = {
        utils: {
            deepClone: (value) => JSON.parse(JSON.stringify(value)),
            randomID: () => 'generated-source',
        },
    }
    global.CONFIG = {
        statusEffects: {
            Position4: {
                id: 'Position4',
                name: 'Sehr schlechte Position (Liegend)',
                img: 'falling.svg',
                changes: [
                    { key: 'system.modifikatoren.nahkampfmod', mode: 2, value: -4 },
                    { key: 'system.modifikatoren.verteidigungmod', mode: 2, value: -4 },
                ],
            },
        },
    }
    global.ActiveEffect = { createDocuments: jest.fn().mockResolvedValue([]) }
    global.ui = { notifications: { warn: jest.fn() } }
})

describe('status condition service', () => {
    it('creates one Position4 effect from the status template for the first source', async () => {
        const actor = createActor()

        await addConditionSource(actor, 'Position4', { id: 'maneuver', type: 'preEffect' })

        expect(ActiveEffect.createDocuments).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    name: 'Sehr schlechte Position (Liegend)',
                    img: 'falling.svg',
                    statuses: ['Position4'],
                    changes: CONFIG.statusEffects.Position4.changes,
                    system: expect.objectContaining({
                        ilarisCondition: {
                            statusId: 'Position4',
                            sources: [{ id: 'maneuver', type: 'preEffect' }],
                        },
                    }),
                }),
            ],
            { parent: actor },
        )
    })

    it('merges a new source into a legacy Position4 status instead of duplicating changes', async () => {
        const legacy = {
            id: 'legacy',
            statuses: new Set(['Position4']),
            system: {},
            update: jest.fn().mockResolvedValue(undefined),
        }
        const actor = createActor({ effects: [legacy] })

        await addConditionSource(actor, 'Position4', { id: 'maneuver', type: 'preEffect' })

        expect(ActiveEffect.createDocuments).not.toHaveBeenCalled()
        expect(legacy.update).toHaveBeenCalledWith({
            'system.ilarisCondition': {
                statusId: 'Position4',
                sources: [
                    { id: 'legacy-Position4', type: 'manual' },
                    { id: 'maneuver', type: 'preEffect' },
                ],
            },
        })
    })

    it('retains spell and resistance provenance on a condition source', async () => {
        const actor = createActor()
        const source = {
            id: 'cast-1:0',
            type: 'preEffect',
            origin: 'Actor.caster',
            sourceItemUuid: 'Item.spell',
            spellUuid: 'Item.spell',
            spellName: 'Fluch des Gewürms',
            casterUuid: 'Actor.caster',
            preEffectIndex: 0,
            applicationId: 'cast-1',
            castSkill: 'Hexerei',
            resistanceOutcome: 'failure',
        }

        await addConditionSource(actor, 'Position4', source)

        expect(ActiveEffect.createDocuments).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    system: expect.objectContaining({
                        ilarisCondition: expect.objectContaining({ sources: [source] }),
                    }),
                }),
            ],
            { parent: actor },
        )
    })

    it('retains the effect until its final source is removed', async () => {
        const effect = {
            id: 'condition',
            system: {
                ilarisCondition: {
                    statusId: 'Position4',
                    sources: [
                        { id: 'manual', type: 'manual' },
                        { id: 'maneuver', type: 'preEffect' },
                    ],
                },
            },
            update: jest.fn().mockResolvedValue(undefined),
        }
        const actor = createActor({ effects: [effect] })

        await removeConditionSource(actor, effect, 'maneuver')

        expect(effect.update).toHaveBeenCalledWith({
            'system.ilarisCondition.sources': [{ id: 'manual', type: 'manual' }],
        })
        expect(actor.deleteEmbeddedDocuments).not.toHaveBeenCalled()

        effect.system.ilarisCondition.sources = [{ id: 'manual', type: 'manual' }]
        await removeConditionSource(actor, effect, 'manual')
        expect(actor.deleteEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', ['condition'])
    })

    it('does not let a manual toggle remove an automated-only condition', async () => {
        const effect = {
            id: 'condition',
            system: {
                ilarisCondition: {
                    statusId: 'Position4',
                    sources: [{ id: 'maneuver', type: 'preEffect' }],
                },
            },
        }
        const actor = createActor({ effects: [effect] })

        const result = await toggleManualCondition(actor, 'Position4', { active: false })

        expect(result).toBeUndefined()
        expect(actor.deleteEmbeddedDocuments).not.toHaveBeenCalled()
        expect(ui.notifications.warn).toHaveBeenCalledWith(
            'Liegend bleibt durch einen automatischen Effekt aktiv.',
        )
    })

    it('preserves the normal removal behavior for a legacy manually toggled status', async () => {
        const legacy = {
            id: 'legacy',
            statuses: new Set(['Position4']),
            system: {},
        }
        const actor = createActor({ effects: [legacy] })

        const result = await toggleManualCondition(actor, 'Position4', { active: false })

        expect(result).toBe(false)
        expect(actor.deleteEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', ['legacy'])
    })
})
