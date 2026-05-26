import { BaseConverter } from './base-converter.js'
import { createRuestungDefaults } from '../constants.js'

/**
 * Converter for Rüstung (armor)
 */
export class ArmorConverter extends BaseConverter {
    /**
     * Convert Rüstung XML element to Foundry item
     * @param {Element} element - DOM Element
     * @returns {Object} Foundry item
     */
    convert(element) {
        const name = this.getAttribute(element, 'name', 'Unnamed Rüstung')
        const text = this.getTextContent(element)

        const systemData = {
            ...createRuestungDefaults(),
            rs_beine: parseInt(this.getAttribute(element, 'rsBeine', '0')) || 0,
            rs_larm: parseInt(this.getAttribute(element, 'rsLArm', '0')) || 0,
            rs_rarm: parseInt(this.getAttribute(element, 'rsRArm', '0')) || 0,
            rs_bauch: parseInt(this.getAttribute(element, 'rsBauch', '0')) || 0,
            rs_brust: parseInt(this.getAttribute(element, 'rsBrust', '0')) || 0,
            rs_kopf: parseInt(this.getAttribute(element, 'rsKopf', '0')) || 0,
            text,
        }

        return this.createFoundryItem(name, 'ruestung', systemData)
    }

    /**
     * Convenience method for converting Rüstung
     * @param {Object} element - XML element
     * @returns {Object} Foundry item
     */
    convertRuestung(element) {
        return this.convert(element)
    }
}
