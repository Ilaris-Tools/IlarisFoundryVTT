import { openZoneAdministration } from './zone-administration-dialog.js'

/** Add the manager to Foundry's existing Region scene controls for GMs only. */
export function registerZoneAdministrationHooks() {
    if (globalThis.window?._ilarisZoneAdministrationRegistered) return
    window._ilarisZoneAdministrationRegistered = true
    Hooks.on('getSceneControlButtons', (controls) => {
        if (!game.user?.isGM || !controls.regions?.tools) return
        controls.regions.tools.ilarisZoneAdministration = {
            name: 'ilarisZoneAdministration',
            title: 'Ilaris-Zonen verwalten',
            icon: 'fa-solid fa-draw-polygon',
            order: Object.keys(controls.regions.tools).length,
            button: true,
            visible: true,
            onChange: () => openZoneAdministration(),
        }
    })
}
