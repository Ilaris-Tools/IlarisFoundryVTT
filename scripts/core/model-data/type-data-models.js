import { createActorTypeDataModels } from '../../actors/model-data/index.js'
import { createItemTypeDataModels } from '../../items/model-data/models.js'
import { buildTypeDataFieldHelpers } from './field-helpers.js'

export function registerIlarisTypeDataModels() {
    const TypeDataModel = foundry?.abstract?.TypeDataModel
    const fields = foundry?.data?.fields

    if (!TypeDataModel || !fields?.SchemaField) {
        console.warn(
            'Ilaris | TypeDataModel API not available; skipping explicit data model registration.',
        )
        return
    }

    const helpers = buildTypeDataFieldHelpers(fields)

    CONFIG.Actor.dataModels = {
        ...(CONFIG.Actor.dataModels || {}),
        ...createActorTypeDataModels(TypeDataModel, helpers),
    }

    CONFIG.Item.dataModels = {
        ...(CONFIG.Item.dataModels || {}),
        ...createItemTypeDataModels(TypeDataModel, helpers),
    }

    console.log(
        `Ilaris | Registered explicit strict TypeDataModels (${Object.keys(CONFIG.Actor.dataModels).length} Actor types, ${Object.keys(CONFIG.Item.dataModels).length} Item types).`,
    )
}
