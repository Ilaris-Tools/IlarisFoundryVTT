const {
    summarizeZone,
    summarizeDamage,
    summarizeResistance,
    summarizeArmedCombat,
    summarizeCondition,
    summarizeMarker,
    summarizePreEffect,
} = require('../summaries.js')

describe('summaries (accordion headers)', () => {
    it('summarizes a cone zone with anchor', () => {
        expect(
            summarizeZone({
                shape: 'cone',
                distance: 8,
                angle: 60,
                placement: { anchor: 'caster' },
            }),
        ).toBe('Kegel · 8 Schritt · 60° · beim Zaubernden')
    })

    it('falls back for absent zones', () => {
        expect(summarizeZone(null)).toBe('—')
        expect(summarizeZone(undefined)).toBe('—')
    })

    it('summarizes damage with type label and Mächtig bonus', () => {
        expect(
            summarizeDamage(
                {
                    value: '4W6',
                    damageType: 'FEUER',
                    amplifiedByMaechtigeMagie: true,
                    maechtigBonus: '+2W6',
                },
                { damageTypes: { FEUER: 'Feuer' } },
            ),
        ).toBe('4W6 · Feuer · Mächtig +2W6')
    })

    it('summarizes resistance difficulty', () => {
        expect(
            summarizeResistance({
                attribut: 'KO',
                resistDifficultySource: 'fixed',
                resistDifficulty: 12,
            }),
        ).toBe('KO · Schwierigkeit 12')
        expect(
            summarizeResistance({
                attribut: 'KK',
                resistDifficultySource: 'triggeringRoll',
                resistDifficulty: 16,
            }),
        ).toBe('KK · Schwierigkeit aus Probe')
    })

    it('summarizes armed combat with bonus and charges', () => {
        expect(
            summarizeArmedCombat({
                trigger: 'nextSuccessfulAttack',
                scope: 'melee',
                attackBonus: 2,
                charges: { base: 3 },
            }),
        ).toBe('Nächster erfolgreicher Angriff · Nahkampf · AT +2 · 3 Ladungen')
    })

    it('returns fallback for disabled or absent condition/marker', () => {
        expect(summarizeCondition({ enabled: false })).toBe('—')
        expect(summarizeMarker({ enabled: false })).toBe('—')
        expect(summarizeCondition({ enabled: true, statusId: 'Brennend' })).toBe('Brennend')
        expect(summarizeMarker({ enabled: true, label: 'Handlungsunfähig' })).toBe(
            'Handlungsunfähig',
        )
    })

    it('joins active features of a whole pre-effect', () => {
        const summary = summarizePreEffect({
            changes: [{ value: '4W6', damageType: 'FEUER' }],
            condition: { enabled: true, statusId: 'Brennend' },
            avoidTest: { enabled: true, attribut: 'KO', resistDifficulty: 12 },
            summonItem: { enabled: true },
        })
        expect(summary).toContain('4W6 · FEUER')
        expect(summary).toContain('Brennend')
        expect(summary).toContain('KO · Schwierigkeit 12')
        expect(summary).toContain('Gegenstand beschwören')
    })

    it('falls back for inactive pre-effects', () => {
        expect(summarizePreEffect({ changes: [], avoidTest: { enabled: false } })).toBe('—')
    })
})
