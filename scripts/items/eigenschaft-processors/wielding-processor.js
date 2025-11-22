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

        if (!weapon.system.hauptwaffe && !weapon.system.nebenwaffe) return
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
                computed.schadenBonus -= 4
                computed.modifiers.dmg.push(`${name}: -4`)
                computed.modifiers.at.push(`${name}: ${penalty.at || 0}`)
                computed.modifiers.vt.push(`${name}: ${penalty.vt || 0}`)
            }
        }
    }
}
