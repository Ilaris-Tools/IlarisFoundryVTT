import * as hardcoded from './../hardcodedvorteile.js';

describe('getKampfstile', () => {
    beforeAll(() => {
        global.CONFIG = {
            ILARIS: {
                label: {
                    'ohne': 'Kein Kampfstil',
                    'bhk': 'Beidhändiger Kampf',
                    'kvk': 'Kraftvoller Kampf',
                    'pwk': 'Parierwaffenkampf',
                    'rtk': 'Reiterkampf',
                    'shk': 'Schildkampf',
                    'snk': 'Schneller Kampf'
                }
            }
        };
    });

    test('returns only ohne when actor has no kampfstile', () => {
        const actor = {
            vorteil: {
                kampfstil: []
            }
        };

        const result = hardcoded.getKampfstile(actor);
        expect(result).toEqual([
            { name: 'Kein Kampfstil', key: 'ohne', stufe: 0 }
        ]);
    });

    test('returns highest level of each kampfstil', () => {
        const actor = {
            vorteil: {
                kampfstil: [
                    { name: 'Beidhändiger Kampf I', _stats: { compendiumSource: 'bhk1' } },
                    { name: 'Beidhändiger Kampf III', _stats: { compendiumSource: 'bhk3' } },
                    { name: 'Kraftvoller Kampf II', _stats: { compendiumSource: 'kvk2' } },
                    { name: 'Kraftvoller Kampf I', _stats: { compendiumSource: 'kvk1' } }
                ]
            }
        };

        const result = hardcoded.getKampfstile(actor);
        expect(result).toEqual([
            { name: 'Kein Kampfstil', key: 'ohne', stufe: 0 },
            { name: 'Beidhändiger Kampf III', key: 'bhk3', stufe: 3 },
            { name: 'Kraftvoller Kampf II', key: 'kvk2', stufe: 2 }
        ]);
    });

    test('handles single level kampfstile', () => {
        const actor = {
            vorteil: {
                kampfstil: [
                    { name: 'Beidhändiger Kampf II', _stats: { compendiumSource: 'bhk2' } }
                ]
            }
        };

        const result = hardcoded.getKampfstile(actor);
        expect(result).toEqual([
            { name: 'Kein Kampfstil', key: 'ohne', stufe: 0 },
            { name: 'Beidhändiger Kampf II', key: 'bhk2', stufe: 2 }
        ]);
    });

    test('handles kampfstile with same level', () => {
        const actor = {
            vorteil: {
                kampfstil: [
                    { name: 'Beidhändiger Kampf II', _stats: { compendiumSource: 'bhk2a' } },
                    { name: 'Beidhändiger Kampf II', _stats: { compendiumSource: 'bhk2b' } }
                ]
            }
        };

        const result = hardcoded.getKampfstile(actor);
        // Should keep the first one encountered
        expect(result).toEqual([
            { name: 'Kein Kampfstil', key: 'ohne', stufe: 0 },
            { name: 'Beidhändiger Kampf II', key: 'bhk2a', stufe: 2 }
        ]);
    });

    test('handles invalid kampfstil names', () => {
        const actor = {
            vorteil: {
                kampfstil: [
                    { name: 'Invalid Kampfstil', _stats: { compendiumSource: 'invalid' } },
                    { name: 'Beidhändiger Kampf II', _stats: { compendiumSource: 'bhk2' } }
                ]
            }
        };

        const result = hardcoded.getKampfstile(actor);
        expect(result).toEqual([
            { name: 'Kein Kampfstil', key: 'ohne', stufe: 0 },
            { name: 'Invalid Kampfstil', key: 'invalid', stufe: 0 },
            { name: 'Beidhändiger Kampf II', key: 'bhk2', stufe: 2 }
        ]);
    });
});

describe('sum', () => {
    test('adds 1 + 2 to equal 3', () => {
        expect(hardcoded.sum(1, 2)).toBe(3);
    });

    test('adds 2 + 2 to equal 4', () => {
        expect(hardcoded.sum(2, 2)).toBe(4);
    });
});

describe('getSelectedKampfstil', () => {
    test('returns matching kampfstil when found', () => {
        const kampfstile = [
            { name: 'Kein Kampfstil', key: 'ohne', stufe: 0 },
            { name: 'Beidhändiger Kampf II', key: 'bhk2', stufe: 2 }
        ];
        
        const result = hardcoded.getSelectedKampfstil('bhk2', kampfstile);
        expect(result).toEqual({ name: 'Beidhändiger Kampf II', key: 'bhk2', stufe: 2 });
    });

    test('returns first kampfstil (ohne) when no match found', () => {
        const kampfstile = [
            { name: 'Kein Kampfstil', key: 'ohne', stufe: 0 },
            { name: 'Beidhändiger Kampf II', key: 'bhk2', stufe: 2 }
        ];
        
        const result = hardcoded.getSelectedKampfstil('invalid', kampfstile);
        expect(result).toEqual({ name: 'Kein Kampfstil', key: 'ohne', stufe: 0 });
    });
});