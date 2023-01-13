import Parser from 'xml2js';
import * as fs from 'fs';

// Sephrasto main 25.04.2021
// ## Vorteil
// typ = 0         Allgemein (4)
// typ = 1         Profan (568)
// typ = 2         Kampf (895)
// typ = 3         Kampfstil (1179)
// typ = 4         Magie (1434)
// typ = 5         Tradition Zauber (1675)
// typ = 6         Karma (2325)
// typ = 7         Tradition Karma (2485)
// typ = 8         Tradition Paktierer (3205)
// ## Fertigkeiten:
// printclass=0    Nahkampf (12107)
// printclass=1    Fernkampf (12144)
// printclass=2    Körper (12161)
// printclass=3    Gesellschaft (12197)
// printclass=4    Wissen (12224)
// printclass=5    Natur (12251)
// printclass=6    Handwerk (12260)
// ## Talente:
// printclass=-1       Profan (3243)
// printclass=[0,19]   Zauber (3935)
// printclass=[20,55]  Liturgien (8985)
// printclass=99       Mirakel (11275)
// printclass=299      Dämonische Stärkung (11605)
// printclass=200      Dämonisch
// ## Manöver
// typ = 0         Nahkampf (14490)
// typ = 1         Fernkampf (14682)
// typ = 2         Magie (14738)
// typ = 3         Karma (14810)
// typ = 4         Antimage-Eigenschaften-... (15042)
// typ = 6         paktierer (14987)

const CONFIG = {
    talente: {
        prof_tal: -1,
        zauber_min: 0,
        zauber_max: 19,
        liturgie_min: 20,
        liturgie_max: 55,
        mirakel: 99,
        daemonisch_staerkung: 299,
        daemonisch: 200,
    },
    fertigkeiten: {
        nahkampf: 0,
        fernkampf: 1,
        koerper: 2,
        gesellschaft: 3,
        wissen: 4,
        natur: 5,
        handwerk: 6,
    },
    vorteil: {
        allgemein: 0,
        profan: 1,
        kampf: 2,
        kampfstil: 3,
        magie: 4,
        tradition_zauber: 5,
        karma: 6,
        tradition_karma: 7,
        tradition_paktierer: 8,
    },
    //Die stimmen so noch nicht!!
    manoever: {
        nahkampf: 0,
        fernkampf: 1,
        magie: 2,
        karma: 3,
        zauber_speziell: 4,
        kampf: 5,
        anrufung: 6,
        status: 8,
        allgemein: 9,
    },
};

function get_object_from_file(file_xml) {
    let parser = new Parser.Parser({
        explicitArray: false,
        charkey: '#text',
        mergeAttrs: true,
        // valueProcessors: [Parser.processors.parseNumbers],
    });
    let rawdata = fs.readFileSync(file_xml, 'utf8');
    let db_object;
    parser.parseString(rawdata, function (err, result) {
        db_object = result;
    });
    // parser.parseString(rawdata, {
    //     //tagNameProcessors: [nameToUpperCase],
    //     //attrNameProcessors: [nameToUpperCase],
    //     // valueProcessors: [Parser.processors.parseNumbers],
    //     //attrValueProcessors: [nameToUpperCase]
    // },
    //     function(err, result) {
    //     db_object = result
    // });
    // parser.reset()
    return db_object;
}

function write_jsonfile_from_object(jsonfile, data) {
    let json_data = JSON.stringify(data, null, 2);
    fs.writeFileSync(jsonfile, json_data, {
        encoding: 'utf8',
    });
}

