import { createActorTemplateFields } from './shared.js'

export function createKreaturActorDataModel(TypeDataModel, h) {
    return class KreaturActorDataModel extends TypeDataModel {
        static defineSchema() {
            const actorBase = createActorTemplateFields(h)
            const displayFields = createActorTemplateFields(h)

            return {
                gesundheit: actorBase.gesundheit,
                energien: actorBase.energien,
                initiative: actorBase.initiative,
                furcht: actorBase.furcht,
                modifikatoren: actorBase.modifikatoren,
                schips: actorBase.schips,
                attribute: actorBase.attribute,
                additemtype: h.string('angriff'),
                edit: h.bool(false),
                kreaturentyp: h.string('humanoid'),
                kurzbeschreibung: h.string(''),
                kampfwerte: h.schema({
                    ws: h.number(0),
                    ws_stern: h.number(0),
                    ini: h.number(0),
                    baseIni: h.number(0),
                    gs: h.number(1),
                    koloss: h.number(0),
                    mr: h.number(0),
                    gs_schwimmend: h.number(0),
                }),
                talente: h.arrayOfStrings(),
                freietalente: h.arrayOfStrings(),
                kampfunfaehig: h.string(''),
                text: h.string(''),
                abgeleitete: actorBase.abgeleitete,
                displayWerte: displayFields.abgeleitete,
            }
        }
    }
}
