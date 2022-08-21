export const initializeHandlebars = () => {
    registerHandlebarsHelpers();
    preloadHandlebarsTemplates();
};

function preloadHandlebarsTemplates() {
    const templatePaths = [
        // "systems/Ilaris/templates/sheets/helden.html",
        'systems/Ilaris/templates/sheets/tabs/attribute.html',
        'systems/Ilaris/templates/sheets/tabs/fertigkeiten.html',
        'systems/Ilaris/templates/sheets/tabs/kampf.html',
        'systems/Ilaris/templates/sheets/tabs/inventar.html',
        'systems/Ilaris/templates/sheets/tabs/uebernatuerlich.html',
        'systems/Ilaris/templates/sheets/tabs/notes.html',
        'systems/Ilaris/templates/sheets/tabs/effekte.html',
        // "systems/Ilaris/templates/sheets/items/ruestung.html",
        'systems/Ilaris/templates/helper/select_attribut.html',
        'systems/Ilaris/templates/helper/select_fertigkeitsgruppe.html',
        'systems/Ilaris/templates/helper/select_vorteilsgruppe.html',
        'systems/Ilaris/templates/helper/select_manoever.html',
        'systems/Ilaris/templates/helper/select_trefferzone.html',
        'systems/Ilaris/templates/chat/dreid20.html',
        'systems/Ilaris/templates/chat/probendiag_profan.html',
        'systems/Ilaris/templates/chat/probenchat_profan.html',
        'systems/Ilaris/templates/chat/probendiag_nahkampf.html',
    ];
    return loadTemplates(templatePaths);
}

function registerHandlebarsHelpers() {
    Handlebars.registerHelper('AttributeFertigkeit', function (attrArray) {
        const fertAttr = attrArray[0].concat('/', attrArray[1], '/', attrArray[2]);
        return fertAttr;
    });

    Handlebars.registerHelper('AttributeFertigkeit_from_data', function (attrArray) {
        // console.log(attrArray);
        const fertAttr = attrArray.attribut_0.concat(
            '/',
            attrArray.attribut_1,
            '/',
            attrArray.attribut_2,
        );
        return fertAttr;
    });

    Handlebars.registerHelper('ProfanFertigkeitList', function (talente) {
        let fertigkeit_list = '';
        // console.log(talente);
        for (let [i, tal] of talente.entries()) {
            if (i == 0) {
                fertigkeit_list = tal.name;
                // fertigkeit_list = tal.data.label;
            } else {
                fertigkeit_list = fertigkeit_list.concat(', ', tal.name);
                // fertigkeit_list = fertigkeit_list.concat(", ", tal.data.label);
            }
        }
        return fertigkeit_list;
    });

    Handlebars.registerHelper('arrayToString', function (my_array, sep) {
        let my_list = '';
        for (let [i, part] of my_array.entries()) {
            if (i == 0) {
                // fertigkeit_list = tal.name;
                my_list = part;
            } else {
                // fertigkeit_list = fertigkeit_list.concat(", ", tal.name);
                my_list = my_list.concat(sep, part);
            }
        }
        return my_list;
    });

    Handlebars.registerHelper('waffeneigenschaften_string', function (waffe) {
        let my_list = '';
        // console.log(waffe);
        for (const [eig, val] of Object.entries(waffe.data.data.eigenschaften)) {
            // console.log(eig);
            if (val == true) {
                if (my_list.length == 0) {
                    my_list = CONFIG.ILARIS.label[eig];
                } else {
                    my_list = my_list.concat(', ', CONFIG.ILARIS.label[eig]);
                }
            }
        }
        return my_list;
    });

    Handlebars.registerHelper('waffe_ist_fernkampf', function (waffe) {
        return (waffe.typ == "Fern");
    });

    Handlebars.registerHelper('ist_nicht_leer', function (object) {
        return (Object.keys(object).length > 0);
    });

    Handlebars.registerHelper('translate_formula', function (formula) {
        if (formula) {
            return formula.replace("W", "d");
        }
        return null;
    });

    Handlebars.registerHelper('get_label', function (eig) {
        // console.log(eig);
        return CONFIG.ILARIS.label[eig];
    });

    Handlebars.registerHelper('ifIn', function (word, list) {
        return list.indexOf(word) > -1;
    });

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
        const talentList = fertigkeitObject.talente;
        let talentString = '';
        // for (const talent of Object.entries(talentList)) {
        for (const talent of Object.values(talentList)) {
            // if (talent[1].aktiv == true) {
            if (talent.aktiv == true) {
                if (talentString != '') {
                    talentString = talentString.concat(', ');
                }
                // talentString = talentString.concat(talent[1].label);
                talentString = talentString.concat(talent.label);
            }
        }
        return talentString;
    });

    Handlebars.registerHelper('multMinusOne', function (numb) {
        return -1 * numb;
    });
}
