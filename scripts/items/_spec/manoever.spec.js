// Mock the parent class
jest.mock('../data/item.js', () => ({
    IlarisItem: class MockIlarisItem {
        constructor(data = {}) {
            this.name = data.name || 'Test Item'
            this.system = data.system || {}
        }
    },
}))

// Import the actual class we want to test
const { ManoeverItem } = require('../data/manoever.js')

describe('ManoeverItem', () => {
    let manoever
    let mockActor
    let mockItem

    beforeEach(() => {
        manoever = new ManoeverItem({
            name: 'Test Manöver',
            system: {},
        })
        mockActor = {
            _hasVorteil: jest.fn(),
        }
        mockItem = {
            type: 'waffe',
            system: {
                eigenschaften: [],
                angriffmanover: [],
            },
        }
    })

    describe('_manoeverRequirementsFulfilled', () => {
        it('should return true if no requirements are set', () => {
            manoever.system = { voraussetzungen: '' }
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(true)
        })

        it('should bypass requirements if maneuver is in item angriffmanover list', () => {
            manoever.system = { voraussetzungen: 'Vorteil Kampfgespür' }
            mockItem.system.angriffmanover = ['Test Manöver']
            mockActor._hasVorteil.mockReturnValue(false)
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(true)
        })

        it('should check single Waffeneigenschaft requirement', () => {
            manoever.system = { voraussetzungen: 'Waffeneigenschaft Zweihändig' }
            mockItem.system.eigenschaften = [{ key: 'Zweihändig' }]
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(true)

            mockItem.system.eigenschaften = []
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(false)
        })

        it('should check single Vorteil requirement', () => {
            manoever.system = { voraussetzungen: 'Vorteil Kampfgespür' }
            mockActor._hasVorteil.mockReturnValue(true)
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(true)

            mockActor._hasVorteil.mockReturnValue(false)
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(false)
        })

        it('should handle AND conditions', () => {
            manoever.system = {
                voraussetzungen: 'Waffeneigenschaft Zweihändig, Vorteil Kampfgespür',
            }
            mockItem.system.eigenschaften = [{ key: 'Zweihändig' }]
            mockActor._hasVorteil.mockReturnValue(true)
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(true)

            mockItem.system.eigenschaften = []
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(false)

            mockItem.system.eigenschaften = [{ key: 'Zweihändig' }]
            mockActor._hasVorteil.mockReturnValue(false)
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(false)
        })

        it('should handle OR conditions', () => {
            manoever.system = {
                voraussetzungen: 'Waffeneigenschaft Zweihändig ODER Vorteil Kampfgespür',
            }
            mockItem.system.eigenschaften = [{ key: 'Zweihändig' }]
            mockActor._hasVorteil.mockReturnValue(false)
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(true)

            mockItem.system.eigenschaften = []
            mockActor._hasVorteil.mockReturnValue(true)
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(true)

            mockItem.system.eigenschaften = []
            mockActor._hasVorteil.mockReturnValue(false)
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(false)
        })

        it('should handle complex AND/OR combinations', () => {
            manoever.system = {
                voraussetzungen: 'Vorteil vorteil1, Vorteil vorteilA ODER Vorteil vorteilB',
            }

            // Test case: vorteil1 true, vorteilA true (should pass)
            mockActor._hasVorteil.mockImplementation((vorteil) => {
                return vorteil === 'vorteil1' || vorteil === 'vorteilA'
            })
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(true)

            // Test case: vorteil1 true, vorteilB true (should pass)
            mockActor._hasVorteil.mockImplementation((vorteil) => {
                return vorteil === 'vorteil1' || vorteil === 'vorteilB'
            })
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(true)

            // Test case: vorteil1 false, both vorteilA and vorteilB true (should fail)
            mockActor._hasVorteil.mockImplementation((vorteil) => {
                return vorteil === 'vorteilA' || vorteil === 'vorteilB'
            })
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(false)
        })
    })
})
