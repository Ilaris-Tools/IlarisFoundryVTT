import {
    usesSingleWeapon,
    usesTwoWeapons,
    anyWeaponNeedsToMeetRequirement,
    ignoreSideWeaponMalus,
    checkCombatStyleConditions,
    applyModifierToWeapons,
} from '../weapon-utils.js'

describe('weapon-requirements.js', () => {
    // Mock weapon objects for testing
    const createMockWeapon = (id, type = 'nahkampfwaffe', eigenschaften = {}) => ({
        id,
        type,
        system: {
            eigenschaften,
            at: 0,
            vt: 0,
        },
    })

    const mockMeleeWeapon1 = createMockWeapon('weapon1', 'nahkampfwaffe', { at: 0, vt: 0 })
    const mockMeleeWeapon2 = createMockWeapon('weapon2', 'nahkampfwaffe', { at: 0, vt: 0 })
    const mockSameWeapon = createMockWeapon('weapon1', 'nahkampfwaffe', { at: 0, vt: 0 })
    const mockRangedWeapon = createMockWeapon('ranged1', 'fernkampfwaffe', { at: 0, vt: 0 })
    const mockRidingWeapon = createMockWeapon('riding1', 'nahkampfwaffe', {
        reittier: true,
        at: 0,
        vt: 0,
    })
    const mockShieldWeapon = createMockWeapon('shield1', 'nahkampfwaffe', {
        schild: true,
        at: 0,
        vt: 0,
    })
    const mockRidingShieldWeapon = createMockWeapon('ridingShield1', 'nahkampfwaffe', {
        reittier: true,
        schild: true,
        at: 0,
        vt: 0,
    })

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
            const weaponWithFalsyProperty = createMockWeapon('weapon6', 'nahkampfwaffe', {
                reittier: false,
            })
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
            const weaponWithCustomProperty = createMockWeapon('weapon8', 'nahkampfwaffe', {
                customProperty: true,
            })
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
            const nebenwaffe = createMockWeapon('nebenwaffe', 'nahkampfwaffe', {
                kein_malus_nebenwaffe: true,
            })
            ignoreSideWeaponMalus(nebenwaffe)
            expect(nebenwaffe.system.at).toBe(0)
            expect(nebenwaffe.system.vt).toBe(0)
        })

        it('should apply bonus if kein_malus_nebenwaffe is false', () => {
            const nebenwaffe = createMockWeapon('nebenwaffe', 'nahkampfwaffe', {
                kein_malus_nebenwaffe: false,
            })
            ignoreSideWeaponMalus(nebenwaffe)
            expect(nebenwaffe.system.at).toBe(4)
            expect(nebenwaffe.system.vt).toBe(4)
        })

        it('should not apply bonus if weapon is undefined', () => {
            const result = ignoreSideWeaponMalus(undefined)
            expect(result).toBeUndefined()
        })

        it('should apply bonus if weapon has schild property', () => {
            const nebenwaffe = createMockWeapon('nebenwaffe', 'nahkampfwaffe', {
                schild: true,
            })
            ignoreSideWeaponMalus(nebenwaffe, 'schild')
            expect(nebenwaffe.system.at).toBe(4)
            expect(nebenwaffe.system.vt).toBe(4)
        })
    })

    describe('checkComatStyleConditions', () => {
        const createMockWeaponWithSkill = (
            id,
            type = 'nahkampfwaffe',
            eigenschaften = {},
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

        it('should return true for empty or null conditions', () => {
            const mockWeapon = createMockWeapon('weapon1')
            expect(checkCombatStyleConditions('', mockWeapon, undefined, false)).toBe(true)
            expect(checkCombatStyleConditions(null, mockWeapon, undefined, false)).toBe(true)
            expect(checkCombatStyleConditions('   ', mockWeapon, undefined, false)).toBe(true)
        })

        it('should return false when hauptWaffe is undefined', () => {
            expect(checkCombatStyleConditions('beritten', undefined, undefined, true)).toBe(false)
            expect(checkCombatStyleConditions('reittier', undefined, undefined, false)).toBe(false)
            expect(checkCombatStyleConditions('', undefined, undefined, false)).toBe(false)
        })

        describe('mounted status conditions', () => {
            it('should check "beritten" condition correctly', () => {
                const mockWeapon = createMockWeapon('weapon1')
                expect(checkCombatStyleConditions('beritten', mockWeapon, undefined, true)).toBe(
                    true,
                )
                expect(checkCombatStyleConditions('beritten', mockWeapon, undefined, false)).toBe(
                    false,
                )
            })

            it('should check "nicht beritten" condition correctly', () => {
                const mockWeapon = createMockWeapon('weapon1')
                expect(
                    checkCombatStyleConditions('nicht beritten', mockWeapon, undefined, false),
                ).toBe(true)
                expect(
                    checkCombatStyleConditions('nicht beritten', mockWeapon, undefined, true),
                ).toBe(false)
            })
        })

        describe('weapon type/count conditions', () => {
            it('should check "einzelne waffe" condition correctly', () => {
                const singleWeapon = createMockWeapon('weapon1')
                expect(
                    checkCombatStyleConditions('einzelne waffe', singleWeapon, undefined, false),
                ).toBe(true)
                expect(
                    checkCombatStyleConditions(
                        'einzelne nahkampfwaffe',
                        singleWeapon,
                        undefined,
                        false,
                    ),
                ).toBe(true)
                expect(
                    checkCombatStyleConditions('einzelne waffe', singleWeapon, singleWeapon, false),
                ).toBe(true)

                const mockWeapon = createMockWeapon('weapon2')
                expect(
                    checkCombatStyleConditions('einzelne waffe', singleWeapon, mockWeapon, false),
                ).toBe(false)
            })

            it('should check "zwei einhändige waffen" condition correctly', () => {
                const weapon1 = createMockWeapon('weapon1')
                const weapon2 = createMockWeapon('weapon2')
                expect(
                    checkCombatStyleConditions('zwei einhändige waffen', weapon1, weapon2, false),
                ).toBe(true)
                expect(
                    checkCombatStyleConditions(
                        'zwei einhändige nahkampfwaffen',
                        weapon1,
                        weapon2,
                        false,
                    ),
                ).toBe(true)
                expect(
                    checkCombatStyleConditions('zwei einhändige waffen', weapon1, undefined, false),
                ).toBe(false)
            })

            it('should check "einzelne fernkampfwaffe" condition correctly', () => {
                const rangedWeapon = createMockWeapon('ranged1', 'fernkampfwaffe')
                expect(
                    checkCombatStyleConditions(
                        'einzelne fernkampfwaffe',
                        rangedWeapon,
                        undefined,
                        false,
                    ),
                ).toBe(true)
                expect(
                    checkCombatStyleConditions(
                        'einzelne fernkampfwaffe',
                        undefined,
                        rangedWeapon,
                        false,
                    ),
                ).toBe(false)

                const sameRangedWeapon = createMockWeapon('ranged2', 'fernkampfwaffe')
                expect(
                    checkCombatStyleConditions(
                        'einzelne fernkampfwaffe',
                        rangedWeapon,
                        sameRangedWeapon,
                        false,
                    ),
                ).toBe(false)

                const meleeWeapon = createMockWeapon('melee1', 'nahkampfwaffe')
                expect(
                    checkCombatStyleConditions(
                        'einzelne fernkampfwaffe',
                        meleeWeapon,
                        undefined,
                        false,
                    ),
                ).toBe(false)
            })

            it('should check "zwei einhändige fernkampfwaffen" condition correctly', () => {
                const rangedWeapon1 = createMockWeapon('ranged1', 'fernkampfwaffe')
                const rangedWeapon2 = createMockWeapon('ranged2', 'fernkampfwaffe')
                expect(
                    checkCombatStyleConditions(
                        'zwei einhändige fernkampfwaffen',
                        rangedWeapon1,
                        rangedWeapon2,
                        false,
                    ),
                ).toBe(true)

                const sameRangedWeapon = createMockWeapon('ranged1', 'fernkampfwaffe')
                expect(
                    checkCombatStyleConditions(
                        'zwei einhändige fernkampfwaffen',
                        rangedWeapon1,
                        sameRangedWeapon,
                        false,
                    ),
                ).toBe(false)
            })
        })

        describe('weapon skill conditions', () => {
            it('should check "Fertigkeit" condition correctly', () => {
                const weaponWithSkill = createMockWeaponWithSkill(
                    'weapon1',
                    'nahkampfwaffe',
                    {},
                    'hiebwaffen',
                )
                expect(
                    checkCombatStyleConditions(
                        'Fertigkeit Hiebwaffen',
                        weaponWithSkill,
                        undefined,
                        false,
                    ),
                ).toBe(true)
                expect(
                    checkCombatStyleConditions(
                        'Fertigkeit Hiebwaffen',
                        undefined,
                        weaponWithSkill,
                        false,
                    ),
                ).toBe(false)
                expect(
                    checkCombatStyleConditions(
                        'Fertigkeit Stichwaffen',
                        weaponWithSkill,
                        undefined,
                        false,
                    ),
                ).toBe(false)
            })
        })

        describe('weapon property conditions', () => {
            it('should check positive weapon properties correctly', () => {
                const weaponWithReittier = createMockWeapon('weapon1', 'nahkampfwaffe', {
                    reittier: true,
                })
                expect(
                    checkCombatStyleConditions('reittier', weaponWithReittier, undefined, false),
                ).toBe(true)
                expect(
                    checkCombatStyleConditions('reittier', undefined, weaponWithReittier, false),
                ).toBe(false)

                const weaponWithoutReittier = createMockWeapon('weapon2', 'nahkampfwaffe', {})
                expect(
                    checkCombatStyleConditions('reittier', weaponWithoutReittier, undefined, false),
                ).toBe(false)
            })

            it('should check negative weapon properties correctly', () => {
                const weaponWithReittier = createMockWeapon('weapon1', 'nahkampfwaffe', {
                    reittier: true,
                })
                expect(
                    checkCombatStyleConditions(
                        'kein reittier',
                        weaponWithReittier,
                        undefined,
                        false,
                    ),
                ).toBe(false)

                const weaponWithoutReittier = createMockWeapon('weapon2', 'nahkampfwaffe', {})
                expect(
                    checkCombatStyleConditions(
                        'kein reittier',
                        weaponWithoutReittier,
                        undefined,
                        false,
                    ),
                ).toBe(true)
            })
        })

        describe('multiple conditions', () => {
            it('should check multiple conditions separated by commas', () => {
                const weaponWithReittier = createMockWeaponWithSkill(
                    'weapon1',
                    'nahkampfwaffe',
                    { reittier: true },
                    'hiebwaffen',
                )

                // All conditions met
                expect(
                    checkCombatStyleConditions(
                        'beritten, reittier, Fertigkeit Hiebwaffen',
                        weaponWithReittier,
                        undefined,
                        true,
                    ),
                ).toBe(true)

                // One condition not met
                expect(
                    checkCombatStyleConditions(
                        'beritten, reittier, Fertigkeit Hiebwaffen',
                        weaponWithReittier,
                        undefined,
                        false,
                    ),
                ).toBe(false)

                // Mixed positive and negative conditions
                const weaponWithoutSchild = createMockWeapon('weapon2', 'nahkampfwaffe', {
                    reittier: true,
                })
                expect(
                    checkCombatStyleConditions(
                        'reittier, kein schild',
                        weaponWithoutSchild,
                        undefined,
                        false,
                    ),
                ).toBe(true)

                const weaponWithSchild = createMockWeapon('weapon3', 'nahkampfwaffe', {
                    reittier: true,
                    schild: true,
                })
                expect(
                    checkCombatStyleConditions(
                        'reittier, kein schild',
                        weaponWithSchild,
                        undefined,
                        false,
                    ),
                ).toBe(false)
            })

            it('should handle conditions with extra whitespace', () => {
                const weaponWithReittier = createMockWeapon('weapon1', 'nahkampfwaffe', {
                    reittier: true,
                })
                expect(
                    checkCombatStyleConditions(
                        ' beritten , reittier ',
                        weaponWithReittier,
                        undefined,
                        true,
                    ),
                ).toBe(true)
            })
        })

        describe('case sensitivity', () => {
            it('should handle case-insensitive keywords but preserve property case', () => {
                const mockWeapon = createMockWeapon('weapon1')
                expect(checkCombatStyleConditions('BERITTEN', mockWeapon, undefined, true)).toBe(
                    true,
                )
                expect(
                    checkCombatStyleConditions('Nicht Beritten', mockWeapon, undefined, false),
                ).toBe(true)
                expect(
                    checkCombatStyleConditions(
                        'EINZELNE WAFFE',
                        createMockWeapon('weapon1'),
                        undefined,
                        false,
                    ),
                ).toBe(true)

                const weaponWithReittier = createMockWeapon('weapon1', 'nahkampfwaffe', {
                    reittier: true,
                })
                expect(
                    checkCombatStyleConditions(
                        'KEIN reittier',
                        weaponWithReittier,
                        undefined,
                        false,
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
                },
            }
        })

        describe('BE reduction logic', () => {
            it('should apply full BE reduction when belastung is higher than modifiers.be', () => {
                const modifiers = { at: 2, vt: 1, be: 3, damage: 0 }
                const belastung = 5

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, modifiers)

                // Base modifiers + BE reduction (3)
                expect(hauptWaffe.system.at).toBe(15) // 10 + 2 + 3
                expect(hauptWaffe.system.vt).toBe(12) // 8 + 1 + 3
                expect(nebenWaffe.system.at).toBe(13) // 8 + 2 + 3
                expect(nebenWaffe.system.vt).toBe(10) // 6 + 1 + 3
            })

            it('should cap BE reduction at available belastung', () => {
                const modifiers = { at: 1, vt: 1, be: 5, damage: 0 }
                const belastung = 2

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, modifiers)

                // Base modifiers + capped BE reduction (2)
                expect(hauptWaffe.system.at).toBe(13) // 10 + 1 + 2
                expect(hauptWaffe.system.vt).toBe(11) // 8 + 1 + 2
                expect(nebenWaffe.system.at).toBe(11) // 8 + 1 + 2
                expect(nebenWaffe.system.vt).toBe(9) // 6 + 1 + 2
            })

            it('should not apply BE reduction when belastung is 0', () => {
                const modifiers = { at: 2, vt: 1, be: 3, damage: 0 }
                const belastung = 0

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, modifiers)

                // Only base modifiers, no BE reduction
                expect(hauptWaffe.system.at).toBe(12) // 10 + 2
                expect(hauptWaffe.system.vt).toBe(9) // 8 + 1
                expect(nebenWaffe.system.at).toBe(10) // 8 + 2
                expect(nebenWaffe.system.vt).toBe(7) // 6 + 1
            })

            it('should not apply BE reduction when modifiers.be is 0', () => {
                const modifiers = { at: 2, vt: 1, be: 0, damage: 0 }
                const belastung = 3

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, modifiers)

                // Only base modifiers, no BE reduction
                expect(hauptWaffe.system.at).toBe(12) // 10 + 2
                expect(hauptWaffe.system.vt).toBe(9) // 8 + 1
                expect(nebenWaffe.system.at).toBe(10) // 8 + 2
                expect(nebenWaffe.system.vt).toBe(7) // 6 + 1
            })

            it('should apply BE reduction when modifiers.be is  belastung', () => {
                const modifiers = { at: 2, vt: 1, be: 3, damage: 0 }
                const belastung = 3

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, modifiers)

                // Only base modifiers, no BE reduction
                expect(hauptWaffe.system.at).toBe(15) // 10 + 5
                expect(hauptWaffe.system.vt).toBe(12) // 8 + 4
                expect(nebenWaffe.system.at).toBe(13) // 8 + 5
                expect(nebenWaffe.system.vt).toBe(10) // 6 + 4
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
                    },
                }

                nebenWaffe = {
                    id: 'ranged-weapon-2',
                    type: 'fernkampfwaffe',
                    system: {
                        fk: 10,
                        schaden: '1W6',
                    },
                }
            })

            it('should apply modifiers to ranged weapons when affectRanged is true', () => {
                const modifiers = { at: 3, vt: 0, be: 2, damage: 1 }
                const belastung = 4

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, modifiers, true)

                // FK gets at modifier + BE reduction
                expect(hauptWaffe.system.fk).toBe(17) // 12 + 3 + 2
                expect(hauptWaffe.system.schaden).toBe('1W6+1+1')
                expect(nebenWaffe.system.fk).toBe(15) // 10 + 3 + 2
                expect(nebenWaffe.system.schaden).toBe('1W6+1')
            })

            it('should not apply modifiers to ranged weapons when affectRanged is false', () => {
                const modifiers = { at: 3, vt: 0, be: 2, damage: 1 }
                const belastung = 4

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, modifiers, false)

                // Should remain unchanged
                expect(hauptWaffe.system.fk).toBe(12)
                expect(hauptWaffe.system.schaden).toBe('1W6+1')
                expect(nebenWaffe.system.fk).toBe(10)
                expect(nebenWaffe.system.schaden).toBe('1W6')
            })
        })

        describe('damage modifiers', () => {
            it('should append damage bonus to weapon damage', () => {
                const modifiers = { at: 0, vt: 0, be: 0, damage: 3 }
                const belastung = 0

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, modifiers)

                expect(hauptWaffe.system.schaden).toBe('1W6+2+3')
                expect(nebenWaffe.system.schaden).toBe('1W6+3')
            })

            it('should not modify damage when damage modifier is 0', () => {
                const modifiers = { at: 2, vt: 1, be: 0, damage: 0 }
                const belastung = 0

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, modifiers)

                expect(hauptWaffe.system.schaden).toBe('1W6+2')
                expect(nebenWaffe.system.schaden).toBe('1W6')
            })
        })

        describe('single weapon scenarios', () => {
            it('should only modify hauptWaffe when nebenWaffe is undefined', () => {
                const modifiers = { at: 2, vt: 1, be: 1, damage: 0 }
                const belastung = 2

                applyModifierToWeapons(hauptWaffe, undefined, belastung, modifiers)

                expect(hauptWaffe.system.at).toBe(13) // 10 + 2 + 1
                expect(hauptWaffe.system.vt).toBe(10) // 8 + 1 + 1
            })

            it('should not modify nebenWaffe when it has same id as hauptWaffe', () => {
                nebenWaffe.id = hauptWaffe.id // Same weapon in both hands
                const originalAt = nebenWaffe.system.at
                const originalVt = nebenWaffe.system.vt

                const modifiers = { at: 2, vt: 1, be: 1, damage: 0 }
                const belastung = 2

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, modifiers)

                // Only hauptWaffe should be modified
                expect(hauptWaffe.system.at).toBe(13) // 10 + 2 + 1
                expect(hauptWaffe.system.vt).toBe(10) // 8 + 1 + 1

                // nebenWaffe should remain unchanged since it's the same weapon
                expect(nebenWaffe.system.at).toBe(originalAt)
                expect(nebenWaffe.system.vt).toBe(originalVt)
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
                    },
                }

                const modifiers = { at: 2, vt: 1, be: 1, damage: 0 }
                const belastung = 2

                // Test with affectRanged = false
                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, modifiers, false)

                // Melee weapon should be modified
                expect(hauptWaffe.system.at).toBe(13) // 10 + 2 + 1
                expect(hauptWaffe.system.vt).toBe(10) // 8 + 1 + 1

                // Ranged weapon should remain unchanged
                expect(nebenWaffe.system.fk).toBe(10)

                // Reset and test with affectRanged = true
                nebenWaffe.system.fk = 10 // Reset
                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, modifiers, true)

                // Ranged weapon should now be modified
                expect(nebenWaffe.system.fk).toBe(13) // 10 + 2 + 1
            })
        })

        describe('edge cases', () => {
            it('should handle undefined hauptWaffe gracefully', () => {
                const modifiers = { at: 2, vt: 1, be: 1, damage: 0 }
                const belastung = 2

                expect(() => {
                    applyModifierToWeapons(undefined, nebenWaffe, belastung, modifiers)
                }).not.toThrow()
            })

            it('should handle negative modifiers', () => {
                const modifiers = { at: -2, vt: -1, be: 1, damage: -1 }
                const belastung = 2

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, modifiers)

                expect(hauptWaffe.system.at).toBe(9) // 10 - 2 + 1
                expect(hauptWaffe.system.vt).toBe(8) // 8 - 1 + 1
                expect(hauptWaffe.system.schaden).toBe('1W6+2-1')
            })

            it('should handle zero values for all parameters', () => {
                const modifiers = { at: 0, vt: 0, be: 0, damage: 0 }
                const belastung = 0

                const originalHauptAt = hauptWaffe.system.at
                const originalHauptVt = hauptWaffe.system.vt
                const originalNebenAt = nebenWaffe.system.at
                const originalNebenVt = nebenWaffe.system.vt

                applyModifierToWeapons(hauptWaffe, nebenWaffe, belastung, modifiers)

                // Values should remain unchanged
                expect(hauptWaffe.system.at).toBe(originalHauptAt)
                expect(hauptWaffe.system.vt).toBe(originalHauptVt)
                expect(nebenWaffe.system.at).toBe(originalNebenAt)
                expect(nebenWaffe.system.vt).toBe(originalNebenVt)
            })
        })
    })
})
