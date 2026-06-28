import { createIlarisActiveEffectDataModel } from './ilaris-effect-model.js'

export function createActiveEffectTypeDataModels(h) {
    return {
        base: createIlarisActiveEffectDataModel(h),
    }
}
