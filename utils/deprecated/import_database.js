import Datastore from 'nedb'
import * as fs from 'fs'
import _ from 'lodash'

function merge_two_arrayf_of_dicts(org_array, update_array) {
    let array = []
    org_array.forEach((item) => {
        let update_obj = update_array.filter((x) => x.name === item.name)[0]
        _.merge(item, update_obj)
        array.push(item)
    })
    update_array.forEach((item) => {
        if (!org_array.some((x) => x.name === item.name)) {
            array.push(item)
        }
    })
    return array
}

function save_to_db(data, db_out) {
    let db = new Datastore({
        filename: db_out,
        autoload: true,
    })
    db.remove(
        {},
        {
            multi: true,
        },
    )
    db.insert(data)
    db.persistence.compactDatafile()
}

function import_weapons() {
    let data_auto = JSON.parse(fs.readFileSync('./local_db/json_auto/waffen.json'))
    let data_user = JSON.parse(fs.readFileSync('./local_db/json_user/waffen.json'))
    let nwaffen_auto = data_auto['Nahkampfwaffen']
    let nwaffen_user = data_user['Nahkampfwaffen']
    let nwaffen = merge_two_arrayf_of_dicts(nwaffen_auto, nwaffen_user)
    let fwaffen_auto = data_auto['Fernkampfwaffen']
    let fwaffen_user = data_user['Fernkampfwaffen']
    let fwaffen = merge_two_arrayf_of_dicts(fwaffen_auto, fwaffen_user)
    let waffen = nwaffen.concat(fwaffen)
    fs.writeFileSync('./local_db/db/waffen.json', JSON.stringify(waffen, null, 2), {
        encoding: 'utf8',
    })
    save_to_db(waffen, './packs/waffen.db')
}

function import_profan_fertigkeiten_und_talente() {
    let data_auto = JSON.parse(
        fs.readFileSync('./local_db/json_auto/fertigkeiten-und-talente.json'),
    )
    let data_user = JSON.parse(
        fs.readFileSync('./local_db/json_user/fertigkeiten-und-talente.json'),
    )
    let talente_auto = data_auto['Talente']
    let talente_user = data_user['Talente']
    let talente = merge_two_arrayf_of_dicts(talente_auto, talente_user)
    let fertigkeiten_auto = data_auto['Fertigkeiten']
    let fertigkeiten_user = data_user['Fertigkeiten']
    let fertigkeiten = merge_two_arrayf_of_dicts(fertigkeiten_auto, fertigkeiten_user)
    let freie_fertigkeiten_auto = data_auto['Freie Fertigkeiten']
    let freie_fertigkeiten_user = data_user['Freie Fertigkeiten']
    let freie_fertigkeiten = merge_two_arrayf_of_dicts(
        freie_fertigkeiten_auto,
        freie_fertigkeiten_user,
    )
    let profan = talente.concat(fertigkeiten, freie_fertigkeiten)
    fs.writeFileSync(
        './local_db/db/fertigkeiten-und-talente.json',
        JSON.stringify(profan, null, 2),
        {
            encoding: 'utf8',
        },
    )
    save_to_db(profan, './packs/fertigkeiten-und-talente.db')
}

function import_vorteile() {
    let data_auto = JSON.parse(fs.readFileSync('./local_db/json_auto/vorteile.json'))
    let data_user = JSON.parse(fs.readFileSync('./local_db/json_user/vorteile.json'))
    let vorteile_auto = data_auto['Vorteile']
    let vorteile_user = data_user['Vorteile']
    let vorteile = merge_two_arrayf_of_dicts(vorteile_auto, vorteile_user)
    fs.writeFileSync('./local_db/db/vorteile.json', JSON.stringify(vorteile, null, 2), {
        encoding: 'utf8',
    })
    save_to_db(vorteile, './packs/vorteile.db')
}

function import_uebernatuerliche_fertigkeiten() {
    let data_auto = JSON.parse(
        fs.readFileSync('./local_db/json_auto/ubernaturliche-fertigkeiten.json'),
    )
    let data_user = JSON.parse(
        fs.readFileSync('./local_db/json_user/ubernaturliche-fertigkeiten.json'),
    )
    let fertigkeiten_auto = data_auto['Übernatürliche Fertigkeiten']
    let fertigkeiten_user = data_user['Übernatürliche Fertigkeiten']
    let fertigkeiten = merge_two_arrayf_of_dicts(fertigkeiten_auto, fertigkeiten_user)
    fs.writeFileSync(
        './local_db/db/ubernaturliche-fertigkeiten.json',
        JSON.stringify(fertigkeiten, null, 2),
        {
            encoding: 'utf8',
        },
    )
    save_to_db(fertigkeiten, './packs/ubernaturliche-fertigkeiten.db')
}

function import_zauber() {
    let data_auto = JSON.parse(
        fs.readFileSync('./local_db/json_auto/zauberspruche-und-rituale.json'),
    )
    let data_user = JSON.parse(
        fs.readFileSync('./local_db/json_user/zauberspruche-und-rituale.json'),
    )
    let fertigkeiten_auto = data_auto['Zaubersprüche und Rituale']
    let fertigkeiten_user = data_user['Zaubersprüche und Rituale']
    let fertigkeiten = merge_two_arrayf_of_dicts(fertigkeiten_auto, fertigkeiten_user)
    fs.writeFileSync(
        './local_db/db/zauberspruche-und-rituale.json',
        JSON.stringify(fertigkeiten, null, 2),
        {
            encoding: 'utf8',
        },
    )
    save_to_db(fertigkeiten, './packs/zauberspruche-und-rituale.db')
}

function import_liturgien() {
    let data_auto = JSON.parse(fs.readFileSync('./local_db/json_auto/liturgien-und-mirakel.json'))
    let data_user = JSON.parse(fs.readFileSync('./local_db/json_user/liturgien-und-mirakel.json'))
    let fertigkeiten_auto = data_auto['Liturgien und Mirakel']
    let fertigkeiten_user = data_user['Liturgien und Mirakel']
    let fertigkeiten = merge_two_arrayf_of_dicts(fertigkeiten_auto, fertigkeiten_user)
    fs.writeFileSync(
        './local_db/db/liturgien-und-mirakel.json',
        JSON.stringify(fertigkeiten, null, 2),
        {
            encoding: 'utf8',
        },
    )
    save_to_db(fertigkeiten, './packs/liturgien-und-mirakel.db')
}

function import_gegenstaende() {
    let data_user = JSON.parse(fs.readFileSync('./local_db/json_user/gegenstande.json'))
    let gegenstaende = data_user['Gegenstände']
    fs.writeFileSync('./local_db/db/gegenstaende.json', JSON.stringify(gegenstaende, null, 2), {
        encoding: 'utf8',
    })
    save_to_db(gegenstaende, './packs/gegenstande.db')
}

function import_manoever() {
    let data_auto = JSON.parse(fs.readFileSync('./local_db/json_auto/manoever.json'))
    let data_user = JSON.parse(fs.readFileSync('./local_db/json_user/manoever.json'))
    let manoever_auto = data_auto['Manöver']
    let manoever_user = data_user['Manöver']
    let manoever = merge_two_arrayf_of_dicts(manoever_auto, manoever_user)
    fs.writeFileSync('./local_db/db/manoever.json', JSON.stringify(manoever, null, 2), {
        encoding: 'utf8',
    })
    save_to_db(manoever, './packs/manoever.db')
}

import_weapons()
import_profan_fertigkeiten_und_talente()
import_vorteile()
import_uebernatuerliche_fertigkeiten()
import_zauber()
import_liturgien()
import_gegenstaende()
import_manoever()
