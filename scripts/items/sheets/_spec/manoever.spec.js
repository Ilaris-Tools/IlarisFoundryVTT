const { readFileSync } = require('node:fs')
const { join } = require('node:path')

global.foundry.applications.sheets = {
    ItemSheetV2: class ItemSheetV2 {
        _onRender() {}
    },
}

const { ManoeverSheet } = require('../manoever.js')

describe('ManoeverSheet pre-effect authoring', () => {
    it('uses the shared pre-effect defaults with a bounded combat activation', () => {
        const sheet = Object.create(ManoeverSheet.prototype)

        expect(sheet._defaultPreEffect()).toMatchObject({
            activation: 'onConfirmedHit',
            operation: '',
            ilarisEnding: { type: '' },
            avoidTest: { enabled: false },
        })
    })

    it('renders selector choices and the two supported maneuver activations', () => {
        const maneuverTemplate = readFileSync(
            join(process.cwd(), 'scripts', 'items', 'templates', 'manoever.hbs'),
            'utf8',
        )
        const preEffectsTemplate = readFileSync(
            join(process.cwd(), 'scripts', 'items', 'templates', 'pre-effects.hbs'),
            'utf8',
        )

        expect(maneuverTemplate).toContain('system.input.choices.')
        expect(preEffectsTemplate).toContain('onConfirmedHit')
        expect(preEffectsTemplate).toContain('onSuccessfulDefense')
        expect(preEffectsTemplate).toContain('deselectEquippedWeapon')
    })
})