function create_weapons(data) {
    let weapons = {};
    weapons['Nahkampfwaffen'] = [];
    weapons['Fernkampfwaffen'] = [];
    let waffen_data = data['Datenbank']['Waffe'];
    for (const [key, item] of Object.entries(waffen_data)) {
        if (item['fk'] == '0') {
            let eigenschaften = item['#text'] || '';
            let nwaffe = {
                name: item['name'],
                type: 'nahkampfwaffe',
                data: {
                    dice_anzahl: parseInt(item['W6']),
                    dice_plus: parseInt(item['plus']),
                    haerte: parseInt(item['haerte']),
                    fertigkeit: item['fertigkeit'],
                    talent: item['talent'],
                    rw: parseInt(item['rw']),
                    wm_at: parseInt(item['wm']),
                    wm_vt: parseInt(item['wm']),
                    gewicht: 1,
                    eigenschaften: {
                        kopflastig: eigenschaften.includes('Kopflastig'),
                        niederwerfen: eigenschaften.includes('Niederwerfen'),
                        parierwaffe: eigenschaften.includes('Parierwaffe'),
                        reittier: eigenschaften.includes('Reittier'),
                        ruestungsbrechend: eigenschaften.includes('Rüstungsbrechend'),
                        schild: eigenschaften.includes('Schild'),
                        schwer_4: eigenschaften.includes('Schwer (4)'),
                        schwer_8: eigenschaften.includes('Schwer (8)'),
                        stumpf: eigenschaften.includes('Stumpf'),
                        unberechenbar: eigenschaften.includes('Unberechenbar'),
                        unzerstoerbar: eigenschaften.includes('Unzerstörbar'),
                        wendig: eigenschaften.includes('Wendig'),
                        zerbrechlich: eigenschaften.includes('Zerbrechlich'),
                        zweihaendig: eigenschaften.includes('Zweihändig'),
                        kein_malus_nebenwaffe: eigenschaften.includes('kein Malus als Nebenwaffe'),
                    },
                },
            };
            let gewicht = 1;
            if (nwaffe['data']['eigenschaften']['reittier']) {
                gewicht = -1;
            } else if (nwaffe['data']['eigenschaften']['zweihaendig']) {
                gewicht = 2;
            } else if (
                nwaffe['data']['eigenschaften']['schild'] &&
                !nwaffe['data']['eigenschaften']['parierwaffe']
            ) {
                gewicht = 2;
            } else if (nwaffe['data']['talent'] == 'Unbewaffnet') {
                gewicht = 0;
            }
            nwaffe['data']['gewicht'] = gewicht;
            weapons['Nahkampfwaffen'].push(nwaffe);
        } else if (item['fk'] == '1') {
            let eigenschaften = item['#text'] || '';
            let kein_reiter_nocaps = eigenschaften.includes('nicht für Reiter');
            let kein_reiter_caps = eigenschaften.includes('Nicht für Reiter');
            let kein_reiter = false;
            if (kein_reiter_nocaps || kein_reiter_caps) {
                kein_reiter = true;
            }
            let fwaffe = {
                name: item['name'],
                type: 'fernkampfwaffe',
                data: {
                    dice_anzahl: parseInt(item['W6']),
                    dice_plus: parseInt(item['plus']),
                    haerte: parseInt(item['haerte']),
                    fertigkeit: item['fertigkeit'],
                    talent: item['talent'],
                    rw: parseInt(item['rw']),
                    lz: parseInt(item['lz']),
                    gewicht: 1,
                    eigenschaften: {
                        kein_reiter: kein_reiter,
                        niederwerfen: eigenschaften.includes('Niederwerfen'),
                        niederwerfen_4: eigenschaften.includes('Niederwerfen (-4)'),
                        niederwerfen_8: eigenschaften.includes('Niederwerfen (-8)'),
                        schwer_4: eigenschaften.includes('Schwer (4)'),
                        schwer_8: eigenschaften.includes('Schwer (8)'),
                        stationaer: eigenschaften.includes('Stationär'),
                        stumpf: eigenschaften.includes('Stumpf'),
                        umklammern_212: eigenschaften.includes('Umklammern (-2; 12)'),
                        umklammern_416: eigenschaften.includes('Umklammern (-4; 16)'),
                        umklammern_816: eigenschaften.includes('Umklammern (-8; 16)'),
                        zweihaendig: eigenschaften.includes('Zweihändig'),
                    },
                },
            };
            if (
                fwaffe['data']['eigenschaften']['niederwerfen_4'] ||
                fwaffe['data']['eigenschaften']['niederwerfen_8']
            ) {
                fwaffe['data']['eigenschaften']['niederwerfen'] = false;
            }
            let gewicht = 1;
            if (fwaffe['data']['eigenschaften']['stationaer']) {
                gewicht = 3;
            } else if (fwaffe['data']['eigenschaften']['zweihaendig']) {
                gewicht = 2;
            }
            fwaffe['data']['gewicht'] = gewicht;
            weapons['Fernkampfwaffen'].push(fwaffe);
        }
    }
    write_jsonfile_from_object('./local_db/json_auto/waffen.json', weapons);
    return weapons;
}

