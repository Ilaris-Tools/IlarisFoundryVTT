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

const { ManoeverSheet } = require('../manoever.js')
const { PreEffectItemSheet } = require('../pre-effect-item.js')
const { UebernatuerlichTalentSheet } = require('../uebernatuerlich-talent.js')

describe('ManoeverSheet pre-effect authoring', () => {
    it('inherits the shared base directly without supernatural generation behavior', () => {
        expect(Object.getPrototypeOf(ManoeverSheet.prototype)).toBe(PreEffectItemSheet.prototype)
        expect(ManoeverSheet.prototype).not.toBeInstanceOf(UebernatuerlichTalentSheet)
        expect(ManoeverSheet.PARTS).toMatchObject({
            form: { template: 'systems/Ilaris/scripts/items/templates/manoever.hbs' },
            preEffects: PreEffectItemSheet.PARTS.preEffects,
        })
    })

    it('does not expose LLM generation even for a configured GM', async () => {
        global.CONFIG = { ILARIS: { attribute: [], manoever: {} }, statusEffects: {} }
        global.game.user = { isGM: true }
        global.game.packs = new Map()
        global.game.settings.get.mockReturnValue('[]')
        const sheet = new ManoeverSheet()
        sheet.item = {}
        sheet.document = { actor: null }

        await expect(sheet._prepareContext({})).resolves.not.toHaveProperty(
            'hasLLMPreEffectGeneration',
        )
    })

    it('uses the shared pre-effect defaults with a bounded combat activation', () => {
        const sheet = Object.create(ManoeverSheet.prototype)

        expect(sheet._defaultPreEffect()).toMatchObject({
            activation: 'onConfirmedHit',
            operation: '',
            ilarisEnding: { type: '' },
            avoidTest: { enabled: false, resistDifficultySource: 'fixed' },
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
        expect(preEffectsTemplate).toContain('Schwierigkeit aus:')
        expect(preEffectsTemplate).toContain('Ergebnis der auslösenden Probe')
        expect(preEffectsTemplate).toContain('@root.hasLLMPreEffectGeneration')
    })

    it('uses the inherited world-registry options for damage-type changes', () => {
        const maneuverTemplate = readFileSync(
            join(process.cwd(), 'scripts', 'items', 'templates', 'manoever.hbs'),
            'utf8',
        )

        expect(maneuverTemplate).toContain(
            '{{selectOptions ../damageTypeOptions selected=this.value}}',
        )
        expect(maneuverTemplate).not.toContain('../schadenstypen')
    })
})
