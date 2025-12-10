import { BaseConverter } from './base-converter.js'
import { DEFAULT_WEAPON_VALUES } from '../constants.js'

/**
 * Converter for Waffe and Waffeneigenschaft
 */
export class WeaponConverter extends BaseConverter {
    /**
     * Convert weapon XML elements (Nahkampfwaffe and Fernkampfwaffe) to Foundry items
     * @param {Element} element - DOM Element
     * @param {string} itemType - 'nahkampfwaffe' or 'fernkampfwaffe'
     * @returns {Object} Foundry item
     */
    convert(element, itemType) {
        const name = this.getAttribute(element, 'name', `Unnamed ${itemType}`)

        // Construct TP from würfel, würfelSeiten, and plus
        const würfel = this.getAttribute(element, 'würfel', '0')
        const würfelSeiten = this.getAttribute(element, 'würfelSeiten', '0')
        const plus = parseInt(this.getAttribute(element, 'plus', '0')) || 0
        const tp = `${würfel}W${würfelSeiten}${plus !== 0 ? (plus > 0 ? '+' + plus : plus) : ''}`

        // Parse eigenschaften from text content (comma-separated)
        // The text content contains the eigenschaften, NOT the description
        const eigenschaftenRaw = this.getTextContent(element)
        const eigenschaften = eigenschaftenRaw
            .split(',')
            .map((e) => e.trim())
            .filter((e) => e.length > 0)

        // Basic weapon system data (shared between both types)
        const systemData = {
            ...DEFAULT_WEAPON_VALUES,
            tp,
            fertigkeit: this.getAttribute(element, 'fertigkeit'),
            talent: this.getAttribute(element, 'talent'),
            rw: parseInt(this.getAttribute(element, 'rw', '0')) || 0,
            eigenschaften,
        }

        // Add type-specific WM properties
        const wm = parseInt(this.getAttribute(element, 'wm', '0')) || 0
        if (itemType === 'nahkampfwaffe') {
            // For nahkampfwaffe: wm applies to wm_at, and optionally wmVt to wm_vt
            systemData.wm_at = wm
            // Check if wmVt is present and not null/undefined
            const wmVt = this.getAttribute(element, 'wmVt', null)
            if (wmVt !== null && wmVt !== undefined && wmVt !== '') {
                systemData.wm_vt = parseInt(wmVt) || 0
            } else {
                systemData.wm_vt = wm
            }
        } else if (itemType === 'fernkampfwaffe') {
            // For fernkampfwaffe: wm applies to wm_fk, and we need lz
            systemData.wm_fk = wm
            systemData.lz = parseInt(this.getAttribute(element, 'lz', '0')) || 0
        }

        return this.createFoundryItem(name, itemType, systemData)
    }

    /**
     * Determine if a weapon is nahkampfwaffe or fernkampfwaffe based on lz attribute
     * @param {Element} element - DOM Element
     * @returns {string} 'nahkampfwaffe' or 'fernkampfwaffe'
     */
    determineWeaponType(element) {
        const lz = this.getAttribute(element, 'lz', null)
        // If lz is present and not null/undefined/empty, it's a fernkampfwaffe
        return lz !== null && lz !== undefined && lz !== '' ? 'fernkampfwaffe' : 'nahkampfwaffe'
    }

    /**
     * Convert Waffe XML element to appropriate Foundry item type
     * @param {Element} element - DOM Element
     * @returns {Object} Foundry item (nahkampfwaffe or fernkampfwaffe)
     */
    convertWaffe(element) {
        const itemType = this.determineWeaponType(element)
        return this.convert(element, itemType)
    }

    /**
     * Convert Waffeneigenschaft XML element to Foundry item
     * @param {Element} element - DOM Element
     * @returns {Object} Foundry item
     */
    convertWaffeneigenschaft(element) {
        const name = this.getAttribute(element, 'name', 'Unnamed Waffeneigenschaft')
        const text = this.getTextContent(element)
        const script = this.getAttribute(element, 'script')

        const systemData = {
            name,
            sephrastoScript: script,
            foundryScript: '', // Empty by default, can be filled manually later
            text,
        }

        return this.createFoundryItem(name, 'waffeneigenschaft', systemData)
    }
}
