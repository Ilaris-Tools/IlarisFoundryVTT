import { IlarisItem } from './item.js'

export class ManoeverItem extends IlarisItem {
    _manoeverRequirementsFulfilled(actor, item) {
        const voraussetzung = this.system.voraussetzung || this.system.voraussetzungen

        // If the maneuver is explicitly listed in angriffmanover, unlock it immediately.
        if (
            Array.isArray(item.system.angriffmanover) &&
            item.system.angriffmanover.includes(this.name)
        ) {
            return true
        }

        if (!voraussetzung) {
            return true
        }
        // First split by comma to get AND conditions
        const andConditions = voraussetzung.split(',').map((c) => c.trim())

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
                        if (item.type === 'angriff') {
                            return Object.values(item.system.eigenschaften).some(
                                (eigenschaft) => eigenschaft.name === value,
                            )
                        }
                        return item.system.eigenschaften.some(
                            (eigenschaft) => eigenschaft.key === value,
                        )
                    case 'Vorteil':
                        return actor._hasVorteil(value, item)
                    default:
                        return false
                }
            })
        })
    }
}
