import {
    getKampfstile,
    getSelectedStil,
    getKampfstilStufe,
    calculateModifiedCost,
    beTraglast,
} from '../hardcodedvorteile.js'

// jest.mock('../hardcodedvorteile.js', () => ({
//     ...jest.requireActual('../hardcodedvorteile.js'),
//     getSelectedStil: jest.fn().mockImplementation(() => ({
//         name: 'ohne',
//         stufe: 0,
//     })),
// }))

jest.mock('./../../settings/configure-game-settings.js', () => ({}))

describe('hardcodedvorteile.js', () => {
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
                    modifiers: { at: 0, vt: 0, damage: 0, rw: 0, be: 0 },
                    bedingungen: '',
                    foundryScriptMethods: [],
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
                            system: {
                                script: 'modifyKampfstil("Beidhändiger Kampf", 1, 0, 0, 0, 0)',
                            },
                        },
                        {
                            name: 'Beidhändiger Kampf II (test)',
                            _stats: { compendiumSource: 'Ilaris.beidhändig2' },
                            system: {
                                script: 'modifyKampfstil("Beidhändiger Kampf", 1, 0, 0, 0, 0)',
                            },
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
                    modifiers: { at: 0, vt: 0, damage: 0, rw: 0, be: 0 },
                    bedingungen: '',
                    foundryScriptMethods: [],
                },
                'Beidhändiger Kampf': {
                    name: 'Beidhändiger Kampf',
                    key: 'Beidhändiger Kampf',
                    stufe: 2,
                    sources: ['Beidhändiger Kampf I', 'Beidhändiger Kampf II (test)'],
                    modifiers: { at: 2, vt: 0, damage: 0, rw: 0, be: 0 },
                    bedingungen: '',
                    foundryScriptMethods: [],
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
                    modifiers: { at: 0, vt: 0, damage: 0, rw: 0, be: 0 },
                    bedingungen: '',
                    foundryScriptMethods: [],
                },
                'Beidhändiger Kampf': {
                    name: 'Beidhändiger Kampf',
                    key: 'Beidhändiger Kampf',
                    stufe: 1,
                    sources: ['Beidhändiger Kampf I'],
                    modifiers: { at: 0, vt: 0, damage: 0, rw: 0, be: 0 },
                    bedingungen: '',
                    foundryScriptMethods: [],
                },
                'Defensiver Kampfstil': {
                    name: 'Defensiver Kampfstil',
                    key: 'Defensiver Kampfstil',
                    stufe: 2,
                    sources: ['Defensiver Kampfstil II'],
                    modifiers: { at: 0, vt: 0, damage: 0, rw: 0, be: 0 },
                    bedingungen: '',
                    foundryScriptMethods: [],
                },
            })
        })
    })

    describe('getSelectedStil', () => {
        const mockKampfstile = {
            ohne: {
                name: 'ohne',
                key: 'ohne',
                stufe: 0,
                sources: [],
            },
            'Beidhändiger Kampf': {
                name: 'Beidhändiger Kampf II',
                key: 'Beidhändiger Kampf',
                stufe: 2,
                sources: ['Beidhändiger Kampf I', 'Beidhändiger Kampf II (test)'],
            },
        }
        // Mock actor setup
        let mockActor = {
            type: 'held',
            vorteil: {
                karma: [],
                magie: [],
            },
            system: {
                misc: {
                    selected_uebernatuerlicher_stil: undefined,
                    selected_kampfstil: undefined,
                },
            },
            misc: {
                uebernatuerliche_stile_list: {
                    ohne: {
                        name: 'ohne',
                        key: 'ohne',
                        stufe: 0,
                        sources: [],
                    },
                },
                kampfstile_list: mockKampfstile,
            },
        }

        it('should return selected kampfstil when it exists', () => {
            mockActor.system.misc.selected_kampfstil = 'Beidhändiger Kampf'
            const result = getSelectedStil(mockActor, 'kampf')
            expect(result).toEqual(mockKampfstile['Beidhändiger Kampf'])
        })

        it('should return ohne if not existing', () => {
            mockActor.system.misc.selected_kampfstil = 'Something'
            const result = getSelectedStil(mockActor, 'kampf')
            expect(result).toEqual(mockKampfstile['ohne'])
        })

        it('should return null if no stil selected for requested type', () => {
            mockActor.system.misc.selected_uebernatuerlicher_stil = 'Beidhändiger Kampf'
            const result = getSelectedStil(mockActor, 'uebernatuerlich')
            expect(result).toEqual(mockActor.misc.uebernatuerliche_stile_list['ohne'])
        })

        it('should return null if actor not held', () => {
            mockActor.type = 'kreatur'
            const result = getSelectedStil(mockActor, 'kampf')
            expect(result).toEqual(null)
        })

        it('should return null if wrong type requested', () => {
            const result = getSelectedStil(mockActor, 'something')
            expect(result).toEqual(null)
        })
    })

    describe('beTraglast', () => {
        let settingsGetMockValue = -1
        global.game = {
            settings: {
                get: jest.fn().mockImplementation(() => {
                    return settingsGetMockValue
                }),
            },
        }
        it('world settings weapon space requirement is disable', () => {
            settingsGetMockValue = false
            expect(beTraglast(settingsGetMockValue)).toBe(0)
        })

        test.each`
            description | systemData | reslut
            ${'weight diff < 0'} | ${{
    getragen: 13,
    abgeleitete: {
        traglast: 17,
        traglast_intervall: 18,
    },
}} | ${0}
            ${'weight diff = 0'} | ${{
    getragen: 2233,
    abgeleitete: {
        traglast: 2233,
        traglast_intervall: 18,
    },
}} | ${0}
            ${'weight diff > 0 && ceil == floor'} | ${{
    getragen: 53,
    abgeleitete: {
        traglast: 17,
        traglast_intervall: 6,
    },
}} | ${6}
            ${'weight diff = 0 && ceil != floor'} | ${{
    getragen: 53,
    abgeleitete: {
        traglast: 21,
        traglast_intervall: 12,
    },
}} | ${3}
        `('$description', ({ systemData, reslut }) => {
            settingsGetMockValue = true
            expect(beTraglast(systemData)).toBe(reslut)
        })
    })
})

