import { BaseConverter } from './base-converter.js'

/**
 * Converter for AbgeleiteterWert (Derived Values)
 * Converts XML AbgeleiteterWert elements to Foundry abgeleiteter-wert items
 */
export class AbgeleiteterWertConverter extends BaseConverter {
    /**
     * Convert XML AbgeleiteterWert element to Foundry item
     * @param {Element} element - DOM Element representing AbgeleiteterWert
     * @returns {Object} Foundry item object
     */
    convert(element) {
        const name = this.getAttribute(element, 'name', '')
        const formel = this.getAttribute(element, 'formel', '')
        const script = this.getAttribute(element, 'script', '')
        const finalscript = this.getAttribute(element, 'finalscript', '')
        const text = element.textContent?.trim() || ''

        const systemData = {
            formel,
            script,
            finalscript,
            text,
        }

        return this.createFoundryItem(
            name,
            'abgeleiteter-wert',
            systemData,
            'systems/Ilaris/assets/images/skills/profan-skill.svg',
        )
    }
}
