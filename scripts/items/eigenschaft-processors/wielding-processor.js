import { BaseEigenschaftProcessor } from './base-processor.js'

/**
 * Processor for 'wielding' kategorie eigenschaften
 * Handles wielding requirements like two-handed weapons
 */
export class WieldingProcessor extends BaseEigenschaftProcessor {
    static getKategorie() {
        return 'wielding'
    }

    process(name, eigenschaft, computed, actor, weapon) {
        const req = eigenschaft.wieldingRequirements

        if (!req) return

        // Store flags first
        console.log('Processing wielding for weapon:', weapon.name, 'with requirements:', req)
        if (req.hands) {
            computed.handsRequired = Math.max(computed.handsRequired || 1, req.hands)
        }
        if (req.ignoreNebenMalus) {
            computed.ignoreNebenMalus = true
        }
        if (req.noRider) {
            computed.noRider = true
        }

        if (req.condition && req.condition.value) {
            this.handleCondition(req.condition, computed, actor, weapon)
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

    handleCondition(condition, computed, actor, weapon) {
        // Example condition handling: currently only supports strength requirement
        if (condition.type === 'attribute_check') {
            const attributeValue = actor.system.attribute[condition.attribute].wert || 0
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

                if (penalty.schaden) {
                    computed.modifiers.dmg.push(
                        `${condition.attribute} Voraussetzung nicht erfüllt: ${
                            penalty.schaden || 0
                        }`,
                    )
                }
                if (penalty.at) {
                    computed.modifiers.at.push(
                        `${condition.attribute} Voraussetzung nicht erfüllt: ${penalty.at || 0}`,
                    )
                }
                if (penalty.vt) {
                    computed.modifiers.vt.push(
                        `${condition.attribute} Voraussetzung nicht erfüllt: ${penalty.vt || 0}`,
                    )
                }
            }
        }
    }
}
