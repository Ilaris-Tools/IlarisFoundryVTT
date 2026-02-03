// Mock global dependencies
global.game = {
    settings: {
        get: jest.fn().mockReturnValue('{}'),
    },
}

global.CONFIG = {
    ILARIS: {},
}

// Mock the parent classes
jest.mock('../item.js', () => ({
    IlarisItem: class MockIlarisItem {
        constructor(data = {}) {
            this.name = data.name || 'Test Item'
            this.type = data.type || 'zauber'
            this.system = data.system || {}
        }
    },
}))

// Mock the settings imports
jest.mock('../../settings/configure-game-settings.model.js', () => ({
    IlarisGameSettingNames: {},
    ConfigureGameSettingsCategories: {},
}))

// Mock the config import
jest.mock('../../config.js', () => ({
    ILARIS: {},
    MANOEVER_GRUPPE: {
        NAHKAMPF: 0,
        FERNKAMPF: 1,
        ZAUBER: 2,
        LITURGIE: 3,
        ANRUFUNG: 4,
        NAHKAMPF_KREATUR: 13,
    },
}))

// Import the actual class we want to test
const { CombatItem } = require('../combat.js')

describe('CombatItem', () => {
    let combatItem

    beforeEach(() => {
        combatItem = new CombatItem({
            name: 'Test Zauber',
            type: 'zauber',
            system: {
                modifikationen: '',
            },
        })
    })

    describe('_parseModifikationen', () => {
        it('should parse complex modification string with multiple modifications', () => {
            const modificationString =
                'Schutz vor Übelkeit (–4; auch ungefährliche, aber unangenehme Inhalte wie Salz im Meerwasser werden entfernt.)\nSchutz vor Vergiftung (–4, Wirkungsdauer 8 Stunden; du reinigst auch alles, was dem Essen hinzugefügt wird.)'

            const result = combatItem._parseModifikationen(modificationString)

            expect(result).toHaveLength(2)

            // First modification: Schutz vor Übelkeit
            const firstMod = result[0]
            expect(firstMod.name).toBe('Schutz vor Übelkeit')
            expect(firstMod.id).toBe('mod0')
            expect(firstMod.type).toBe('manoever')
            expect(firstMod.system.gruppe).toBe(2) // zauber
            expect(firstMod.system.probe).toBe(-4)
            expect(firstMod.system.text).toBe(
                'auch ungefährliche, aber unangenehme Inhalte wie Salz im Meerwasser werden entfernt.',
            )
            expect(firstMod.system.modificationData.erschwernis).toBe(-4)

            // Check modifications array
            expect(firstMod.system.modifications[0]).toEqual({
                type: 'ATTACK',
                value: -4,
                operator: 'ADD',
                target: '',
                affectedByInput: false,
            })

            // Second modification: Schutz vor Vergiftung
            const secondMod = result[1]
            expect(secondMod.name).toBe('Schutz vor Vergiftung')
            expect(secondMod.id).toBe('mod1')
            expect(secondMod.type).toBe('manoever')
            expect(secondMod.system.gruppe).toBe(2) // zauber
            expect(secondMod.system.probe).toBe(-4)
            expect(secondMod.system.text).toBe(
                'Wirkungsdauer 8 Stunden;du reinigst auch alles, was dem Essen hinzugefügt wird.',
            )
            expect(secondMod.system.modificationData.erschwernis).toBe(-4)
            expect(secondMod.system.modificationData.wirkungsdauer).toBe('Wirkungsdauer 8 Stunden')

            // Check modifications array for second modification
            expect(secondMod.system.modifications[0]).toEqual({
                type: 'ATTACK',
                value: -4,
                operator: 'ADD',
                target: '',
                affectedByInput: false,
            })

            expect(secondMod.system.modifications[1]).toEqual({
                type: 'SPECIAL_TEXT',
                value: 'Wirkungsdauer 8 Stunden',
                operator: 'ADD',
                target: '',
                affectedByInput: false,
            })
        })

        it('should return empty array for null or empty string', () => {
            expect(combatItem._parseModifikationen(null)).toEqual([])
            expect(combatItem._parseModifikationen('')).toEqual([])
            expect(combatItem._parseModifikationen(undefined)).toEqual([])
        })

        it('should handle single modification correctly', () => {
            const modificationString = 'Haltbarkeit (–4, Wirkungsdauer 1 Jahr, 8 AsP)'

            const result = combatItem._parseModifikationen(modificationString)

            expect(result).toHaveLength(1)
            const mod = result[0]
            expect(mod.name).toBe('Haltbarkeit')
            expect(mod.system.modificationData.erschwernis).toBe(-4)
            expect(mod.system.modificationData.wirkungsdauer).toBe('Wirkungsdauer 1 Jahr')
            expect(mod.system.modificationData.kosten).toBe('8 AsP')
        })

        it('should parse Adamantenquader, Kristallglanz, and Zauberklinge modifications correctly', () => {
            const modificationString =
                'Adamantenquader (–4; das maximale Gewicht wird verdoppelt. Mehrfach wählbar.) Kristallglanz (–4; während der Wirkungsdauer erscheint die Oberfläche des Materials wie die eines beliebigen anderen erzenen Materials.) Zauberklinge (–4; während der Wirkungsdauer gilt die Waffe als magisch.)'

            const result = combatItem._parseModifikationen(modificationString)

            expect(result).toHaveLength(3) // First modification: Adamantenquader
            const adamantenquader = result[0]
            expect(adamantenquader.name).toBe('Adamantenquader')
            expect(adamantenquader.id).toBe('mod0')
            expect(adamantenquader.type).toBe('manoever')
            expect(adamantenquader.system.gruppe).toBe(2) // zauber
            expect(adamantenquader.system.probe).toBe(-4)
            expect(adamantenquader.system.text).toBe(
                'das maximale Gewicht wird verdoppelt. Mehrfach wählbar.',
            )
            expect(adamantenquader.system.modificationData.erschwernis).toBe(-4)
            expect(adamantenquader.system.input.field).toBe('NUMBER') // Should be NUMBER because description contains "Mehrfach wählbar"
            expect(adamantenquader.inputValue.field).toBe('NUMBER')
            expect(adamantenquader.inputValue.value).toBe(null) // Should default to null for NUMBER fields

            // Check modifications array for Adamantenquader
            expect(adamantenquader.system.modifications[0]).toEqual({
                type: 'ATTACK',
                value: -4,
                operator: 'ADD',
                target: '',
                affectedByInput: true,
            }) // Second modification: Kristallglanz
            const kristallglanz = result[1]
            expect(kristallglanz.name).toBe('Kristallglanz')
            expect(kristallglanz.id).toBe('mod1')
            expect(kristallglanz.type).toBe('manoever')
            expect(kristallglanz.system.gruppe).toBe(2) // zauber
            expect(kristallglanz.system.probe).toBe(-4)
            expect(kristallglanz.system.text).toBe(
                'während der Wirkungsdauer erscheint die Oberfläche des Materials wie die eines beliebigen anderen erzenen Materials.',
            )
            expect(kristallglanz.system.modificationData.erschwernis).toBe(-4)
            expect(kristallglanz.system.input.field).toBe('CHECKBOX') // Should be CHECKBOX because description doesn't contain "Mehrfach wählbar"
            expect(kristallglanz.inputValue.field).toBe('CHECKBOX')
            expect(kristallglanz.inputValue.value).toBe(false) // Should default to false for CHECKBOX fields

            // Check modifications array for Kristallglanz
            expect(kristallglanz.system.modifications[0]).toEqual({
                type: 'ATTACK',
                value: -4,
                operator: 'ADD',
                target: '',
                affectedByInput: false,
            }) // Third modification: Zauberklinge
            const zauberklinge = result[2]
            expect(zauberklinge.name).toBe('Zauberklinge')
            expect(zauberklinge.id).toBe('mod2')
            expect(zauberklinge.type).toBe('manoever')
            expect(zauberklinge.system.gruppe).toBe(2) // zauber
            expect(zauberklinge.system.probe).toBe(-4)
            expect(zauberklinge.system.text).toBe(
                'während der Wirkungsdauer gilt die Waffe als magisch.',
            )
            expect(zauberklinge.system.modificationData.erschwernis).toBe(-4)
            expect(zauberklinge.system.input.field).toBe('CHECKBOX') // Should be CHECKBOX because description doesn't contain "Mehrfach wählbar"
            expect(zauberklinge.inputValue.field).toBe('CHECKBOX')
            expect(zauberklinge.inputValue.value).toBe(false) // Should default to false for CHECKBOX fields

            // Check modifications array for Zauberklinge
            expect(zauberklinge.system.modifications[0]).toEqual({
                type: 'ATTACK',
                value: -4,
                operator: 'ADD',
                target: '',
                affectedByInput: false,
            })
        })
    })
})
