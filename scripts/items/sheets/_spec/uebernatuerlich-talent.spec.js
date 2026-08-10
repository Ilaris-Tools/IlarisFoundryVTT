const { readFileSync } = require('node:fs')
const { join } = require('node:path')

global.foundry.applications.sheets = {
    ItemSheetV2: class ItemSheetV2 {
        _onRender() {}

        async _prepareContext() {
            return {}
        }
    },
}

const { UebernatuerlichTalentSheet } = require('../uebernatuerlich-talent.js')
const { PreEffectItemSheet } = require('../pre-effect-item.js')

describe('UebernatuerlichTalentSheet shared Pre-Effect composition', () => {
    it('keeps the supernatural form while inheriting the shared Pre-Effects part', () => {
        expect(UebernatuerlichTalentSheet.prototype).toBeInstanceOf(PreEffectItemSheet)
        expect(UebernatuerlichTalentSheet.PARTS).toMatchObject({
            form: {
                template: 'systems/Ilaris/scripts/items/templates/uebernatuerlich_talent.hbs',
            },
            preEffects: PreEffectItemSheet.PARTS.preEffects,
        })
    })

    it('exposes LLM generation only for a configured GM', async () => {
        global.CONFIG = { ILARIS: { attribute: [] }, statusEffects: {} }
        global.game.user = { isGM: true }
        global.game.packs = new Map()
        global.game.settings.get.mockImplementation((_namespace, key) => {
            if (key === 'llmApiUrl') return 'https://llm.example.test'
            if (key === 'llmApiKey') return 'configured-key'
            return '[]'
        })
        const sheet = new UebernatuerlichTalentSheet()
        sheet.item = {}
        sheet.document = { actor: null }

        await expect(sheet._prepareContext({})).resolves.toMatchObject({
            hasLLMPreEffectGeneration: true,
        })
    })
})

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
            if (namespace !== 'Ilaris') return '[]'
            if (key === 'waffenPacks') return '["Ilaris.waffen"]'
            if (key === 'gegenstandPacks') return '["Ilaris.gegenstande"]'
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

    it('lists configured weapon and Gegenstände-pack Items as stable summon source UUIDs', async () => {
        const sheet = Object.create(UebernatuerlichTalentSheet.prototype)

        await expect(sheet._buildSummonItemOptions('waffe')).resolves.toEqual([
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
        ])
        await expect(sheet._buildSummonItemOptions('gegenstand')).resolves.toEqual([
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

        expect(template).toContain('summonItem.sourceKind')
        expect(template).toContain('ilaris-summon-item-sources-waffe')
        expect(template).toContain('ilaris-summon-item-sources-gegenstand')
        expect(template).toContain('@root.hasLLMPreEffectGeneration')
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
