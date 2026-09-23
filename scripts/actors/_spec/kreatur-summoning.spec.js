import { createKreaturActorDataModel } from '../model-data/kreatur.js'
import { createKreaturActorSystemDefaults } from '../model-data/shared.js'

describe('creature summoning model data', () => {
    const fields = {
        number: (initial) => ({ kind: 'number', initial }),
        string: (initial) => ({ kind: 'string', initial }),
        bool: (initial) => ({ kind: 'bool', initial }),
        schema: (shape) => ({ kind: 'schema', shape }),
        arrayOfStrings: () => ({ kind: 'array' }),
    }

    it('defaults creature summoning difficulty and cost to 12', () => {
        class TypeDataModel {}
        const KreaturActorDataModel = createKreaturActorDataModel(TypeDataModel, fields)

        const schema = KreaturActorDataModel.defineSchema()

        expect(schema.summoningDifficulty).toEqual({ kind: 'number', initial: 12 })
        expect(schema.summoningCost).toEqual({ kind: 'number', initial: 12 })
    })

    it('includes the summoning defaults in plain creature system data', () => {
        expect(createKreaturActorSystemDefaults()).toEqual(
            expect.objectContaining({ summoningDifficulty: 12, summoningCost: 12 }),
        )
    })
})
