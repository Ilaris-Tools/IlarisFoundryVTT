import { getKampfstile, getSelectedStil, getKampfstilStufe } from '../hardcodedvorteile.js'

describe('getKampfstile', () => {
    beforeEach(() => {
        global.CONFIG = {
            ILARIS: {
                label: {
                    ohne: 'Ohne',
                },
            },
        }
    })

    it('should return object with ohne as default', () => {
        const actor = { vorteil: { kampfstil: [] } }
        const result = getKampfstile(actor)

        expect(result).toEqual({
            ohne: {
                name: 'Ohne',
                key: 'ohne',
                stufe: 0,
                sources: [],
            },
        })
    })

    it('should group kampfstile and use highest level', () => {
        const actor = {
            vorteil: {
                kampfstil: [
                    {
                        name: 'Beidhändiger Kampf I',
                        _stats: { compendiumSource: 'Ilaris.beidhändig1' },
                    },
                    {
                        name: 'Beidhändiger Kampf II (test)',
                        _stats: { compendiumSource: 'Ilaris.beidhändig2' },
                    },
                ],
            },
        }

        const result = getKampfstile(actor)

        expect(result).toEqual({
            ohne: {
                name: 'Ohne',
                key: 'ohne',
                stufe: 0,
                sources: [],
            },
            'Ilaris.beidhändig2': {
                name: 'Beidhändiger Kampf',
                key: 'Ilaris.beidhändig2',
                stufe: 2,
                sources: ['Ilaris.beidhändig1', 'Ilaris.beidhändig2'],
            },
        })
    })

    it('should handle multiple different kampfstile', () => {
        const actor = {
            vorteil: {
                kampfstil: [
                    {
                        name: 'Beidhändiger Kampf I',
                        _stats: { compendiumSource: 'Ilaris.beidhändig1' },
                    },
                    {
                        name: 'Defensiver Kampfstil II',
                        _stats: { compendiumSource: 'Ilaris.defensiv2' },
                    },
                ],
            },
        }

        const result = getKampfstile(actor)

        expect(result).toEqual({
            ohne: {
                name: 'Ohne',
                key: 'ohne',
                stufe: 0,
                sources: [],
            },
            'Ilaris.beidhändig1': {
                name: 'Beidhändiger Kampf',
                key: 'Ilaris.beidhändig1',
                stufe: 1,
                sources: ['Ilaris.beidhändig1'],
            },
            'Ilaris.defensiv2': {
                name: 'Defensiver Kampfstil',
                key: 'Ilaris.defensiv2',
                stufe: 2,
                sources: ['Ilaris.defensiv2'],
            },
        })
    })
})

describe('getSelectedStil', () => {
    const mockKampfstile = {
        ohne: {
            name: 'Ohne',
            key: 'ohne',
            stufe: 0,
            sources: [],
        },
        'Ilaris.beidhändig2': {
            name: 'Beidhändiger Kampf II',
            key: 'Ilaris.beidhändig2',
            stufe: 2,
            sources: ['Ilaris.beidhändig1', 'Ilaris.beidhändig2'],
        },
    }

    it('should return selected kampfstil when it exists', () => {
        const result = getSelectedStil('Ilaris.beidhändig2', mockKampfstile)
        expect(result).toEqual({
            name: 'Beidhändiger Kampf II',
            key: 'Ilaris.beidhändig2',
            stufe: 2,
            sources: ['Ilaris.beidhändig1', 'Ilaris.beidhändig2'],
        })
    })

    it('should return ohne when selected kampfstil does not exist', () => {
        const result = getSelectedStil('nonexistent', mockKampfstile)
        expect(result).toEqual({
            name: 'Ohne',
            key: 'ohne',
            stufe: 0,
            sources: [],
        })
    })

    it('should return ohne when selected value is undefined', () => {
        const result = getSelectedStil(undefined, mockKampfstile)
        expect(result).toEqual({
            name: 'Ohne',
            key: 'ohne',
            stufe: 0,
            sources: [],
        })
    })
})
