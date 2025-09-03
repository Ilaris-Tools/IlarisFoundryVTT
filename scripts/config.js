import { label } from './config/label.js'

export const ILARIS = {}

let stat_desc = {
    ws: {
        name: 'Wundschwelle',
        short: 'WS',
        text: 'Schaden der erforderlich ist um eine Wunde zu verursachen (ohne Rüstung).',
    },
    ws_stern: {
        name: 'Effektive Wundschwelle',
        short: 'WS*',
        text: 'Schaden der erforderlich ist um eine Wunde zu verursachen (mit Rüstung).',
    },
    ini: {
        name: 'Initiative',
        short: 'INI',
    },
    koloss: {
        // TODO: move to eigenschaften? #18
        name: 'Koloss',
        short: 'KOL',
    },
    gs: {
        name: 'Geschwindigkeit',
        short: 'GS',
    },
    gs_schwimmend: {
        name: 'Geschwindigkeit (schwimmend)',
        short: 'GSS',
    },
    gs_fliegend: {
        name: 'Geschwindigkeit (fliegend)',
        short: 'GSF',
    },
    gs_reitend: {
        name: 'Geschwindigkeit (reitend)',
        short: 'GSR',
    },
    schips: {
        // TODO: remove schips completly? #19
        name: 'Schicksalspunkte',
        short: 'SIP',
    },
    mr: {
        name: 'Magieresistenz',
        short: 'MR',
    },
}
ILARIS.stat_desc = stat_desc

ILARIS.label = label

let trefferzonen = {
    0: 'keine',
    1: 'Beine',
    2: 'Schildarm',
    3: 'Schwertarm',
    4: 'Bauch',
    5: 'Brust',
    6: 'Kopf',
    7: 'andere',
}
ILARIS.trefferzonen = trefferzonen

let freie_fertigkeiten = {
    0: 'Sprachen',
    1: 'Schriften',
    2: 'Berufe',
    3: 'Freizeit',
    4: 'Anderes',
}
ILARIS.freie_fertigkeiten = freie_fertigkeiten

let xd20_choice = {
    0: '1W20',
    1: '3W20',
}
ILARIS.xd20_choice = xd20_choice

let schips_choice = {
    0: 'Ohne',
    1: 'ohne Eigenheit',
    2: 'mit Eigenheit',
}
ILARIS.schips_choice = schips_choice

let zeroToEightObj = {
    0: '0',
    1: '1',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
    8: '8',
}
ILARIS.zeroToEightObj = zeroToEightObj

// Reichweite (Nahkampf)
let distance_choice = {
    0: 'ideal',
    1: '1 Feld',
    2: '2 Felder',
}
ILARIS.distance_choice = distance_choice

// Größenklassen
let gzkl_choice = {
    0: 'sehr groß (Elefant)',
    1: 'groß (Pferd, Oger)',
    2: 'mittel (Mensch, Zwerg)',
    3: 'klein (Wolf, Reh)',
    4: 'sehr klein (Fasan, Hase)',
    5: 'winzig (Maus)',
}
ILARIS.gzkl_choice = gzkl_choice

// Lichtverhältnisse
let lcht_choice = {
    0: 'Tag',
    1: 'Dämmerung',
    2: 'Mondlicht',
    3: 'Sternenlicht',
    4: 'Blind',
}
ILARIS.lcht_choice = lcht_choice

// Wetterverhältnisse
let wttr_choice = {
    0: 'still',
    1: 'Wind',
    2: 'Sturm',
}
ILARIS.wttr_choice = wttr_choice

// Bewegung
let bwng_choice = {
    0: 'langsam',
    1: 'schnell (laufender Mensch)',
    2: 'sehr schnell (Pferd)',
    3: 'extrem schnell (Vogel)',
}
ILARIS.bwng_choice = bwng_choice

// Deckung
let dckg_choice = {
    0: 'keine',
    '-1': 'halbe Deckung',
    '-2': 'Dreivierteldeckung',
}
ILARIS.dckg_choice = dckg_choice

// Kampfgetümmel
let kgtl_choice = {
    0: 'Freistehendes Ziel',
    1: 'im offenen Feld',
    2: 'im beengten Raum',
}
ILARIS.kgtl_choice = kgtl_choice

// Schnellschuss
let fm_snls_choice = {
    0: 'kein',
    1: '1x',
    2: '2x',
}
ILARIS.fm_snls_choice = fm_snls_choice

// // Zaubertechnik ignorieren
// let mm_zaig_choice = {
//     0: '0',
//     1: '1',
//     2: '2',
//     3: '3',
// };
// ILARIS.mm_zaig_choice = mm_zaig_choice;

// // Kosten sparen
// let mm_kosp_choice = {
//     0: '0',
//     1: '1',
//     2: '2',
//     3: '3',
//     4: '4',
// };
// ILARIS.mm_kosp_choice = mm_kosp_choice;

