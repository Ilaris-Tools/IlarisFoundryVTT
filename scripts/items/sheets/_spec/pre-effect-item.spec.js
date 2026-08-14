global.foundry.applications.sheets = {
    ItemSheetV2: class ItemSheetV2 {
        _onRender() {}
    },
}

const { PreEffectItemSheet } = require('../pre-effect-item.js')

describe('PreEffectItemSheet', () => {
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
