export const ILARIS = {};

let label = {
    // Attribute
    KO: 'Konstitution',
    MU: 'Mut',
    GE: 'Gewandheit',
    KK: 'Körperkraft',
    IN: 'Intuition',
    KL: 'Klugheit',
    CH: 'Charisma',
    FF: 'Fingerfertigkeit',
    // Kampfwerte
    ws: 'Wundschwelle',
    ws_stern: 'Effektive Wundschwelle',
    ini: 'Initiative',
    koloss: 'Koloss',
    gs: 'Geschwindigkeit',
    gss: 'Geschwindigkeit (schwimmend)',
    gsf: 'Geschwindigkeit (fliegend)',
    gsr: 'Geschwindigkeit (reitend)',
    schips: 'Schicksalspunkte',
    // Waffeneigenschaften
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
    erschoepfung: 'Erschöpfung',
    // Kampfstile
    ohne: 'Kein Kampfstil',
    bhk: 'Beidhändiger Kampf',
    kvk: 'Kraftvoller Kampf',
    pwk: 'Parierwaffenkampf',
    rtk: 'Reiterkampf',
    shk: 'Schildkampf',
    snk: 'Schneller Kampf',
    // Kampfabkürzungen
    kbak: 'kombinierte Aktion',
    vldf: 'volle Defensive',
    gzkl: 'Größenklasse',
    bwng: 'Bewegung',
    lcht: 'Licht',
    wttr: 'Wetter',
    dckg: 'Deckung',
    kgtl: 'Kampfgetümmel',
    brtn: 'Beritten',
    kwut: 'Kalte Wut',
    // kampfmanoever
    km_ausw: 'Ausweichen',
    km_bind: 'Binden',
    km_ever: 'Entfernung verändern',
    km_entw: 'Entwaffnen',
    km_gzsl: 'Gezielter Schlag',
    km_umre: 'Umreißen',
    km_wusl: 'Wuchtschlag',
    km_aufl: 'Auflaufen lassen',
    km_rust: 'Rüstungsbrecher',
    km_shsp: 'Schildspalter',
    km_stsl: 'Stumpfer Schlag',
    km_umkl: 'Umklammern',
    km_ausf: 'Ausfall',
    km_befr: 'Befreiungsschlag',
    km_dppl: 'Doppelangriff',
    km_hmsl: 'Hammerschlag',
    km_kltz: 'Klingentanz',
    km_ndwf: 'Niederwerfen',
    km_rpst: 'Riposte',
    km_shwl: 'Schildwall',
    km_stag: 'Sturmangriff',
    km_tdst: 'Todesstoß',
    km_uebr: 'Überrennen',
    km_utlf: 'Unterlaufen',
    fm_gzss: 'Gezielter Schuss',
    fm_rwrh: 'Reichweite erhöhen',
    fm_srfs: 'Scharfschuss',
    fm_zlen: 'Zielen',
    fm_msts: 'Meisterschuss',
    fm_rust: 'Rüstungsbrecher',
    fm_snls: 'Schnellschuss',
    fm_gzss: 'Gezielter Schuss',
    fm_rwrh: 'Reichweite',
    fm_srfs: 'Scharfschuss',
    fm_zlen: 'Zielen',
    fm_msts: 'Meisterschuss',
    fm_rust: 'Rüstungsbrecher',
    fm_snls: 'Schnellschuss',
    // magiemanöver
    mm_mama: 'Mächtige Magie',
    mm_mezi: 'Mehrere Ziele',
    mm_rwrh: 'Reichweite erhöhen',
    mm_vbvk: 'Vorbereitung verkürzen',
    mm_wkvl: 'Wirkungsdauer verlängern',
    mm_ztig: 'Zaubertechnik ignorieren',
    mm_erzw: 'Erzwingen',
    mm_kosp: 'Kosten sparen',
    mm_ztls: 'Zeit lassen',
    mm_zere: 'Zeremonie',
    mm_opfe: 'Opferung',
    // karmamanöver
    lm_mali: 'Mächtige Liturgie',
    lm_mezi: 'Mehrere Ziele',
    lm_ltig: 'Liturgische Technik ignorieren',
    lm_rwrh: 'Reichweite erhöhen',
    lm_vbvk: 'Vorbereitung verkürzen',
    lm_wkvl: 'Wirkungsdauer verlängern',
    lm_kosp: 'Kosten sparen',
    lm_zere: 'Zeremonie',
    lm_opfe: 'Opferung',
    // sonstige
    gewicht: 'Platzbedarf',
};
ILARIS.label = label;

