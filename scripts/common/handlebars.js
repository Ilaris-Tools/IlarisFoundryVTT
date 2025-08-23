export const initializeHandlebars = () => {
    registerHandlebarsHelpers()
    preloadHandlebarsTemplates()
}

function preloadHandlebarsTemplates() {
    const templatePaths = [
        // "systems/Ilaris/templates/sheets/helden.hbs",
        'systems/Ilaris/templates/sheets/tabs/attribute.hbs',
        'systems/Ilaris/templates/sheets/tabs/fertigkeiten.hbs',
        'systems/Ilaris/templates/sheets/tabs/kampf.hbs',
        'systems/Ilaris/templates/sheets/tabs/inventar.hbs',
        'systems/Ilaris/templates/sheets/tabs/uebernatuerlich.hbs',
        'systems/Ilaris/templates/sheets/tabs/notes.hbs',
        'systems/Ilaris/templates/sheets/tabs/effekte.hbs',

        'systems/Ilaris/templates/sheets/tabs/inventory/carrying.hbs',
        'systems/Ilaris/templates/sheets/tabs/inventory/finances.hbs',
        'systems/Ilaris/templates/sheets/tabs/inventory/handcart.hbs',
        'systems/Ilaris/templates/sheets/tabs/inventory/supporting.hbs',

        'systems/Ilaris/templates/sheets/items/base_item_layout.hbs',

        // "systems/Ilaris/templates/sheets/items/ruestung.hbs",
        'systems/Ilaris/templates/helper/select_attribut.hbs',
        'systems/Ilaris/templates/helper/select_fertigkeitsgruppe.hbs',
        'systems/Ilaris/templates/helper/select_vorteilsgruppe.hbs',
        'systems/Ilaris/templates/helper/select_trefferzone.hbs',
        'systems/Ilaris/templates/chat/dreid20.hbs',
        'systems/Ilaris/templates/chat/probendiag_profan.hbs',
        'systems/Ilaris/templates/chat/probendiag_simpleformula.hbs',
        'systems/Ilaris/templates/chat/probenchat_profan.hbs',
        'systems/Ilaris/templates/chat/probendiag_nahkampf.hbs',
    ]
    return loadTemplates(templatePaths)
}

