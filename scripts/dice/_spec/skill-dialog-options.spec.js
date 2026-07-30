import {
    buildAttributeProbeDialogOptions,
    buildFertigkeitProbeDialogOptions,
} from '../skill-dialog-options.js'

describe('skill dialog option builders', () => {
    beforeEach(() => {
        global.CONFIG = { ILARIS: { label: { GE: 'Gewandtheit' } } }
    })

    it('keeps a semantic main-attribute target local to the tested GE probe', () => {
        const options = buildAttributeProbeDialogOptions(
            'GE',
            { attribute: { GE: { pw: 12, wert: 15 } } },
            'sozialesDuell',
        )

        expect(options).toEqual({
            probeType: 'attribut',
            fertigkeitKey: 'GE',
            fertigkeitName: 'Gewandtheit',
            pw: 12,
            attributeTargets: ['GE'],
            situation: 'sozialesDuell',
        })
    })

    it('passes all tested skill attributes, talents, and a supplied social-duel situation', () => {
        const options = buildFertigkeitProbeDialogOptions(
            'ueberreden',
            {
                name: 'Überreden',
                system: {
                    pw: 14,
                    attribut_0: 'CH',
                    attribut_1: 'IN',
                    attribut_2: 'KL',
                    talente: [{ name: 'Diplomatie' }],
                },
            },
            'sozialesDuell',
        )

        expect(options).toEqual(
            expect.objectContaining({
                fertigkeitKey: 'ueberreden',
                talentList: { 0: 'Diplomatie' },
                attributeTargets: ['CH', 'IN', 'KL'],
                situation: 'sozialesDuell',
            }),
        )
    })
})
