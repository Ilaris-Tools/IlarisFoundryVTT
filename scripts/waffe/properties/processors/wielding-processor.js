import { BaseEigenschaftProcessor } from './base-processor.js'

/**
 * Processor for 'wielding' kategorie eigenschaften
 * Handles wielding requirements like two-handed weapons
 */
export class WieldingProcessor extends BaseEigenschaftProcessor {
    static getKategorie() {
        return 'wielding'
    }

    process(name, eigenschaft, parameters, computed, actor, weapon) {
        const req = eigenschaft.wieldingRequirements
        const slots = eigenschaft.parameterSlots || []

        if (!req) return

        // Store flags first
        console.log(
            'Processing wielding for weapon:',
            weapon.name,
            'with requirements:',
            req,
            'parameters:',
            parameters,
        )
        if (req.hands) {
            computed.handsRequired = Math.max(computed.handsRequired || 1, req.hands)
        }
        if (req.ignoreNebenMalus) {
            computed.ignoreNebenMalus = true
        }
        if (req.noRider) {
            computed.noRider = true
        }

        // Handle condition with parameter override for value
        if (req.condition && (req.condition.value || parameters.length > 0)) {
            // Build effective condition - parameters can override condition.value
            const effectiveCondition = this._buildEffectiveCondition(
                req.condition,
                slots,
                parameters,
            )
            this.handleCondition(effectiveCondition, computed, actor, weapon, name)
        }

        const isHauptOnly = weapon.system.hauptwaffe && !weapon.system.nebenwaffe
        const isNebenOnly = !weapon.system.hauptwaffe && weapon.system.nebenwaffe
        const isBothHands = weapon.system.hauptwaffe && weapon.system.nebenwaffe

        // Apply two-handed weapon specific penalties
        if (!weapon.system.hauptwaffe && !weapon.system.nebenwaffe) return
        if (req.hands === 2) {
            let penalty = null

            if (isHauptOnly && req.penalties.hauptOnly) {
                penalty = req.penalties.hauptOnly
            } else if (isNebenOnly && req.penalties.nebenOnly) {
                penalty = req.penalties.nebenOnly
            } else if (!isBothHands && req.penalties.nebenWithoutExemption) {
                // Check if weapon has exemption from nebenwaffe penalty (via computed flag)
                if (!computed.ignoreNebenMalus) {
                    penalty = req.penalties.nebenWithoutExemption
                }
            }

            if (penalty) {
                computed.at += penalty.at || 0
                computed.vt += penalty.vt || 0
                computed.schadenBonus -= 4
                computed.modifiers.dmg.push(`${name}: -4`)
                computed.modifiers.at.push(`${name}: ${penalty.at || 0}`)
                computed.modifiers.vt.push(`${name}: ${penalty.vt || 0}`)
            }
        }
    }

    handleCondition(condition, computed, actor, weapon, name) {
        // Example condition handling: currently only supports strength requirement
        if (condition.type === 'attribute_check') {
            const attributeValue = actor.system.attribute[condition.attribute]?.wert || 0
            let checkPassed = false
            switch (condition.operator) {
                case '<':
                    checkPassed = attributeValue < condition.value
                    break
                case '<=':
                    checkPassed = attributeValue <= condition.value
                    break
                case '>':
                    checkPassed = attributeValue > condition.value
                    break
                case '>=':
                    checkPassed = attributeValue >= condition.value
                    break
                case '==':
                    checkPassed = attributeValue == condition.value
                    break
                case '!=':
                    checkPassed = attributeValue != condition.value
                    break
            }
            if (!checkPassed && condition.onFailure) {
                // Apply penalty for not meeting strength requirement
                const penalty = condition.onFailure
                computed.at += penalty.at || 0
                computed.vt += penalty.vt || 0
                computed.schadenBonus += penalty.schaden || 0

                const displayName = name || condition.attribute
                if (penalty.schaden) {
                    computed.modifiers.dmg.push(
                        `${displayName} (${condition.attribute} !${condition.operator} ${
                            condition.value
                        }): ${penalty.schaden || 0}`,
                    )
                }
                if (penalty.at) {
                    computed.modifiers.at.push(
                        `${displayName} (${condition.attribute} !${condition.operator} ${
                            condition.value
                        }): ${penalty.at || 0}`,
                    )
                }
                if (penalty.vt) {
                    computed.modifiers.vt.push(
                        `${displayName} (${condition.attribute} !${condition.operator} ${
                            condition.value
                        }): ${penalty.vt || 0}`,
                    )
                }
            }
        }
    }

    /**
     * Build effective condition by applying parameter overrides
     * @param {Object} baseCondition - The condition template from eigenschaft
     * @param {Array} slots - Parameter slot definitions
     * @param {Array} parameters - Parameter values from weapon
     * @returns {Object} Condition with parameter values applied
     * @private
     */
    _buildEffectiveCondition(baseCondition, slots, parameters) {
        const condition = { ...baseCondition }

        // Convert slots to array if it's an object
        let slotsArray = slots || []
        if (slotsArray && typeof slotsArray === 'object' && !Array.isArray(slotsArray)) {
            slotsArray = Object.values(slotsArray)
        }

        // Find parameter slot that maps to condition.value
        const valueSlotIndex = slotsArray.findIndex(
            (slot) => slot && slot.usage === 'wieldingRequirements.condition.value',
        )

        if (valueSlotIndex !== -1 && parameters[valueSlotIndex] !== undefined) {
            condition.value = Number(parameters[valueSlotIndex]) || 0
        } else if (parameters.length > 0 && typeof parameters[0] === 'number') {
            // Fallback: first parameter is the threshold value
            condition.value = parameters[0]
        }

        return condition
    }
}