function registerHandlebarsHelpers() {
    Handlebars.registerHelper('AttributeFertigkeit', function (attrArray) {
        const fertAttr = attrArray[0].concat('/', attrArray[1], '/', attrArray[2])
        return fertAttr
    })

    Handlebars.registerHelper('some', function (array, prop) {
        return array.some((item) => {
            if (prop === 'checked') return item.value
            return item.value && item.value !== '0'
        })
    })

    Handlebars.registerHelper('AttributeFertigkeit_from_data', function (attrArray) {
        // console.log(attrArray);
        const fertAttr = attrArray.attribut_0.concat(
            '/',
            attrArray.attribut_1,
            '/',
            attrArray.attribut_2,
        )
        return fertAttr
    })

    Handlebars.registerHelper('ProfanFertigkeitList', function (talente) {
        let fertigkeit_list = ''
        // console.log(talente);
        for (let [i, tal] of talente.entries()) {
            if (i == 0) {
                fertigkeit_list = tal.name
                // fertigkeit_list = tal.data.label;
            } else {
                fertigkeit_list = fertigkeit_list.concat(', ', tal.name)
                // fertigkeit_list = fertigkeit_list.concat(", ", tal.data.label);
            }
        }
        return fertigkeit_list
    })

    Handlebars.registerHelper('arrayToString', function (my_array, sep) {
        let my_list = ''
        for (let [i, part] of my_array.entries()) {
            if (i == 0) {
                // fertigkeit_list = tal.name;
                my_list = part
            } else {
                // fertigkeit_list = fertigkeit_list.concat(", ", tal.name);
                my_list = my_list.concat(sep, part)
            }
        }
        return my_list
    })

    Handlebars.registerHelper('waffeneigenschaften_string', function (waffe) {
        let my_list = ''
        // console.log(waffe);
        for (const [eig, val] of Object.entries(waffe.system.eigenschaften)) {
            // console.log(eig);
            if (val == true) {
                if (my_list.length == 0) {
                    my_list = CONFIG.ILARIS.label[eig]
                } else {
                    my_list = my_list.concat(', ', CONFIG.ILARIS.label[eig])
                }
            }
        }
        return my_list
    })

    Handlebars.registerHelper('waffe_ist_fernkampf', function (waffe) {
        return waffe.typ == 'Fern'
    })

    Handlebars.registerHelper('ist_nicht_leer', function (object) {
        return Object.keys(object).length > 0
    })

    Handlebars.registerHelper('translate_formula', function (formula) {
        if (formula) {
            return formula.replace(/[Ww]/g, 'd')
        }
        return null
    })

    // extract a number from a string like '16 Schritt'
    // Handlebars.registerHelper('get_number_from_string', function (string) {
    //     if (string) {
    //         return string.match(/\d+/)[0];
    //     }
    //     return null;
    // });

    Handlebars.registerHelper('get_label', function (eig) {
        // console.log(eig);
        return CONFIG.ILARIS.label[eig]
    })
    Handlebars.registerHelper('get_stat_short', function (eig) {
        // console.log(eig);
        if (CONFIG.ILARIS.stat_desc[eig]) {
            return CONFIG.ILARIS.stat_desc[eig].short
        } else {
            return eig
        }
    })
    Handlebars.registerHelper('ifIn', function (word, list) {
        return list.indexOf(word) > -1
    })

    Handlebars.registerHelper('ifEq', function (arg1, arg2) {
        return arg1 == arg2
    })

    //if arg1 greater then arg2
    Handlebars.registerHelper('ifGt', function (arg1, arg2) {
        if (Number.isInteger(arg1) && Number.isInteger(arg2)) {
            return arg1 > arg2
        } else {
            throw new Error('handelbars.js - ifGt - atleast one parameter is not a number')
        }
    })

    Handlebars.registerHelper('sum', function (arg1, arg2) {
        return arg1 + arg2
    })

    Handlebars.registerHelper('isCaster', function (actor) {
        console.log('caster?')
        return (
            actor.system.energien.asp.max +
                actor.system.energien.gup.max +
                actor.system.energien.kap.max >
            0
        )
    })

    Handlebars.registerHelper('modColor', function (arg1) {
        if (arg1 > 0) {
            return 'darkgreen'
        } else if (arg1 < 0) {
            return 'darkred'
        } else {
            return 'black'
        }
    })

    Handlebars.registerHelper('nonzero', function (arg1) {
        if (arg1 != 0) {
            return true
        } else {
            return false
        }
    })

    // Handlebars.registerHelper("get_kampfstile", function(data) {
    //     let kampfstile = ["ohne"];
    //     console.log(data);
    //     if (data.find(x => x.name.includes("Beidhändiger Kampf"))) kampfstile.push("bhk");
    //     if (data.find(x => x.name.includes("Kraftvoller Kampf"))) kampfstile.push("kvk");
    //     if (data.find(x => x.name.includes("Parierwaffenkampf"))) kampfstile.push("pwk");
    //     if (data.find(x => x.name.includes("Reiterkampf"))) kampfstile.push("rtk");
    //     if (data.find(x => x.name.includes("Schildkampf"))) kampfstile.push("shk");
    //     if (data.find(x => x.name.includes("Schneller Kampf"))) kampfstile.push("snk");
    //     console.log(kampfstile);
    //     return kampfstile;
    // });

    // Handlebars.registerHelper("TalentList", function (fertigkeit) {
    //     // console.log(attrArray);
    //     let talentlist = [];
    //     const fertAttr = attrArray.attribut_0.concat("/", attrArray.attribut_1, "/", attrArray.attribut_2);
    //     return fertAttr;
    // });

    // Handlebars.registerHelper("AlleMagieFertigkeiten", function (ev) {
    //     console.log("In AlleMagieFertigkeiten Handlebar");
    //     console.log(ev);
    //     console.log(ev.data.root.data.fertigkeit_array);
    //     // console.log(ev.data.root.Actor());
    //     // console.log(ev.data.root.item.Actor());
    //     // console.log(ev.data.root.entity.Actor());
    //     // console.log(ev.data.root.data.Actor());
    //     // console.log(ev.data.Actor());
    //     return ev.data.root.data.fertigkeit_array;
    // });

    Handlebars.registerHelper('aktivTalentView', function (fertigkeitObject) {
        const talentList = fertigkeitObject.talente
        let talentString = ''
        // for (const talent of Object.entries(talentList)) {
        for (const talent of Object.values(talentList)) {
            // if (talent[1].aktiv == true) {
            if (talent.aktiv == true) {
                if (talentString != '') {
                    talentString = talentString.concat(', ')
                }
                // talentString = talentString.concat(talent[1].label);
                talentString = talentString.concat(talent.label)
            }
        }
        return talentString
    })

    Handlebars.registerHelper('multMinusOne', function (numb) {
        return -1 * numb
    })

    /**
     * Handlebars helper to colorize probe values, highlighting positive values in green and negative values in red.
     * @param {string} probe - The probe string (e.g., "AT -2" or "AT -X, TP +X" or "PA +2, AT +2" or "AT -2-BE" or "TP +GS")
     * @returns {string} HTML string with colorized values
     */
    Handlebars.registerHelper('colorizeProbe', function (probe) {
        return probe.replace(/([+-][^\s,)]+)/g, (match) => {
            const color = match.startsWith('+') ? 'color: #006400;' : 'color: #8B0000;' // Dark green and dark red
            return `<span style="${color}">${match}</span>`
        })
    })

    /**
     * Get the correct probe display for a maneuver, accounting for special cases like Ruhige Hand
     * @param {Object} manoever - The maneuver object
     * @param {Object} item - The weapon item
     * @returns {string} The correct probe text to display
     */
    Handlebars.registerHelper('getManoeverProbe', function (manoever, item) {
        let probeText = manoever.system.probe

        // Special case for "Zielen" with "Ruhige Hand"
        if (manoever.name === 'Zielen' && item?.system?.manoever?.fm_zlen?.ruhige_hand) {
            // Replace +2 with +4 for Ruhige Hand
            probeText = probeText.replace(/FK \+2/, 'FK +4')
        }

        return probeText
    })
}
