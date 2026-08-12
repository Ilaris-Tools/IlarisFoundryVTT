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