let trefferzonen = {
    0: 'keine',
    1: 'Beine',
    2: 'Schildarm',
    3: 'Schwertarm',
    4: 'Bauch',
    5: 'Brust',
    6: 'Kopf',
    7: 'andere',
};
ILARIS.trefferzonen = trefferzonen;

let freie_fertigkeiten = {
    0: 'Sprachen',
    1: 'Schriften',
    2: 'Berufe',
    3: 'Freizeit',
    4: 'Anderes',
};
ILARIS.freie_fertigkeiten = freie_fertigkeiten;

let xd20_choice = {
    0: '1W20',
    1: '3W20',
};
ILARIS.xd20_choice = xd20_choice;

let schips_choice = {
    0: 'Ohne',
    1: 'ohne Eigenheit',
    2: 'mit Eigenheit',
};
ILARIS.schips_choice = schips_choice;

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
};
ILARIS.zeroToEightObj = zeroToEightObj;

// Reichweite (Nahkampf)
let distance_choice = {
    0: 'ideal',
    1: '1 Feld',
    2: '2 Felder',
};
ILARIS.distance_choice = distance_choice;

// Größenklassen
let gzkl_choice = {
    0: 'sehr groß (Elefant)',
    1: 'groß (Pferd, Oger)',
    2: 'mittel (Mensch, Zwerg)',
    3: 'klein (Wolf, Reh)',
    4: 'sehr klein (Fasan, Hase)',
    5: 'winzig (Maus)',
};
ILARIS.gzkl_choice = gzkl_choice;

// Lichtverhältnisse
let lcht_choice = {
    0: 'Tag',
    1: 'Dämmerung',
    2: 'Mondlicht',
    3: 'Sternenlicht',
    4: 'Blind',
};
ILARIS.lcht_choice = lcht_choice;

// Wetterverhältnisse
let wttr_choice = {
    0: 'still',
    1: 'Wind',
    2: 'Sturm',
};
ILARIS.wttr_choice = wttr_choice;

// Bewegung
let bwng_choice = {
    0: 'langsam',
    1: 'schnell (laufender Mensch)',
    2: 'sehr schnell (Pferd)',
    3: 'extrem schnell (Vogel)',
};
ILARIS.bwng_choice = bwng_choice;

// Deckung
let dckg_choice = {
    0: 'keine',
    '-1': 'halbe Deckung',
    '-2': 'Dreivierteldeckung',
};
ILARIS.dckg_choice = dckg_choice;

// Kampfgetümmel
let kgtl_choice = {
    0: 'Freistehendes Ziel',
    1: 'im offenen Feld',
    2: 'im beengten Raum',
};
ILARIS.kgtl_choice = kgtl_choice;

// Schnellschuss
let fm_snls_choice = {
    0: 'kein',
    1: '1x',
    2: '2x',
};
ILARIS.fm_snls_choice = fm_snls_choice;

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
};
ILARIS.zere_choice = zere_choice;

let manoever_nahkampf = {
    kbak: {
        selected: false,
    },
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
    kwut: false,
    km_ausw: {
        possible: true,
        selected: false,
    },
    km_bind: {
        possible: true,
        selected: 0,
    },
    km_ever: {
        possible: true,
        selected: false,
    },
    km_entw: {
        possible: true,
        selected_at: false,
        selected_vt: false,
    },
    km_gzsl: {
        possible: true,
        selected: '0',
    },
    km_umre: {
        possible: true,
        selected: false,
    },
    km_wusl: {
        possible: true,
        selected: 0,
    },
    km_aufl: {
        possible: true,
        selected: false,
        gs: 0,
    },
    km_rust: {
        possible: false,
        selected: false,
    },
    km_shsp: {
        possible: true,
        selected: false,
    },
    km_stsl: {
        possible: false,
        selected: false,
    },
    km_umkl: {
        possible: false,
        selected: false,
        mod: 0,
    },
    km_ausf: {
        possible: false,
        selected: false,
    },
    km_befr: {
        possible: false,
        selected: false,
    },
    km_dppl: {
        possible: false,
        selected: false,
    },
    km_hmsl: {
        possible: false,
        selected: false,
    },
    km_kltz: {
        possible: false,
        selected: false,
    },
    km_ndwf: {
        possible: false,
        selected: false,
    },
    km_rpst: {
        possible: false,
        selected: false,
    },
    km_shwl: {
        possible: false,
        selected: false,
    },
    km_stag: {
        possible: false,
        selected: false,
        gs: 0,
    },
    km_tdst: {
        possible: false,
        selected: false,
    },
    km_uebr: {
        possible: false,
        selected: false,
        gs: 0,
    },
    km_utlf: {
        possible: false,
        selected: false,
    },
    mod: {
        selected: '0',
    },
    rllm: {
        selected: 'roll',
    },
};
ILARIS.manoever_nahkampf = manoever_nahkampf;

