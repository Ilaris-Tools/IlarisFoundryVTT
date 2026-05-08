import { IlarisItem } from './item.js'
/**
 * Ein spezieller Item-Typ, der ausschließlich als Container für Active Effects dient.
 * Diese Klasse erweitert das Foundry VTT Item-Document und ermöglicht es,
 * vordefinierte Active Effects in einem Compendium zu speichern und auf Actors anzuwenden.
 */
export class EffectItem extends IlarisItem {
    /** @override */
    prepareDerivedData() {
        super.prepareDerivedData()

        // Stelle sicher, dass die eingebetteten Effects standardmäßig aktiv sind.
        if (this.effects) {
            this.effects.forEach((e) => {
                if (e.disabled === undefined) {
                    e.disabled = false
                }
            })
        }
    }

    /**
     * Wendet die in diesem Item gespeicherten Active Effects auf einen Ziel-Actor an.
     * @param {Actor} targetActor - Der Actor, der den Effekt erhalten soll.
     * @returns {Promise<ActiveEffect[]>} - Die erstellten ActiveEffect-Dokumente.
     */
    async applyEffectsToActor(targetActor) {
        if (!this.effects || this.effects.size === 0) {
            ui.notifications.warn(`Item "${this.name}" enthält keine Active Effects.`)
            return []
        }

        // Erstelle Kopien der eingebetteten Effects auf dem Ziel-Actor
        const effectData = this.effects.map((e) => e.toObject())

        try {
            const createdEffects = await targetActor.createEmbeddedDocuments(
                'ActiveEffect',
                effectData,
            )
            ui.notifications.info(
                `${createdEffects.length} Effekt(e) von "${this.name}" wurden auf ${targetActor.name} angewendet.`,
            )
            return createdEffects
        } catch (error) {
            console.error('Fehler beim Anwenden der Effects:', error)
            ui.notifications.error(`Fehler beim Anwenden der Effekte von "${this.name}".`)
            return []
        }
    }

    /**
     * Überprüft, ob dieses Item ein Effect-Container ist.
     * @returns {boolean}
     */
    get isEffectContainer() {
        return this.type === 'effectItem' || this.effects?.size > 0
    }
}
