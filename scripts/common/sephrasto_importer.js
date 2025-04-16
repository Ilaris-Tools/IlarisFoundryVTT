import * as data from '../../assets/sephrasto_datenbank.js';

//Talente:
// printclass=-1      Profane Talente (7705)
// printclass=0       Zauber (9374)
// printclass=1       Rituale Druide? (16286)
// printclass=1       Rituale Druide? (16286)
// ....
// printclass=20      Karma Talente (21470)
//Übernatürliche-Fertigkeit:
// printclass=0        Magische Fertigkeiten
// printclass=1        Karmale Fertigkeiten
//Vorteile
// typ=0              allgemeine Vorteile
// typ=1              profane Vorteile (1359)
// typ=2              Kampfvorteile (2147)
// typ=3              Kampfstile (2831)
// typ=4              magische Vorteile (3452)
// typ=5              magische Traditionen (4031)
// typ=6              karmale Vorteile (5591)
// typ=7              karmale Traditionen(5975)
//Manöver
// typ=0              Nahkampf (33602)
// typ=1              Fernkampf (34035)
// typ=2              Magie (34160)
// typ=3              Karma (34323)
// typ=4              Antimagie (34718) + Hexenbesen (34791)
// typ=5              Aktionen Nahkampf (34809)

export class SephrastoImporter {
    constructor() {
        // this.datenbank = data.default.Datenbank;
        this.datenbank = data.default.datenbank;
    }

    async _create_vorteile_old() {
        const pack_allgemein = game.packs.get('world.allgemeine-vorteile');
        const pack_profan = game.packs.get('world.profane-vorteile');
        const pack_kampf = game.packs.get('world.kampfvorteile');
        const pack_stil = game.packs.get('world.kampfstile');
        const pack_mag_vort = game.packs.get('world.magische-vorteile');
        const pack_mag_trad = game.packs.get('world.magische-traditionen');
        const pack_kar_vort = game.packs.get('world.karmale-vorteile');
        const pack_kar_trad = game.packs.get('world.karmale-traditionen');
        await pack_allgemein.getIndex().then((index) => {
            for (let i of index) {
                pack_allgemein.deleteEntity(i._id);
            }
        });
        await pack_profan.getIndex().then((index) => {
            for (let i of index) {
                pack_profan.deleteEntity(i._id);
            }
        });
        await pack_kampf.getIndex().then((index) => {
            for (let i of index) {
                pack_kampf.deleteEntity(i._id);
            }
        });
        await pack_stil.getIndex().then((index) => {
            for (let i of index) {
                pack_stil.deleteEntity(i._id);
            }
        });
        await pack_mag_vort.getIndex().then((index) => {
            for (let i of index) {
                pack_mag_vort.deleteEntity(i._id);
            }
        });
        await pack_mag_trad.getIndex().then((index) => {
            for (let i of index) {
                pack_mag_trad.deleteEntity(i._id);
            }
        });
        await pack_kar_vort.getIndex().then((index) => {
            for (let i of index) {
                pack_kar_vort.deleteEntity(i._id);
            }
        });
        await pack_kar_trad.getIndex().then((index) => {
            for (let i of index) {
                pack_kar_trad.deleteEntity(i._id);
            }
        });
        let vorteile = this.datenbank.Vorteil;
        for (let vort of vorteile) {
            let name = vort.name[0];
            let text = vort._;
            let typ = Number(vort.typ[0]);
            let voraussetzung = vort.voraussetzungen[0];

            console.log(vort);
            let itemData = {
                name: name,
                data: {
                    voraussetzung: voraussetzung,
                    text: text,
                },
            };
            if (typ == 0) {
                itemData.type = 'allgemein_vorteil';
                let item = new Item(itemData);
                console.log(itemData);
                await pack_allgemein.importEntity(item);
            } else if (typ == 1) {
                itemData.type = 'profan_vorteil';
                let item = new Item(itemData);
                await pack_profan.importEntity(item);
            } else if (typ == 2) {
                itemData.type = 'kampf_vorteil';
                let item = new Item(itemData);
                await pack_kampf.importEntity(item);
            } else if (typ == 3) {
                itemData.type = 'kampfstil';
                let item = new Item(itemData);
                await pack_stil.importEntity(item);
            } else if (typ == 4) {
                itemData.type = 'magie_vorteil';
                let item = new Item(itemData);
                await pack_mag_vort.importEntity(item);
            } else if (typ == 5) {
                itemData.type = 'magie_tradition';
                let item = new Item(itemData);
                await pack_mag_trad.importEntity(item);
            } else if (typ == 6) {
                itemData.type = 'karma_vorteil';
                let item = new Item(itemData);
                await pack_kar_vort.importEntity(item);
            } else if (typ == 7) {
                itemData.type = 'karma_tradition';
                let item = new Item(itemData);
                await pack_kar_trad.importEntity(item);
            }
        }
    }

