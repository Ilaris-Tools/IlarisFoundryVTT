import { createActorTemplateFields } from './shared.js'

export function createHeldActorDataModel(TypeDataModel, h) {
    return class HeldActorDataModel extends TypeDataModel {
        static defineSchema() {
            const actorBase = createActorTemplateFields(h)

            return {
                gesundheit: actorBase.gesundheit,
                attribute: actorBase.attribute,
                abgeleitete: actorBase.abgeleitete,
                schips: actorBase.schips,
                initiative: actorBase.initiative,
                furcht: actorBase.furcht,
                modifikatoren: actorBase.modifikatoren,
                misc: actorBase.misc,
                geld: actorBase.geld,
                getragen: h.number(0),
                notes: h.string(''),
            }
        }
    }
}

export function createNscActorDataModel(TypeDataModel, h) {
    return class NscActorDataModel extends TypeDataModel {
        static defineSchema() {
            const actorBase = createActorTemplateFields(h)

            return {
                gesundheit: actorBase.gesundheit,
                attribute: actorBase.attribute,
                abgeleitete: actorBase.abgeleitete,
                schips: actorBase.schips,
                initiative: actorBase.initiative,
                furcht: actorBase.furcht,
                modifikatoren: actorBase.modifikatoren,
                misc: actorBase.misc,
                geld: actorBase.geld,
                getragen: h.number(0),
                notes: h.string(''),
            }
        }
    }
}
