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
        "systems/Ilaris/templates/sheets/tabs/notes.html",
        "systems/Ilaris/templates/chat/dreid20.html",
        "systems/Ilaris/templates/sheets/items/ruestung.html"
    ];
    return loadTemplates(templatePaths);
};


function registerHandlebarsHelpers() {
    Handlebars.registerHelper("AttributeFertigkeit", function (attrArray) {
        const fertAttr = attrArray[0].concat("/", attrArray[1], "/", attrArray[2]);
        return fertAttr;
    });

    Handlebars.registerHelper("aktivTalentView", function (fertigkeitObject) {
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
