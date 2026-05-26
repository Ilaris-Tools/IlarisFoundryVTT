import { BaseConverter } from './base-converter.js'
import { createAbgeleiteterWertDefaults } from '../../../../items/model-data/shared.js'

/**
 * Converter for AbgeleiteterWert (Derived Values)
 * Converts XML AbgeleiteterWert elements to Foundry abgeleiteterWert items
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
            ...createAbgeleiteterWertDefaults(name),
            formel,
            script,
            finalscript,
            text,
        }

        return this.createFoundryItem(
            name,
            'abgeleiteterWert',
            systemData,
            'systems/Ilaris/assets/images/skills/profan-skill.svg',
        )
    }
}
