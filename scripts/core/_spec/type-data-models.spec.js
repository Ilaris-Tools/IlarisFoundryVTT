import { registerIlarisTypeDataModels } from '../model-data/type-data-models.js'

class MockTypeDataModel {}

class MockNumberField {
    constructor(options) {
        this.kind = 'number'
        this.options = options
    }
}

class MockStringField {
    constructor(options) {
        this.kind = 'string'
        this.options = options
    }
}

class MockBooleanField {
    constructor(options) {
        this.kind = 'boolean'
        this.options = options
    }
}

class MockObjectField {
    constructor(options) {
        this.kind = 'object'
        this.options = options
    }
}

class MockArrayField {
    constructor(elementField, options) {
        this.kind = 'array'
        this.elementField = elementField
        this.options = options
    }
}

class MockSchemaField {
    constructor(shape, options) {
        this.kind = 'schema'
        this.shape = shape
        this.options = options
    }
}

describe('registerIlarisTypeDataModels', () => {
    let warnSpy
    let logSpy

    beforeEach(() => {
        global.foundry.abstract = {
            TypeDataModel: MockTypeDataModel,
        }

        global.foundry.data = {
            fields: {
                NumberField: MockNumberField,
                StringField: MockStringField,
                BooleanField: MockBooleanField,
                SchemaField: MockSchemaField,
                ObjectField: MockObjectField,
                ArrayField: MockArrayField,
            },
        }

        global.CONFIG = {
            Actor: {},
            Item: {},
        }

        warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
        logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
        warnSpy.mockRestore()
        logSpy.mockRestore()
    })

    it('registers explicit TypeDataModel classes for actor and item types', () => {
        registerIlarisTypeDataModels()

        expect(CONFIG.Actor.dataModels.held).toBeDefined()
        expect(CONFIG.Item.dataModels.manoever).toBeDefined()
        expect(CONFIG.Actor.dataModels.kreatur).toBeDefined()
        expect(CONFIG.Item.dataModels['abgeleiteterWert']).toBeDefined()
    })

    it('creates schema fields matching top-level model defaults', () => {
        registerIlarisTypeDataModels()

        const actorSchema = CONFIG.Actor.dataModels.held.defineSchema()
        expect(actorSchema.getragen.kind).toBe('number')
        expect(actorSchema.notes.kind).toBe('string')
        expect(actorSchema.misc.kind).toBe('schema')

        const itemSchema = CONFIG.Item.dataModels.manoever.defineSchema()
        expect(itemSchema.voraussetzung.kind).toBe('string')
        expect(itemSchema.modifications.kind).toBe('array')
        expect(itemSchema.gruppe.kind).toBe('number')

        const weaponSchema = CONFIG.Item.dataModels.waffeneigenschaft.defineSchema()
        expect(weaponSchema.modifiers.kind).toBe('schema')
        expect(weaponSchema.parameterSlots.kind).toBe('array')
    })
})
