import { getKampfstile, getSelectedStil, getKampfstilStufe, calculateModifiedCost, beTraglast } from '../hardcodedvorteile.js';

jest.mock('../hardcodedvorteile.js', () => ({
    ...jest.requireActual('../hardcodedvorteile.js'),
    getSelectedStil: jest.fn().mockImplementation(() => ({
        name: 'ohne',
        stufe: 0
    }))
}));

jest.mock('./../../settings/configure-game-settings.js', () => ({}));


describe('hardcodedvorteile.js', ()=> {
    describe('getKampfstile', () => {
        beforeEach(() => {
            global.CONFIG = {
                ILARIS: {
                    label: {
                        'ohne': 'Ohne'
                    }
                }
            };
        });

        it('should return object with ohne as default', () => {
            const actor = { vorteil: { kampfstil: [] } };
            const result = getKampfstile(actor);
            
            expect(result).toEqual({
                'ohne': {
                    name: 'Ohne',
                    key: 'ohne',
                    stufe: 0,
                    sources: []
                }
            });
        });

        it('should group kampfstile and use highest level', () => {
            const actor = {
                vorteil: {
                    kampfstil: [
                        { 
                            name: 'Beidhändiger Kampf I',
                            _stats: { compendiumSource: 'Ilaris.beidhändig1' }
                        },
                        {
                            name: 'Beidhändiger Kampf II (test)',
                            _stats: { compendiumSource: 'Ilaris.beidhändig2' }
                        }
                    ]
                }
            };
            
            const result = getKampfstile(actor);
            
            expect(result).toEqual({
                'ohne': {
                    name: 'Ohne',
                    key: 'ohne',
                    stufe: 0,
                    sources: []
                },
                'Ilaris.beidhändig2': {
                    name: 'Beidhändiger Kampf',
                    key: 'Ilaris.beidhändig2',
                    stufe: 2,
                    sources: ['Ilaris.beidhändig1', 'Ilaris.beidhändig2']
                }
            });
        });

        it('should handle multiple different kampfstile', () => {
            const actor = {
                vorteil: {
                    kampfstil: [
                        {
                            name: 'Beidhändiger Kampf I',
                            _stats: { compendiumSource: 'Ilaris.beidhändig1' }
                        },
                        {
                            name: 'Defensiver Kampfstil II',
                            _stats: { compendiumSource: 'Ilaris.defensiv2' }
                        }
                    ]
                }
            };
            
            const result = getKampfstile(actor);
            
            expect(result).toEqual({
                'ohne': {
                    name: 'Ohne',
                    key: 'ohne',
                    stufe: 0,
                    sources: []
                },
                'Ilaris.beidhändig1': {
                    name: 'Beidhändiger Kampf',
                    key: 'Ilaris.beidhändig1',
                    stufe: 1,
                    sources: ['Ilaris.beidhändig1']
                },
                'Ilaris.defensiv2': {
                    name: 'Defensiver Kampfstil',
                    key: 'Ilaris.defensiv2',
                    stufe: 2,
                    sources: ['Ilaris.defensiv2']
                }
            });
        });
    });

    describe('getSelectedStil', () => {
        const mockKampfstile = {
            'ohne': {
                name: 'Ohne',
                key: 'ohne',
                stufe: 0,
                sources: []
            },
            'Ilaris.beidhändig2': {
                name: 'Beidhändiger Kampf II',
                key: 'Ilaris.beidhändig2',
                stufe: 2,
                sources: ['Beidhändiger Kampf I', 'Beidhändiger Kampf II (test)']
            }
        };

        it('should return selected kampfstil when it exists', () => {
            const result = getSelectedStil('Ilaris.beidhändig2', mockKampfstile);
            expect(result).toEqual({
                name: 'Beidhändiger Kampf II',
                key: 'Ilaris.beidhändig2',
                stufe: 2,
                sources: ['Ilaris.beidhändig1', 'Ilaris.beidhändig2']
            });
        });

        it('should return ohne when selected kampfstil does not exist', () => {
            const result = getSelectedStil('nonexistent', mockKampfstile);
            expect(result).toEqual({
                name: 'Ohne',
                key: 'ohne',
                stufe: 0,
                sources: []
            });
        });

        it('should return ohne when selected value is undefined', () => {
            const result = getSelectedStil(undefined, mockKampfstile);
            expect(result).toEqual({
                name: 'Ohne',
                key: 'ohne',
                stufe: 0,
                sources: []
            });
        });
    });

    describe('beTraglast', () => {
        let settingsGetMockValue = -1;
        global.game = {
            settings: {
                get: jest.fn().mockImplementation(()=>{
                    return settingsGetMockValue;
                })
            }
        }
        it('world settings weapon space requirement is disable', () => {
            settingsGetMockValue = false;
            expect(beTraglast(settingsGetMockValue)).toBe(0);
        });

        test.each`
        description | systemData | reslut
        ${'weight diff < 0'} | ${{
            getragen: 13,
            abgeleitete: {
                traglast: 17,
                traglast_intervall: 18,
            }
        }} | ${0} 
        ${'weight diff = 0'} | ${{
            getragen: 2233,
            abgeleitete: {
                traglast: 2233,
                traglast_intervall: 18,
            }
        }} | ${0} 
        ${'weight diff > 0 && ceil == floor'} | ${{
            getragen: 53,
            abgeleitete: {
                traglast: 17,
                traglast_intervall: 6,
            }
        }} | ${6} 
        ${'weight diff = 0 && ceil != floor'} | ${{
            getragen: 53,
            abgeleitete: {
                traglast: 21,
                traglast_intervall: 12,
            }
        }} | ${3} 
    
        `('$description',({systemData, reslut}) => {
            settingsGetMockValue = true;
            expect(beTraglast(systemData)).toBe(reslut);
            });
    });
});

