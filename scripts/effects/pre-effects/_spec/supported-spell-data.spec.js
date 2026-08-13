import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const spellSourceDirectory = join(
    process.cwd(),
    'comp_packs',
    'zauberspruche-und-rituale',
    '_source',
)
const liturgySourceDirectory = join(process.cwd(), 'comp_packs', 'liturgien-und-mirakel', '_source')
const weaponSourceDirectory = join(process.cwd(), 'comp_packs', 'waffen', '_source')
const itemSourceDirectory = join(process.cwd(), 'comp_packs', 'gegenstande', '_source')

function readSpell(filename) {
    return JSON.parse(readFileSync(join(spellSourceDirectory, filename), 'utf8'))
}

function readLiturgy(filename) {
    return JSON.parse(readFileSync(join(liturgySourceDirectory, filename), 'utf8'))
}

function readWeapon(filename) {
    return JSON.parse(readFileSync(join(weaponSourceDirectory, filename), 'utf8'))
}

function readItem(filename) {
    return JSON.parse(readFileSync(join(itemSourceDirectory, filename), 'utf8'))
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
    it('configures Phexens Sternenwurf and Segen der Heiligen Ardare as first-slice summons', () => {
        const phexensSternenwurf = readLiturgy('Phexens_Sternenwurf_Zd8WWyywzZvGNjrP.json')
        const ardare = readLiturgy('Segen_der_Heiligen_Ardare_nniOXont43xAf4Bq.json')
        const wurfstern = readWeapon('Phexens_Wurfstern_C9Qy0anjBUWn9TUw.json')

        expect(phexensSternenwurf.system.preEffects?.[0]).toMatchObject({
            baseDuration: 64,
            summonItem: {
                sourceKind: 'waffe',
                sourceUuid: 'Compendium.Ilaris.waffen.Item.C9Qy0anjBUWn9TUw',
                overrides: [expect.objectContaining({ path: 'system.tp', maechtigBonus: '+1W20' })],
            },
        })
        expect(ardare.system.preEffects?.[0]).toMatchObject({
            baseDuration: 16,
            summonItem: {
                sourceKind: 'waffe',
                sourceUuid: 'Compendium.Ilaris.waffen.Item.mpqeLctvVQjSMrdT',
            },
        })
        expect(wurfstern.effects).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    transfer: true,
                    system: {
                        ilarisArmedCombat: expect.objectContaining({
                            sourceItemOnly: true,
                            onExhaust: 'deleteOwningItem',
                        }),
                    },
                }),
            ]),
        )
    })

    it('configures reviewed Largorax Hammer and Hexenkrallen summons', () => {
        const largorax = readLiturgy('Largorax__Hammer_qT9xDYX9Df1iVYuV.json')
        const hexenkrallen = readSpell('Hexenkrallen_M1xClzIiwBP1e2yu.json')
        const hammer = readWeapon('Largorax__Hammer_b6qMsEBOjUhbVjPo.json')

        expect(largorax.system.preEffects?.[0]).toMatchObject({
            baseDuration: 161280,
            summonItem: {
                sourceKind: 'waffe',
                sourceUuid: 'Compendium.Ilaris.waffen.Item.b6qMsEBOjUhbVjPo',
                overrides: [expect.objectContaining({ path: 'system.tp', maechtigBonus: '+10' })],
            },
        })
        expect(hexenkrallen.system.preEffects?.[0]).toMatchObject({
            baseDuration: 16,
            summonItem: {
                sourceKind: 'waffe',
                sourceUuid: 'Compendium.Ilaris.waffen.Item.iyoROxzExM0toe8P',
                overrides: [expect.objectContaining({ path: 'system.tp', maechtigBonus: '+2' })],
            },
        })
        expect(hammer.effects).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    transfer: true,
                    system: {
                        ilarisArmedCombat: expect.objectContaining({
                            scope: 'melee',
                            sourceItemOnly: true,
                            onExhaust: 'deleteOwningItem',
                        }),
                    },
                }),
            ]),
        )
    })

    it('configures reviewed ordinary Item and Flammenschwert summons', () => {
        const firunsEinsicht = readLiturgy('Firuns_Einsicht_yjHWlMiWIJSaoyL3.json')
        const ingalfsAlchemie = readLiturgy('Ingalfs_Alchemie_982l2HMFL4EzoCDq.json')
        const meisterschluessel = readLiturgy('Phexens_Meisterschl_ssel_8Ti80i4sZ6u4G8wn.json')
        const flammenschwert = readSpell('Flammenschwert_6Le0B028zxoqgr7e.json')
        const ring = readItem('Firuns_Rings_nzMDgayAm0lz5QZP.json')
        const trichter = readItem('Hesindes_Trichter_YDE6JC5XNS3bJatr.json')
        const schluessel = readItem('Phexens_Meisterschl_ssel_boTWlXOLtukSGoQL.json')
        const flameSword = readWeapon('Flammenschwert_KKOHovBsVU9bphLS.json')

        expect(firunsEinsicht.system.preEffects?.[0]).toMatchObject({
            baseDuration: 960,
            summonItem: {
                sourceKind: 'gegenstand',
                sourceUuid: `Compendium.Ilaris.gegenstande.Item.${ring._id}`,
            },
        })
        expect(ingalfsAlchemie.system.preEffects?.[0]).toMatchObject({
            baseDuration: 7680,
            summonItem: {
                sourceKind: 'gegenstand',
                sourceUuid: `Compendium.Ilaris.gegenstande.Item.${trichter._id}`,
            },
        })
        expect(meisterschluessel.system.preEffects?.[0]).toMatchObject({
            baseDuration: 16,
            summonItem: {
                sourceKind: 'gegenstand',
                sourceUuid: `Compendium.Ilaris.gegenstande.Item.${schluessel._id}`,
            },
        })
        expect(flammenschwert.system.preEffects?.[0]).toMatchObject({
            baseDuration: 16,
            summonItem: {
                sourceKind: 'waffe',
                sourceUuid: `Compendium.Ilaris.waffen.Item.${flameSword._id}`,
                overrides: [expect.objectContaining({ path: 'system.tp', maechtigBonus: '+2' })],
            },
        })
        expect(flameSword.name).toBe('Flammenschwert')
    })

    it('configures Falkenauge and Neun Streiche as charged armed combat effects', () => {
        const falkenauge = readSpell('Falkenauge_Meisterschuss_1IrKao8Dho4TTgsR.json')
        const neunStreiche = readLiturgy('Neun_Streiche_in_einem_G1Ei7UA4kqCYhF8r.json')

        expect(falkenauge.system.preEffects?.[0].armedCombat).toMatchObject({
            scope: 'ranged',
            attackBonus: 4,
            charges: { base: 1 },
        })
        expect(neunStreiche.system.preEffects?.[0].armedCombat).toMatchObject({
            scope: 'any',
            inputs: [expect.objectContaining({ key: 'previousHits', min: 0, max: 8 })],
            damage: { input: 'previousHits', perInput: 'W6' },
            charges: { base: 1 },
        })
    })
    it('configures Axxeleratus Blitzgeschwind (Tiergeist) like its supported base spell', () => {
        const spell = readSpell('Axxeleratus_Blitzgeschwind__Tiergeist__NZax4EdnXTHTpt8F.json')

        expect(spell.system.preEffects).toEqual([
            expect.objectContaining({
                baseDuration: 16,
                instant: false,
                changes: [],
                ilarisModifiers: expect.arrayContaining([
                    expect.objectContaining({ phase: 'prepare', target: 'gs', value: '4' }),
                    expect.objectContaining({ phase: 'roll', target: 'at', value: '2' }),
                    expect.objectContaining({ phase: 'roll', target: 'vt', value: '2' }),
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

    it('configures Plumbumbarum as an eight-phase semantic attack modifier', () => {
        const preEffect = readSpell('Plumbumbarum_schwerer_Arm_jpmAxEkEsqT9cV8l.json').system
            .preEffects?.[0]

        expect(preEffect).toMatchObject({ baseDuration: 8, instant: false })
        expect(preEffect.changes).toEqual([])
        expect(preEffect.ilarisModifiers).toEqual([
            expect.objectContaining({
                phase: 'roll',
                target: 'at',
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
                    changes: [],
                    ilarisModifiers: [
                        expect.objectContaining({
                            target: 'probe',
                            value: '-4',
                        }),
                    ],
                }),
            ]),
        )
    })

    it('configures the supported zone profiles for Tlalucs Odem and Wand aus Dornen', () => {
        const tlalucs = readSpell('Tlalucs_Odem_Pestgestank_AxZ1uUWFUlGIECDS.json')
        const dornen = readSpell('Wand_aus_Dornen_XthRIeEiC9Te02tL.json')

        expect(tlalucs.system.zone).toMatchObject({
            shape: 'cone',
            distance: 8,
            angle: 45,
            placement: { anchor: 'caster', pivot: 'tip' },
            lifecycle: 'instant',
        })
        expect(tlalucs.system.spellModifications).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 'miasmasphaero',
                    zone: expect.objectContaining({
                        shape: 'circle',
                        placement: expect.objectContaining({
                            anchor: 'caster',
                            pivot: 'center',
                        }),
                    }),
                }),
                expect.objectContaining({ id: 'miasmafaxius', zone: false }),
            ]),
        )
        expect(dornen.system.zone).toMatchObject({
            shape: 'rectangle',
            distance: 4,
            width: 1,
            lifecycle: 'persistent',
            duration: { remaining: 256, originalValue: 256 },
            trigger: { triggerOnCreate: false, onEnter: false, onTraverse: true },
            traversal: {
                avoidTest: { attribut: 'GE', resistDifficulty: 16 },
                failureMarker: { name: 'Durchquerung fehlgeschlagen' },
            },
        })
        expectDamageChange(dornen.system.preEffects?.[0], {
            value: '2W6',
            damageType: 'PROFAN',
        })
        expect(dornen.system.preEffects?.[0]?.avoidTest?.enabled).not.toBe(true)
    })

    it('configures Dunkelheit as a stationary, marker-only passive zone', () => {
        const dunkelheit = readSpell('Dunkelheit_Q4kEr8XiRJQs0owu.json')

        expect(dunkelheit.system.zone).toMatchObject({
            shape: 'circle',
            distance: 4,
            placement: { anchor: 'caster', range: 0, pivot: 'center' },
            lifecycle: 'persistent',
            effectMode: 'passive',
            duration: { remaining: 64, originalValue: 64 },
            trigger: { triggerOnCreate: true, onEnter: true },
            targeting: { includeCaster: false },
        })
        expect(dunkelheit.system.preEffects).toEqual([
            expect.objectContaining({
                baseDuration: 0,
                instant: false,
                marker: { enabled: true },
                changes: [],
                ilarisModifiers: [],
            }),
        ])
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
                changes: [],
                ilarisModifiers: [
                    expect.objectContaining({
                        target: 'probe',
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

    it('configures Tanz der Schwerter with its complete 16-phase combat modifiers', () => {
        const preEffect = readLiturgy('Tanz_der_Schwerter_0mKqCy9GHd4GPzxW.json').system
            .preEffects?.[0]

        expect(preEffect).toMatchObject({ baseDuration: 16, instant: false, changes: [] })
        expect(preEffect.ilarisModifiers).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    phase: 'prepare',
                    target: 'gs',
                    value: '4',
                    stacking: 'strongest-supernatural',
                    amplifiedByMaechtigeMagie: true,
                    maechtigBonus: '+2',
                }),
                expect.objectContaining({ phase: 'roll', target: 'at', value: '2' }),
                expect.objectContaining({ phase: 'roll', target: 'vt', value: '2' }),
            ]),
        )
    })

    it('configures exact named-talent modifiers with converted Initiativephase durations', () => {
        const cases = [
            [
                readSpell('Adlerauge_Luchsenohr_QjByI4mdvimnXnUy.json'),
                64,
                ['Sinnenschärfe', 'Wachsamkeit'],
            ],
            [
                readSpell('Adlerauge_Luchsenohr__Tiergeist__RrDf1TSVA7hrsy3c.json'),
                64,
                ['Sinnenschärfe', 'Wachsamkeit'],
            ],
            [readLiturgy('Innere_Ruhe_mnib8KZWADSbWIxw.json'), 7680, ['Selbstbeherrschung']],
            [readLiturgy('Mondsilberzunge_V3yVnzomRnXUZWFA.json'), 960, ['Überreden']],
            [
                readLiturgy('Rahjas_Wohlgefallen_3Lye7M6LN2L4BtC9.json'),
                960,
                ['Menschenkenntnis', 'Betören'],
            ],
        ]

        for (const [item, baseDuration, talents] of cases) {
            const preEffect = item.system.preEffects?.[0]
            expect(preEffect).toMatchObject({ baseDuration, instant: false, changes: [] })
            expect(preEffect.ilarisModifiers).toEqual([
                expect.objectContaining({
                    phase: 'roll',
                    target: 'talent',
                    value: '4',
                    stacking: 'strongest-supernatural',
                    selector: { talent: talents },
                    amplifiedByMaechtigeMagie: true,
                    maechtigBonus: '+2',
                }),
            ])
        }
    })

    it('configures the reviewed MR effects with semantic modifiers and converted durations', () => {
        const cases = [
            [readSpell('Psychostabilis_vgfz3Gra9JYsLN4V.json'), 960],
            [readSpell('Psychostabilis__Tiergeist__2SCc6VIJLbIoqXd4.json'), 960],
            [readSpell('Tanz_des_Ungehorsams_zYncwAznu4Jiv9H2.json'), 23040],
        ]

        for (const [item, baseDuration] of cases) {
            expect(item.system.preEffects?.[0]).toMatchObject({
                baseDuration,
                instant: false,
                changes: [],
                ilarisModifiers: [
                    expect.objectContaining({
                        phase: 'prepare',
                        target: 'mr',
                        value: '4',
                        stacking: 'strongest-supernatural',
                        amplifiedByMaechtigeMagie: true,
                        maechtigBonus: '+2',
                    }),
                ],
            })
        }
    })
})
