describe('showChangelogNotification', () => {
    beforeEach(() => {
        jest.resetModules()
        global.Hooks.once.mockClear()
    })

    it('adds the changelog content class through DialogV2 configuration', async () => {
        const render = jest.fn()
        global.foundry.applications.api.DialogV2 = class DialogV2 {
            constructor(options) {
                this.options = options
            }

            render() {
                render(this.options)
                return this
            }
        }

        const { showChangelogNotification } = await import('../changelog-notification.js')
        showChangelogNotification('14.1', '<p>Generated breaking changes</p>')

        expect(render).toHaveBeenCalledWith(
            expect.objectContaining({
                classes: ['ilaris-changelog-notification'],
                window: expect.objectContaining({
                    contentClasses: ['ilaris-changelog-window-content'],
                }),
            }),
        )
    })
})