let manoever_fernkampf = {
    kbak: {
        selected: false,
    },
    // "vldf": {
    //     "possible": false,
    //     "selected": false
    // },
    gzkl: {
        selected: '2',
    },
    // "umge": {
    //     "selected": "0"
    // },
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
    kwut: false,
    fm_gzss: {
        possible: true,
        selected: '0',
    },
    fm_rwrh: {
        possible: true,
        selected: '0',
    },
    fm_srfs: {
        possible: true,
        selected: '0',
    },
    fm_zlen: {
        possible: true,
        ruhige_hand: false,
        selected: false,
    },
    fm_msts: {
        possible: false,
        selected: false,
    },
    fm_rust: {
        possible: false,
        selected: false,
    },
    fm_snls: {
        possible: false,
        selected: '0',
    },
    mod: {
        selected: '0',
    },
    rllm: {
        selected: 'roll',
    },
};
ILARIS.manoever_fernkampf = manoever_fernkampf;

let manoever_magie = {
    // kombinierte aktion
    kbak: {
        selected: false,
    },
    // mm_mama: 'Mächtige Magie',
    mm_mama: {
        possible: true,
        selected: '0',
    },
    // mm_mezi: 'Mehrere Ziele',
    mm_mezi: {
        possible: true,
        selected: false,
    },
    // mm_rwrh: 'Reichweite erhöhen',
    mm_rwrh: {
        possible: true,
        selected: '0',
    },
    // mm_vbvk: 'Vorbereitung verkürzen',
    mm_vbvk: {
        possible: true,
        selected: '0',
    },
    // mm_wkvl: 'Wirkungsdauer verlängern',
    mm_wkvl: {
        possible: true,
        selected: '0',
    },
    // mm_ztig: 'Zaubertechnik ignorieren',
    mm_ztig: {
        possible: true,
        selected: '0',
    },
    // mm_erzw: 'Erzwingen',
    mm_erzw: {
        possible: false,
        selected: false,
    },
    // mm_kosp: 'Kosten sparen',
    mm_kosp: {
        possible: false,
        selected: '0',
    },
    // mm_ztls: 'Zeit lassen',
    mm_ztls: {
        possible: false,
        selected: false,
    },
    // mm_zere: 'Zeremonie',
    mm_zere: {
        possible: false,
        selected: '0',
    },
    // mm_opfe: 'Opferung',
    mm_opfe: {
        possible: false,
        selected: false,
    },
    // modifikator
    mod: {
        selected: '0',
    },
    // rollmode
    rllm: {
        selected: 'roll',
    }
};
ILARIS.manoever_magie = manoever_magie;

let manoever_karma = {
    // kombinierta aktion
    kbak: {
        selected: false,
    },
    // lm_mali: 'Mächtige Liturgie',
    lm_mali: {
        possible: true,
        selected: '0',
    },
    // lm_mezi: 'Mehrere Ziele',
    lm_mezi: {
        possible: true,
        selected: false,
    },
    // lm_ltig: 'Liturgische Technik ignorieren',
    lm_ltig: {
        possible: true,
        selected: '0',
    },
    // lm_rwrh: 'Reichweite erhöhen',
    lm_rwrh: {
        possible: true,
        selected: '0',
    },
    // lm_vbvk: 'Vorbereitung verkürzen',
    lm_vbvk: {
        possible: true,
        selected: '0',
    },
    // lm_wkvl: 'Wirkungsdauer verlängern',
    lm_wkvl: {
        possible: true,
        selected: '0',
    },
    // lm_kosp: 'Kosten sparen',
    lm_kosp: {
        possible: false,
        selected: '0',
    },
    // lm_zere: 'Zeremonie',
    lm_zere: {
        possible: false,
        selected: '0',
    },
    // lm_opfe: 'Opferung',
    lm_opfe: {
        possible: false,
        selected: false,
    },
    // modifikator
    mod: {
        selected: '0',
    },
    // rollmode
    rllm: {
        selected: 'roll',
    },
};
ILARIS.manoever_karma = manoever_karma;