function create_profan_fertigkeiten_und_talente(data) {
    let profan = {};
    profan['Fertigkeiten'] = [];
    profan['Talente'] = [];
    profan['Freie Fertigkeiten'] = [];
    let talente = data['Datenbank']['Talent'];
    for (const [key, item] of Object.entries(talente)) {
        let printclass = parseInt(item['printclass']);
        printclass = isNaN(printclass) ? CONFIG.talente.prof_tal : printclass;
        if (printclass == -1) {
            let text = item['#text'] || '';
            const talent = {
                name: item['name'],
                type: 'talent',
                data: {
                    fertigkeit: item['fertigkeiten'],
                    text: text,
                },
            };
            profan['Talente'].push(talent);
        }
    }
    let fertigkeiten = data['Datenbank']['Fertigkeit'];
    for (const [key, item] of Object.entries(fertigkeiten)) {
        let attribute = item['attribute'].split('|');
        let attribut_0 = attribute[0];
        let attribut_1 = attribute[1];
        let attribut_2 = attribute[2];
        let text = item['#text'] || '';
        let fertigkeit = {
            name: item['name'],
            type: 'fertigkeit',
            data: {
                attribut_0: attribut_0,
                attribut_1: attribut_1,
                attribut_2: attribut_2,
                gruppe: parseInt(item['printclass']),
                text: text,
            },
        };
        profan['Fertigkeiten'].push(fertigkeit);
    }
    let freie_fertigkeiten = data['Datenbank']['FreieFertigkeit'];
    for (const [key, item] of Object.entries(freie_fertigkeiten)) {
        let kategorie = item['kategorie'];
        let gruppe = 4;
        if (kategorie == 'Sprache') {
            gruppe = 0;
        } else if (kategorie == 'Schrift') {
            gruppe = 1;
        }
        let text = item['voraussetzungen'] || '';
        let ffertigkeit = {
            name: item['#text'],
            type: 'freie_fertigkeit',
            data: {
                gruppe: gruppe,
                text: text,
            },
        };
        profan['Freie Fertigkeiten'].push(ffertigkeit);
    }
    write_jsonfile_from_object('./local_db/json_auto/fertigkeiten-und-talente.json', profan);
    return profan;
}

function create_vorteile(data) {
    let vorteile_db = {};
    vorteile_db['Vorteile'] = [];
    let vorteile = data['Datenbank']['Vorteil'];
    for (const [key, item] of Object.entries(vorteile)) {
        let gruppe = parseInt(item['typ']);
        let text = item['#text'].split('Sephrasto')[0];
        let vorteil = {
            name: item['name'],
            type: 'vorteil',
            data: {
                voraussetzung: item['voraussetzungen'],
                gruppe: gruppe,
                text: text,
            },
        };
        vorteile_db['Vorteile'].push(vorteil);
    }
    write_jsonfile_from_object('./local_db/json_auto/vorteile.json', vorteile_db);
    return vorteile_db;
}

