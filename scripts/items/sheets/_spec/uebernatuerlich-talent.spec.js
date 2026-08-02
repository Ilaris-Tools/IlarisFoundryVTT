global.foundry.applications.sheets = {
    ItemSheetV2: class ItemSheetV2 {
        _onRender() {}
    },
}

const { UebernatuerlichTalentSheet } = require('../uebernatuerlich-talent.js')

describe('UebernatuerlichTalentSheet damage type options', () => {
    beforeEach(() => {
        global.game.settings.get.mockReset()
    })

    it('returns an empty option list without crashing when the registry is empty', () => {
        global.game.settings.get.mockReturnValue('[]')
        const sheet = Object.create(UebernatuerlichTalentSheet.prototype)

        expect(sheet._getDamageTypeOptions()).toEqual([])
    })
})

describe('UebernatuerlichTalentSheet resistance options', () => {
    beforeEach(() => {
        global.game.settings.get.mockImplementation((namespace, key) => {
            if (namespace !== 'Ilaris') return '[]'
            if (key === 'fertigkeitenPacks') return '["Ilaris.skills"]'
            if (key === 'talentePacks') return '["Ilaris.talents"]'
            return '[]'
        })
        global.game.packs = new Map([
            [
                'Ilaris.skills',
                {
                    getIndex: jest.fn(),
                    index: [
                        { name: 'Athletik', type: 'fertigkeit' },
                        { name: 'Magie', type: 'uebernatuerlicheFertigkeit' },
                    ],
                    metadata: { label: 'Fertigkeiten' },
                },
            ],
            [
                'Ilaris.talents',
                {
                    getIndex: jest.fn(),
                    index: [
                        { name: 'Akrobatik', type: 'talent', system: { fertigkeit: 'Athletik' } },
                        { name: 'Zauber', type: 'zauber', system: { fertigkeit: 'Magie' } },
                    ],
                    metadata: { label: 'Talente' },
                },
            ],
        ])
    })

    it('returns only profane skills and talents with their parent skill', async () => {
        const sheet = Object.create(UebernatuerlichTalentSheet.prototype)

        await expect(sheet._buildAvoidTestSkillOptions()).resolves.toEqual([
            {
                packName: 'Fertigkeiten',
                skills: [{ name: 'Athletik', type: 'fertigkeit' }],
            },
        ])
        await expect(sheet._buildAvoidTestTalentOptions()).resolves.toEqual([
            {
                packName: 'Talente',
                talents: [{ name: 'Akrobatik', fertigkeit: 'Athletik' }],
            },
        ])
    })
})

describe('UebernatuerlichTalentSheet Ilaris modifier removal', () => {
    it('removes a modifier when Foundry supplies object-indexed pre-effect form data', () => {
        const sheet = new UebernatuerlichTalentSheet()
        const firstModifier = { target: 'at', value: '1' }
        const secondModifier = { target: 'vt', value: '2' }
        const modifierCard = {}
        const preEffectCard = {
            querySelectorAll: jest.fn(() => [modifierCard]),
        }
        const clickHandlers = []
        const preEffectsList = {
            addEventListener: jest.fn((eventName, handler) => {
                if (eventName === 'click') clickHandlers.push(handler)
            }),
        }
        const deleteButton = {
            closest: jest.fn((selector) => {
                if (selector === '.delete-ilaris-modifier') return deleteButton
                if (selector === '.ilaris-modifier-card') return modifierCard
                if (selector === '.pre-effect-card') return preEffectCard
                return null
            }),
        }

        sheet.element = {
            querySelector: jest.fn((selector) =>
                selector === '.pre-effects-list' ? preEffectsList : null,
            ),
            querySelectorAll: jest.fn((selector) =>
                selector === '.pre-effect-card' ? [preEffectCard] : [],
            ),
        }
        sheet.document = {
            system: {
                preEffects: {
                    0: {
                        ilarisModifiers: {
                            0: firstModifier,
                            1: secondModifier,
                        },
                    },
                },
            },
            update: jest.fn(),
        }

        sheet._onRender({}, {})
        clickHandlers.forEach((handler) => handler({ target: deleteButton }))

        expect(sheet.document.update).toHaveBeenCalledWith({
            'system.preEffects': [{ ilarisModifiers: [secondModifier] }],
        })
    })
})
