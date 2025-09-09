import {
    usesSingleWeapon,
    usesTwoWeapons,
    anyWeaponNeedsToMeetRequirement,
    ignoreSideWeaponMalus,
    checkComatStyleConditions,
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
            expect(checkComatStyleConditions('', mockWeapon, undefined, false)).toBe(true)
            expect(checkComatStyleConditions(null, mockWeapon, undefined, false)).toBe(true)
            expect(checkComatStyleConditions('   ', mockWeapon, undefined, false)).toBe(true)
        })

        it('should return false when hauptWaffe is undefined', () => {
            expect(checkComatStyleConditions('beritten', undefined, undefined, true)).toBe(false)
            expect(checkComatStyleConditions('reittier', undefined, undefined, false)).toBe(false)
            expect(checkComatStyleConditions('', undefined, undefined, false)).toBe(false)
        })

        describe('mounted status conditions', () => {
            it('should check "beritten" condition correctly', () => {
                const mockWeapon = createMockWeapon('weapon1')
                expect(checkComatStyleConditions('beritten', mockWeapon, undefined, true)).toBe(
                    true,
                )
                expect(checkComatStyleConditions('beritten', mockWeapon, undefined, false)).toBe(
                    false,
                )
            })

            it('should check "nicht beritten" condition correctly', () => {
                const mockWeapon = createMockWeapon('weapon1')
                expect(
                    checkComatStyleConditions('nicht beritten', mockWeapon, undefined, false),
                ).toBe(true)
                expect(
                    checkComatStyleConditions('nicht beritten', mockWeapon, undefined, true),
                ).toBe(false)
            })
        })

        describe('weapon type/count conditions', () => {
            it('should check "einzelne waffe" condition correctly', () => {
                const singleWeapon = createMockWeapon('weapon1')
                expect(
                    checkComatStyleConditions('einzelne waffe', singleWeapon, undefined, false),
                ).toBe(true)
                expect(
                    checkComatStyleConditions(
                        'einzelne nahkampfwaffe',
                        singleWeapon,
                        undefined,
                        false,
                    ),
                ).toBe(true)
                expect(
                    checkComatStyleConditions('einzelne waffe', singleWeapon, singleWeapon, false),
                ).toBe(true)

                const mockWeapon = createMockWeapon('weapon2')
                expect(
                    checkComatStyleConditions('einzelne waffe', singleWeapon, mockWeapon, false),
                ).toBe(false)
            })

            it('should check "zwei einhändige waffen" condition correctly', () => {
                const weapon1 = createMockWeapon('weapon1')
                const weapon2 = createMockWeapon('weapon2')
                expect(
                    checkComatStyleConditions('zwei einhändige waffen', weapon1, weapon2, false),
                ).toBe(true)
                expect(
                    checkComatStyleConditions(
                        'zwei einhändige nahkampfwaffen',
                        weapon1,
                        weapon2,
                        false,
                    ),
                ).toBe(true)
                expect(
                    checkComatStyleConditions('zwei einhändige waffen', weapon1, undefined, false),
                ).toBe(false)
            })

            it('should check "einzelne fernkampfwaffe" condition correctly', () => {
                const rangedWeapon = createMockWeapon('ranged1', 'fernkampfwaffe')
                expect(
                    checkComatStyleConditions(
                        'einzelne fernkampfwaffe',
                        rangedWeapon,
                        undefined,
                        false,
                    ),
                ).toBe(true)
                expect(
                    checkComatStyleConditions(
                        'einzelne fernkampfwaffe',
                        undefined,
                        rangedWeapon,
                        false,
                    ),
                ).toBe(false)

                const sameRangedWeapon = createMockWeapon('ranged2', 'fernkampfwaffe')
                expect(
                    checkComatStyleConditions(
                        'einzelne fernkampfwaffe',
                        rangedWeapon,
                        sameRangedWeapon,
                        false,
                    ),
                ).toBe(false)

                const meleeWeapon = createMockWeapon('melee1', 'nahkampfwaffe')
                expect(
                    checkComatStyleConditions(
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
                    checkComatStyleConditions(
                        'zwei einhändige fernkampfwaffen',
                        rangedWeapon1,
                        rangedWeapon2,
                        false,
                    ),
                ).toBe(true)

                const sameRangedWeapon = createMockWeapon('ranged1', 'fernkampfwaffe')
                expect(
                    checkComatStyleConditions(
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
                    checkComatStyleConditions(
                        'Fertigkeit Hiebwaffen',
                        weaponWithSkill,
                        undefined,
                        false,
                    ),
                ).toBe(true)
                expect(
                    checkComatStyleConditions(
                        'Fertigkeit Hiebwaffen',
                        undefined,
                        weaponWithSkill,
                        false,
                    ),
                ).toBe(false)
                expect(
                    checkComatStyleConditions(
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
                    checkComatStyleConditions('reittier', weaponWithReittier, undefined, false),
                ).toBe(true)
                expect(
                    checkComatStyleConditions('reittier', undefined, weaponWithReittier, false),
                ).toBe(false)

                const weaponWithoutReittier = createMockWeapon('weapon2', 'nahkampfwaffe', {})
                expect(
                    checkComatStyleConditions('reittier', weaponWithoutReittier, undefined, false),
                ).toBe(false)
            })

            it('should check negative weapon properties correctly', () => {
                const weaponWithReittier = createMockWeapon('weapon1', 'nahkampfwaffe', {
                    reittier: true,
                })
                expect(
                    checkComatStyleConditions(
                        'kein reittier',
                        weaponWithReittier,
                        undefined,
                        false,
                    ),
                ).toBe(false)

                const weaponWithoutReittier = createMockWeapon('weapon2', 'nahkampfwaffe', {})
                expect(
                    checkComatStyleConditions(
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
                    checkComatStyleConditions(
                        'beritten, reittier, Fertigkeit Hiebwaffen',
                        weaponWithReittier,
                        undefined,
                        true,
                    ),
                ).toBe(true)

                // One condition not met
                expect(
                    checkComatStyleConditions(
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
                    checkComatStyleConditions(
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
                    checkComatStyleConditions(
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
                    checkComatStyleConditions(
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
                expect(checkComatStyleConditions('BERITTEN', mockWeapon, undefined, true)).toBe(
                    true,
                )
                expect(
                    checkComatStyleConditions('Nicht Beritten', mockWeapon, undefined, false),
                ).toBe(true)
                expect(
                    checkComatStyleConditions(
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
                    checkComatStyleConditions(
                        'KEIN reittier',
                        weaponWithReittier,
                        undefined,
                        false,
                    ),
                ).toBe(false)
            })
        })
    })
})
