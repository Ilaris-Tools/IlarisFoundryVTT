const {
    getPreEffectCapabilities,
    PRE_EFFECT_CAPABILITIES,
    PRE_EFFECT_FEATURES,
} = require('../pre-effect-capabilities.js')

describe('getPreEffectCapabilities', () => {
    it('grants activation triggers only to maneuvers', () => {
        expect(getPreEffectCapabilities('manoever', 'base').allowActivationTrigger).toBe(true)
        expect(getPreEffectCapabilities('zauber', 'base').allowActivationTrigger).toBe(false)
        expect(getPreEffectCapabilities('liturgie', 'base').allowActivationTrigger).toBe(false)
    })

    it('grants zone automation only to supernatural types', () => {
        expect(getPreEffectCapabilities('zauber', 'base').allowZone).toBe(true)
        expect(getPreEffectCapabilities('manoever', 'base').allowZone).toBe(false)
    })

    it('restricts form context to the reduced feature set', () => {
        const form = getPreEffectCapabilities('zauber', 'form')
        expect(form.allowResistance).toBe(true)
        expect(form.allowSummonCreature).toBe(true)
        expect(form.allowArmedCombat).toBe(false)
        expect(form.allowIlarisModifiers).toBe(false)
        expect(form.allowMarker).toBe(false)
        expect(form.allowRawChanges).toBe(false)
        expect(form.allowZone).toBe(false)
        expect(form.allowSpellModifications).toBe(false)
    })

    it('returns an empty flag set for unknown item types', () => {
        expect(getPreEffectCapabilities('gegenstand', 'base')).toEqual({})
    })

    it('defines the supernatural base consistently across types', () => {
        for (const type of ['zauber', 'liturgie', 'anrufung']) {
            expect(PRE_EFFECT_CAPABILITIES[type]).toEqual(PRE_EFFECT_CAPABILITIES.zauber)
        }
    })

    it('exposes the maneuver trigger only to the maneuver add menu', () => {
        const trigger = PRE_EFFECT_FEATURES.find((feature) => feature.id === 'activationTrigger')

        expect(trigger).toEqual({
            id: 'activationTrigger',
            label: 'Manöver-Auslöser',
            flag: 'allowActivationTrigger',
        })
        expect(PRE_EFFECT_CAPABILITIES.manoever).toHaveProperty(trigger.flag, true)
        expect(PRE_EFFECT_CAPABILITIES.zauber).toHaveProperty(trigger.flag, false)
    })

    it('exposes only documented feature flags for the add menu', () => {
        for (const feature of PRE_EFFECT_FEATURES) {
            expect(PRE_EFFECT_CAPABILITIES.zauber).toHaveProperty(feature.flag)
        }
    })
})
