const { readFileSync } = require('node:fs')
const { join } = require('node:path')

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

describe('UebernatuerlichTalentSheet summon-item options', () => {
    beforeEach(() => {
        global.game.settings.get.mockImplementation((namespace, key) => {
            if (namespace === 'Ilaris' && key === 'waffenPacks')
                return '["Ilaris.waffen","Ilaris.gegenstande"]'
            return '[]'
        })
        global.game.packs = new Map([
            [
                'Ilaris.waffen',
                {
                    collection: 'Ilaris.waffen',
                    getIndex: jest.fn(),
                    index: [
                        { _id: 'armalion', name: 'Armalion', type: 'nahkampfwaffe' },
                        { _id: 'wurfstern', name: 'Phexens Wurfstern', type: 'fernkampfwaffe' },
                    ],
                    metadata: { label: 'Waffen' },
                },
            ],
            [
                'Ilaris.gegenstande',
                {
                    collection: 'Ilaris.gegenstande',
                    getIndex: jest.fn(),
                    index: [{ _id: 'ring', name: 'Firuns Ring', type: 'gegenstand' }],
                    metadata: { label: 'Gegenstände' },
                },
            ],
        ])
    })

    it('lists configured weapon-pack Items as stable summon source UUIDs', async () => {
        const sheet = Object.create(UebernatuerlichTalentSheet.prototype)

        await expect(sheet._buildSummonItemOptions()).resolves.toEqual([
            {
                packName: 'Waffen',
                items: [
                    {
                        name: 'Armalion',
                        type: 'nahkampfwaffe',
                        uuid: 'Compendium.Ilaris.waffen.Item.armalion',
                    },
                    {
                        name: 'Phexens Wurfstern',
                        type: 'fernkampfwaffe',
                        uuid: 'Compendium.Ilaris.waffen.Item.wurfstern',
                    },
                ],
            },
            {
                packName: 'Gegenstände',
                items: [
                    {
                        name: 'Firuns Ring',
                        type: 'gegenstand',
                        uuid: 'Compendium.Ilaris.gegenstande.Item.ring',
                    },
                ],
            },
        ])
    })

    it('renders summon sources as an autocomplete input with a shared datalist', () => {
        const template = readFileSync(
            join(process.cwd(), 'scripts', 'items', 'templates', 'pre-effects.hbs'),
            'utf8',
        )

        expect(template).toContain('list="ilaris-summon-item-sources"')
        expect(template).toContain('<datalist id="ilaris-summon-item-sources">')
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
