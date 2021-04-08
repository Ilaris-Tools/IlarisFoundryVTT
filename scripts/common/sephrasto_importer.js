import * as data from '../../assets/sephrasto_datenbank.js';

//Talente:
// printclass=-1      Profane Talente
// printclass=0       Zauber (9374)
// printclass=1       Rituale Druide? (16286)
// printclass=1       Rituale Druide? (16286)
// ....
// printclass=20      Karma Talente (21470)
//Übernatürliche-Fertigkeit:
//printclass=0        Magische Fertigkeiten
//printclass=1        Karmale Fertigkeiten

export class SephrastoImporter {
    constructor() {
        this.datenbank = data.default.Datenbank
    }

    async _create_profan_fertigkeit() {
        const pack = game.packs.get("world.profane-fertigkeiten");
        await pack.getIndex().then(index => {
            for (let i of index) {
                pack.deleteEntity(i._id);
            }
        });
        let fertigkeiten = this.datenbank.Fertigkeit
        for (let fert of fertigkeiten) {
            let attribute = fert.attribute[0].split("|");
            let itemData = {
                name: fert.name[0],
                type: "profan_fertigkeit",
                data: {
                    text: fert._,
                    // "faktor": Number(fert.steigerungsfaktor[0]),
                    gruppe: Number(fert.printclass[0]),
                    attribut_0: attribute[0],
                    attribut_1: attribute[1],
                    attribut_2: attribute[2],
                }
            }
            let item = new Item(itemData)
            await pack.importEntity(item);
        }
    }

    async _create_profan_talent() {
        const pack = game.packs.get("world.profane-talente")
        await pack.getIndex().then(index => {
            for (let i of index) {
                pack.deleteEntity(i._id);
            }
        });
        let talente = this.datenbank.Talent
        for (let tal of talente) {
            // console.log(tal)
            //Gebräuche haben keine printclass
            if (tal.hasOwnProperty('printclass')) {
                if (tal.printclass[0] === "-1") {
                    const prefix_b = "Überleben: "
                    const name = tal.name[0]
                    let label = name
                    if (label.includes(prefix_b)) label = label.replace(prefix_b, "");
                    let itemData = {
                        name: name,
                        type: "profan_talent",
                        data: {
                            label: label,
                            text: tal._,
                            fertigkeit: tal.fertigkeiten[0],
                        }
                    }
                    let item = new Item(itemData)
                    await pack.importEntity(item);
                }
            }
            else {
                if (tal.variable[0] === "-1") {
                    const prefix_a = "Gebräuche: "
                    const prefix_b = "Überleben: "
                    const name = tal.name[0]
                    let label = name
                    if (label.includes(prefix_a)) label = label.replace(prefix_a, "");
                    if (label.includes(prefix_b)) label = label.replace(prefix_b, "");
                    let itemData = {
                        name: name,
                        type: "profan_talent",
                        data: {
                            label: label,
                            text: tal._,
                            fertigkeit: tal.fertigkeiten[0],
                        }
                    }
                    let item = new Item(itemData)
                    await pack.importEntity(item);
                }
            }
        }
    }

