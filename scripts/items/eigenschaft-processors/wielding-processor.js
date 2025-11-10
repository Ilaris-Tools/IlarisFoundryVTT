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

        if (!req || req.hands !== 2) return

        const isHauptOnly = weapon.system.hauptwaffe && !weapon.system.nebenwaffe
        const isNebenOnly = !weapon.system.hauptwaffe && weapon.system.nebenwaffe
        const isBothHands = weapon.system.hauptwaffe && weapon.system.nebenwaffe

        let penalty = null

        if (req.hands === 2) {
            if (isHauptOnly && req.penalties.hauptOnly) {
                penalty = req.penalties.hauptOnly
            } else if (isNebenOnly && req.penalties.nebenOnly) {
                penalty = req.penalties.nebenOnly
            } else if (!isBothHands && req.penalties.nebenWithoutExemption) {
                // Check if weapon has exemption from nebenwaffe penalty
                const hasExemption = weapon.system.eigenschaften.includes(
                    'kein Malus als Nebenwaffe',
                )
                if (!hasExemption) {
                    penalty = req.penalties.nebenWithoutExemption
                }
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
