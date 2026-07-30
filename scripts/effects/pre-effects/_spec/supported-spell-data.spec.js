import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const spellSourceDirectory = join(
    process.cwd(),
    'comp_packs',
    'zauberspruche-und-rituale',
    '_source',
)

function readSpell(filename) {
    return JSON.parse(readFileSync(join(spellSourceDirectory, filename), 'utf8'))
}

function expectDamageChange(preEffect, { value, damageType, maechtigBonus = '' }) {
    expect(preEffect).toMatchObject({ instant: true, baseDuration: 0 })
    expect(preEffect.changes).toEqual([
        expect.objectContaining({
            key: 'system.gesundheit.wunden',
            type: 'add',
            value,
            damageType,
            maechtigBonus,
        }),
    ])
}

describe('reviewed supported spell pre-effect source data', () => {
    it('configures Axxeleratus Blitzgeschwind (Tiergeist) like its supported base spell', () => {
        const spell = readSpell('Axxeleratus_Blitzgeschwind__Tiergeist__NZax4EdnXTHTpt8F.json')

        expect(spell.system.preEffects).toEqual([
            expect.objectContaining({
                baseDuration: 16,
                instant: false,
                changes: expect.arrayContaining([
                    expect.objectContaining({ key: 'system.abgeleitete.gs', value: '4' }),
                    expect.objectContaining({
                        key: 'system.modifikatoren.nahkampfmod',
                        value: '2',
                    }),
                    expect.objectContaining({
                        key: 'system.modifikatoren.verteidigungmod',
                        value: '2',
                    }),
                ]),
            }),
        ])
    })

    it('configures reviewed direct-damage spells with their agreed damage type and Mächtige Magie bonus', () => {
        expectDamageChange(
            readSpell('Fulminictus_Donnerkeil_H7ImAYog4hQrArTY.json').system.preEffects?.[0],
            { value: '2W6', damageType: 'TRUE_DAMAGE', maechtigBonus: '+4' },
        )
        expectDamageChange(readSpell('Hexengalle_9rwCzQDAtGzeuU24.json').system.preEffects?.[0], {
            value: '2W6',
            damageType: 'TRUE_DAMAGE',
            maechtigBonus: '+1W6',
        })
        expectDamageChange(
            readSpell('Tlalucs_Odem_Pestgestank_AxZ1uUWFUlGIECDS.json').system.preEffects?.[0],
            { value: '2W6', damageType: 'TRUE_DAMAGE', maechtigBonus: '+1W6' },
        )
    })

    it('configures Plumbumbarum as an eight-phase attack modifier', () => {
        const preEffect = readSpell('Plumbumbarum_schwerer_Arm_jpmAxEkEsqT9cV8l.json').system
            .preEffects?.[0]

        expect(preEffect).toMatchObject({ baseDuration: 8, instant: false })
        expect(preEffect.changes).toEqual([
            expect.objectContaining({
                key: 'system.modifikatoren.nahkampfmod',
                value: '-4',
                amplifiedByMaechtigeMagie: true,
                maechtigBonus: '-2',
            }),
        ])
    })

    it('keeps Tlalucs damage separate from its Zähigkeit-guarded global modifier', () => {
        const preEffects = readSpell('Tlalucs_Odem_Pestgestank_AxZ1uUWFUlGIECDS.json').system
            .preEffects

        expect(preEffects).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ instant: true }),
                expect.objectContaining({
                    baseDuration: 8,
                    instant: false,
                    avoidTest: expect.objectContaining({
                        enabled: true,
                        fertigkeit: 'Zähigkeit',
                        resistDifficulty: 16,
                    }),
                    changes: [
                        expect.objectContaining({
                            key: 'system.modifikatoren.manuellermod',
                            value: '-4',
                        }),
                    ],
                }),
            ]),
        )
    })

    it('configures spell-named marker and diminished branches without a numeric marker modifier', () => {
        const hexengalle = readSpell('Hexengalle_9rwCzQDAtGzeuU24.json').system.preEffects
        const gewuerm = readSpell('Fluch_des_Gew_rms_iLc4RFaAgAFDdvUg.json').system.preEffects

        expect(hexengalle).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    baseDuration: 2,
                    instant: false,
                    avoidTest: expect.objectContaining({
                        fertigkeit: 'Zähigkeit',
                        resistDifficulty: 16,
                    }),
                    changes: [
                        expect.objectContaining({
                            key: 'system.modifikatoren.manuellermod',
                            value: '0',
                        }),
                    ],
                }),
            ]),
        )
        expect(gewuerm).toEqual([
            expect.objectContaining({
                baseDuration: 16,
                instant: false,
                avoidTest: expect.objectContaining({
                    fertigkeit: 'Willenskraft',
                    diminishedOnly: true,
                    resistDifficulty: 16,
                }),
                changes: [
                    expect.objectContaining({
                        key: 'system.modifikatoren.manuellermod',
                        value: '0',
                        diminishedValue: '-4',
                    }),
                ],
            }),
        ])
    })

    it('adds one-time-only damage approximations for the accepted zone and contact spells', () => {
        expectDamageChange(readSpell('Pand_monium_veNTD1rnQURhqGjs.json').system.preEffects?.[0], {
            value: '2W6',
            damageType: 'PROFAN',
            maechtigBonus: '+1W6',
        })
        expectDamageChange(readSpell('Seelenfeuer_QkRPoYl037LeA7Pi.json').system.preEffects?.[0], {
            value: '2W6',
            damageType: 'TRUE_DAMAGE',
            maechtigBonus: '+4',
        })
        expectDamageChange(
            readSpell('Wand_aus_Flammen_cwYNL2OTHHn8HGmA.json').system.preEffects?.[0],
            { value: '4W6', damageType: 'TRUE_DAMAGE', maechtigBonus: '+2W6' },
        )
    })
})
