const { readFileSync } = require('node:fs')
const { join } = require('node:path')

global.foundry.applications.sheets = {
    ItemSheetV2: class ItemSheetV2 {
        _onRender() {}
    },
}

const {
    normalizePreEffectFormData,
    normalizeSpellModificationFormData,
    PreEffectItemSheet,
} = require('../pre-effect-item.js')

describe('PreEffectItemSheet', () => {
    it('normalizes indexed Pre-Effect form data before document updates', () => {
        const updateData = {
            system: {
                preEffects: {
                    0: {
                        summonItem: { sourceKind: 'gegenstand', overrides: {} },
                        ilarisModifiers: {
                            0: {
                                phase: 'roll',
                                target: 'at',
                                selector: { fertigkeit: 'Klingenwaffen' },
                            },
                        },
                        resistanceOutcomes: {
                            failure: { changes: {}, ilarisModifiers: {} },
                        },
                    },
                },
            },
        }

        expect(normalizePreEffectFormData(updateData)).toMatchObject({
            system: {
                preEffects: [
                    {
                        summonItem: { sourceKind: 'gegenstand', overrides: [] },
                        ilarisModifiers: [
                            {
                                phase: 'roll',
                                target: 'at',
                                selector: { fertigkeit: 'Klingenwaffen' },
                            },
                        ],
                        resistanceOutcomes: {
                            failure: { changes: [], ilarisModifiers: [] },
                        },
                    },
                ],
            },
        })
    })

    it('normalizes object-indexed spellModifications and nested arrays before updates', () => {
        const updateData = {
            system: {
                spellModificationGroups: {
                    0: { id: 'attribute', label: 'Attribut', required: true },
                },
                spellModifications: {
                    0: {
                        id: 'ff',
                        name: 'FF',
                        description: 'Beschreibung',
                        preEffects: {
                            0: {
                                baseDuration: 1,
                                changes: { 0: { key: 'system.test', value: '1' } },
                                ilarisModifiers: { 0: { target: 'at', value: '+1' } },
                                summonItem: {
                                    enabled: true,
                                    overrides: { 0: { path: 'system.tp' } },
                                },
                                summonCreature: {
                                    overrides: { 0: { path: 'items.0.system.at' } },
                                    dominationChecks: {
                                        entries: { 0: { kreaturentyp: 'daemon' } },
                                    },
                                },
                                resistanceOutcomes: {
                                    failure: {
                                        changes: { 0: { key: 'system.fail' } },
                                        ilarisModifiers: {},
                                    },
                                },
                            },
                        },
                    },
                },
                text: 'Regeltext',
            },
        }

        expect(normalizeSpellModificationFormData(updateData)).toMatchObject({
            system: {
                spellModificationGroups: [{ id: 'attribute', label: 'Attribut', required: true }],
                spellModifications: [
                    {
                        id: 'ff',
                        name: 'FF',
                        description: 'Beschreibung',
                        preEffects: [
                            {
                                baseDuration: 1,
                                changes: [{ key: 'system.test', value: '1' }],
                                ilarisModifiers: [{ target: 'at', value: '+1' }],
                                summonItem: {
                                    enabled: true,
                                    overrides: [{ path: 'system.tp' }],
                                },
                                summonCreature: {
                                    overrides: [{ path: 'items.0.system.at' }],
                                    dominationChecks: { entries: [{ kreaturentyp: 'daemon' }] },
                                },
                                resistanceOutcomes: {
                                    failure: {
                                        changes: [{ key: 'system.fail' }],
                                        ilarisModifiers: [],
                                    },
                                },
                            },
                        ],
                    },
                ],
                text: 'Regeltext',
            },
        })
    })

    it('renders outcome-payload controls with the correct pre-effect index', () => {
        const template = readFileSync(
            join(process.cwd(), 'scripts', 'items', 'templates', 'pre-effects.hbs'),
            'utf8',
        )

        expect(template).toContain('{{#each preEffects as |preEffect preEffectIndex|}}')
        expect(template).toContain(
            'name="system.preEffects.{{preEffectIndex}}.resistanceOutcomes.failure.enabled"',
        )
        expect(template).toContain(
            'name="system.preEffects.{{preEffectIndex}}.resistanceOutcomes.success.enabled"',
        )
        expect(template).toContain(
            'name="system.preEffects.{{preEffectIndex}}.resistanceOutcomes.failure.changes.{{@index}}.key"',
        )
        expect(template).toContain(
            'name="system.preEffects.{{preEffectIndex}}.resistanceOutcomes.success.ilarisModifiers.{{@index}}.target"',
        )
        expect(template).not.toContain('system.preEffects..resistanceOutcomes')
        expect(template).not.toContain('{{@../../index}}.resistanceOutcomes')
    })

    it('owns the shared pre-effects part and standard defaults', () => {
        const sheet = Object.create(PreEffectItemSheet.prototype)

        expect(PreEffectItemSheet.PARTS).toMatchObject({
            preEffects: {
                template: 'systems/Ilaris/scripts/items/templates/pre-effects.hbs',
            },
        })
        expect(sheet._defaultPreEffect()).toMatchObject({
            baseDuration: 0,
            changes: [],
            ilarisModifiers: [],
            marker: { enabled: false },
            summonCreature: expect.objectContaining({
                enabled: false,
                kreaturentypen: [],
                sourceUuid: '',
                lifetime: 'permanent',
                overrides: [],
                boundResourceCost: expect.objectContaining({ enabled: false }),
                dominationChecks: { enabled: false, entries: [] },
            }),
            avoidTest: { enabled: false, resistDifficultySource: 'fixed' },
            resistanceOutcomes: {
                failure: {
                    enabled: false,
                    marker: { enabled: false, id: '', label: '' },
                    tableManagedDisplacement: { enabled: false },
                },
                success: {
                    enabled: false,
                    marker: { enabled: false, id: '', label: '' },
                    tableManagedDisplacement: { enabled: false },
                },
            },
        })
    })

    it('creates an isolated nested outcome payload when editing a legacy pre-effect', () => {
        const sheet = Object.create(PreEffectItemSheet.prototype)
        const preEffect = { changes: [{ key: 'system.test' }] }

        const success = sheet._getEditablePayload(preEffect, 'success')
        success.changes.push({ key: 'system.success' })

        expect(preEffect.changes).toEqual([{ key: 'system.test' }])
        expect(preEffect.resistanceOutcomes.success).toMatchObject({
            enabled: false,
            changes: [{ key: 'system.success' }],
        })
    })

    it('supplies editor-only outcome defaults for legacy entries without mutating them', () => {
        const sheet = Object.create(PreEffectItemSheet.prototype)
        const legacy = [{ changes: [] }]

        const [prepared] = sheet._getEditorPreEffects(legacy)

        expect(prepared.resistanceOutcomes).toMatchObject({
            failure: { enabled: false, changes: [], ilarisModifiers: [] },
            success: { enabled: false, changes: [], ilarisModifiers: [] },
        })
        expect(legacy[0]).not.toHaveProperty('resistanceOutcomes')
    })

    it('adds a change at the selected nested outcome path', () => {
        const sheet = Object.create(PreEffectItemSheet.prototype)
        const preEffectCard = {}
        const outcomeContainer = { dataset: { outcome: 'success' } }
        const addButton = {
            closest: jest.fn((selector) => {
                if (selector === 'button') return addButton
                if (selector === '.add-change') return addButton
                if (selector === '.pre-effect-card') return preEffectCard
                if (selector === '.outcome-payload') return outcomeContainer
                return null
            }),
        }
        sheet.element = { querySelectorAll: jest.fn(() => [preEffectCard]) }
        sheet.document = {
            system: { preEffects: [{ changes: [], resistanceOutcomes: { success: {} } }] },
            update: jest.fn(),
        }

        sheet._handlePreEffectEditorClick({ target: addButton })

        expect(sheet.document.update).toHaveBeenCalledWith({
            'system.preEffects': [
                expect.objectContaining({
                    resistanceOutcomes: expect.objectContaining({
                        success: expect.objectContaining({
                            changes: [expect.objectContaining({ key: '', value: '' })],
                        }),
                    }),
                }),
            ],
        })
    })

    it('lists only configured creature Actors as stable summon source UUIDs', async () => {
        global.game.settings.get.mockImplementation((_namespace, key) =>
            key === 'kreaturenPacks' ? '["Ilaris.kreaturen"]' : '[]',
        )
        global.game.packs = new Map([
            [
                'Ilaris.kreaturen',
                {
                    collection: 'Ilaris.kreaturen',
                    metadata: { type: 'Actor', label: 'Kreaturen' },
                    getIndex: jest.fn(),
                    index: [
                        { _id: 'raben', name: 'Krähenschwarm', type: 'kreatur' },
                        { _id: 'held', name: 'Heldin', type: 'character' },
                    ],
                },
            ],
            [
                'Ilaris.items',
                {
                    collection: 'Ilaris.items',
                    metadata: { type: 'Item', label: 'Gegenstände' },
                    getIndex: jest.fn(),
                    index: [{ _id: 'not-an-actor', name: 'Nicht verfügbar', type: 'kreatur' }],
                },
            ],
        ])
        const sheet = Object.create(PreEffectItemSheet.prototype)

        await expect(sheet._buildSummonCreatureOptions()).resolves.toEqual([
            {
                actors: [
                    {
                        name: 'Krähenschwarm',
                        uuid: 'Compendium.Ilaris.kreaturen.Actor.raben',
                    },
                ],
                packName: 'Kreaturen',
            },
        ])
    })

    it('defines independent structured creature-override defaults', () => {
        const sheet = Object.create(PreEffectItemSheet.prototype)

        expect(sheet._defaultSummonCreatureOverride()).toEqual({
            path: '',
            value: '',
            amplifiedByMaechtigeMagie: false,
            maechtigBonus: '',
        })
    })

    it('persists a creature override without touching summon-item authoring', () => {
        const sheet = new PreEffectItemSheet()
        const preEffectCard = {}
        const addOverride = {
            closest: jest.fn((selector) => {
                if (selector === 'button' || selector === '.add-summon-creature-override')
                    return addOverride
                if (selector === '.pre-effect-card') return preEffectCard
                return null
            }),
        }
        sheet.element = {
            querySelectorAll: jest.fn((selector) =>
                selector === '.pre-effect-card' ? [preEffectCard] : [],
            ),
        }
        sheet.document = {
            system: {
                preEffects: [
                    {
                        summonItem: { enabled: true, overrides: [{ path: 'system.tp' }] },
                        summonCreature: { enabled: true, overrides: [] },
                    },
                ],
            },
            update: jest.fn(),
        }

        sheet._handlePreEffectEditorClick({ target: addOverride })

        expect(sheet.document.update).toHaveBeenCalledWith({
            'system.preEffects': [
                expect.objectContaining({
                    summonItem: { enabled: true, overrides: [{ path: 'system.tp' }] },
                    summonCreature: expect.objectContaining({
                        overrides: [expect.objectContaining({ path: '', value: '' })],
                    }),
                }),
            ],
        })
    })

    it('persists a creature override without touching summon-item authoring', () => {
        const sheet = new PreEffectItemSheet()
        const preEffectCard = {}
        const addOverride = {
            closest: jest.fn((selector) => {
                if (selector === 'button' || selector === '.add-summon-creature-override')
                    return addOverride
                if (selector === '.pre-effect-card') return preEffectCard
                return null
            }),
        }
        sheet.element = {
            querySelectorAll: jest.fn((selector) =>
                selector === '.pre-effect-card' ? [preEffectCard] : [],
            ),
        }
        sheet.document = {
            system: {
                preEffects: [
                    {
                        summonItem: { enabled: true, overrides: [{ path: 'system.tp' }] },
                        summonCreature: { enabled: true, overrides: [] },
                    },
                ],
            },
            update: jest.fn(),
        }

        sheet._handlePreEffectEditorClick({ target: addOverride })

        expect(sheet.document.update).toHaveBeenCalledWith({
            'system.preEffects': [
                expect.objectContaining({
                    summonItem: { enabled: true, overrides: [{ path: 'system.tp' }] },
                    summonCreature: expect.objectContaining({
                        overrides: [expect.objectContaining({ path: '', value: '' })],
                    }),
                }),
            ],
        })
    })

    it('creates an empty, type-specific domination-check entry', () => {
        const sheet = Object.create(PreEffectItemSheet.prototype)

        expect(sheet._defaultDominationCheck()).toEqual({
            kreaturentyp: '',
            difficulty: 12,
            probeType: 'attribut',
            attribut: '',
            fertigkeit: '',
            talent: '',
        })
    })

    it('normalizes indexed pre-effects before adding and removing entries', () => {
        const sheet = new PreEffectItemSheet()
        const preEffectCard = {}
        const handlers = []
        const list = {
            addEventListener: jest.fn((_eventName, handler) => handlers.push(handler)),
        }
        const addButton = {
            addEventListener: jest.fn(),
            closest: jest.fn((selector) => (selector === '.add-pre-effect' ? addButton : null)),
        }
        const deleteButton = {
            closest: jest.fn((selector) => {
                if (selector === '.delete-pre-effect') return deleteButton
                if (selector === '.pre-effect-card') return preEffectCard
                return null
            }),
        }
        sheet.element = {
            querySelector: jest.fn((selector) => {
                if (selector === '.add-pre-effect') return addButton
                if (selector === '.pre-effects-list') return list
                return null
            }),
            querySelectorAll: jest.fn((selector) =>
                selector === '.pre-effect-card' ? [preEffectCard] : [],
            ),
        }
        sheet.document = {
            system: { preEffects: { 0: { changes: [] } } },
            update: jest.fn(),
        }

        sheet._onRender({}, {})
        addButton.addEventListener.mock.calls[0][1]()
        handlers.forEach((handler) => handler({ target: deleteButton }))

        expect(sheet.document.update).toHaveBeenNthCalledWith(1, {
            'system.preEffects': [expect.objectContaining({ changes: [] }), expect.any(Object)],
        })
        expect(sheet.document.update).toHaveBeenNthCalledWith(2, { 'system.preEffects': [] })
    })
})
