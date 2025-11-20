import { BaseEigenschaftProcessor } from './base-processor.js'

/**
 * Processor for 'wielding' kategorie eigenschaften
 * Handles wielding requirements like two-handed weapons
 */
export class WieldingProcessor extends BaseEigenschaftProcessor {
    static getKategorie() {
        return 'wielding'
    }

    process(eigenschaft, computed, actor, weapon) {
        const req = eigenschaft.wieldingRequirements

        if (!req) return

        // Store flags first
        if (req.hands) {
            computed.handsRequired = Math.max(computed.handsRequired || 1, req.hands)
        }
        if (req.ignoreNebenMalus) {
            computed.ignoreNebenMalus = true
        }
        if (req.noRider) {
            computed.noRider = true
        }

        const isHauptOnly = weapon.system.hauptwaffe && !weapon.system.nebenwaffe
        const isNebenOnly = !weapon.system.hauptwaffe && weapon.system.nebenwaffe
        const isBothHands = weapon.system.hauptwaffe && weapon.system.nebenwaffe

        // Only apply general nebenwaffe malus if not already set by another processor
        if (isNebenOnly && !computed.ignoreNebenMalus && !computed._nebenwaffeMalusApplied) {
            computed.at -= 4
            computed.vt -= 4
            computed.penalties.push('Nebenwaffe: -4 AT/-4 VT')
            computed._nebenwaffeMalusApplied = true
        }

        // Apply two-handed weapon specific penalties
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
                computed.schadenBonus += penalty.schaden || 0

                if (penalty.message) {
                    computed.penalties.push(penalty.message)
                }
            }
        }
    }
}