    async _create_profan_fertigkeit_old() {
        const pack = game.packs.get('world.profane-fertigkeiten');
        await pack.getIndex().then((index) => {
            for (let i of index) {
                pack.deleteEntity(i._id);
            }
        });
        let fertigkeiten = this.datenbank.Fertigkeit;
        for (let fert of fertigkeiten) {
            let attribute = fert.attribute[0].split('|');
            let itemData = {
                name: fert.name[0],
                type: 'profan_fertigkeit',
                data: {
                    text: fert._,
                    // "faktor": Number(fert.steigerungsfaktor[0]),
                    gruppe: Number(fert.printclass[0]),
                    attribut_0: attribute[0],
                    attribut_1: attribute[1],
                    attribut_2: attribute[2],
                },
            };
            let item = new Item(itemData);
            await pack.importEntity(item);
        }
    }

    async _create_profan_talent_old() {
        const pack = game.packs.get('world.profane-talente');
        await pack.getIndex().then((index) => {
            for (let i of index) {
                pack.deleteEntity(i._id);
            }
        });
        let talente = this.datenbank.Talent;
        for (let tal of talente) {
            // console.log(tal)
            //Gebräuche haben keine printclass
            if (tal.hasOwnProperty('printclass')) {
                if (tal.printclass[0] === '-1') {
                    const prefix_b = 'Überleben: ';
                    const name = tal.name[0];
                    let label = name;
                    if (label.includes(prefix_b)) label = label.replace(prefix_b, '');
                    let itemData = {
                        name: name,
                        type: 'profan_talent',
                        data: {
                            label: label,
                            text: tal._,
                            fertigkeit: tal.fertigkeiten[0],
                        },
                    };
                    let item = new Item(itemData);
                    await pack.importEntity(item);
                }
            } else {
                if (tal.variable[0] === '-1') {
                    const prefix_a = 'Gebräuche: ';
                    const prefix_b = 'Überleben: ';
                    const name = tal.name[0];
                    let label = name;
                    if (label.includes(prefix_a)) label = label.replace(prefix_a, '');
                    if (label.includes(prefix_b)) label = label.replace(prefix_b, '');
                    let itemData = {
                        name: name,
                        type: 'profan_talent',
                        data: {
                            label: label,
                            text: tal._,
                            fertigkeit: tal.fertigkeiten[0],
                        },
                    };
                    let item = new Item(itemData);
                    await pack.importEntity(item);
                }
            }
        }
    }