describe('calculateModifiedCost', () => {
    let mockActor;
    let mockItem;

    beforeEach(() => {
        // Mock actor setup
        mockActor = {
            type: 'held',
            vorteil: {
                karma: [],
                magic: []
            }
        };

        // Mock item setup
        mockItem = {
            type: 'zauber',
            system: {
                kosten: '4'
            }
        };

        // Mock getSelectedStil function to handle actor argument
        global.getSelectedStil = jest.fn().mockImplementation((actor) => ({
            name: 'ohne',
            stufe: 0
        }));
    });

    it('should return unmodified cost when no advantages apply', () => {
        const result = calculateModifiedCost(mockActor, mockItem, true, false, 4);
        expect(result).toBe(4);
    });

    it('should reduce cost by 1/4 for Durro-Dun style level 2', () => {
        global.getSelectedStil.mockReturnValue({
            name: 'Durro-Dun',
            stufe: 2
        });
        const result = calculateModifiedCost(mockActor, mockItem, true, false, 4);
        expect(result).toBe(3); // 4 - ceil(4/4)
    });

    it('should make liturgy cost 0 with Liebling der Gottheit on 16+ success', () => {
        mockActor.vorteil.karma.push({ name: 'Liebling der Gottheit' });
        mockItem.type = 'liturgie';
        const result = calculateModifiedCost(mockActor, mockItem, true, true, 4);
        expect(result).toBe(0);
    });

    it('should not modify liturgy cost with Liebling der Gottheit on success below 16', () => {
        mockActor.vorteil.karma.push({ name: 'Liebling der Gottheit' });
        mockItem.type = 'liturgie';
        const result = calculateModifiedCost(mockActor, mockItem, true, false, 4);
        expect(result).toBe(4);
    });

    it('should reduce spell cost by half with Mühelose Magie on 16+ success', () => {
        mockActor.vorteil.magic.push({ name: 'Mühelose Magie' });
        mockItem.type = 'zauber';
        const result = calculateModifiedCost(mockActor, mockItem, true, true, 4);
        expect(result).toBe(2); // 4 - ceil(4/2)
    });

    it('should not modify spell cost with Mühelose Magie on success below 16', () => {
        mockActor.vorteil.magic.push({ name: 'Mühelose Magie' });
        mockItem.type = 'zauber';
        const result = calculateModifiedCost(mockActor, mockItem, true, false, 4);
        expect(result).toBe(4);
    });

    it('should never return a cost below 0', () => {
        mockActor.vorteil.karma.push({ name: 'Liebling der Gottheit' });
        mockItem.type = 'liturgie';
        const result = calculateModifiedCost(mockActor, mockItem, true, true, 1);
        expect(result).toBe(0);
    });

    it('should apply Durro-Dun reduction before other advantages', () => {
        global.getSelectedStil.mockReturnValue({
            name: 'Durro-Dun',
            stufe: 2
        });
        mockActor.vorteil.magic.push({ name: 'Mühelose Magie' });
        mockItem.type = 'zauber';
        const result = calculateModifiedCost(mockActor, mockItem, true, true, 8);
        // First reduces by 1/4 of base (8/4 = 2), then by half of base (8/2 = 4)
        // 8 - 2 - 4 = 2
        expect(result).toBe(2);
    });
});