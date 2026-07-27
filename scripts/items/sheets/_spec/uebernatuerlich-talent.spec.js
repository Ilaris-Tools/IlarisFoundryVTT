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
