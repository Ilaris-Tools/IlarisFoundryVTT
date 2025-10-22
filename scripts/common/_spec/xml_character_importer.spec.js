import { XmlCharacterImporter } from '../xml_character_importer.js'

// Mock DOMParser for Node.js environment
class MockDOMParser {
    parseFromString(xmlString, mimeType) {
        // Simple XML parser mock that extracts the data we need for tests
        const doc = {
            querySelector: (selector) => {
                if (selector === 'Beschreibung') {
                    return {
                        querySelector: (subSelector) => {
                            if (subSelector === 'Name') {
                                const match = xmlString.match(/<Name>(.*?)<\/Name>/)
                                return match
                                    ? { textContent: match[1].trim() }
                                    : { textContent: '' }
                            }
                            return null
                        },
                        querySelectorAll: () => [],
                    }
                }
                return null
            },
            querySelectorAll: (selector) => {
                const results = []
                if (selector === 'FreieFertigkeiten > FreieFertigkeit') {
                    const regex = /<FreieFertigkeit\s+([^>]*)>/g
                    let match
                    while ((match = regex.exec(xmlString)) !== null) {
                        const attrs = match[1]
                        const nameMatch = attrs.match(/name="([^"]*)"/)
                        const wertMatch = attrs.match(/wert="([^"]*)"/)
                        if (nameMatch) {
                            results.push({
                                getAttribute: (attrName) => {
                                    if (attrName === 'name') return nameMatch[1]
                                    if (attrName === 'wert') return wertMatch ? wertMatch[1] : null
                                    return null
                                },
                            })
                        }
                    }
                }
                return results
            },
        }
        return doc
    }
}

describe('XmlCharacterImporter - FreieFertigkeiten', () => {
    let importer

    beforeEach(() => {
        // Mock DOMParser
        global.DOMParser = MockDOMParser
        importer = new XmlCharacterImporter()
    })

    afterEach(() => {
        delete global.DOMParser
    })

    describe('parseCharacterXml', () => {
        it('should parse FreieFertigkeiten from XML', () => {
            const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
                <Held>
                    <Beschreibung>
                        <Name>Test Charakter</Name>
                    </Beschreibung>
                    <FreieFertigkeiten>
                        <FreieFertigkeit name="Garethi" wert="3"/>
                        <FreieFertigkeit name="stuff" wert="1"/>
                    </FreieFertigkeiten>
                </Held>`

            const xmlDoc = importer.xmlParser.parseFromString(xmlContent, 'text/xml')
            const characterData = importer.parseCharacterXml(xmlDoc)

            expect(characterData.freeSkills).toBeDefined()
            expect(characterData.freeSkills).toHaveLength(2)
            expect(characterData.freeSkills[0]).toEqual({ name: 'Garethi', value: 3 })
            expect(characterData.freeSkills[1]).toEqual({ name: 'stuff', value: 1 })
        })

        it('should handle empty FreieFertigkeiten section', () => {
            const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
                <Held>
                    <Beschreibung>
                        <Name>Test Charakter</Name>
                    </Beschreibung>
                    <FreieFertigkeiten>
                    </FreieFertigkeiten>
                </Held>`

            const xmlDoc = importer.xmlParser.parseFromString(xmlContent, 'text/xml')
            const characterData = importer.parseCharacterXml(xmlDoc)

            expect(characterData.freeSkills).toBeDefined()
            expect(characterData.freeSkills).toHaveLength(0)
        })

        it('should handle missing FreieFertigkeiten section', () => {
            const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
                <Held>
                    <Beschreibung>
                        <Name>Test Charakter</Name>
                    </Beschreibung>
                </Held>`

            const xmlDoc = importer.xmlParser.parseFromString(xmlContent, 'text/xml')
            const characterData = importer.parseCharacterXml(xmlDoc)

            expect(characterData.freeSkills).toBeDefined()
            expect(characterData.freeSkills).toHaveLength(0)
        })

        it('should skip FreieFertigkeit entries without name', () => {
            const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
                <Held>
                    <Beschreibung>
                        <Name>Test Charakter</Name>
                    </Beschreibung>
                    <FreieFertigkeiten>
                        <FreieFertigkeit name="Garethi" wert="3"/>
                        <FreieFertigkeit wert="5"/>
                        <FreieFertigkeit name="Valid" wert="2"/>
                    </FreieFertigkeiten>
                </Held>`

            const xmlDoc = importer.xmlParser.parseFromString(xmlContent, 'text/xml')
            const characterData = importer.parseCharacterXml(xmlDoc)

            expect(characterData.freeSkills).toBeDefined()
            expect(characterData.freeSkills).toHaveLength(2)
            expect(characterData.freeSkills[0]).toEqual({ name: 'Garethi', value: 3 })
            expect(characterData.freeSkills[1]).toEqual({ name: 'Valid', value: 2 })
        })

        it('should default to 0 for missing wert attribute', () => {
            const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
                <Held>
                    <Beschreibung>
                        <Name>Test Charakter</Name>
                    </Beschreibung>
                    <FreieFertigkeiten>
                        <FreieFertigkeit name="NoValue"/>
                        <FreieFertigkeit name="WithValue" wert="5"/>
                    </FreieFertigkeiten>
                </Held>`

            const xmlDoc = importer.xmlParser.parseFromString(xmlContent, 'text/xml')
            const characterData = importer.parseCharacterXml(xmlDoc)

            expect(characterData.freeSkills).toBeDefined()
            expect(characterData.freeSkills).toHaveLength(2)
            expect(characterData.freeSkills[0]).toEqual({ name: 'NoValue', value: 0 })
            expect(characterData.freeSkills[1]).toEqual({ name: 'WithValue', value: 5 })
        })
    })

    describe('analyzeImportData', () => {
        it('should count free skills in analysis', async () => {
            const characterData = {
                name: 'Test',
                attributes: {},
                skills: [],
                supernaturalSkills: [],
                talents: [],
                supernaturalTalents: [],
                advantages: [],
                weapons: [],
                energies: {},
                experience: { total: 0, spent: 0 },
                description: {},
                eigenheiten: [],
                notes: '',
                freeSkills: [
                    { name: 'Garethi', value: 3 },
                    { name: 'stuff', value: 1 },
                ],
            }

            const analysis = await importer.analyzeImportData(characterData)

            expect(analysis.freeSkills).toBeDefined()
            expect(analysis.freeSkills.total).toBe(2)
        })

        it('should handle zero free skills', async () => {
            const characterData = {
                name: 'Test',
                attributes: {},
                skills: [],
                supernaturalSkills: [],
                talents: [],
                supernaturalTalents: [],
                advantages: [],
                weapons: [],
                energies: {},
                experience: { total: 0, spent: 0 },
                description: {},
                eigenheiten: [],
                notes: '',
                freeSkills: [],
            }

            const analysis = await importer.analyzeImportData(characterData)

            expect(analysis.freeSkills).toBeDefined()
            expect(analysis.freeSkills.total).toBe(0)
        })
    })
})
