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
