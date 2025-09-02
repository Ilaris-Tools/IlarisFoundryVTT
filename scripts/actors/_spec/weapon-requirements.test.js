import {
    usesSingleMeleeWeapon,
    usesTwoMeleeWeapons,
    anyWeaponNeedsToMeetRequirement,
} from '../weapon-requirements.js'

describe('weapon-requirements.js', () => {
    // Mock weapon objects for testing
    const createMockWeapon = (id, type = 'nahkampfwaffe', eigenschaften = {}) => ({
        id,
        type,
        system: {
            eigenschaften,
        },
    })

    const mockMeleeWeapon1 = createMockWeapon('weapon1', 'nahkampfwaffe', {})
    const mockMeleeWeapon2 = createMockWeapon('weapon2', 'nahkampfwaffe', {})
    const mockSameWeapon = createMockWeapon('weapon1', 'nahkampfwaffe', {})
    const mockRangedWeapon = createMockWeapon('ranged1', 'fernkampfwaffe', {})
    const mockRidingWeapon = createMockWeapon('riding1', 'nahkampfwaffe', { reittier: true })
    const mockShieldWeapon = createMockWeapon('shield1', 'nahkampfwaffe', { schild: true })
    const mockRidingShieldWeapon = createMockWeapon('ridingShield1', 'nahkampfwaffe', {
        reittier: true,
        schild: true,
    })

    describe('usesSingleMeleeWeapon', () => {
        it('should return null when both weapons are undefined', () => {
            const result = usesSingleMeleeWeapon(undefined, undefined)
            expect(result).toBeNull()
        })

        it('should return the hauptWaffe when only hauptWaffe is provided', () => {
            const result = usesSingleMeleeWeapon(mockMeleeWeapon1, undefined)
            expect(result).toBe(mockMeleeWeapon1)
        })

        it('should return the nebenWaffe when only nebenWaffe is provided', () => {
            const result = usesSingleMeleeWeapon(undefined, mockMeleeWeapon2)
            expect(result).toBe(mockMeleeWeapon2)
        })

        it('should return the weapon when both weapons are the same', () => {
            const result = usesSingleMeleeWeapon(mockMeleeWeapon1, mockSameWeapon)
            expect(result).toBe(mockMeleeWeapon1)
        })

        it('should return null when both weapons are provided but different', () => {
            const result = usesSingleMeleeWeapon(mockMeleeWeapon1, mockMeleeWeapon2)
            expect(result).toBeNull()
        })

        it('should return null when weapon requires riding but riding is not allowed', () => {
            const result = usesSingleMeleeWeapon(mockRidingWeapon, undefined, false)
            expect(result).toBeNull()
        })

        it('should return the weapon when weapon requires riding and riding is allowed', () => {
            const result = usesSingleMeleeWeapon(mockRidingWeapon, undefined, true)
            expect(result).toBe(mockRidingWeapon)
        })

        it('should handle weapons without eigenschaften property', () => {
            const weaponWithoutEigenschaften = {
                id: 'weapon3',
                type: 'nahkampfwaffe',
                system: {},
            }
            const result = usesSingleMeleeWeapon(weaponWithoutEigenschaften, undefined)
            expect(result).toBe(weaponWithoutEigenschaften)
        })
    })

    describe('usesTwoMeleeWeapons', () => {
        it('should return false when hauptWaffe is undefined', () => {
            const result = usesTwoMeleeWeapons(undefined, mockMeleeWeapon2)
            expect(result).toBe(false)
        })

        it('should return false when nebenWaffe is undefined', () => {
            const result = usesTwoMeleeWeapons(mockMeleeWeapon1, undefined)
            expect(result).toBe(false)
        })

        it('should return false when both weapons are undefined', () => {
            const result = usesTwoMeleeWeapons(undefined, undefined)
            expect(result).toBe(false)
        })

        it('should return false when both weapons have the same id', () => {
            const result = usesTwoMeleeWeapons(mockMeleeWeapon1, mockSameWeapon)
            expect(result).toBe(false)
        })

        it('should return false when hauptWaffe is not a melee weapon', () => {
            const result = usesTwoMeleeWeapons(mockRangedWeapon, mockMeleeWeapon2)
            expect(result).toBe(false)
        })

        it('should return false when nebenWaffe is not a melee weapon', () => {
            const result = usesTwoMeleeWeapons(mockMeleeWeapon1, mockRangedWeapon)
            expect(result).toBe(false)
        })

        it('should return true when both weapons are different melee weapons', () => {
            const result = usesTwoMeleeWeapons(mockMeleeWeapon1, mockMeleeWeapon2)
            expect(result).toBe(true)
        })

        it('should return false when one weapon requires riding but riding is not allowed', () => {
            const result = usesTwoMeleeWeapons(mockRidingWeapon, mockMeleeWeapon2, false)
            expect(result).toBe(false)
        })

        it('should return true when one weapon requires riding and riding is allowed', () => {
            const result = usesTwoMeleeWeapons(mockRidingWeapon, mockMeleeWeapon2, true)
            expect(result).toBe(true)
        })

        it('should return false when one weapon requires shield but shield is not allowed', () => {
            const result = usesTwoMeleeWeapons(mockShieldWeapon, mockMeleeWeapon2, false, false)
            expect(result).toBe(false)
        })

        it('should return true when one weapon requires shield and shield is allowed', () => {
            const result = usesTwoMeleeWeapons(mockShieldWeapon, mockMeleeWeapon2, false, true)
            expect(result).toBe(true)
        })

        it('should return false when weapon requires both riding and shield but only one is allowed', () => {
            const result = usesTwoMeleeWeapons(
                mockRidingShieldWeapon,
                mockMeleeWeapon2,
                true,
                false,
            )
            expect(result).toBe(false)
        })

        it('should return true when weapon requires both riding and shield and both are allowed', () => {
            const result = usesTwoMeleeWeapons(mockRidingShieldWeapon, mockMeleeWeapon2, true, true)
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
})
