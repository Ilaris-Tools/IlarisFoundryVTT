import { isNumericCost } from '../../../common/utilities.js'

describe('UebernatuerlichDialog canSetEnergyCost logic', () => {
    // Mock the getData logic for canSetEnergyCost
    function calculateCanSetEnergyCost(actor, item) {
        return (
            actor.vorteil?.magie?.some((v) => v.name === 'Unitatio') ||
            !isNumericCost(item.system.kosten)
        )
    }

    const createMockActor = (hasUnitatio = false) => ({
        vorteil: {
            magie: hasUnitatio ? [{ name: 'Unitatio' }] : [],
        },
    })

    const createMockItem = (kosten) => ({
        system: { kosten },
    })

    describe('with Unitatio advantage', () => {
        it('should always allow setting energy cost', () => {
            const actor = createMockActor(true)
            const item = createMockItem('5')

            expect(calculateCanSetEnergyCost(actor, item)).toBe(true)
        })

        it('should allow setting energy cost even with numeric costs', () => {
            const actor = createMockActor(true)
            const item = createMockItem('10')

            expect(calculateCanSetEnergyCost(actor, item)).toBe(true)
        })

        it('should allow setting energy cost with arbitrary costs', () => {
            const actor = createMockActor(true)
            const item = createMockItem('beliebig')

            expect(calculateCanSetEnergyCost(actor, item)).toBe(true)
        })
    })

    describe('without Unitatio advantage', () => {
        it('should not allow setting energy cost for numeric costs', () => {
            const actor = createMockActor(false)
            const item = createMockItem('5')

            expect(calculateCanSetEnergyCost(actor, item)).toBe(false)
        })

        it('should not allow setting energy cost for mixed numeric costs', () => {
            const actor = createMockActor(false)
            const item = createMockItem('5 AsP')

            expect(calculateCanSetEnergyCost(actor, item)).toBe(false)
        })

        it('should allow setting energy cost for arbitrary costs', () => {
            const actor = createMockActor(false)
            const item = createMockItem('beliebig')

            expect(calculateCanSetEnergyCost(actor, item)).toBe(true)
        })

        it('should allow setting energy cost for non-numeric costs', () => {
            const actor = createMockActor(false)
            const item = createMockItem('nach Dämon')

            expect(calculateCanSetEnergyCost(actor, item)).toBe(true)
        })

        it('should allow setting energy cost for variable costs', () => {
            const actor = createMockActor(false)
            const item = createMockItem('variabel')

            expect(calculateCanSetEnergyCost(actor, item)).toBe(true)
        })
    })
})

