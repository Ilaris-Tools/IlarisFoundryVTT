import {
    usesSingleWeapon,
    usesTwoWeapons,
    anyWeaponNeedsToMeetRequirement,
    ignoreSideWeaponMalus,
    checkCombatStyleConditions,
    applyModifierToWeapons,
    _executeKampfstilMethodsAndApplyModifiers,
    manoverAusgleich,
} from '../data/actor-weapon-utils.js'

describe('weapon-requirements.js', () => {
    // Mock weapon objects for testing
    const createMockWeapon = (id, type = 'nahkampfwaffe', eigenschaften = []) => ({
        id,
        type,
        system: {
            eigenschaften,
            at: 0,
            vt: 0,
            computed: {
                at: 0,
                vt: 0,
            },
        },
    })

    const mockMeleeWeapon1 = createMockWeapon('weapon1', 'nahkampfwaffe', [])
    const mockMeleeWeapon2 = createMockWeapon('weapon2', 'nahkampfwaffe', [])
    const mockSameWeapon = createMockWeapon('weapon1', 'nahkampfwaffe', [])
    const mockRangedWeapon = createMockWeapon('ranged1', 'fernkampfwaffe', [])
    const mockRidingWeapon = createMockWeapon('riding1', 'nahkampfwaffe', [
        { key: 'Reittier', parameters: [] },
    ])
    const mockShieldWeapon = createMockWeapon('shield1', 'nahkampfwaffe', [
        { key: 'Schild', parameters: [] },
    ])
    const mockRidingShieldWeapon = createMockWeapon('ridingShield1', 'nahkampfwaffe', [
        { key: 'Reittier', parameters: [] },
        { key: 'Schild', parameters: [] },
    ])

    describe('usesSingleMeleeWeapon', () => {
        it('should return null when both weapons are undefined', () => {
            const result = usesSingleWeapon(undefined, undefined)
            expect(result).toBeNull()
        })

        it('should return the hauptWaffe when only hauptWaffe is provided', () => {
            const result = usesSingleWeapon(mockMeleeWeapon1, undefined)
            expect(result).toBe(mockMeleeWeapon1)
        })

        it('should return null when only nebenWaffe is provided', () => {
            const result = usesSingleWeapon(undefined, mockMeleeWeapon2)
            expect(result).toBe(null)
        })

        it('should return the weapon when both weapons are the same', () => {
            const result = usesSingleWeapon(mockMeleeWeapon1, mockSameWeapon)
            expect(result).toBe(mockMeleeWeapon1)
        })

        it('should return null when both weapons are provided but different', () => {
            const result = usesSingleWeapon(mockMeleeWeapon1, mockMeleeWeapon2)
            expect(result).toBeNull()
        })

        it('should handle weapons without eigenschaften property', () => {
            const weaponWithoutEigenschaften = {
                id: 'weapon3',
                type: 'nahkampfwaffe',
                system: {},
            }
            const result = usesSingleWeapon(weaponWithoutEigenschaften, undefined)
            expect(result).toBe(weaponWithoutEigenschaften)
        })
    })

    describe('usesTwoMeleeWeapons', () => {
        it('should return false when hauptWaffe is undefined', () => {
            const result = usesTwoWeapons(undefined, mockMeleeWeapon2)
            expect(result).toBe(false)
        })

        it('should return false when nebenWaffe is undefined', () => {
            const result = usesTwoWeapons(mockMeleeWeapon1, undefined)
            expect(result).toBe(false)
        })

        it('should return false when both weapons are undefined', () => {
            const result = usesTwoWeapons(undefined, undefined)
            expect(result).toBe(false)
        })

        it('should return false when both weapons have the same id', () => {
            const result = usesTwoWeapons(mockMeleeWeapon1, mockSameWeapon)
            expect(result).toBe(false)
        })

        it('should return false when hauptWaffe is not a melee weapon', () => {
            const result = usesTwoWeapons(mockRangedWeapon, mockMeleeWeapon2)
            expect(result).toBe(false)
        })

        it('should return false when nebenWaffe is not a melee weapon', () => {
            const result = usesTwoWeapons(mockMeleeWeapon1, mockRangedWeapon)
            expect(result).toBe(false)
        })

        it('should return true when both weapons are different melee weapons', () => {
            const result = usesTwoWeapons(mockMeleeWeapon1, mockMeleeWeapon2)
            expect(result).toBe(true)
        })
    })

    describe('anyWeaponNeedsToMeetRequirement', () => {
        it('should return false when both weapons are null', () => {
            const result = anyWeaponNeedsToMeetRequirement(null, null, 'reittier')
            expect(result).toBe(false)
        })

        it('should return false when both weapons are undefined', () => {
            const result = anyWeaponNeedsToMeetRequirement(undefined, undefined, 'reittier')
            expect(result).toBe(false)
        })

        it('should return true when hauptWaffe has the required property', () => {
            const result = anyWeaponNeedsToMeetRequirement(
                mockRidingWeapon,
                mockMeleeWeapon2,
                'reittier',
            )
            expect(result).toBe(true)
        })

        it('should return true when nebenWaffe has the required property', () => {
            const result = anyWeaponNeedsToMeetRequirement(
                mockMeleeWeapon1,
                mockShieldWeapon,
                'schild',
            )
            expect(result).toBe(true)
        })

        it('should return true when both weapons have the required property', () => {
            const result = anyWeaponNeedsToMeetRequirement(
                mockRidingWeapon,
                mockRidingShieldWeapon,
                'reittier',
            )
            expect(result).toBe(true)
        })

        it('should return false when neither weapon has the required property', () => {
            const result = anyWeaponNeedsToMeetRequirement(
                mockMeleeWeapon1,
                mockMeleeWeapon2,
                'reittier',
            )
            expect(result).toBe(false)
        })

        it('should handle weapons without system property', () => {
            const weaponWithoutSystem = { id: 'weapon4', type: 'nahkampfwaffe' }
            const result = anyWeaponNeedsToMeetRequirement(
                weaponWithoutSystem,
                mockMeleeWeapon2,
                'reittier',
            )
            expect(result).toBe(false)
        })

        it('should handle weapons without eigenschaften property', () => {
            const weaponWithoutEigenschaften = {
                id: 'weapon5',
                type: 'nahkampfwaffe',
                system: {},
            }
            const result = anyWeaponNeedsToMeetRequirement(
                weaponWithoutEigenschaften,
                mockMeleeWeapon2,
                'schild',
            )
            expect(result).toBe(false)
        })

        it('should return false when requirement property exists but is false/falsy', () => {
            const weaponWithFalsyProperty = createMockWeapon('weapon6', 'nahkampfwaffe', [])
            const result = anyWeaponNeedsToMeetRequirement(
                weaponWithFalsyProperty,
                mockMeleeWeapon2,
                'reittier',
            )
            expect(result).toBe(false)
        })

        it('should handle mixed scenarios with one weapon having system and other not', () => {
            const weaponWithoutSystem = { id: 'weapon7', type: 'nahkampfwaffe' }
            const result = anyWeaponNeedsToMeetRequirement(
                weaponWithoutSystem,
                mockRidingWeapon,
                'reittier',
            )
            expect(result).toBe(true)
        })

        it('should test with custom requirement properties', () => {
            const weaponWithCustomProperty = createMockWeapon('weapon8', 'nahkampfwaffe', [
                { key: 'CustomProperty', parameters: [] },
            ])
            const result = anyWeaponNeedsToMeetRequirement(
                weaponWithCustomProperty,
                mockMeleeWeapon2,
                'customProperty',
            )
            expect(result).toBe(true)
        })
    })

    describe('ignoreSideWeaponMalus', () => {
        it('should not apply bonus if kein_malus_nebenwaffe is true', () => {
            const nebenwaffe = createMockWeapon('nebenwaffe', 'nahkampfwaffe', [])
            nebenwaffe.system.computed.ignoreNebenMalus = true
            ignoreSideWeaponMalus(undefined, nebenwaffe, false)
            expect(nebenwaffe.system.computed.at).toBe(0)
            expect(nebenwaffe.system.computed.vt).toBe(0)
        })

        it('should apply bonus if kein_malus_nebenwaffe is false', () => {
            const nebenwaffe = createMockWeapon('nebenwaffe', 'nahkampfwaffe', [])
            ignoreSideWeaponMalus(undefined, nebenwaffe, false)
            expect(nebenwaffe.system.computed.at).toBe(4)
            expect(nebenwaffe.system.computed.vt).toBe(4)
        })

        it('should not apply bonus if weapon is undefined', () => {
            const result = ignoreSideWeaponMalus(undefined, undefined, false)
            expect(result).toBeUndefined()
        })

        it('should apply bonus if weapon has schild property', () => {
            const nebenwaffe = createMockWeapon('nebenwaffe', 'nahkampfwaffe', [
                { key: 'Schild', parameters: [] },
            ])
            ignoreSideWeaponMalus(undefined, nebenwaffe, false, 'schild')
            expect(nebenwaffe.system.computed.at).toBe(4)
            expect(nebenwaffe.system.computed.vt).toBe(4)
        })
    })

    describe('checkComatStyleConditions', () => {
        const createMockWeaponWithSkill = (
            id,
            type = 'nahkampfwaffe',
            eigenschaften = [],
            fertigkeit = '',
        ) => ({
            id,
            type,
            system: {
                eigenschaften,
                fertigkeit,
                at: 0,
                vt: 0,
            },
        })
        const actor = () => ({ misc: { selected_kampfstil_conditions_not_met: '' } })
        const kampfstil = (key = 'stil', bedingung = '') => ({ key, stilBedingungen: bedingung })

        it('should return true for empty or null conditions', () => {
            const mockWeapon = createMockWeapon('weapon1')
            expect(
                checkCombatStyleConditions(kampfstil(), mockWeapon, undefined, false, actor()),
            ).toBe(true)
            expect(
                checkCombatStyleConditions(
                    kampfstil('stil', null),
                    mockWeapon,
                    undefined,
                    false,
                    actor(),
                ),
            ).toBe(true)
            expect(
                checkCombatStyleConditions(kampfstil('   '), mockWeapon, undefined, false, actor()),
            ).toBe(true)
        })

        it('should return false when hauptWaffe is undefined', () => {
            expect(
                checkCombatStyleConditions(
                    kampfstil('stil', 'beritten'),
                    undefined,
                    undefined,
                    true,
                    actor(),
                ),
            ).toBe(false)
            expect(
                checkCombatStyleConditions(
                    kampfstil('stil', 'reittier'),
                    undefined,
                    undefined,
                    false,
                    actor(),
                ),
            ).toBe(false)
            expect(
                checkCombatStyleConditions(
                    kampfstil('stil', ''),
                    undefined,
                    undefined,
                    false,
                    actor(),
                ),
            ).toBe(false)
        })

        it('should return false if no stil or key is "ohne"', () => {
            const mockWeapon = createMockWeapon('weapon1')
            expect(
                checkCombatStyleConditions(undefined, mockWeapon, undefined, true, actor()),
            ).toBe(false)
            expect(
                checkCombatStyleConditions(
                    kampfstil('ohne', 'reittier'),
                    undefined,
                    undefined,
                    false,
                    actor(),
                ),
            ).toBe(false)
        })

        describe('mounted status conditions', () => {
            it('should check "beritten" condition correctly', () => {
                const mockWeapon = createMockWeapon('weapon1')
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'beritten'),
                        mockWeapon,
                        undefined,
                        true,
                        actor(),
                    ),
                ).toBe(true)
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'beritten'),
                        mockWeapon,
                        undefined,
                        false,
                        actor(),
                    ),
                ).toBe(false)
            })

            it('should check "nicht beritten" condition correctly', () => {
                const mockWeapon = createMockWeapon('weapon1')
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'nicht beritten'),
                        mockWeapon,
                        undefined,
                        false,
                        actor(),
                    ),
                ).toBe(true)
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'nicht beritten'),
                        mockWeapon,
                        undefined,
                        true,
                        actor(),
                    ),
                ).toBe(false)
            })
        })

        describe('weapon type/count conditions', () => {
            it('should check "einzelne waffe" condition correctly', () => {
                const singleWeapon = createMockWeapon('weapon1')
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'einzelne waffe'),
                        singleWeapon,
                        undefined,
                        false,
                        actor(),
                    ),
                ).toBe(true)
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'einzelne nahkampfwaffe'),
                        singleWeapon,
                        undefined,
                        false,
                        actor(),
                    ),
                ).toBe(true)
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'einzelne waffe'),
                        singleWeapon,
                        singleWeapon,
                        false,
                        actor(),
                    ),
                ).toBe(true)

                const mockWeapon = createMockWeapon('weapon2')
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'einzelne waffe'),
                        singleWeapon,
                        mockWeapon,
                        false,
                        actor(),
                    ),
                ).toBe(false)
            })

            it('should check "zwei einhändige waffen" condition correctly', () => {
                const weapon1 = createMockWeapon('weapon1')
                const weapon2 = createMockWeapon('weapon2')
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'zwei einhändige waffen'),
                        weapon1,
                        weapon2,
                        false,
                        actor(),
                    ),
                ).toBe(true)
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'zwei einhändige nahkampfwaffen'),
                        weapon1,
                        weapon2,
                        false,
                        actor(),
                    ),
                ).toBe(true)
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'zwei einhändige waffen'),
                        weapon1,
                        undefined,
                        false,
                        actor(),
                    ),
                ).toBe(false)
            })

            it('should check "einzelne fernkampfwaffe" condition correctly', () => {
                const rangedWeapon = createMockWeapon('ranged1', 'fernkampfwaffe')
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'einzelne fernkampfwaffe'),
                        rangedWeapon,
                        undefined,
                        false,
                        actor(),
                    ),
                ).toBe(true)
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'einzelne fernkampfwaffe'),
                        undefined,
                        rangedWeapon,
                        false,
                        actor(),
                    ),
                ).toBe(false)

                const sameRangedWeapon = createMockWeapon('ranged2', 'fernkampfwaffe')
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'einzelne fernkampfwaffe'),
                        rangedWeapon,
                        sameRangedWeapon,
                        false,
                        actor(),
                    ),
                ).toBe(false)

                const meleeWeapon = createMockWeapon('melee1', 'nahkampfwaffe')
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'einzelne fernkampfwaffe'),
                        meleeWeapon,
                        undefined,
                        false,
                        actor(),
                    ),
                ).toBe(false)
            })

            it('should check "zwei einhändige fernkampfwaffen" condition correctly', () => {
                const rangedWeapon1 = createMockWeapon('ranged1', 'fernkampfwaffe')
                const rangedWeapon2 = createMockWeapon('ranged2', 'fernkampfwaffe')
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'zwei einhändige fernkampfwaffen'),
                        rangedWeapon1,
                        rangedWeapon2,
                        false,
                        actor(),
                    ),
                ).toBe(true)

                const sameRangedWeapon = createMockWeapon('ranged1', 'fernkampfwaffe')
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'zwei einhändige fernkampfwaffen'),
                        rangedWeapon1,
                        sameRangedWeapon,
                        false,
                        actor(),
                    ),
                ).toBe(false)
            })
        })

        describe('weapon skill conditions', () => {
            const actor = () => ({ misc: { selected_kampfstil_conditions_not_met: '' } })
            it('should check "Fertigkeit" condition correctly', () => {
                const weaponWithSkill = createMockWeaponWithSkill(
                    'weapon1',
                    'nahkampfwaffe',
                    [],
                    'hiebwaffen',
                )
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'Fertigkeit Hiebwaffen'),
                        weaponWithSkill,
                        undefined,
                        false,
                        actor(),
                    ),
                ).toBe(true)
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'Fertigkeit Hiebwaffen'),
                        undefined,
                        weaponWithSkill,
                        false,
                        actor(),
                    ),
                ).toBe(false)
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'Fertigkeit Stichwaffen'),
                        weaponWithSkill,
                        undefined,
                        false,
                        actor(),
                    ),
                ).toBe(false)
            })
        })

        describe('weapon property conditions', () => {
            const actor = () => ({ misc: { selected_kampfstil_conditions_not_met: '' } })
            it('should check positive weapon properties correctly', () => {
                const weaponWithReittier = createMockWeapon('weapon1', 'nahkampfwaffe', [
                    { key: 'reittier', parameters: [] },
                ])
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'reittier'),
                        weaponWithReittier,
                        undefined,
                        false,
                        actor(),
                    ),
                ).toBe(true)
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'reittier'),
                        undefined,
                        weaponWithReittier,
                        false,
                        actor(),
                    ),
                ).toBe(false)

                const weaponWithoutReittier = createMockWeapon('weapon2', 'nahkampfwaffe', [])
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'reittier'),
                        weaponWithoutReittier,
                        undefined,
                        false,
                        actor(),
                    ),
                ).toBe(false)
            })

            it('should check negative weapon properties correctly', () => {
                const weaponWithReittier = createMockWeapon('weapon1', 'nahkampfwaffe', [
                    { key: 'Reittier', parameters: [] },
                ])
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'kein reittier'),
                        weaponWithReittier,
                        undefined,
                        false,
                        actor(),
                    ),
                ).toBe(false)

                const weaponWithoutReittier = createMockWeapon('weapon2', 'nahkampfwaffe', [])
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'kein reittier'),
                        weaponWithoutReittier,
                        undefined,
                        false,
                        actor(),
                    ),
                ).toBe(true)
            })
        })

        describe('multiple conditions', () => {
            const actor = () => ({ misc: { selected_kampfstil_conditions_not_met: '' } })
            it('should check multiple conditions separated by commas', () => {
                const weaponWithReittier = createMockWeaponWithSkill(
                    'weapon1',
                    'nahkampfwaffe',
                    [{ key: 'Reittier', parameters: [] }],
                    'hiebwaffen',
                )

                // All conditions met
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'beritten, reittier, Fertigkeit Hiebwaffen'),
                        weaponWithReittier,
                        undefined,
                        true,
                        actor(),
                    ),
                ).toBe(true)

                // One condition not met
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'beritten, reittier, Fertigkeit Hiebwaffen'),
                        weaponWithReittier,
                        undefined,
                        false,
                        actor(),
                    ),
                ).toBe(false)

                // Mixed positive and negative conditions
                const weaponWithoutSchild = createMockWeapon('weapon2', 'nahkampfwaffe', [
                    { key: 'Reittier', parameters: [] },
                ])
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'reittier, kein schild'),
                        weaponWithoutSchild,
                        undefined,
                        false,
                        actor(),
                    ),
                ).toBe(true)

                const weaponWithSchild = createMockWeapon('weapon3', 'nahkampfwaffe', [
                    { key: 'Reittier', parameters: [] },
                    { key: 'Schild', parameters: [] },
                ])
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'reittier, kein schild'),
                        weaponWithSchild,
                        undefined,
                        false,
                        actor(),
                    ),
                ).toBe(false)
            })

            it('should handle conditions with extra whitespace', () => {
                const weaponWithReittier = createMockWeapon('weapon1', 'nahkampfwaffe', [
                    { key: 'Reittier', parameters: [] },
                ])
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', ' beritten , reittier '),
                        weaponWithReittier,
                        undefined,
                        true,
                        actor(),
                    ),
                ).toBe(true)
            })
        })

        describe('case sensitivity', () => {
            const actor = () => ({ misc: { selected_kampfstil_conditions_not_met: '' } })
            it('should handle case-insensitive keywords but preserve property case', () => {
                const mockWeapon = createMockWeapon('weapon1')
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'BERITTEN'),
                        mockWeapon,
                        undefined,
                        true,
                        actor(),
                    ),
                ).toBe(true)
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'Nicht Beritten'),
                        mockWeapon,
                        undefined,
                        false,
                        actor(),
                    ),
                ).toBe(true)
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'EINZELNE WAFFE'),
                        createMockWeapon('weapon1'),
                        undefined,
                        false,
                        actor(),
                    ),
                ).toBe(true)

                const weaponWithReittier = createMockWeapon('weapon1', 'nahkampfwaffe', [
                    { key: 'Reittier', parameters: [] },
                ])
                expect(
                    checkCombatStyleConditions(
                        kampfstil('stil', 'KEIN reittier'),
                        weaponWithReittier,
                        undefined,
                        false,
                        actor(),
                    ),
                ).toBe(false)
            })
        })
    })

    describe('applyModifierToWeapons', () => {
        let hauptWaffe, nebenWaffe

        beforeEach(() => {
            // Mock main weapon (nahkampfwaffe)
            hauptWaffe = {
                id: 'main-weapon-1',
                type: 'nahkampfwaffe',
                system: {
                    at: 10,
                    vt: 8,
                    schaden: '1W6+2',
                    computed: {
                        at: 10,
                        vt: 8,
                        schadenBonus: 0,
                        modifiers: { at: [], vt: [], dmg: [] },
                    },
                },
            }

            // Mock side weapon (nahkampfwaffe)
            nebenWaffe = {
                id: 'side-weapon-1',
                type: 'nahkampfwaffe',
                system: {
                    at: 8,
                    vt: 6,
                    schaden: '1W6',
                    computed: {
                        at: 8,
                        vt: 6,
                        schadenBonus: 0,
                        modifiers: { at: [], vt: [], dmg: [] },
                    },
                },
            }
        })

        describe('BE reduction logic', () => {
            it('should apply full BE reduction when belastung is higher than modifiers.be', () => {
                const kampfstil = {
                    name: 'Test Style',
                    modifiers: { at: 2, vt: 1, be: -3, damage: 0, rw: 0 },
                }
                const belastung = 5

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, kampfstil)

                // Base modifiers + BE reduction (3)
                expect(hauptWaffe.system.computed.at).toBe(15) // 10 + 2 + 3
                expect(hauptWaffe.system.computed.vt).toBe(12) // 8 + 1 + 3
                expect(nebenWaffe.system.computed.at).toBe(13) // 8 + 2 + 3
                expect(nebenWaffe.system.computed.vt).toBe(10) // 6 + 1 + 3
            })

            it('should cap BE reduction at available belastung', () => {
                const kampfstil = {
                    name: 'Test Style',
                    modifiers: { at: 1, vt: 1, be: -5, damage: 0, rw: 0 },
                }
                const belastung = 2

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, kampfstil)

                // Base modifiers + capped BE reduction (2)
                expect(hauptWaffe.system.computed.at).toBe(13) // 10 + 1 + 2
                expect(hauptWaffe.system.computed.vt).toBe(11) // 8 + 1 + 2
                expect(nebenWaffe.system.computed.at).toBe(11) // 8 + 1 + 2
                expect(nebenWaffe.system.computed.vt).toBe(9) // 6 + 1 + 2
            })

            it('should not apply BE reduction when belastung is 0', () => {
                const kampfstil = {
                    name: 'Test Style',
                    modifiers: { at: 2, vt: 1, be: -3, damage: 0, rw: 0 },
                }
                const belastung = 0

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, kampfstil)

                // Only base modifiers, no BE reduction
                expect(hauptWaffe.system.computed.at).toBe(12) // 10 + 2
                expect(hauptWaffe.system.computed.vt).toBe(9) // 8 + 1
                expect(nebenWaffe.system.computed.at).toBe(10) // 8 + 2
                expect(nebenWaffe.system.computed.vt).toBe(7) // 6 + 1
            })

            it('should not apply BE reduction when modifiers.be is 0', () => {
                const kampfstil = {
                    name: 'Test Style',
                    modifiers: { at: 2, vt: 1, be: 0, damage: 0, rw: 0 },
                }
                const belastung = 3

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, kampfstil)

                // Only base modifiers, no BE reduction
                expect(hauptWaffe.system.computed.at).toBe(12) // 10 + 2
                expect(hauptWaffe.system.computed.vt).toBe(9) // 8 + 1
                expect(nebenWaffe.system.computed.at).toBe(10) // 8 + 2
                expect(nebenWaffe.system.computed.vt).toBe(7) // 6 + 1
            })

            it('should apply BE reduction when modifiers.be is  belastung', () => {
                const kampfstil = {
                    name: 'Test Style',
                    modifiers: { at: 2, vt: 1, be: -3, damage: 0, rw: 0 },
                }
                const belastung = 3

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, kampfstil)

                // Only base modifiers, no BE reduction
                expect(hauptWaffe.system.computed.at).toBe(15) // 10 + 5
                expect(hauptWaffe.system.computed.vt).toBe(12) // 8 + 4
                expect(nebenWaffe.system.computed.at).toBe(13) // 8 + 5
                expect(nebenWaffe.system.computed.vt).toBe(10) // 6 + 4
            })
        })

        describe('ranged weapons', () => {
            beforeEach(() => {
                hauptWaffe = {
                    id: 'ranged-weapon-1',
                    type: 'fernkampfwaffe',
                    system: {
                        fk: 12,
                        schaden: '1W6+1',
                        computed: {
                            fk: 12,
                            rw: 0,
                            schadenBonus: 0,
                            modifiers: { at: [], vt: [], dmg: [] },
                        },
                    },
                }

                nebenWaffe = {
                    id: 'ranged-weapon-2',
                    type: 'fernkampfwaffe',
                    system: {
                        fk: 10,
                        schaden: '1W6',
                        computed: {
                            fk: 10,
                            rw: 0,
                            schadenBonus: 0,
                            modifiers: { at: [], vt: [], dmg: [] },
                        },
                    },
                }
            })

            it('should apply modifiers to ranged weapons when affectRanged is true', () => {
                const kampfstil = {
                    name: 'Test Style',
                    modifiers: { at: 3, vt: 0, be: -2, damage: 1, rw: 0 },
                }
                const belastung = 4

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, kampfstil, true)

                // FK gets at modifier + BE reduction
                expect(hauptWaffe.system.computed.fk).toBe(17) // 12 + 3 + 2
                expect(hauptWaffe.system.computed.schadenBonus).toBe(1)
                expect(nebenWaffe.system.computed.fk).toBe(15) // 10 + 3 + 2
                expect(nebenWaffe.system.computed.schadenBonus).toBe(1)
            })

            it('should not apply modifiers, but be reduction, to ranged weapons when affectRanged is false', () => {
                const kampfstil = {
                    name: 'Test Style',
                    modifiers: { at: 3, vt: 0, be: -2, damage: 1, rw: 0 },
                }
                const belastung = 4

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, kampfstil, false)

                // Should only get BE reduction, no combat modifiers
                expect(hauptWaffe.system.computed.fk).toBe(14) // 12 + 2 (BE only)
                expect(hauptWaffe.system.computed.schadenBonus).toBe(0)
                expect(nebenWaffe.system.computed.fk).toBe(12) // 10 + 2 (BE only)
                expect(nebenWaffe.system.computed.schadenBonus).toBe(0)
            })
        })

        describe('damage modifiers', () => {
            it('should append damage bonus to weapon damage', () => {
                const kampfstil = {
                    name: 'Test Style',
                    modifiers: { at: 0, vt: 0, be: 0, damage: 3, rw: 0 },
                }
                const belastung = 0

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, kampfstil)

                expect(hauptWaffe.system.computed.schadenBonus).toBe(3)
                expect(nebenWaffe.system.computed.schadenBonus).toBe(3)
            })

            it('should not modify damage when damage modifier is 0', () => {
                const kampfstil = {
                    name: 'Test Style',
                    modifiers: { at: 2, vt: 1, be: 0, damage: 0, rw: 0 },
                }
                const belastung = 0

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, kampfstil)

                expect(hauptWaffe.system.computed.schadenBonus).toBe(0)
                expect(nebenWaffe.system.computed.schadenBonus).toBe(0)
            })
        })

        describe('single weapon scenarios', () => {
            it('should only modify hauptWaffe when nebenWaffe is undefined', () => {
                const kampfstil = {
                    name: 'Test Style',
                    modifiers: { at: 2, vt: 1, be: -1, damage: 0, rw: 0 },
                }
                const belastung = 2

                applyModifierToWeapons(hauptWaffe, undefined, belastung, kampfstil)

                expect(hauptWaffe.system.computed.at).toBe(13) // 10 + 2 + 1
                expect(hauptWaffe.system.computed.vt).toBe(10) // 8 + 1 + 1
            })

            it('should not modify nebenWaffe when it has same id as hauptWaffe', () => {
                nebenWaffe.id = hauptWaffe.id // Same weapon in both hands
                const originalAt = nebenWaffe.system.computed.at
                const originalVt = nebenWaffe.system.computed.vt

                const kampfstil = {
                    name: 'Test Style',
                    modifiers: { at: 2, vt: 1, be: -1, damage: 0, rw: 0 },
                }
                const belastung = 2

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, kampfstil)

                // Only hauptWaffe should be modified
                expect(hauptWaffe.system.computed.at).toBe(13) // 10 + 2 + 1
                expect(hauptWaffe.system.computed.vt).toBe(10) // 8 + 1 + 1

                // nebenWaffe should remain unchanged since it's the same weapon
                expect(nebenWaffe.system.computed.at).toBe(originalAt)
                expect(nebenWaffe.system.computed.vt).toBe(originalVt)
            })
        })

        describe('mixed weapon types', () => {
            it('should handle hauptWaffe as melee and nebenWaffe as ranged', () => {
                nebenWaffe = {
                    id: 'ranged-weapon-1',
                    type: 'fernkampfwaffe',
                    system: {
                        fk: 10,
                        schaden: '1W6',
                        computed: {
                            fk: 10,
                            rw: 0,
                            schadenBonus: 0,
                            modifiers: { at: [], vt: [], dmg: [] },
                        },
                    },
                }

                const kampfstil = {
                    name: 'Test Style',
                    modifiers: { at: 2, vt: 1, be: -1, damage: 0, rw: 0 },
                }
                const belastung = 2

                // Test with affectRanged = false
                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, kampfstil, false)

                // Melee weapon should be modified
                expect(hauptWaffe.system.computed.at).toBe(13) // 10 + 2 + 1
                expect(hauptWaffe.system.computed.vt).toBe(10) // 8 + 1 + 1

                // Ranged weapon should remain unchanged only BE reduction applies
                expect(nebenWaffe.system.computed.fk).toBe(11)

                // Reset and test with affectRanged = true
                nebenWaffe.system.computed.fk = 10 // Reset
                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, kampfstil, true)

                // Ranged weapon should now be modified
                expect(nebenWaffe.system.computed.fk).toBe(13) // 10 + 2 + 1
            })
        })

        describe('edge cases', () => {
            it('should handle undefined hauptWaffe gracefully', () => {
                const kampfstil = {
                    name: 'Test Style',
                    modifiers: { at: 2, vt: 1, be: -1, damage: 0, rw: 0 },
                }
                const belastung = 2

                expect(() => {
                    applyModifierToWeapons(undefined, nebenWaffe, belastung, kampfstil)
                }).not.toThrow()
            })

            it('should handle negative modifiers', () => {
                const kampfstil = {
                    name: 'Test Style',
                    modifiers: { at: -2, vt: -1, be: -1, damage: -1, rw: 0 },
                }
                const belastung = 2

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, kampfstil)

                expect(hauptWaffe.system.computed.at).toBe(9) // 10 - 2 + 1
                expect(hauptWaffe.system.computed.vt).toBe(8) // 8 - 1 + 1
                expect(hauptWaffe.system.computed.schadenBonus).toBe(-1)
            })

            it('should handle zero values for all parameters', () => {
                const kampfstil = {
                    name: 'Test Style',
                    modifiers: { at: 0, vt: 0, be: 0, damage: 0, rw: 0 },
                }
                const belastung = 0

                const originalHauptAt = hauptWaffe.system.computed.at
                const originalHauptVt = hauptWaffe.system.computed.vt
                const originalNebenAt = nebenWaffe.system.computed.at
                const originalNebenVt = nebenWaffe.system.computed.vt

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, kampfstil)

                // Values should remain unchanged
                expect(hauptWaffe.system.computed.at).toBe(originalHauptAt)
                expect(hauptWaffe.system.computed.vt).toBe(originalHauptVt)
                expect(nebenWaffe.system.computed.at).toBe(originalNebenAt)
                expect(nebenWaffe.system.computed.vt).toBe(originalNebenVt)
            })
        })
    })

    describe('_executeKampfstilMethodsAndApplyModifiers', () => {
        let hauptWaffe, nebenWaffe, actor

        beforeEach(() => {
            hauptWaffe = {
                id: 'main-weapon-1',
                type: 'nahkampfwaffe',
                system: {
                    at: 10,
                    vt: 8,
                    schaden: '1W6+2',
                    manoverausgleich: {
                        value: 0,
                        overcomplicated: false,
                    },
                    computed: {
                        at: 10,
                        vt: 8,
                        fk: 0,
                        rw: 0,
                        schadenBonus: 0,
                        modifiers: { at: [], vt: [], dmg: [] },
                    },
                },
            }

            nebenWaffe = {
                id: 'side-weapon-1',
                type: 'nahkampfwaffe',
                system: {
                    at: 8,
                    vt: 6,
                    schaden: '1W6',
                    manoverausgleich: {
                        value: 0,
                        overcomplicated: false,
                    },
                    computed: {
                        at: 8,
                        vt: 6,
                        fk: 0,
                        rw: 0,
                        schadenBonus: 0,
                        modifiers: { at: [], vt: [], dmg: [] },
                    },
                },
            }

            actor = {
                system: {
                    misc: {
                        ist_beritten: false,
                    },
                    abgeleitete: {
                        be: 5,
                    },
                },
            }
        })

        it('should execute kampfstil method and apply modifiers', () => {
            const kampfstil = {
                name: 'Test Kampfstil',
                foundryScriptMethods: ['manoverAusgleich(2)'],
                modifiers: { at: 2, vt: 1, be: -3, damage: 0, rw: 0 },
            }

            _executeKampfstilMethodsAndApplyModifiers(kampfstil, hauptWaffe, nebenWaffe, actor)

            // Check that manoverAusgleich was applied
            expect(hauptWaffe.system.manoverausgleich.value).toBe(2)
            expect(nebenWaffe.system.manoverausgleich.value).toBe(2)

            // Check that weapon modifiers were applied
            expect(hauptWaffe.system.computed.at).toBe(15) // 10 + 2 (at) + 3 (be)
            expect(hauptWaffe.system.computed.vt).toBe(12) // 8 + 1 (vt) + 3 (be)

            // Check that actor BE was reduced
            expect(actor.system.abgeleitete.be).toBe(2) // 5 - 3
        })

        it('should handle multiple method calls', () => {
            const kampfstil = {
                name: 'Multi Method Kampfstil',
                foundryScriptMethods: ['manoverAusgleich(1)', 'manoverAusgleich(2)'],
                modifiers: { at: 1, vt: 0, be: -1, damage: 0, rw: 0 },
            }

            _executeKampfstilMethodsAndApplyModifiers(kampfstil, hauptWaffe, nebenWaffe, actor)

            // manoverAusgleich should be called twice, adding up
            expect(hauptWaffe.system.manoverausgleich.value).toBe(3) // 1 + 2

            // Modifiers still applied once
            expect(hauptWaffe.system.computed.at).toBe(12) // 10 + 1 + 1
        })

        it('should handle kampfstil without methods', () => {
            const kampfstil = {
                name: 'No Methods Kampfstil',
                foundryScriptMethods: [],
                modifiers: { at: 2, vt: 1, be: -2, damage: 1, rw: 0 },
            }

            _executeKampfstilMethodsAndApplyModifiers(kampfstil, hauptWaffe, nebenWaffe, actor)

            // No method calls, so manoverausgleich stays 0
            expect(hauptWaffe.system.manoverausgleich.value).toBe(0)

            // But modifiers should still be applied
            expect(hauptWaffe.system.computed.at).toBe(14) // 10 + 2 + 2
            expect(hauptWaffe.system.computed.schadenBonus).toBe(1)
            expect(actor.system.abgeleitete.be).toBe(3) // 5 - 2
        })

        it('should not reduce BE below zero', () => {
            actor.system.abgeleitete.be = 1

            const kampfstil = {
                name: 'High BE Kampfstil',
                foundryScriptMethods: [],
                modifiers: { at: 1, vt: 1, be: -5, damage: 0, rw: 0 },
            }

            _executeKampfstilMethodsAndApplyModifiers(kampfstil, hauptWaffe, nebenWaffe, actor)

            // BE should not go negative
            expect(actor.system.abgeleitete.be).toBe(-4) // 1 - 5
        })

        it('should handle invalid method format gracefully', () => {
            const kampfstil = {
                name: 'Invalid Method Kampfstil',
                foundryScriptMethods: ['invalidMethodFormat', 'manoverAusgleich(1)'],
                modifiers: { at: 1, vt: 0, be: 0, damage: 0, rw: 0 },
            }

            // Should not throw
            expect(() => {
                _executeKampfstilMethodsAndApplyModifiers(kampfstil, hauptWaffe, nebenWaffe, actor)
            }).not.toThrow()

            // Valid method should still execute
            expect(hauptWaffe.system.manoverausgleich.value).toBe(1)
        })

        it('should handle method with complex parameters', () => {
            const kampfstil = {
                name: 'Complex Param Kampfstil',
                foundryScriptMethods: ['manoverAusgleich(3, false)'],
                modifiers: { at: 0, vt: 0, be: 0, damage: 0, rw: 0 },
            }

            _executeKampfstilMethodsAndApplyModifiers(kampfstil, hauptWaffe, nebenWaffe, actor)

            expect(hauptWaffe.system.manoverausgleich.value).toBe(3)
            expect(hauptWaffe.system.manoverausgleich.overcomplicated).toBe(false)
        })
    })
})