    async _create_uebernatuerlich_talent_old() {
        const pack_magie = game.packs.get('world.zauberspruche-und-rituale');
        await pack_magie.getIndex().then((index) => {
            for (let i of index) {
                pack_magie.deleteEntity(i._id);
            }
        });
        const pack_karma = game.packs.get('world.liturgien');
        await pack_karma.getIndex().then((index) => {
            for (let i of index) {
                pack_karma.deleteEntity(i._id);
            }
        });
        let talente = this.datenbank.Talent;
        for (let tal of talente) {
            if (tal.hasOwnProperty('printclass')) {
                let printclass = Number(tal.printclass[0]);
                let type = '';
                if (printclass == -1) {
                    continue;
                } else if (printclass > -1 && printclass < 20) {
                    type = 'magie_talent';
                } else if (printclass > 19) {
                    type = 'karma_talent';
                }
                let beschreibung = tal._;
                let splitted = '';
                let text = '';
                let maechtig = '';
                let schwierigkeit = '';
                let modifikationen = '';
                let vorbereitung = '';
                let ziel = '';
                let reichweite = '';
                let wirkungsdauer = '';
                let kosten = '';
                let erlernen = '';

                splitted = beschreibung.split('\r\nErlernen: ');
                if (splitted.length == 2) {
                    erlernen = splitted[1];
                    erlernen = erlernen.split(';');
                    erlernen.pop();
                    erlernen.join(';');
                }
                beschreibung = splitted[0];

                if (splitted.length == 2) splitted = beschreibung.split('\r\nFertigkeiten: ');
                beschreibung = splitted[0];

                splitted = beschreibung.split('\r\nKosten: ');
                if (splitted.length == 2) kosten = splitted[1];
                beschreibung = splitted[0];

                splitted = beschreibung.split('\r\nWirkungsdauer: ');
                if (splitted.length == 2) wirkungsdauer = splitted[1];
                beschreibung = splitted[0];

                splitted = beschreibung.split('\r\nReichweite: ');
                if (splitted.length == 2) reichweite = splitted[1];
                beschreibung = splitted[0];

                splitted = beschreibung.split('\r\nZiel: ');
                if (splitted.length == 2) ziel = splitted[1];
                beschreibung = splitted[0];

                splitted = beschreibung.split('\r\nVorbereitungszeit: ');
                if (splitted.length == 2) vorbereitung = splitted[1];
                beschreibung = splitted[0];

                splitted = beschreibung.split('\r\nModifikationen: ');
                if (splitted.length == 2) modifikationen = splitted[1];
                beschreibung = splitted[0];

                splitted = beschreibung.split('\r\nProbenschwierigkeit: ');
                if (splitted.length == 2) schwierigkeit = splitted[1];
                beschreibung = splitted[0];

                if (printclass > -1 && printclass < 20) {
                    splitted = beschreibung.split('\r\nMächtige Magie: ');
                } else if (printclass > 19) {
                    splitted = beschreibung.split('\r\nMächtige Liturgie: ');
                }
                if (splitted.length == 2) maechtig = splitted[1];
                text = splitted[0];

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
                    },
                };
                let item = new Item(itemData);
                if (printclass > -1 && printclass < 20) {
                    await pack_magie.importEntity(item);
                } else if (printclass > 19) {
                    await pack_karma.importEntity(item);
                }
            }
        }
    }

    async _create_uebernatuerlich_fertigkeit_old() {
        const pack_magie = game.packs.get('world.magische-fertigkeiten');
        const pack_karma = game.packs.get('world.karmale-fertigkeiten');
        await pack_magie.getIndex().then((index) => {
            for (let i of index) {
                pack_magie.deleteEntity(i._id);
            }
        });
        await pack_karma.getIndex().then((index) => {
            for (let i of index) {
                pack_karma.deleteEntity(i._id);
            }
        });
        let fertigkeiten = this.datenbank['Übernatürliche-Fertigkeit'];
        for (let fert of fertigkeiten) {
            let printclass = Number(fert.printclass[0]);
            let attribute = fert.attribute[0].split('|');
            let name = fert.name[0];
            let text = fert._;
            let type = '';
            if (printclass == 0) {
                type = 'magie_fertigkeit';
            } else if (printclass == 1) {
                type = 'karma_fertigkeit';
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
                },
            };
            let item = new Item(itemData);
            if (printclass == 0) {
                await pack_magie.importEntity(item);
            } else if (printclass == 1) {
                await pack_karma.importEntity(item);
            }
        }
    }

    async _create_waffen_old() {
        const pack = game.packs.get('world.waffen');
        await pack.getIndex().then((index) => {
            for (let i of index) {
                pack.deleteEntity(i._id);
            }
        });
        let waffen = this.datenbank.Waffe;
        for (let waffe of waffen) {
            let name = waffe.name[0];
            let label = name.split(' (')[0];
            let haerte = waffe.haerte[0];
            let dice_anzahl = waffe.W6[0];
            let plus = waffe.plus[0];
            let eigenschaften = waffe._;
            let fertigkeit = waffe.fertigkeit[0];
            let talent = waffe.talent[0];
            let rw = waffe.rw[0];
            let kampfstile = waffe.kampfstile[0];
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
                    kampfstile: kampfstile,
                },
            };
            let fk = Number(waffe.fk[0]);
            if (fk == 0) {
                itemData.type = 'nahkampfwaffe';
                itemData.wm_at = waffe.wm[0];
                itemData.wm_vt = waffe.wm[0];
            } else if (fk == 1) {
                itemData.type = 'fernkampfwaffe';
                itemData.lz = waffe.lz[0];
            }
            let item = new Item(itemData);
            await pack.importEntity(item);
        }
    }

    async _create_waffen() {
        await game.packs.get('world.waffen').getDocuments();
        const pack = game.packs.get('world.waffen');
        // pack.forEach(e => e.deleteDocument());
        pack.forEach((e) => e.delete());
        // pack.forEach(e => console.log(e));
        // await pack.getIndex().then(index => {
        //     for (let i of index) {
        //         // pack.deleteEntity(i._id);
        //         // pack.deleteDocuments('Item', [i._id]);
        //     }
        // });
        let nwaffen = this.datenbank.nahkampfwaffen;
        for (let nwaffe of nwaffen) {
            let item = new Item(nwaffe);
            await pack.importDocument(item);
        }
        let fwaffen = this.datenbank.fernkampfwaffen;
        for (let fwaffe of fwaffen) {
            let item = new Item(fwaffe);
            await pack.importDocument(item);
        }
    }

    async _create_fertigkeiten_talente() {
        await game.packs.get('world.fertigkeiten-und-talente').getDocuments();
        const pack = game.packs.get('world.fertigkeiten-und-talente');
        pack.forEach((e) => e.delete());
        // await pack.getIndex().then(index => {
        //     for (let i of index) {
        //         pack.deleteEntity(i._id);
        //     }
        // });
        let fertigkeiten = this.datenbank.fertigkeiten;
        for (let fert of fertigkeiten) {
            let item = new Item(fert);
            await pack.importDocument(item);
        }
        let talente = this.datenbank.talente;
        for (let tal of talente) {
            let item = new Item(tal);
            await pack.importDocument(item);
        }
    }

    async _create_zauber() {
        await game.packs.get('world.zauberspruche-und-rituale').getDocuments();
        const pack = game.packs.get('world.zauberspruche-und-rituale');
        // await pack.getIndex().then(index => {
        //     for (let i of index) {
        //         pack.deleteEntity(i._id);
        //     }
        // });
        pack.forEach((e) => e.delete());
        let zauber = this.datenbank.zauber;
        for (let zaub of zauber) {
            let item = new Item(zaub);
            await pack.importDocument(item);
        }
    }

    async _create_liturgien() {
        await game.packs.get('world.liturgien-und-mirakel').getDocuments();
        const pack = game.packs.get('world.liturgien-und-mirakel');
        // await pack.getIndex().then(index => {
        //     for (let i of index) {
        //         pack.deleteEntity(i._id);
        //     }
        // });
        pack.forEach((e) => e.delete());
        let liturgien = this.datenbank.liturgien;
        for (let litu of liturgien) {
            let item = new Item(litu);
            await pack.importDocument(item);
        }
    }

    async _create_uebernatuerliche_fertigkeiten() {
        await game.packs.get('world.ubernaturliche-fertigkeiten').getDocuments();
        const pack = game.packs.get('world.ubernaturliche-fertigkeiten');
        // await pack.getIndex().then(index => {
        //     for (let i of index) {
        //         pack.deleteEntity(i._id);
        //     }
        // });
        pack.forEach((e) => e.delete());
        let fertigkeiten = this.datenbank.uebernatuerliche_fertigkeiten;
        for (let fert of fertigkeiten) {
            let item = new Item(fert);
            await pack.importDocument(item);
        }
    }

    async _create_vorteile() {
        await game.packs.get('world.vorteile').getDocuments();
        const pack = game.packs.get('world.vorteile');
        // await pack.getIndex().then(index => {
        //     for (let i of index) {
        //         pack.deleteEntity(i._id);
        //     }
        // });
        pack.forEach((e) => e.delete());
        let vorteile = this.datenbank.vorteile;
        for (let vort of vorteile) {
            let item = new Item(vort);
            await pack.importDocument(item);
        }
    }

    async _create_manoever() {
        await game.packs.get('world.manover').getDocuments();
        const pack = game.packs.get('world.manover');
        // await pack.getIndex().then(index => {
        //     for (let i of index) {
        //         pack.deleteEntity(i._id);
        //     }
        // });
        pack.forEach((e) => e.delete());
        let manoever = this.datenbank.manoever;
        for (let man of manoever) {
            let item = new Item(man);
            await pack.importDocument(item);
        }
    }

    import() {
        this._create_waffen();
        this._create_fertigkeiten_talente();
        this._create_zauber();
        this._create_liturgien();
        this._create_uebernatuerliche_fertigkeiten();
        this._create_vorteile();
        this._create_manoever();
    }
}