function create_uebernatuerliche_fertigkeiten(data) {
    let uebernatuerliche_fertigkeiten = {};
    uebernatuerliche_fertigkeiten['Übernatürliche Fertigkeiten'] = [];
    let fertigkeiten = data['Datenbank']['Übernatürliche-Fertigkeit'];
    for (const [key, item] of Object.entries(fertigkeiten)) {
        let attribute = item['attribute'].split('|');
        let attribut_0 = attribute[0];
        let attribut_1 = attribute[1];
        let attribut_2 = attribute[2];
        let text = item['#text'] || '';
        let fertigkeit = {
            name: item['name'],
            type: 'uebernatuerliche_fertigkeit',
            data: {
                attribut_0: attribut_0,
                attribut_1: attribut_1,
                attribut_2: attribut_2,
                gruppe: parseInt(item['printclass']),
                text: text,
            },
        };
        uebernatuerliche_fertigkeiten['Übernatürliche Fertigkeiten'].push(fertigkeit);
    }
    write_jsonfile_from_object(
        './local_db/json_auto/ubernaturliche-fertigkeiten.json',
        uebernatuerliche_fertigkeiten,
    );
    return uebernatuerliche_fertigkeiten;
}

function create_uebernatuerliche_talente(data) {
    let zauberspruche_und_rituale = {};
    let liturgien_und_mirakel = {};
    zauberspruche_und_rituale['Zaubersprüche und Rituale'] = [];
    liturgien_und_mirakel['Liturgien und Mirakel'] = [];
    let talente_db = data['Datenbank']['Talent'];
    for (const [key, item] of Object.entries(talente_db)) {
        let printclass = parseInt(item['printclass']);
        printclass = isNaN(printclass) ? CONFIG.talente.prof_tal : printclass;
        let talent_typ = -1;
        if (printclass <= CONFIG.talente.zauber_max && printclass >= CONFIG.talente.zauber_min) {
            talent_typ = 'zauber';
        } else if (
            (printclass <= CONFIG.talente.liturgie_max &&
                printclass >= CONFIG.talente.liturgie_min) ||
            printclass == CONFIG.talente.mirakel
        ) {
            talent_typ = 'liturgie';
        }
        if (talent_typ == 'zauber' || talent_typ == 'liturgie') {
            let beschreibung = item['#text'] || '';
            let splitted = '';
            let anmerkungen = '';
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
            splitted = beschreibung.split('\nSephrasto: ');
            if (splitted.length == 2) {
                // Brauchen wir wohl nicht?
            }
            beschreibung = splitted[0];
            splitted = beschreibung.split('\nAnmerkungen: ');
            if (splitted.length == 2) {
                anmerkungen = splitted[1];
            }
            beschreibung = splitted[0];
            splitted = beschreibung.split('\nErlernen: ');
            if (splitted.length == 2) {
                erlernen = splitted[1];
                erlernen = erlernen.split(';');
                if (erlernen[erlernen.length - 1].includes('EP')) {
                    erlernen.pop();
                }
                erlernen = erlernen.join(';');
            }
            beschreibung = splitted[0];
            splitted = beschreibung.split('\nFertigkeiten: ');
            if (splitted.length == 2) {
                // direkt auslesbar
            }
            beschreibung = splitted[0];
            splitted = beschreibung.split('\nKosten: ');
            if (splitted.length == 2) {
                kosten = splitted[1];
            }
            beschreibung = splitted[0];
            splitted = beschreibung.split('\nWirkungsdauer: ');
            if (splitted.length == 2) {
                wirkungsdauer = splitted[1];
            }
            beschreibung = splitted[0];
            splitted = beschreibung.split('\nReichweite: ');
            if (splitted.length == 2) {
                reichweite = splitted[1];
            }
            beschreibung = splitted[0];
            splitted = beschreibung.split('\nZiel: ');
            if (splitted.length == 2) {
                ziel = splitted[1];
            }
            beschreibung = splitted[0];
            splitted = beschreibung.split('\nVorbereitungszeit: ');
            if (splitted.length == 2) {
                vorbereitung = splitted[1];
            }
            beschreibung = splitted[0];
            splitted = beschreibung.split('\nModifikationen: ');
            if (splitted.length == 2) {
                modifikationen = splitted[1];
            }
            beschreibung = splitted[0];
            splitted = beschreibung.split('\nProbenschwierigkeit: ');
            if (splitted.length == 2) {
                schwierigkeit = splitted[1];
            }
            beschreibung = splitted[0];
            if (talent_typ == 'zauber') {
                splitted = beschreibung.split('\nMächtige Magie: ');
                if (splitted.length == 2) {
                    maechtig = splitted[1];
                }
            } else if (talent_typ == 'liturgie') {
                splitted = beschreibung.split('\nMächtige Liturgie: ');
                if (splitted.length == 2) {
                    maechtig = splitted[1];
                }
            }
            // else if (talent_typ == "daemonisch") {
            //     splitted = beschreibung.split("\nMächtige Anrufung: ")
            //     if (splitted.length == 2) {
            //         maechtig = splitted[1]
            //     }
            text = splitted[0];
            if (anmerkungen != '') {
                text = text + '\nAnmerkungen: ' + anmerkungen;
            }
            let talent = {
                name: item['name'],
                type: talent_typ,
                data: {
                    fertigkeiten: item['fertigkeiten'],
                    text: text,
                    maechtig: maechtig,
                    schwierigkeit: schwierigkeit,
                    modifikationen: modifikationen,
                    vorbereitung: vorbereitung,
                    ziel: ziel,
                    reichweite: reichweite,
                    wirkungsdauer: wirkungsdauer,
                    kosten: kosten,
                    erlernen: erlernen,
                    gruppe: printclass,
                },
            };
            if (talent_typ == 'zauber') {
                zauberspruche_und_rituale['Zaubersprüche und Rituale'].push(talent);
            } else if (talent_typ == 'liturgie') {
                liturgien_und_mirakel['Liturgien und Mirakel'].push(talent);
            }
        }
        write_jsonfile_from_object(
            './local_db/json_auto/zauberspruche-und-rituale.json',
            zauberspruche_und_rituale,
        );
        write_jsonfile_from_object(
            './local_db/json_auto/liturgien-und-mirakel.json',
            liturgien_und_mirakel,
        );
    }
}

