// Mock Foundry's Item class
class MockItem {
    constructor() {
        // Add any foundry Item properties needed for tests
    }
}

// Mock IlarisItem class
class MockIlarisItem extends MockItem {
    constructor() {
        super();
        // Add any IlarisItem specific properties needed for tests
    }
}

// Mock our actual class but extend from MockIlarisItem
class IlarisManoever extends MockIlarisItem {
    _manoeverRequirementsFulfilled(actor, item) {
        if (!this.system.voraussetzungen) {
            return true;
        }

        // First split by comma to get AND conditions
        const andConditions = this.system.voraussetzungen.split(",").map(c => c.trim());
        
        // For each AND condition, check if any of its OR parts is fulfilled
        return andConditions.every(andCondition => {
            // Split by ODER to get OR conditions
            const orParts = andCondition.split(" ODER ");
            
            // Check if any of the OR parts is fulfilled
            return orParts.some(condition => {
                const parts = condition.trim().split(" ");
                const type = parts[0];
                const value = parts.slice(1).join(" ");

                switch(type) {
                    case "Waffeneigenschaft":
                        // Find the key where the value matches
                        const eigenschaftKey = Object.entries(CONFIG.ILARIS.waffeneigenschaften)
                            .find(([key, val]) => val === value)?.[0];
                        return eigenschaftKey ? item.system.eigenschaften[eigenschaftKey] : false;
                    case "Vorteil":
                        return actor._hasVorteil(value);
                    default:
                        return false;
                }
            });
        });
    }
}

describe('IlarisManoever', () => {
    let manoever;
    let mockActor;
    let mockItem;

    beforeEach(() => {
        manoever = new IlarisManoever();
        mockActor = {
            _hasVorteil: jest.fn()
        };
        mockItem = {
            system: {
                eigenschaften: {}
            }
        };
        global.CONFIG = {
            ILARIS: {
                waffeneigenschaften: {
                    'zweihaendig': 'Zweihändig',
                    'kopflastig': 'Kopflastig',
                    'scharf': 'Scharf'
                }
            }
        };
    });

    describe('_manoeverRequirementsFulfilled', () => {
        it('should return true if no requirements are set', () => {
            manoever.system = { voraussetzungen: '' };
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(true);
        });

        it('should check single Waffeneigenschaft requirement', () => {
            manoever.system = { voraussetzungen: 'Waffeneigenschaft Zweihändig' };
            mockItem.system.eigenschaften.zweihaendig = true;
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(true);

            mockItem.system.eigenschaften.zweihaendig = false;
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(false);
        });

        it('should check single Vorteil requirement', () => {
            manoever.system = { voraussetzungen: 'Vorteil Kampfgespür' };
            mockActor._hasVorteil.mockReturnValue(true);
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(true);

            mockActor._hasVorteil.mockReturnValue(false);
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(false);
        });

        it('should handle AND conditions', () => {
            manoever.system = { voraussetzungen: 'Waffeneigenschaft Zweihändig, Vorteil Kampfgespür' };
            mockItem.system.eigenschaften.zweihaendig = true;
            mockActor._hasVorteil.mockReturnValue(true);
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(true);

            mockItem.system.eigenschaften.zweihaendig = false;
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(false);

            mockItem.system.eigenschaften.zweihaendig = true;
            mockActor._hasVorteil.mockReturnValue(false);
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(false);
        });

        it('should handle OR conditions', () => {
            manoever.system = { voraussetzungen: 'Waffeneigenschaft Zweihändig ODER Vorteil Kampfgespür' };
            mockItem.system.eigenschaften.zweihaendig = true;
            mockActor._hasVorteil.mockReturnValue(false);
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(true);

            mockItem.system.eigenschaften.zweihaendig = false;
            mockActor._hasVorteil.mockReturnValue(true);
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(true);

            mockItem.system.eigenschaften.zweihaendig = false;
            mockActor._hasVorteil.mockReturnValue(false);
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(false);
        });

        it('should handle complex AND/OR combinations', () => {
            manoever.system = { voraussetzungen: 'Vorteil vorteil1, Vorteil vorteilA ODER Vorteil vorteilB' };
            
            // Test case: vorteil1 true, vorteilA true (should pass)
            mockActor._hasVorteil.mockImplementation((vorteil) => {
                return vorteil === 'vorteil1' || vorteil === 'vorteilA';
            });
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(true);

            // Test case: vorteil1 true, vorteilB true (should pass)
            mockActor._hasVorteil.mockImplementation((vorteil) => {
                return vorteil === 'vorteil1' || vorteil === 'vorteilB';
            });
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(true);

            // Test case: vorteil1 false, both vorteilA and vorteilB true (should fail)
            mockActor._hasVorteil.mockImplementation((vorteil) => {
                return vorteil === 'vorteilA' || vorteil === 'vorteilB';
            });
            expect(manoever._manoeverRequirementsFulfilled(mockActor, mockItem)).toBe(false);
        });
    });
}); 