// Zeremonie
let zere_choice = {
    0: '0',
    1: '1 Minute',
    2: '1 Stunde',
    3: '1 Tag',
    4: '1 Woche',
    5: '1 Monat',
    6: '1 Jahr',
}
ILARIS.zere_choice = zere_choice

let waffeneigenschaften = {
    kein_malus_nebenwaffe: 'Kein Malus als Nebenwaffe',
    kein_reiter: 'Nicht für Reiter',
    kopflastig: 'Kopflastig',
    niederwerfen: 'Niederwerfen',
    niederwerfen_4: 'Niederwerfen (-4)',
    niederwerfen_8: 'Niederwerfen (-8)',
    parierwaffe: 'Parierwaffe',
    reittier: 'Reittier',
    ruestungsbrechend: 'Rüstungsbrechend',
    schild: 'Schild',
    schwer_4: 'Schwer (4)',
    schwer_8: 'Schwer (8)',
    stationaer: 'Stationär',
    stumpf: 'Stumpf',
    umklammern_212: 'Umklammern (-2,12)',
    umklammern_416: 'Umklammern (-4,16)',
    umklammern_816: 'Umklammern (-8,16)',
    unberechenbar: 'Unberechenbar',
    unzerstoerbar: 'Unzerstörbar',
    wendig: 'Wendig',
    zerbrechlich: 'Zerbrechlich',
    zweihaendig: 'Zweihändig',
}
ILARIS.waffeneigenschaften = waffeneigenschaften

let manoever = {
    voraussetzung_type: {
        VORTEIL: 'Vorteil',
        WAFFENEIGENSCHAFT: 'Waffeneigenschaft',
        STILE: 'Stile',
    },
    manoever_type: {
        0: 'Nahkampf Angriff',
        1: 'Fernkampf',
        2: 'Magie',
        3: 'Karma',
        4: 'Nahkampf Verteidigung',
    },
    selector_type: {
        CHECKBOX: 'Checkbox',
        NUMBER: 'Nummerneingabefeld',
        TREFFER_ZONE: 'Trefferzonenauswahl',
    },
    modification_type: {
        DAMAGE: 'Schaden',
        DEFENCE: 'Verteidigung',
        ATTACK: 'Angriff/Fernkampf/Übernatürlich Fertigkeiten',
        INITIATIVE: 'Initiative',
        LOADING_TIME: 'Ladezeit/Vorbereitungszeit',
        SPECIAL_RESOURCE: 'Ressource für Zauber/Liturgien',
        WEAPON_DAMAGE: 'Waffenschaden',
        ZERO_DAMAGE: 'Kein Schaden',
        CHANGE_DAMAGE_TYPE: 'Schadenstyp ändern',
        ARMOR_BREAKING: 'Rüstung ignorieren',
        SPECIAL_TEXT: 'Spezialeffekt',
    },
    operator: {
        MULTIPLY: 'Multiplizieren',
        ADD: 'Addieren',
        SUBTRACT: 'Subtrahieren',
        DIVIDE: 'Dividieren',
    },
    labels: {
        prerequisites: 'Voraussetzungen',
        prerequisitesDescription:
            'Die Voraussetzungen sind an Sephrasto angelehnt und werden auch entsprechen im System behandelt. Wird ein Vorteil nicht richtig geschrieben, kann und wird das Manöver nicht angezeigt. In naher Zukunft wird es die Möglichkeit geben Hausregeln von Sephrasto direkt in Foundry zu übertragen, ab diesem Zeitpunkt solltest du auch einfach die Regeln aus Sephrasto importierten bevor du hier etwas veränderst.',
        input: 'Input',
        inputDescription:
            'Hier legst du fest, welches Eingabefeld im Würfeldialog für dieses Manöver angezeigt werden soll:',
        inputTypes: {
            checkbox: 'Checkbox - Eine einfache Ja/Nein Auswahl',
            number: 'Nummerneingabefeld - Ein Feld für Zahleneingaben',
            hitZone: 'Trefferzonenauswahl - Auswahl einer spezifischen Trefferzone',
        },
        inputLabel: 'Inputlabel',
        inputType: 'Inputtype',
        numberLimits: 'Zahlenbegrenzung',
        min: 'Min',
        max: 'Max',
        modifications: 'Modifikatoren',
        modificationsDescription: 'Hier definierst du die Effekte des Manövers. Empfehlungen:',
        modificationsHints: [
            'Verwende "Subtrahieren" nur wenn nötig (z.B. für Belastungswert, wenn du das Feld Target verwendest)',
            'Eine -1 ist leichter zu lesen als "Subtrahieren"',
            'Beispiel Wuchtschlag: AT -1 (Addieren) und Schaden +1 (Addieren)',
        ],
        modificationType: 'Modifikatortyp',
        value: 'Wert',
        operator: 'Operator',
        target: 'Target',
        targetPlaceholder: 'z.B. actor.system.abgeleitete.be',
        affectedByInput: 'Wird von Input beeinflusst',
        affectedByInputDescription:
            'Wenn aktiviert, wird der Wert mit der Eingabe multipliziert, falls ein Inputfeld vorhanden ist. Eine Checkbox wirkt sich nie auf den Wert aus.',
        specialEffect: 'Spezialeffekt beschreiben, der als Text beim Schadenswurf angezeigt wird',
    },
}
ILARIS.manoever = manoever

