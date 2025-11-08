import { BaseConverter } from './base-converter.js'
import { DEFAULT_ARMOR_VALUES } from '../constants.js'

/**
 * Converter for Rüstung (armor)
 */
export class ArmorConverter extends BaseConverter {
    /**
     * Convert Rüstung XML element to Foundry item
     * @param {Object} element - XML element (parsed by xml2js)
     * @returns {Object} Foundry item
     */
    convert(element) {
        const name = this.extractAttribute(element, 'name', 'Unnamed Rüstung')
        const text = this.extractText(element)

        const systemData = {
            ...DEFAULT_ARMOR_VALUES,
            rs_beine: parseInt(this.extractAttribute(element, 'rsBeine', '0')) || 0,
            rs_larm: parseInt(this.extractAttribute(element, 'rsLArm', '0')) || 0,
            rs_rarm: parseInt(this.extractAttribute(element, 'rsRArm', '0')) || 0,
            rs_bauch: parseInt(this.extractAttribute(element, 'rsBauch', '0')) || 0,
            rs_brust: parseInt(this.extractAttribute(element, 'rsBrust', '0')) || 0,
            rs_kopf: parseInt(this.extractAttribute(element, 'rsKopf', '0')) || 0,
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