describe('Gildenmagier II Bonus logic', () => {
    // Mock the logic for counting base maneuvers
    function countBaseManoever(maneuvers) {
        let baseManoverCount = 0
        maneuvers.forEach((manoever) => {
            // Check if maneuver is selected (has a value)
            const hasValue =
                (manoever.inputValue.field === 'CHECKBOX' && manoever.inputValue.value) ||
                (manoever.inputValue.field === 'NUMBER' && manoever.inputValue.value > 0) ||
                (manoever.inputValue.field === 'TREFFER_ZONE' && manoever.inputValue.value > 0)

            if (hasValue && manoever.system.isBaseManover) {
                baseManoverCount++
            }
        })
        return baseManoverCount
    }

    function shouldApplyGildenmagierBonus(actor, item, baseManoverCount) {
        return (
            baseManoverCount >= 2 &&
            actor.type === 'held' &&
            item.type === 'zauber' &&
            actor.vorteil?.magie?.some(
                (v) =>
                    v.name === 'Tradition der Gildenmagier II' ||
                    v.name === 'Tradition der Gildenmagier III' ||
                    v.name === 'Tradition der Gildenmagier IV',
            )
        )
    }

    const createMockManoever = (name, isBase, inputField, inputValue) => ({
        name,
        system: { isBaseManover: isBase },
        inputValue: { field: inputField, value: inputValue },
    })

    describe('counting base maneuvers', () => {
        it('should count 0 base maneuvers when none are selected', () => {
            const maneuvers = [
                createMockManoever('Mächtige Magie', true, 'CHECKBOX', false),
                createMockManoever('Mehrere Ziele', true, 'CHECKBOX', false),
            ]

            expect(countBaseManoever(maneuvers)).toBe(0)
        })

        it('should count 1 base maneuver when only one is selected', () => {
            const maneuvers = [
                createMockManoever('Mächtige Magie', true, 'CHECKBOX', true),
                createMockManoever('Mehrere Ziele', true, 'CHECKBOX', false),
            ]

            expect(countBaseManoever(maneuvers)).toBe(1)
        })

        it('should count 2 base maneuvers when two are selected', () => {
            const maneuvers = [
                createMockManoever('Mächtige Magie', true, 'NUMBER', 2),
                createMockManoever('Mehrere Ziele', true, 'CHECKBOX', true),
            ]

            expect(countBaseManoever(maneuvers)).toBe(2)
        })

        it('should not count advanced maneuvers', () => {
            const maneuvers = [
                createMockManoever('Mächtige Magie', true, 'CHECKBOX', true),
                createMockManoever('Kosten sparen', false, 'CHECKBOX', true),
                createMockManoever('Zeit lassen', false, 'CHECKBOX', true),
            ]

            expect(countBaseManoever(maneuvers)).toBe(1)
        })

        it('should count each base maneuver', () => {
            const maneuvers = [
                createMockManoever('Mächtige Magie', true, 'NUMBER', 3),
                createMockManoever('Mehrere Ziele', true, 'CHECKBOX', true),
            ]

            expect(countBaseManoever(maneuvers)).toBe(2)
        })
    })

    describe('applying Gildenmagier II bonus', () => {
        const createActor = (hasGildenmagierII, type = 'held') => ({
            type,
            vorteil: {
                magie: hasGildenmagierII ? [{ name: 'Tradition der Gildenmagier II' }] : [],
            },
        })

        const createItem = (type = 'zauber') => ({ type })

        it('should apply bonus with 2 base maneuvers and Gildenmagier II', () => {
            const actor = createActor(true)
            const item = createItem('zauber')
            const baseCount = 2

            expect(shouldApplyGildenmagierBonus(actor, item, baseCount)).toBe(true)
        })

        it('should not apply bonus with only 1 base maneuver', () => {
            const actor = createActor(true)
            const item = createItem('zauber')
            const baseCount = 1

            expect(shouldApplyGildenmagierBonus(actor, item, baseCount)).toBe(false)
        })

        it('should not apply bonus without Gildenmagier II advantage', () => {
            const actor = createActor(false)
            const item = createItem('zauber')
            const baseCount = 2

            expect(shouldApplyGildenmagierBonus(actor, item, baseCount)).toBe(false)
        })

        it('should not apply bonus for liturgies', () => {
            const actor = createActor(true)
            const item = createItem('liturgie')
            const baseCount = 2

            expect(shouldApplyGildenmagierBonus(actor, item, baseCount)).toBe(false)
        })

        it('should apply bonus with Gildenmagier III', () => {
            const actor = {
                type: 'held',
                vorteil: { magie: [{ name: 'Tradition der Gildenmagier III' }] },
            }
            const item = createItem('zauber')
            const baseCount = 2

            expect(shouldApplyGildenmagierBonus(actor, item, baseCount)).toBe(true)
        })

        it('should apply bonus with Gildenmagier IV', () => {
            const actor = {
                type: 'held',
                vorteil: { magie: [{ name: 'Tradition der Gildenmagier IV' }] },
            }
            const item = createItem('zauber')
            const baseCount = 3

            expect(shouldApplyGildenmagierBonus(actor, item, baseCount)).toBe(true)
        })

        it('should not apply bonus for creatures', () => {
            const actor = createActor(true, 'kreatur')
            const item = createItem('zauber')
            const baseCount = 2

            expect(shouldApplyGildenmagierBonus(actor, item, baseCount)).toBe(false)
        })
    })
})
