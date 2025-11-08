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
    })
})
