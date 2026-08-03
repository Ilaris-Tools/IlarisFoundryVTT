global.foundry.applications.sheets = {
    ItemSheetV2: class ItemSheetV2 {},
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
