import { VorteilConverter } from '../vorteil-converter.js'

describe('VorteilConverter', () => {
    let converter

    beforeEach(() => {
        converter = new VorteilConverter()
    })

    describe('parseFoundryScript', () => {
        describe('when kategorie is not 3', () => {
            it('should return empty string for kategorie 0', () => {
                const text = 'Dein Schild ignoriert die übliche Erschwernis für Nebenwaffen'
                const result = converter.parseFoundryScript(text, 0)
                expect(result).toBe('')
            })

            it('should return empty string for kategorie 1', () => {
                const text = 'Dein Schild ignoriert die übliche Erschwernis für Nebenwaffen'
                const result = converter.parseFoundryScript(text, 1)
                expect(result).toBe('')
            })

            it('should return empty string for kategorie 4', () => {
                const text = 'Dein Schild ignoriert die übliche Erschwernis für Nebenwaffen'
                const result = converter.parseFoundryScript(text, 4)
                expect(result).toBe('')
            })
        })

        describe('when text is empty or null', () => {
            it('should return empty string for empty text', () => {
                const result = converter.parseFoundryScript('', 3)
                expect(result).toBe('')
            })

            it('should return empty string for null text', () => {
                const result = converter.parseFoundryScript(null, 3)
                expect(result).toBe('')
            })

            it('should return empty string for undefined text', () => {
                const result = converter.parseFoundryScript(undefined, 3)
                expect(result).toBe('')
            })
        })

        describe('when pattern is not present', () => {
            it('should return empty string for unrelated text', () => {
                const text = 'Dies ist ein Vorteil ohne spezielle Muster'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe('')
            })

            it('should return empty string for partial pattern match', () => {
                const text = 'Dein Schild ignoriert etwas anderes'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe('')
            })
        })

        describe('when pattern with specific weapon property is present', () => {
            it('should extract "Schild" and generate script with parameter', () => {
                const text = 'Dein Schild ignoriert die übliche Erschwernis für Nebenwaffen'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe("ignoreSideWeaponMalus('Schild')")
            })

            it('should extract "Parierwaffe" and generate script with parameter', () => {
                const text =
                    'Deine Parierwaffe ignoriert die üblichen Erschwernisse für Nebenwaffen'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe("ignoreSideWeaponMalus('Parierwaffe')")
            })

            it('should handle case insensitive pattern matching', () => {
                const text = 'DEIN SCHILD IGNORIERT DIE ÜBLICHE ERSCHWERNIS FÜR NEBENWAFFEN'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe("ignoreSideWeaponMalus('SCHILD')")
            })

            it('should handle mixed case pattern', () => {
                const text = 'Deine Parierwaffe Ignoriert Die Übliche Erschwernis Für Nebenwaffen'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe("ignoreSideWeaponMalus('Parierwaffe')")
            })
        })

        describe('when pattern with generic weapon term is present', () => {
            it('should generate script without parameter for "zweite Waffe"', () => {
                const text = 'Deine zweite Waffe ignoriert die übliche Erschwernis für Nebenwaffen'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe('ignoreSideWeaponMalus()')
            })

            it('should generate script without parameter for "zweite"', () => {
                const text = 'Deine zweite ignoriert die übliche Erschwernis für Nebenwaffen'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe('ignoreSideWeaponMalus()')
            })

            it('should generate script without parameter for "Waffe"', () => {
                const text = 'Deine Waffe ignoriert die übliche Erschwernis für Nebenwaffen'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe('ignoreSideWeaponMalus()')
            })
        })

        describe('edge cases', () => {
            it('should handle text with additional content after the pattern', () => {
                const text =
                    'Dein Schild ignoriert die übliche Erschwernis für Nebenwaffen. Zusätzliche Informationen hier.'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe("ignoreSideWeaponMalus('Schild')")
            })

            it('should handle multi-line text with pattern in the middle', () => {
                const text = `+1 VT

Dein Schild ignoriert die übliche Erschwernis für Nebenwaffen (S. 39). Außerdem kannst du die erste VT zwischen zwei Initiativephasen als Freie Reaktion ausführen.`
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe("ignoreSideWeaponMalus('Schild')")
            })

            it('should handle multi-line text with Parierwaffe', () => {
                const text = `Bonustext hier

Deine Parierwaffe ignoriert die üblichen Erschwernisse für Nebenwaffen (S. 39). Weitere Details.`
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe("ignoreSideWeaponMalus('Parierwaffe')")
            })

            it('should handle singular "Erschwernis" variant', () => {
                const text = 'Dein Schild ignoriert die übliche Erschwernis für Nebenwaffen'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe("ignoreSideWeaponMalus('Schild')")
            })

            it('should handle plural "Erschwernisse" variant', () => {
                const text = 'Dein Schild ignoriert die üblichen Erschwernisse für Nebenwaffen'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe("ignoreSideWeaponMalus('Schild')")
            })

            it('should capitalize weapon property correctly', () => {
                const text = 'deine parierwaffe ignoriert die übliche Erschwernis für Nebenwaffen'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe("ignoreSideWeaponMalus('Parierwaffe')")
            })

            it('should handle weapon property with multiple words', () => {
                const text = 'Deine lange Klinge ignoriert die übliche Erschwernis für Nebenwaffen'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe("ignoreSideWeaponMalus('Lange Klinge')")
            })

            it('should return empty string when weapon type cannot be extracted but pattern matches', () => {
                const text = 'ignoriert die übliche Erschwernis für Nebenwaffen'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe('')
            })
        })

        describe('mounted range penalty pattern', () => {
            it('should detect mounted range penalty pattern and generate script', () => {
                const text =
                    'Außerdem ignorierst du im Fernkampf du den Malus für berittene Schützen'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe('ignoreMountedRangePenalty()')
            })

            it('should handle mounted range penalty pattern without duplicate "du"', () => {
                const text = 'Außerdem ignorierst du im Fernkampf den Malus für berittene Schützen'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe('ignoreMountedRangePenalty()')
            })

            it('should handle mounted range penalty pattern without leading "du"', () => {
                const text = 'Du ignorierst im Fernkampf den Malus für berittene Schützen'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe('ignoreMountedRangePenalty()')
            })

            it('should handle case insensitive mounted range pattern', () => {
                const text = 'IGNORIERST DU IM FERNKAMPF DU DEN MALUS FÜR BERITTENE SCHÜTZEN'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe('ignoreMountedRangePenalty()')
            })
        })

        describe('combined patterns', () => {
            it('should combine side weapon malus and mounted range penalty scripts', () => {
                const text = `+1 AT, VT, Waffenschaden

Dein Reittier ignoriert die üblichen Erschwernisse für Nebenwaffen (S. 39) und im Reiterkampf ist die BE durch Rüstungen um 1 gesenkt. Außerdem ignorierst du im Fernkampf du den Malus für berittene Schützen (S. 46).`
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe("ignoreSideWeaponMalus('Reittier');ignoreMountedRangePenalty()")
            })

            it('should handle both patterns in different order', () => {
                const text = `Außerdem ignorierst du im Fernkampf den Malus für berittene Schützen. Dein Schild ignoriert die übliche Erschwernis für Nebenwaffen.`
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe("ignoreSideWeaponMalus('Schild');ignoreMountedRangePenalty()")
            })

            it('should handle only mounted range penalty without side weapon pattern', () => {
                const text = `+1 AT

Außerdem ignorierst du im Fernkampf du den Malus für berittene Schützen (S. 46).`
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe('ignoreMountedRangePenalty()')
            })
        })

        describe('manöver penalty reduction pattern', () => {
            it('should detect manöver penalty with condition (gegen humanoide Gegner)', () => {
                const text =
                    'Du kannst gegen humanoide Gegner –1 Erschwernis aus Manövern ignorieren.'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe('manoverAusgleich(1)')
            })

            it('should detect manöver penalty without condition', () => {
                const text = 'Du kannst –1 Erschwernis aus Manövern ignorieren.'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe('manoverAusgleich(1,false)')
            })

            it('should handle manöver penalty with different numeric values', () => {
                const text = 'Du kannst gegen Tiere –2 Erschwernis aus Manövern ignorieren.'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe('manoverAusgleich(2)')
            })

            it('should handle manöver penalty with regular hyphen instead of em-dash', () => {
                const text =
                    'Du kannst gegen humanoide Gegner -1 Erschwernis aus Manövern ignorieren.'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe('manoverAusgleich(1)')
            })

            it('should handle manöver penalty in multi-line text with conditions', () => {
                const text = `Bedingungen: Parierwaffe, nicht beritten.

Du kannst gegen humanoide Gegner –1 Erschwernis aus Manövern ignorieren.`
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe('manoverAusgleich(1)')
            })

            it('should handle case insensitive manöver pattern', () => {
                const text =
                    'DU KANNST GEGEN HUMANOIDE GEGNER –1 ERSCHWERNIS AUS MANÖVERN IGNORIEREN.'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe('manoverAusgleich(1)')
            })

            it('should handle plural "Erschwernisse"', () => {
                const text =
                    'Du kannst gegen humanoide Gegner –2 Erschwernisse aus Manövern ignorieren.'
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe('manoverAusgleich(2)')
            })
        })

        describe('combined patterns with manöver penalty', () => {
            it('should combine side weapon malus and manöver penalty', () => {
                const text = `Du kannst gegen humanoide Gegner –1 Erschwernis aus Manövern ignorieren.

Deine Parierwaffe ignoriert die üblichen Erschwernisse für Nebenwaffen (S. 39). Wenn ideale Kampfbedingungen herrschen – du also keine Erschwernisse durch Position, Untergrund und Licht erleidest – verbessert sich deine Position um eine Stufe (S. 38).`
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe("ignoreSideWeaponMalus('Parierwaffe');manoverAusgleich(1)")
            })

            it('should combine all three patterns', () => {
                const text = `Du kannst gegen Tiere –2 Erschwernis aus Manövern ignorieren.

Dein Schild ignoriert die übliche Erschwernis für Nebenwaffen. Außerdem ignorierst du im Fernkampf den Malus für berittene Schützen.`
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe(
                    "ignoreSideWeaponMalus('Schild');ignoreMountedRangePenalty();manoverAusgleich(2)",
                )
            })

            it('should handle manöver penalty without condition combined with other patterns', () => {
                const text = `Du kannst –1 Erschwernis aus Manövern ignorieren.

Deine Waffe ignoriert die übliche Erschwernis für Nebenwaffen.`
                const result = converter.parseFoundryScript(text, 3)
                expect(result).toBe('ignoreSideWeaponMalus();manoverAusgleich(1,false)')
            })
        })
    })

    describe('generateEffectDescription', () => {
        it('should generate description for single WS change', () => {
            const changes = [
                {
                    key: 'system.abgeleitete.ws',
                    mode: 2,
                    value: '5',
                    priority: 20,
                },
            ]
            const result = converter.generateEffectDescription(changes)
            expect(result).toBe('WS +5')
        })

        it('should generate description for single MR change', () => {
            const changes = [
                {
                    key: 'system.abgeleitete.mr',
                    mode: 2,
                    value: '1',
                    priority: 20,
                },
            ]
            const result = converter.generateEffectDescription(changes)
            expect(result).toBe('MR +1')
        })

        it('should generate description for negative value', () => {
            const changes = [
                {
                    key: 'system.abgeleitete.gs',
                    mode: 2,
                    value: '-2',
                    priority: 20,
                },
            ]
            const result = converter.generateEffectDescription(changes)
            expect(result).toBe('GS -2')
        })

        it('should generate description for formula with attribute', () => {
            const changes = [
                {
                    key: 'system.abgeleitete.ws',
                    mode: 2,
                    value: '@attribute.KO.wert * 5',
                    priority: 20,
                },
            ]
            const result = converter.generateEffectDescription(changes)
            expect(result).toBe('WS +KO*5')
        })

        it('should generate description for complex formula', () => {
            const changes = [
                {
                    key: 'system.abgeleitete.ws',
                    mode: 2,
                    value: '@attribute.KO.wert * 2 + 5',
                    priority: 20,
                },
            ]
            const result = converter.generateEffectDescription(changes)
            expect(result).toBe('WS +KO*2+5')
        })

        it('should generate description for multiple changes', () => {
            const changes = [
                {
                    key: 'system.abgeleitete.mr',
                    mode: 2,
                    value: '1',
                    priority: 20,
                },
                {
                    key: 'system.abgeleitete.gs',
                    mode: 2,
                    value: '2',
                    priority: 20,
                },
            ]
            const result = converter.generateEffectDescription(changes)
            expect(result).toBe('MR +1, GS +2')
        })

        it('should handle INI and DH stats', () => {
            const changes = [
                {
                    key: 'system.abgeleitete.ini',
                    mode: 2,
                    value: '3',
                    priority: 20,
                },
                {
                    key: 'system.abgeleitete.dh',
                    mode: 2,
                    value: '1',
                    priority: 20,
                },
            ]
            const result = converter.generateEffectDescription(changes)
            expect(result).toBe('INI +3, DH +1')
        })

        it('should handle empty changes array', () => {
            const result = converter.generateEffectDescription([])
            expect(result).toBe('')
        })

        it('should skip changes with invalid keys', () => {
            const changes = [
                {
                    key: 'system.abgeleitete',
                    mode: 2,
                    value: '1',
                    priority: 20,
                },
                {
                    key: 'system.abgeleitete.mr',
                    mode: 2,
                    value: '2',
                    priority: 20,
                },
            ]
            const result = converter.generateEffectDescription(changes)
            expect(result).toBe('MR +2')
        })
    })

    describe('parseScriptToEffects', () => {
        it('should return empty array for empty script', () => {
            const result = converter.parseScriptToEffects('', 1)
            expect(result).toEqual([])
        })

        it('should return empty array for null script', () => {
            const result = converter.parseScriptToEffects(null, 1)
            expect(result).toEqual([])
        })

        it('should ignore scripts for kategorie 3 (Kampfstil)', () => {
            const result = converter.parseScriptToEffects('modifyWS(5)', 3)
            expect(result).toEqual([])
        })

        it('should ignore scripts for kategorie 5 (Zaubertradition)', () => {
            const result = converter.parseScriptToEffects('modifyMR(1)', 5)
            expect(result).toEqual([])
        })

        it('should ignore scripts for kategorie 7 (Geweihtentradition)', () => {
            const result = converter.parseScriptToEffects('modifyGS(1)', 7)
            expect(result).toEqual([])
        })

        it('should parse simple numeric modifyMR', () => {
            const result = converter.parseScriptToEffects('modifyMR(1)', 1)
            expect(result).toHaveLength(1)
            expect(result[0]).toEqual({
                key: 'system.abgeleitete.mr',
                mode: 2, // ADD mode
                value: '1',
                priority: 20,
            })
        })

        it('should parse simple numeric modifyGS', () => {
            const result = converter.parseScriptToEffects('modifyGS(1)', 1)
            expect(result).toHaveLength(1)
            expect(result[0]).toEqual({
                key: 'system.abgeleitete.gs',
                mode: 2, // ADD mode
                value: '1',
                priority: 20,
            })
        })

        it('should parse formula with getAttribute for WS', () => {
            const result = converter.parseScriptToEffects('modifyWS(getAttribute(KO)*5)', 1)
            expect(result).toHaveLength(1)
            expect(result[0]).toEqual({
                key: 'system.abgeleitete.ws',
                mode: 2, // ADD mode (handles formulas)
                value: '@attribute.KO.wert * 5',
                priority: 20,
            })
        })

        it('should parse formula with getAttribute for INI', () => {
            const result = converter.parseScriptToEffects('modifyINI(getAttribute(IN)/2)', 1)
            expect(result).toHaveLength(1)
            expect(result[0]).toEqual({
                key: 'system.abgeleitete.ini',
                mode: 2, // ADD mode (handles formulas)
                value: '@attribute.IN.wert / 2',
                priority: 20,
            })
        })

        it('should parse formula with complex expression', () => {
            const result = converter.parseScriptToEffects('modifyWS(getAttribute(KO)*2+5)', 1)
            expect(result).toHaveLength(1)
            expect(result[0]).toEqual({
                key: 'system.abgeleitete.ws',
                mode: 2, // ADD mode (handles formulas)
                value: '@attribute.KO.wert * 2 + 5',
                priority: 20,
            })
        })

        it('should parse multiple modifies in one script', () => {
            const result = converter.parseScriptToEffects('modifyMR(1);modifyGS(2)', 1)
            expect(result).toHaveLength(2)
            expect(result[0]).toEqual({
                key: 'system.abgeleitete.mr',
                mode: 2,
                value: '1',
                priority: 20,
            })
            expect(result[1]).toEqual({
                key: 'system.abgeleitete.gs',
                mode: 2,
                value: '2',
                priority: 20,
            })
        })

        it('should handle negative numeric values', () => {
            const result = converter.parseScriptToEffects('modifyGS(-1)', 1)
            expect(result).toHaveLength(1)
            expect(result[0]).toEqual({
                key: 'system.abgeleitete.gs',
                mode: 2,
                value: '-1',
                priority: 20,
            })
        })

        it('should handle whitespace in script', () => {
            const result = converter.parseScriptToEffects('modifyMR( 1 )', 1)
            expect(result).toHaveLength(1)
            expect(result[0]).toEqual({
                key: 'system.abgeleitete.mr',
                mode: 2,
                value: '1',
                priority: 20,
            })
        })
    })

    describe('convert with effects', () => {
        beforeEach(() => {
            // Create a minimal XML document for testing
            const xmlString = '<Datenbank></Datenbank>'
            const parser = new DOMParser()
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml')
            converter = new VorteilConverter(xmlDoc)
        })

        it('should create vorteil with effect for simple script', () => {
            const xmlString = `
                <Vorteil name="Willensstark I" 
                         voraussetzungen="Attribut MU 4" 
                         kategorie="1" 
                         script="modifyMR(1)">
                    Deine MR steigt um 1 Punkt.
                </Vorteil>
            `
            const parser = new DOMParser()
            const doc = parser.parseFromString(xmlString, 'text/xml')
            const element = doc.querySelector('Vorteil')

            const result = converter.convert(element)

            expect(result.name).toBe('Willensstark I')
            expect(result.type).toBe('vorteil')
            expect(result.system.sephrastoScript).toBe('modifyMR(1)')
            expect(result.effects).toHaveLength(1)
            expect(result.effects[0].name).toBe('Willensstark I Effekt')
            expect(result.effects[0].changes).toHaveLength(1)
            expect(result.effects[0].changes[0]).toEqual({
                key: 'system.abgeleitete.mr',
                mode: 2,
                value: '1',
                priority: 20,
            })
        })

        it('should create vorteil with effect for formula script', () => {
            const xmlString = `
                <Vorteil name="Unverwüstlich" 
                         voraussetzungen="Attribut KO 10" 
                         kategorie="1" 
                         script="modifyWS(getAttribute(KO)*5)">
                    +5*KO LeP.
                </Vorteil>
            `
            const parser = new DOMParser()
            const doc = parser.parseFromString(xmlString, 'text/xml')
            const element = doc.querySelector('Vorteil')

            const result = converter.convert(element)

            expect(result.name).toBe('Unverwüstlich')
            expect(result.effects).toHaveLength(1)
            expect(result.effects[0].changes[0]).toEqual({
                key: 'system.abgeleitete.ws',
                mode: 2,
                value: '@attribute.KO.wert * 5',
                priority: 20,
            })
        })

        it('should create vorteil without effects for kampfstil (kategorie 3)', () => {
            const xmlString = `
                <Vorteil name="Kampfstil Test" 
                         kategorie="3" 
                         script="modifyWS(5)">
                    Test kampfstil.
                </Vorteil>
            `
            const parser = new DOMParser()
            const doc = parser.parseFromString(xmlString, 'text/xml')
            const element = doc.querySelector('Vorteil')

            const result = converter.convert(element)

            expect(result.name).toBe('Kampfstil Test')
            expect(result.effects).toBeUndefined()
        })

        it('should create vorteil without effects when no script present', () => {
            const xmlString = `
                <Vorteil name="No Script Vorteil" 
                         kategorie="1">
                    Test without script.
                </Vorteil>
            `
            const parser = new DOMParser()
            const doc = parser.parseFromString(xmlString, 'text/xml')
            const element = doc.querySelector('Vorteil')

            const result = converter.convert(element)

            expect(result.name).toBe('No Script Vorteil')
            expect(result.effects).toBeUndefined()
        })
    })
})