    async _create_uebernatuerlich_talent() {
        const pack_magie = game.packs.get("world.zauberspruche-und-rituale")
        await pack_magie.getIndex().then(index => {
            for (let i of index) {
                pack_magie.deleteEntity(i._id);
            }
        });
        const pack_karma = game.packs.get("world.liturgien")
        await pack_karma.getIndex().then(index => {
            for (let i of index) {
                pack_karma.deleteEntity(i._id);
            }
        });
        let talente = this.datenbank.Talent
        for (let tal of talente) {
            if (tal.hasOwnProperty('printclass')) {
                let printclass = Number(tal.printclass[0])
                let type = ""
                if (printclass == -1) {
                    continue;
                }
                else if (printclass > -1 && printclass < 20) {
                    type = "magie_talent"
                }
                else if (printclass > 19) {
                    type = "karma_talent"
                }
                let beschreibung = tal._
                let splitted = ''
                let text = ''
                let maechtig = ''
                let schwierigkeit = ''
                let modifikationen = ''
                let vorbereitung = ''
                let ziel = ''
                let reichweite = ''
                let wirkungsdauer = ''
                let kosten = ''
                let erlernen = ''

                splitted = beschreibung.split("\r\nErlernen: ")
                if (splitted.length == 2) {
                    erlernen = splitted[1]
                    erlernen = erlernen.split(";")
                    erlernen.pop()
                    erlernen.join(";")
                }
                beschreibung = splitted[0]

                if (splitted.length == 2) splitted = beschreibung.split("\r\nFertigkeiten: ")
                beschreibung = splitted[0]


                splitted = beschreibung.split("\r\nKosten: ")
                if (splitted.length == 2) kosten = splitted[1]
                beschreibung = splitted[0]

                splitted = beschreibung.split("\r\nWirkungsdauer: ")
                if (splitted.length == 2) wirkungsdauer = splitted[1]
                beschreibung = splitted[0]

                splitted = beschreibung.split("\r\nReichweite: ")
                if (splitted.length == 2) reichweite = splitted[1]
                beschreibung = splitted[0]

                splitted = beschreibung.split("\r\nZiel: ")
                if (splitted.length == 2) ziel = splitted[1]
                beschreibung = splitted[0]

                splitted = beschreibung.split("\r\nVorbereitungszeit: ")
                if (splitted.length == 2) vorbereitung = splitted[1]
                beschreibung = splitted[0]

                splitted = beschreibung.split("\r\nModifikationen: ")
                if (splitted.length == 2) modifikationen = splitted[1]
                beschreibung = splitted[0]

                splitted = beschreibung.split("\r\nProbenschwierigkeit: ")
                if (splitted.length == 2) schwierigkeit = splitted[1]
                beschreibung = splitted[0]

                if (printclass > -1 && printclass < 20) {
                    splitted = beschreibung.split("\r\nMächtige Magie: ")
                }
                else if (printclass > 19) {
                    splitted = beschreibung.split("\r\nMächtige Liturgie: ")
                }
                if (splitted.length == 2) maechtig = splitted[1]
                text = splitted[0]

                let itemData = {
                    name: tal.name[0],
                    type: type,
                    data: {
                        gruppe: printclass,
                        text: text,
                        fertigkeiten: tal.fertigkeiten[0],
                        maechtig: maechtig,
                        schwierigkeit: schwierigkeit,
                        modifikationen: modifikationen,
                        vorbereitung: vorbereitung,
                        ziel: ziel,
                        reichweite: reichweite,
                        wirkungsdauer: wirkungsdauer,
                        kosten: kosten,
                        erlernen: erlernen,
                    }
                }
                let item = new Item(itemData)
                if (printclass > -1 && printclass < 20) {
                    await pack_magie.importEntity(item);
                }
                else if (printclass > 19) {
                    await pack_karma.importEntity(item);
                }
            }
        }
    }

    async _create_uebernatuerlich_fertigkeit() {
        const pack_magie = game.packs.get("world.magie-fertigkeiten");
        const pack_karma = game.packs.get("world.karma-fertigkeiten");
        await pack_magie.getIndex().then(index => {
            for (let i of index) {
                pack_magie.deleteEntity(i._id);
            }
        });
        await pack_karma.getIndex().then(index => {
            for (let i of index) {
                pack_karma.deleteEntity(i._id);
            }
        });
        let fertigkeiten = this.datenbank['Übernatürliche-Fertigkeit']
        for (let fert of fertigkeiten) {
            let printclass = Number(fert.printclass[0])
            let attribute = fert.attribute[0].split("|");
            let name = fert.name[0]
            let text = fert._
            let type = ""
            if (printclass == 0) {
                type = "magie_fertigkeit"
            }
            else if (printclass == 1) {
                type = "karma_fertigkeit"
            }
            let itemData = {
                name: name,
                type: type,
                data: {
                    gruppe: printclass,
                    text: text,
                    attribut_0: attribute[0],
                    attribut_1: attribute[1],
                    attribut_2: attribute[2],
                }
            }
            let item = new Item(itemData)
            if (printclass == 0) {
                await pack_magie.importEntity(item);
            }
            else if (printclass == 1) {
                await pack_karma.importEntity(item);
            }
        }
    }

    async _create_waffen() {
        const pack = game.packs.get("world.waffen");
        await pack.getIndex().then(index => {
            for (let i of index) {
                pack.deleteEntity(i._id);
            }
        });
        let waffen = this.datenbank.Waffe
        for (let waffe of waffen) {
            let name = waffe.name[0]
            let label = name.split(" (")[0]
            let haerte = waffe.haerte[0]
            let dice_anzahl = waffe.W6[0]
            let plus = waffe.plus[0]
            let eigenschaften = waffe._
            let fertigkeit = waffe.fertigkeit[0]
            let talent = waffe.talent[0]
            let rw = waffe.rw[0]
            let kampfstile = waffe.kampfstile[0]
            let itemData = {
                name: name,
                data: {
                    label: label,
                    haerte: haerte,
                    dice_anzahl: dice_anzahl,
                    plus: plus,
                    eigenschaften: eigenschaften,
                    fertigkeit: fertigkeit,
                    talent: talent,
                    rw: rw,
                    kampfstile: kampfstile
                }
            }
            let fk = Number(waffe.fk[0])
            if (fk == 0) {
                itemData.type = "nahkampfwaffe"
                itemData.data.wm_at = waffe.wm[0]
                itemData.data.wm_vt = waffe.wm[0]
            }
            else if (fk == 1) {
                itemData.type = "fernkampfwaffe"
                itemData.lz = waffe.lz[0]
            }
            let item = new Item(itemData)
                await pack.importEntity(item);
        }
    }

    import() {
        this._create_profan_fertigkeit();
        this._create_profan_talent();
        this._create_uebernatuerlich_talent();
        this._create_uebernatuerlich_fertigkeit();
        this._create_waffen();
    }

}
