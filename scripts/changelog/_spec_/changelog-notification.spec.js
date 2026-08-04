describe('changelog release announcements', () => {
    let announceMajorRelease
    let buildMajorReleaseAnnouncement

    beforeAll(async () => {
        foundry.applications.ux = {
            TextEditor: {
                implementation: {
                    enrichHTML: jest.fn(async (content) => content),
                },
            },
        }
        game.system = { id: 'Ilaris', version: '14.0.0' }
        game.user = { isGM: true }
        game.world = { id: 'test-world' }
        ChatMessage.create = jest.fn().mockResolvedValue({ id: 'message-1' })
        global.fetch = jest.fn().mockResolvedValue({ ok: false })
        ;({ announceMajorRelease, buildMajorReleaseAnnouncement } =
            await import('../changelog-notification.js'))
    })

    beforeEach(() => {
        game.settings.get.mockReset()
        game.settings.set.mockReset().mockResolvedValue(undefined)
        ChatMessage.create.mockReset().mockResolvedValue({ id: 'message-1' })
        foundry.applications.ux.TextEditor.implementation.enrichHTML.mockClear()
    })

    it('builds an announcement with the existing tutorials and changelog link', () => {
        const content = buildMajorReleaseAnnouncement('14', { importRequired: true })

        expect(content).toContain('kurzimport001')
        expect(content).toContain('hausregel001')
        expect(content).toContain('CHANGELOG.md')
        expect(content).toContain('neu importiert werden')
    })

    it('posts once for an unannounced major release and persists after creation', async () => {
        game.settings.get.mockReturnValue('')

        await expect(announceMajorRelease()).resolves.toBe(true)

        expect(ChatMessage.create).toHaveBeenCalledTimes(1)
        expect(game.settings.set).toHaveBeenCalledWith('Ilaris', 'lastAnnouncedMajorRelease', '14')
    })

    it('does not duplicate an already announced major release', async () => {
        game.settings.get.mockReturnValue('14')

        await expect(announceMajorRelease()).resolves.toBe(false)

        expect(ChatMessage.create).not.toHaveBeenCalled()
        expect(game.settings.set).not.toHaveBeenCalled()
    })

    it('does not mark the release when chat creation fails', async () => {
        game.settings.get.mockReturnValue('')
        ChatMessage.create.mockRejectedValue(new Error('chat unavailable'))

        await expect(announceMajorRelease()).resolves.toBe(false)

        expect(game.settings.set).not.toHaveBeenCalled()
    })

    it('only allows a GM in a world to publish', async () => {
        game.settings.get.mockReturnValue('')
        game.user.isGM = false

        await expect(announceMajorRelease()).resolves.toBe(false)

        expect(ChatMessage.create).not.toHaveBeenCalled()
    })
})
