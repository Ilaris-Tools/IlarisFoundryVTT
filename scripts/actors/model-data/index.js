import { createHeldActorDataModel, createNscActorDataModel } from './held.js'
import { createKreaturActorDataModel } from './kreatur.js'

export function createActorTypeDataModels(TypeDataModel, h) {
    return {
        held: createHeldActorDataModel(TypeDataModel, h),
        nsc: createNscActorDataModel(TypeDataModel, h),
        kreatur: createKreaturActorDataModel(TypeDataModel, h),
    }
}
