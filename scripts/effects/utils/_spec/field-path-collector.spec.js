/**
 * Tests for collectActorSystemPaths() — recursive field path collection
 *
 * @spec openspec/changes/add-pre-effect-unit-tests/specs/pre-effect-unit-tests/spec.md
 */
import { collectActorSystemPaths } from '../field-path-collector.js'

// Mock SchemaField class for instanceof checks
class MockSchemaField {
    constructor(schema) {
        this.fields = schema
    }
}

function createMockModel(schema) {
    return {
        defineSchema: () => schema,
    }
}

describe('collectActorSystemPaths', () => {
    beforeEach(() => {
        // Set up foundry.data.fields.SchemaField for instanceof checks
        if (!global.foundry.data) {
            global.foundry.data = {}
        }
        global.foundry.data.fields = {
            SchemaField: MockSchemaField,
        }
        // Initialize CONFIG (not set up in jest.setup.js)
        if (!global.CONFIG) {
            global.CONFIG = {}
        }
    })

    afterEach(() => {
        // Clean up CONFIG.Actor to avoid test leakage
        delete global.CONFIG.Actor
    })

    it('returns sorted deduplicated paths from flat schema', () => {
        global.CONFIG.Actor = {
            dataModels: {
                held: createMockModel({
                    wunden: { type: 'number' },
                    erschoepfung: { type: 'number' },
                }),
            },
        }

        const result = collectActorSystemPaths()

        expect(result).toEqual(['system.erschoepfung', 'system.wunden'])
    })

    it('handles nested SchemaField recursion', () => {
        global.CONFIG.Actor = {
            dataModels: {
                held: createMockModel({
                    gesundheit: new MockSchemaField({
                        wunden: { type: 'number' },
                        erschoepfung: { type: 'number' },
                    }),
                    attribute: new MockSchemaField({
                        KO: new MockSchemaField({
                            wert: { type: 'number' },
                            pw: { type: 'number' },
                        }),
                    }),
                }),
            },
        }

        const result = collectActorSystemPaths()

        // Should include all nested paths
        expect(result).toContain('system.gesundheit')
        expect(result).toContain('system.gesundheit.wunden')
        expect(result).toContain('system.gesundheit.erschoepfung')
        expect(result).toContain('system.attribute')
        expect(result).toContain('system.attribute.KO')
        expect(result).toContain('system.attribute.KO.wert')
        expect(result).toContain('system.attribute.KO.pw')

        // Should be sorted
        expect(result).toEqual([...result].sort())
    })

    it('returns empty array for empty data models', () => {
        global.CONFIG.Actor = {
            dataModels: {},
        }

        const result = collectActorSystemPaths()
        expect(result).toEqual([])
    })

    it('returns empty array for undefined data models', () => {
        global.CONFIG.Actor = {
            dataModels: undefined,
        }

        const result = collectActorSystemPaths()
        expect(result).toEqual([])
    })
})
