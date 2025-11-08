import { BaseConverter } from './base-converter.js'
import { DEFAULT_WEAPON_VALUES } from '../constants.js'

/**
 * Converter for Waffe and Waffeneigenschaft
 */
export class WeaponConverter extends BaseConverter {
    /**
     * Convert weapon XML elements (Nahkampfwaffe and Fernkampfwaffe) to Foundry items
     * @param {Object} element - XML element (parsed by xml2js)
     * @param {string} itemType - 'nahkampfwaffe' or 'fernkampfwaffe'
     * @returns {Object} Foundry item
     */
    convert(element, itemType) {
        const name = this.extractAttribute(element, 'name', `Unnamed ${itemType}`)
        const text = this.extractText(element)

        // Construct TP from würfel, würfelSeiten, and plus
        const würfel = this.extractAttribute(element, 'würfel', '0')
        const würfelSeiten = this.extractAttribute(element, 'würfelSeiten', '0')
        const plus = parseInt(this.extractAttribute(element, 'plus', '0')) || 0
        const tp = `${würfel}W${würfelSeiten}${plus !== 0 ? (plus > 0 ? '+' + plus : plus) : ''}`

        // Parse eigenschaften from _ property (comma-separated)
        const eigenschaftenRaw = this.extractText(element)
        const eigenschaftenList = eigenschaftenRaw
            .split(',')
            .map((e) => e.trim())
            .filter((e) => e.length > 0)

        // Basic weapon system data (shared between both types)
        const systemData = {
            ...DEFAULT_WEAPON_VALUES,
            tp,
            fertigkeit: this.extractAttribute(element, 'fertigkeit'),
            talent: this.extractAttribute(element, 'talent'),
            rw: parseInt(this.extractAttribute(element, 'rw', '0')) || 0,
            eigenschaftenList,
            text,
        }

        // Add type-specific WM properties
        const wm = parseInt(this.extractAttribute(element, 'wm', '0')) || 0
        if (itemType === 'nahkampfwaffe') {
            // For nahkampfwaffe: wm applies to wm_at, and optionally wmVt to wm_vt
            systemData.wm_at = wm
            // Check if wmVt is present and not null/undefined
            const wmVt = this.extractAttribute(element, 'wmVt', null)
            if (wmVt !== null && wmVt !== undefined && wmVt !== '') {
                systemData.wm_vt = parseInt(wmVt) || 0
            } else {
                systemData.wm_vt = wm
            }
        } else if (itemType === 'fernkampfwaffe') {
            // For fernkampfwaffe: wm applies to wm_fk, and we need lz
            systemData.wm_fk = wm
            systemData.lz = parseInt(this.extractAttribute(element, 'lz', '0')) || 0
        }

        return this.createFoundryItem(name, itemType, systemData)
    }

    /**
     * Determine if a weapon is nahkampfwaffe or fernkampfwaffe based on lz attribute
     * @param {Object} element - XML element
     * @returns {string} 'nahkampfwaffe' or 'fernkampfwaffe'
     */
    determineWeaponType(element) {
        const lz = this.extractAttribute(element, 'lz', null)
        // If lz is present and not null/undefined/empty, it's a fernkampfwaffe
        return lz !== null && lz !== undefined && lz !== '' ? 'fernkampfwaffe' : 'nahkampfwaffe'
    }

    /**
     * Convert Waffe XML element to appropriate Foundry item type
     * @param {Object} element - XML element
     * @returns {Object} Foundry item (nahkampfwaffe or fernkampfwaffe)
     */
    convertWaffe(element) {
        const itemType = this.determineWeaponType(element)
        return this.convert(element, itemType)
    }

    /**
     * Convert Waffeneigenschaft XML element to Foundry item
     * @param {Object} element - XML element (parsed by xml2js)
     * @returns {Object} Foundry item
     */
    convertWaffeneigenschaft(element) {
        const name = this.extractAttribute(element, 'name', 'Unnamed Waffeneigenschaft')
        const text = this.extractText(element)
        const script = this.extractAttribute(element, 'script')

        const systemData = {
            name,
            sephrastoScript: script,
            foundryScript: '', // Empty by default, can be filled manually later
            text,
        }

        return this.createFoundryItem(name, 'waffeneigenschaft', systemData)
    }
}
