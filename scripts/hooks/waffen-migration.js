import { registerMigrationCommands } from '../common/waffen-migration.js'

/**
 * Register weapon migration commands on ready hook
 */
Hooks.once('ready', async function () {
    console.log('Ilaris: Registering weapon migration commands')
    registerMigrationCommands()
})
