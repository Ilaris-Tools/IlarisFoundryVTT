export class SephrastoImporter extends Application{

    static get defaultOptions()
    {
        const options = super.defaultOptions;
        options.id = "sephrasto-importer";
        options.template = "systems/Ilaris/templates/sephrasto/sephrasto_ui.html";
        options.classes.push("sephrasto-importer");
        options.resizable = false;
        options.height = "auto";
        options.width = 400;
        options.minimizable = true;
        options.title = "Sephrasto Importer";
        return options;
    }

}
