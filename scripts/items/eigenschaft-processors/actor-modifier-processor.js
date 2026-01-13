import { BaseEigenschaftProcessor } from './base-processor.js'

/**
 * Processor for 'actor_modifier' kategorie eigenschaften
 * These eigenschaften modify actor stats, not weapon stats
 */
export class ActorModifierProcessor extends BaseEigenschaftProcessor {
    static getKategorie() {
        return 'actor_modifier'
    }

    process(name, eigenschaft, parameters, computed, actor, weapon) {
        // Check if eigenschaft has actorModifiers structure
        if (!eigenschaft.actorModifiers || !eigenschaft.actorModifiers.modifiers) {
            return
        }

        // Mark that this weapon has actor modifiers
        computed.hasActorModifiers = true

        // Store the modifiers in computed so the actor can collect them
        if (!computed.actorModifiers) {
            computed.actorModifiers = []
        }

        // Handle both array and object formats (objects with numeric keys)
        const modifiers = Array.isArray(eigenschaft.actorModifiers.modifiers)
            ? eigenschaft.actorModifiers.modifiers
            : Object.values(eigenschaft.actorModifiers.modifiers)

        for (const mod of modifiers) {
            if (mod && mod.mode && mod.property) {
                computed.actorModifiers.push({
                    property: mod.property,
                    mode: mod.mode,
                    value: mod.value || 0,
                    weaponName: weapon.name,
                })
            }
        }
    }
}