// "voraussetzung": "",
//   "gruppe": 0,
//     "probe": "",
//       "gegenprobe": "",
//         "text": ""
function create_manoever(data) {
    let manoever_liste = {};
    manoever_liste['Manöver'] = [];
    let manoever_data = data['Datenbank']['Manöver'];
    for (const [key, item] of Object.entries(manoever_data)) {
        let manoever = {
            name: item['name'],
            type: 'manoever',
            data: {
                voraussetzungen: item['voraussetzungen'],
                gruppe: parseInt(item['typ']),
                probe: item['probe'],
                gegenprobe: item['gegenprobe'],
                text: item['#item'],
            },
        };
        manoever_liste['Manöver'].push(manoever);
    }
    write_jsonfile_from_object('./local_db/json_auto/manoever.json', manoever_liste);
}

function create_armor(data) {
    // Rüstung gefällt mir nicht. Mathe geht nicht auf.
    // Daher -> Weglassen
    let armor = {};
    armor['Rüstung'] = [];
    let waffen_data = data['Datenbank']['Rüstung'];
    for (const [key, item] of Object.entries(waffen_data)) {
        // console.log(`${JSON.stringify(item, null, 2)}`);
        armor['Rüstung'].push(item);
    }
    write_jsonfile_from_object('./local_db/json_auto/rustungen.json', armor);
}

let db_object = get_object_from_file('./local_db/org/datenbank.xml');
// // console.log(`${JSON.stringify(db_object, null, 2)}`);
write_jsonfile_from_object('./local_db/org/datenbank.json', db_object);
create_weapons(db_object);
create_profan_fertigkeiten_und_talente(db_object);
create_vorteile(db_object);
create_uebernatuerliche_fertigkeiten(db_object);
create_uebernatuerliche_talente(db_object);
create_manoever(db_object);