let manoever_nahkampf = {
    kbak: { selected: false },
    mod: { selected: false },
    rllm: { selected: '' },
    vlof: {
        selected: false,
        offensiver_kampfstil: false,
    },
    vldf: {
        selected: false,
    },
    rwdf: {
        selected: '0',
    },
    rkaz: {
        selected: 0,
    },
    pssl: {
        selected: false,
    },
}
ILARIS.manoever_nahkampf = manoever_nahkampf

let manoever_fernkampf = {
    kbak: { selected: false },
    mod: { selected: false },
    rllm: { selected: '' },
    gzkl: {
        selected: '2',
    },
    bwng: {
        selected: '0',
    },
    lcht: {
        angepasst: '0',
        selected: '0',
    },
    wttr: {
        selected: '0',
    },
    dckg: {
        selected: '0',
    },
    kgtl: {
        selected: '0',
    },
    brtn: {
        selected: false,
        rtk: false,
    },
    rflx: false,
    rw: {
        0: '1 Schritt',
        1: '2 Schritt',
        2: '3 Schritt',
    },
    fm_gzss: {
        selected: false,
    },
}
ILARIS.manoever_fernkampf = manoever_fernkampf

let manoever_ueber = {
    kbak: { selected: false },
    mod: { selected: false },
    rllm: { selected: '' },
}
ILARIS.manoever_ueber = manoever_ueber

let kreatur_item_options = {
    angriff: 'Angriff',
    eigenschaft: 'Eigenschaft',
    vorteil: 'Vorteil',
    freiestalent: 'Fertigkeit',
    uebernatfreiestalent: 'Übernat. Fertigkeit',
    zauber: 'Zauber',
    liturgie: 'Liturgie',
    anrufung: 'Anrufung',
    info: 'Info',
}
ILARIS.kreatur_item_options = kreatur_item_options

let angriff_typ = {
    Nah: 'Nahkampf',
    Fern: 'Fernkampf',
}
ILARIS.angriff_typ = angriff_typ

let schadenstypen = {
    PROFAN: 'Profan',
    STUMPF: 'Stumpf',
    STICH: 'Stich',
    SCHARF: 'Scharf',
    MAGISCH: 'Magisch',
    GEWEIHT: 'Geweiht',
    EIS: 'Eis',
    ERZ: 'Erz',
    FEUER: 'Feuer',
    HUMUS: 'Humus',
    LUFT: 'Luft',
    WASSER: 'Wasser',
    DAEMONISCH: 'Dämonisch',
}
ILARIS.schadenstypen = schadenstypen

let combat_dialog = {
    labels: {
        angriffNah: 'Nahkampfangriff',
        nahkampfwaffe: 'Nahkampfangriff',
        angriffFern: 'Fernkampfangriff',
        fernkampfwaffe: 'Fernkampfangriff',
        magie: 'Magie',
        liturgie: 'Liturgie',
        anrufung: 'Anrufung',
    },
}
ILARIS.combat_dialog = combat_dialog

// Configuration objects for select helpers to replace deprecated {{#select}}
let vorteilsgruppen = [
    { value: '0', label: 'Allgemein' },
    { value: '1', label: 'Profan' },
    { value: '2', label: 'Kampf' },
    { value: '3', label: 'Kampfstil' },
    { value: '4', label: 'Magie' },
    { value: '5', label: 'Zauber Traditionen' },
    { value: '6', label: 'Karma' },
    { value: '7', label: 'Geweihte Traditionen' },
]
ILARIS.vorteilsgruppen = vorteilsgruppen

let fertigkeitsgruppen = [
    { value: '0', label: 'Nahkampf' },
    { value: '1', label: 'Fernkampf' },
    { value: '2', label: 'Körper' },
    { value: '3', label: 'Gesellschaft' },
    { value: '4', label: 'Wissen' },
    { value: '5', label: 'Natur' },
    { value: '6', label: 'Handwerk' },
]
ILARIS.fertigkeitsgruppen = fertigkeitsgruppen

let stufen = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
]
ILARIS.stufen = stufen
