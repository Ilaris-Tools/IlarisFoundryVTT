import { UebernatuerlichTalentSheet } from './uebernatuerlich-talent.js'

/* Reference shape for `item.system` on `manoever` items.
    "manoever": {
    "voraussetzung": "Vorteil Name1",
      "inputs": {
            "label": "Checkbox | Auswahl | X",
            "field": "CHECKBOX | SELECTOR | NUMBER",
            "choices": ["foo", "bar", "baz"], // only for SELECTOR
            "min": 0, // only for NUMBER
            "max": 8  // only for NUMBER
        },
      "modifications": [
        {
            "type": DAMAGE | DEFENCE | ATTACK | INITIATIVE | LOADING_TIME | SPECIAL_RESSOURCE | WEAPON_DAMAGE | CHANGE_DAMAGE_TYPE | ZERO_DAMAGE | ARMOR_BREAKING | SPECIAL_TEXT,
            "value": 0,
            "operator": MULTIPLY | ADD (+/- values) | SUBTRACT (braucht man vermutlich nur bei Werten vor die man kein - setzen kann zb. wenn sie aus target kommen) | DIVIDE
            "target": "Wert zb aus Actor (99% aller Faelle aus Actor) wie actor.system.abgeleitete.gs, der entsprechend des operator behandelt wird"
            "affectedByInput": true | false // ob der Wert durch den Input beeinflusst wird
        }
      ],
      "gruppe": 0,
      "probe": "", // beschreibt nur was weiter oben durch modifications bewirkt wird
      "gegenprobe": "",
      "text": ""
    },
*/

export class ManoeverSheet extends UebernatuerlichTalentSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'manoever'],
        actions: {
            addModification: ManoeverSheet.#onAddModification,
            deleteModification: ManoeverSheet.#onDeleteModification,
            addSelectorChoice: ManoeverSheet.#onAddSelectorChoice,
            deleteSelectorChoice: ManoeverSheet.#onDeleteSelectorChoice,
        },
    }

    /** @override */
    static PARTS = {
        ...UebernatuerlichTalentSheet.PARTS,
        form: {
            template: 'systems/Ilaris/scripts/items/templates/manoever.hbs',
        },
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        context.manoever = CONFIG.ILARIS.manoever
        context.isManeuverPreEffect = true

        return context
    }

    _defaultPreEffect() {
        return {
            ...super._defaultPreEffect(),
            activation: 'onConfirmedHit',
            operation: '',
            ilarisEnding: { type: '' },
        }
    }

    /**
     * Handle add modification action
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async #onAddModification(event, target) {
        const modifications = Object.values(this.document.system.modifications)
        modifications.push({
            type: 'ATTACK',
            value: 0,
            operator: 'ADD',
            target: '',
            affectedByInput: true,
        })

        await this.document.update({
            'system.modifications': modifications,
        })
    }

    /**
     * Handle delete modification action
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async #onDeleteModification(event, target) {
        const modificationId = target.dataset.modificationid
        const modifications = Object.values(this.document.system.modifications)
        modifications.splice(parseInt(modificationId), 1)

        await this.document.update({
            'system.modifications': modifications,
        })
    }

    static async #onAddSelectorChoice(event, target) {
        const choices = foundry.utils.deepClone(this.document.system.input?.choices || [])
        choices.push('')
        await this.document.update({ 'system.input.choices': choices })
    }

    static async #onDeleteSelectorChoice(event, target) {
        const choices = foundry.utils.deepClone(this.document.system.input?.choices || [])
        choices.splice(Number(target.dataset.choiceIndex), 1)
        await this.document.update({ 'system.input.choices': choices })
    }
}
