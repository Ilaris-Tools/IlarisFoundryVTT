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
            return schema
        }
    }
    return IlarisActiveEffectDataModel
}
