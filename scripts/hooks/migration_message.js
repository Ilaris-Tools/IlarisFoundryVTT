Hooks.once('setup', async function () {
    console.log('starting Ilaris system')
    showMigartionDialog()
})

class MigrationMessageDialog extends foundry.applications.api.DialogV2 {
    async close(options = {}) {
        if (!['de', 'en'].includes(game.i18n.lang)) return

        return super.close(options)
    }
}

const showMigartionDialog = () => {
    new MigrationMessageDialog({
        window: {
            title: 'language',
        },
        content: `<p>Your foundry language is not supported by this system. Due to technical reasons your foundry language setting has to be switched to either english or german.</p>`,
        buttons: [
            {
                action: 'de',
                icon: 'fa fa-check',
                label: 'en',
                callback: async () => {
                    await game.settings.set('core', 'language', 'de')
                    foundry.utils.debouncedReload()
                },
            },
            {
                action: 'en',
                icon: 'fas fa-check',
                label: 'de',
                callback: async () => {
                    await game.settings.set('core', 'language', 'en')
                    foundry.utils.debouncedReload()
                },
            },
            {
                action: 'logout',
                icon: 'fas fa-door-closed',
                label: 'SETTINGS.Logout',
                callback: async () => {
                    ui.menu.items.logout.onClick()
                },
            },
        ],
    }).render(true)
}
