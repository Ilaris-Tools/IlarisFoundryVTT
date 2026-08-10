/**
 * Factory: creates the IlarisActiveEffectDataModel TypeDataModel.
 *
 * Extends V14's built-in ActiveEffectTypeDataModel which already defines
 * the `changes` ArrayField with EffectChangeData schema.
 * We add ilarisTiming on top via super.defineSchema().
 *
 * Registered as CONFIG.ActiveEffect.dataModels["base"]
 *
 * @param {object} h — field helpers
 * @returns {typeof foundry.data.ActiveEffectTypeDataModel}
 */
export function createIlarisActiveEffectDataModel(h) {
    const Base = foundry.data.ActiveEffectTypeDataModel

    class IlarisActiveEffectDataModel extends Base {
        static defineSchema() {
            const schema = super.defineSchema()
            schema.ilarisTiming = h.schema({
                durationType: h.string('ownerTurns'),
                expiresOn: h.string('turnStart'),
                remaining: h.number(0),
                originalValue: h.number(0),
                _pendingExpiry: h.bool(false),
                _pendingDurationChange: h.bool(false),
            })
            // `changes` intentionally remains the native Foundry channel. Contextual
            // Ilaris rules are authored separately so they can be resolved for a
            // weapon, Talent, or situation without modifying prepared actor data.
            schema.ilarisSource = h.string('ordinary')
            schema.ilarisModifiers = h.arrayOfObjects()
            schema.ilarisArmedCombat = h.object({})
            schema.ilarisEnding = h.object({})
            const sourceTiming = h.schema({
                durationType: h.string(''),
                expiresOn: h.string(''),
                remaining: h.number(0),
            })
            const conditionSource = h.schema({
                id: h.string(''),
                type: h.string('preEffect'),
                origin: h.string(''),
                timing: sourceTiming,
            })
            schema.ilarisCondition = h.schema({
                statusId: h.string(''),
                sources: new foundry.data.fields.ArrayField(conditionSource, {
                    required: false,
                    nullable: true,
                    initial: () => [],
                }),
            })
            return schema
        }
    }
    return IlarisActiveEffectDataModel
}
