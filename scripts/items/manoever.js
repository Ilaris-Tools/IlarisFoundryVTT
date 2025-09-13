import { IlarisItem } from './item.js'

export class ManoeverItem extends IlarisItem {
    _manoeverRequirementsFulfilled(actor, item) {
        if (!this.system.voraussetzungen) {
            return true
        }

        // First split by comma to get AND conditions
        const andConditions = this.system.voraussetzungen.split(',').map((c) => c.trim())

        // For each AND condition, check if any of its OR parts is fulfilled
        return andConditions.every((andCondition) => {
            // Split by ODER to get OR conditions
            const orParts = andCondition.split(' ODER ')

            // Check if any of the OR parts is fulfilled
            return orParts.some((condition) => {
                const parts = condition.trim().split(' ')
                const type = parts[0]
                const value = parts.slice(1).join(' ')

                switch (type) {
                    case 'Waffeneigenschaft':
                        // Find the key where the value matches
                        const eigenschaftKey = Object.entries(
                            CONFIG.ILARIS.waffeneigenschaften,
                        ).find(([key, val]) => val === value)?.[0]
                        return eigenschaftKey ? item.system.eigenschaften[eigenschaftKey] : false
                    case 'Vorteil':
                        return actor._hasVorteil(value, item)
                    default:
                        return false
                }
            })
        })
    }
}
