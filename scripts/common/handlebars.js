export const initializeHandlebars = () => {
    registerHandlebarsHelpers();
    preloadHandlebarsTemplates();
};

function preloadHandlebarsTemplates() {
    const templatePaths = [
        "systems/Ilaris/templates/sheets/helden.html",
        "systems/Ilaris/templates/sheets/tabs/attribute.html",
        "systems/Ilaris/templates/sheets/tabs/fertigkeiten.html",
        "systems/Ilaris/templates/sheets/tabs/inventar.html",
        "systems/Ilaris/templates/sheets/tabs/fertigkeitview.html",
        "systems/Ilaris/templates/sheets/tabs/uebernatuerlich.html",
        "systems/Ilaris/templates/sheets/tabs/notes.html",
        "systems/Ilaris/templates/sheets/items/ruestung.html",
        "systems/Ilaris/templates/helper/select_attribut.html",
        "systems/Ilaris/templates/helper/select_fertigkeitsgruppe.html",
        "systems/Ilaris/templates/chat/dreid20.html",
        "systems/Ilaris/templates/chat/probendiag_profan.html",
        "systems/Ilaris/templates/chat/probenchat_profan.html"
    ];
    return loadTemplates(templatePaths);
};


function registerHandlebarsHelpers() {
    Handlebars.registerHelper("AttributeFertigkeit", function(attrArray) {
        const fertAttr = attrArray[0].concat("/", attrArray[1], "/", attrArray[2]);
        return fertAttr;
    });

    Handlebars.registerHelper("AttributeFertigkeit_from_data", function(attrArray) {
        // console.log(attrArray);
        const fertAttr = attrArray.attribut_0.concat("/", attrArray.attribut_1, "/", attrArray.attribut_2);
        return fertAttr;
    });

    Handlebars.registerHelper("ProfanFertigkeitList", function(talente) {
        let fertigkeit_list = "";
        for (let [i, tal] of talente.entries()) {
            if (i == 0) {
                // fertigkeit_list = tal.name;
                fertigkeit_list = tal.data.label;
            } else {
                // fertigkeit_list = fertigkeit_list.concat(", ", tal.name);
                fertigkeit_list = fertigkeit_list.concat(", ", tal.data.label);
            }
        }
        return fertigkeit_list;
    });

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

    Handlebars.registerHelper("aktivTalentView", function(fertigkeitObject) {
        const talentList = fertigkeitObject.talente;
        let talentString = "";
        // for (const talent of Object.entries(talentList)) {
        for (const talent of Object.values(talentList)) {
            // if (talent[1].aktiv == true) {
            if (talent.aktiv == true) {
                if (talentString != "") {
                    talentString = talentString.concat(", ");
                };
                // talentString = talentString.concat(talent[1].label);
                talentString = talentString.concat(talent.label);
            };
        };
        return talentString;
    });
};