describe('calculateModifiedCost', () => {
    let mockActor
    let mockItem

    beforeEach(() => {
        // Mock actor setup
        mockActor = {
            type: 'held',
            vorteil: {
                karma: [],
                magie: [],
            },
            system: {
                misc: {
                    selected_uebernatuerlicher_stil: 'ohne',
                },
            },
            misc: {
                uebernatuerliche_stile_list: [],
            },
        }

        // Mock item setup
        mockItem = {
            type: 'zauber',
            system: {
                kosten: '4',
            },
        }
    })

    it('should return unmodified cost when no advantages apply', () => {
        const result = calculateModifiedCost(mockActor, mockItem, true, false, 4)
        expect(result).toBe(4)
    })

    it('should reduce cost by 1/4 for Durro-Dun style level 2', () => {
        mockActor.misc.uebernatuerliche_stile_list = {
            'Tradition der Durro-Dun': {
                name: 'Tradition der Durro-Dun',
                stufe: 2,
            },
        }
        mockActor.system.misc.selected_uebernatuerlicher_stil = 'Tradition der Durro-Dun'
        const result = calculateModifiedCost(mockActor, mockItem, true, false, 4)
        expect(result).toBe(3) // 4 - ceil(4/4)
    })

    it('should make liturgy cost 0 with Liebling der Gottheit on 16+ success', () => {
        mockActor.vorteil.karma.push({ name: 'Liebling der Gottheit' })
        mockItem.type = 'liturgie'
        const result = calculateModifiedCost(mockActor, mockItem, true, true, 4)
        expect(result).toBe(0)
    })

    it('should not modify liturgy cost with Liebling der Gottheit on success below 16', () => {
        mockActor.vorteil.karma.push({ name: 'Liebling der Gottheit' })
        mockItem.type = 'liturgie'
        const result = calculateModifiedCost(mockActor, mockItem, true, false, 4)
        expect(result).toBe(4)
    })

    it('should reduce spell cost by half with Mühelose Magie on 16+ success', () => {
        mockActor.vorteil.magie.push({ name: 'Mühelose Magie' })
        mockItem.type = 'zauber'
        const result = calculateModifiedCost(mockActor, mockItem, true, true, 4)
        expect(result).toBe(2) // 4 - ceil(4/2)
    })

    it('should not modify spell cost with Mühelose Magie on success below 16', () => {
        mockActor.vorteil.magie.push({ name: 'Mühelose Magie' })
        mockItem.type = 'zauber'
        const result = calculateModifiedCost(mockActor, mockItem, true, false, 4)
        expect(result).toBe(4)
    })

    it('should never return a cost below 0', () => {
        mockActor.vorteil.karma.push({ name: 'Liebling der Gottheit' })
        mockItem.type = 'liturgie'
        const result = calculateModifiedCost(mockActor, mockItem, true, true, 1)
        expect(result).toBe(0)
    })

    it('should apply Tradition der Durro-Dun reduction before other advantages', () => {
        mockActor.misc.uebernatuerliche_stile_list = {
            'Tradition der Durro-Dun': {
                name: 'Tradition der Durro-Dun',
                stufe: 2,
            },
        }
        mockActor.system.misc.selected_uebernatuerlicher_stil = 'Tradition der Durro-Dun'
        mockActor.vorteil.magie.push({ name: 'Mühelose Magie' })
        mockItem.type = 'zauber'
        mockItem.system.kosten = 8
        const result = calculateModifiedCost(mockActor, mockItem, true, true, 8)
        // First reduces by 1/4 of base (8/4 = 2), then by half ((8-2) / 2 = 3)
        expect(result).toBe(3)
    })
})
