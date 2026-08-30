import { createItemTemplateFields } from './shared.js'

export function createItemTypeDataModels(TypeDataModel, h) {
    const createWaffeFields = () => ({
        tp: h.string(''),
        fertigkeit: h.string(''),
        talent: h.string(''),
        rw: h.number(0),
        hauptwaffe: h.bool(false),
        nebenwaffe: h.bool(false),
        eigenschaften: h.arrayOfObjects(),
        text: h.string(''),
        manoverausgleich: h.schema({
            value: h.number(0),
            overcomplicated: h.bool(true),
        }),
    })
    const createFertigkeitFields = () => ({
        basis: h.number(0),
        fw: h.number(0),
        pw: h.number(0),
        attribut_0: h.string('KO'),
        attribut_1: h.string('KO'),
        attribut_2: h.string('KO'),
        gruppe: h.number(-1),
        text: h.string(''),
    })
    const createUebernatuerlichTalentFields = () => ({
        fertigkeiten: h.string(''),
        fertigkeit_ausgewaehlt: h.string('auto'),
        text: h.string(''),
        maechtig: h.string(''),
        schwierigkeit: h.string(''),
        magicResistance: h.schema({
            enabled: h.bool(false),
        }),
        modifikationen: h.string(''),
        vorbereitung: h.string(''),
        ziel: h.string(''),
        reichweite: h.string(''),
        wirkungsdauer: h.string(''),
        kosten: h.string(''),
        erlernen: h.string(''),
        pw: h.number(0),
        gruppe: h.number(-1),
        preEffects: h.arrayOfObjects(),
        // `null` deliberately represents the absence of zone automation.
        // Keeping this optional avoids turning every supernatural Item into a zone.
        zone: h.object(null),
        spellModifications: h.arrayOfObjects(),
        spellModificationGroups: h.arrayOfObjects(),
    })

    class NahkampfwaffeItemDataModel extends TypeDataModel {
        static defineSchema() {
            const itemBase = createItemTemplateFields(h)

            return {
                ...itemBase,
                ...createWaffeFields(),
                wm_at: h.number(0),
                wm_vt: h.number(0),
                rw_mod: h.number(0),
                computed: h.object({}),
            }
        }
    }

    class FernkampfwaffeItemDataModel extends TypeDataModel {
        static defineSchema() {
            const itemBase = createItemTemplateFields(h)

            return {
                ...itemBase,
                ...createWaffeFields(),
                wm_fk: h.number(0),
                lz: h.number(0),
                rw_mod: h.number(0),
                computed: h.object({}),
            }
        }
    }

    class RuestungItemDataModel extends TypeDataModel {
        static defineSchema() {
            const itemBase = createItemTemplateFields(h)

            return {
                ...itemBase,
                rs: h.number(0),
                be: h.number(0),
                rs_beine: h.number(0),
                rs_larm: h.number(0),
                rs_rarm: h.number(0),
                rs_bauch: h.number(0),
                rs_brust: h.number(0),
                rs_kopf: h.number(0),
                aktiv: h.bool(false),
                text: h.string(''),
            }
        }
    }

    class GegenstandItemDataModel extends TypeDataModel {
        static defineSchema() {
            const itemBase = createItemTemplateFields(h)

            return {
                ...itemBase,
                text: h.string(''),
            }
        }
    }

    class FertigkeitItemDataModel extends TypeDataModel {
        static defineSchema() {
            return {
                ...createFertigkeitFields(),
                pwt: h.number(0),
            }
        }
    }

    class TalentItemDataModel extends TypeDataModel {
        static defineSchema() {
            return {
                text: h.string(''),
                fertigkeit: h.string(''),
            }
        }
    }

    class UebernatuerlicheFertigkeitItemDataModel extends TypeDataModel {
        static defineSchema() {
            return {
                ...createFertigkeitFields(),
                voraussetzung: h.string(''),
            }
        }
    }

    class LiturgieItemDataModel extends TypeDataModel {
        static defineSchema() {
            return {
                ...createUebernatuerlichTalentFields(),
            }
        }
    }

    class ZauberItemDataModel extends TypeDataModel {
        static defineSchema() {
            return {
                ...createUebernatuerlichTalentFields(),
            }
        }
    }

    class AnrufungItemDataModel extends TypeDataModel {
        static defineSchema() {
            return {
                ...createUebernatuerlichTalentFields(),
            }
        }
    }

    class FreieFertigkeitItemDataModel extends TypeDataModel {
        static defineSchema() {
            return {
                stufe: h.number(1),
                text: h.string(''),
                gruppe: h.number(0),
            }
        }
    }

    class VorteilItemDataModel extends TypeDataModel {
        static defineSchema() {
            return {
                voraussetzung: h.string(''),
                gruppe: h.number(0),
                text: h.string(''),
                sephrastoScript: h.string(''),
                stilBedingungen: h.string(''),
                foundryScript: h.string(''),
            }
        }
    }

    class ManoeverItemDataModel extends TypeDataModel {
        static defineSchema() {
            return {
                voraussetzung: h.string(''),
                input: h.schema({
                    label: h.string('Checkbox'),
                    field: h.string('CHECKBOX'),
                    choices: h.arrayOfStrings(),
                    min: h.number(0),
                    max: h.number(0),
                }),
                modifications: h.arrayOfObjects(),
                preEffects: h.arrayOfObjects(),
                gruppe: h.number(0),
                probe: h.string(''),
                gegenprobe: h.string(''),
                text: h.string(''),
                isBaseManoever: h.bool(false),
            }
        }
    }

    class EigenheitItemDataModel extends TypeDataModel {
        static defineSchema() {
            return { text: h.string('') }
        }
    }

    class EigenschaftItemDataModel extends TypeDataModel {
        static defineSchema() {
            return { text: h.string('') }
        }
    }

    class AngriffItemDataModel extends TypeDataModel {
        static defineSchema() {
            return {
                eigenschaften: h.arrayOfObjects(),
                tp: h.string(''),
                haerte: h.number(0),
                rw: h.number(0),
                lz: h.number(0),
                wm_at: h.number(0),
                typ: h.string('Nah'),
                at: h.number(0),
                vt: h.number(0),
                angriffmanover: h.arrayOfStrings(),
            }
        }
    }

    class InfoItemDataModel extends TypeDataModel {
        static defineSchema() {
            return { text: h.string('') }
        }
    }

    class FreiesTalentItemDataModel extends TypeDataModel {
        static defineSchema() {
            return {
                text: h.string(''),
                pw: h.string(''),
                profan: h.bool(true),
            }
        }
    }

    class AbgeleiteterWertItemDataModel extends TypeDataModel {
        static defineSchema() {
            return {
                key: h.string(''),
                name: h.string(''),
                formel: h.string(''),
                script: h.string(''),
                finalscript: h.string(''),
                text: h.string(''),
            }
        }
    }

    class WaffeneigenschaftItemDataModel extends TypeDataModel {
        static defineSchema() {
            return {
                sephrastoScript: h.string(''),
                foundryScript: h.string(''),
                text: h.string(''),
                kategorie: h.string('modifier'),
                parameterSlots: h.arrayOfObjects(),
                modifiers: h.schema({
                    at: h.number(0),
                    vt: h.number(0),
                    schaden: h.number(0),
                    schadenFormula: h.string(''),
                    rw: h.number(0),
                    fumbleThreshold: h.number(null),
                    critThreshold: h.number(null),
                    ignoreCover: h.bool(false),
                    ignoreArmor: h.bool(false),
                    additionalDice: h.number(0),
                    conditionalModifiers: h.arrayOfObjects(),
                }),
                wieldingRequirements: h.schema({
                    hands: h.number(1),
                    ignoreNebenMalus: h.bool(false),
                    noRider: h.bool(false),
                    requiresRider: h.bool(false),
                    penalties: h.schema({
                        hauptOnly: h.object({}),
                        nebenOnly: h.object({}),
                        nebenWithoutExemption: h.object({}),
                    }),
                    condition: h.schema({
                        type: h.string('attribute_check'),
                        attribute: h.string('KK'),
                        operator: h.string('<'),
                        value: h.number(0),
                        onFailure: h.schema({
                            at: h.number(0),
                            vt: h.number(0),
                            schaden: h.number(0),
                        }),
                    }),
                }),
                targetEffect: h.schema({
                    trigger: h.string('on_hit'),
                    resistCheck: h.schema({
                        type: h.string('none'),
                        attackerAttribute: h.string(''),
                        defenderAttribute: h.string(''),
                        attackerModifier: h.number(0),
                        defenderModifier: h.number(0),
                    }),
                    effect: h.schema({
                        type: h.string('status'),
                        statusName: h.string(''),
                        duration: h.string(''),
                        icon: h.string(''),
                    }),
                }),
                actorModifiers: h.schema({
                    modifiers: h.arrayOfObjects(),
                    conditions: h.arrayOfObjects(),
                }),
                customScript: h.string(''),
            }
        }
    }

    return {
        nahkampfwaffe: NahkampfwaffeItemDataModel,
        fernkampfwaffe: FernkampfwaffeItemDataModel,
        ruestung: RuestungItemDataModel,
        gegenstand: GegenstandItemDataModel,
        fertigkeit: FertigkeitItemDataModel,
        talent: TalentItemDataModel,
        uebernatuerlicheFertigkeit: UebernatuerlicheFertigkeitItemDataModel,
        liturgie: LiturgieItemDataModel,
        zauber: ZauberItemDataModel,
        anrufung: AnrufungItemDataModel,
        freieFertigkeit: FreieFertigkeitItemDataModel,
        vorteil: VorteilItemDataModel,
        manoever: ManoeverItemDataModel,
        eigenheit: EigenheitItemDataModel,
        eigenschaft: EigenschaftItemDataModel,
        waffeneigenschaft: WaffeneigenschaftItemDataModel,
        angriff: AngriffItemDataModel,
        info: InfoItemDataModel,
        freiesTalent: FreiesTalentItemDataModel,
        abgeleiteterWert: AbgeleiteterWertItemDataModel,
        // Legacy type aliases — allow old worlds to load so the ready-hook
        // migration (migrate-modeldata-normalization.js) can rename them.
        freiestalent: FreiesTalentItemDataModel,
        freie_fertigkeit: FreieFertigkeitItemDataModel,
        uebernatuerliche_fertigkeit: UebernatuerlicheFertigkeitItemDataModel,
        'abgeleiteter-wert': AbgeleiteterWertItemDataModel,
    }
}
