describe('release setting registration', () => {
    it('defines and registers the major release announcement setting', async () => {
        foundry.data = { fields: { BooleanField: class BooleanField {} } }
        game.settings.registerMenu = jest.fn()
        game.settings.register.mockClear()

        const { IlarisGameSettingNames } = await import('../configure-game-settings.model.js')
        const { registerIlarisGameSettings } = await import('../configure-game-settings.js')

        expect(IlarisGameSettingNames.lastAnnouncedMajorRelease).toBe('lastAnnouncedMajorRelease')
        registerIlarisGameSettings()

        const registration = game.settings.register.mock.calls.find(
            ([, name]) => name === IlarisGameSettingNames.lastAnnouncedMajorRelease,
        )
        expect(registration?.[2]).toMatchObject({
            config: false,
            scope: 'world',
            type: String,
            default: '',
        })
    })
})
