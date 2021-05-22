export const ILARIS = {};


ILARIS.label = {
    // Attribute
    "KO": "Konstitution",
    "MU": "Mut",
    "GE": "Gewandheit",
    "KK": "Körperkraft",
    "IN": "Intuition",
    "KL": "Klugheit",
    "CH": "Charisma",
    "FF": "Fingerfertigkeit",
    // Waffeneigenschaften
    "kein_malus_nebenwaffe": "Kein Malus als Nebenwaffe",
    "kein_reiter": "Nicht für Reiter",
    "kopflastig": "Kopflastig",
    "niederwerfen": "Niederwerfen",
    "niederwerfen_4": "Niederwerfen (-4)",
    "niederwerfen_8": "Niederwerfen (-8)",
    "parierwaffe": "Parierwaffe",
    "reittier": "Reittier",
    "ruestungsbrechend": "Rüstungsbrechend",
    "schild": "Schild",
    "schwer_4": "Schwer (4)",
    "schwer_8": "Schwer (8)",
    "stationaer": "Stationär",
    "stumpf": "Stumpf",
    "umklammern_212": "Umklammern (-2,12)",
    "umklammern_416": "Umklammern (-4,16)",
    "umklammern_816": "Umklammern (-8,16)",
    "unberechenbar": "Unberechenbar",
    "unzerstoerbar": "Unzerstörbar",
    "wendig": "Wendig",
    "zerbrechlich": "Zerbrechlich",
    "zweihaendig": "Zweihändig",
    "erschoepfung": "Erschöpfung",
    // Kampfstile
    "ohne": "Kein Kampfstil",
    "bhk": "Beidhändiger Kampf",
    "kvk": "Kraftvoller Kampf",
    "pwk": "Parierwaffenkampf",
    "rtk": "Reiterkampf",
    "shk": "Schildkampf",
    "snk": "Schneller Kampf",
    // kampfmanoever
    "km_ausw": "Ausweichen",
    "km_bind": "Binden",
    "km_ever": "Entfernung verändern",
    "km_entw": "Entwaffnen",
    "km_gzsl": "Gezielter Schlag",
    "km_umre": "Umreißen",
    "km_wusl": "Wuchtschlag",
    "km_aufl": "Auflaufen lassen",
    "km_rust": "Rüstungsbrecher",
    "km_shsp": "Schildspalter",
    "km_stsl": "Stumpfer Schlag",
    "km_umkl": "Umklammern",
    "km_ausf": "Ausfall",
    "km_befr": "Befreiungsschlag",
    "km_dppl": "Doppelangriff",
    "km_hmsl": "Hammerschlag",
    "km_kltz": "Klingentanz",
    "km_ndwf": "Niederwerfen",
    "km_rpst": "Riposte",
    "km_shwl": "Schildwall",
    "km_stag": "Sturmangriff",
    "km_tdst": "Todesstoß",
    "km_uebr": "Überrennen",
    "km_utlf": "Unterlaufen",
};

ILARIS.trefferzonen = {
    "0": "keine",
    "1": "Beine",
    "2": "Schildarm",
    "3": "Schwertarm",
    "4": "Bauch",
    "5": "Brust",
    "6": "Kopf",
    "7": "andere",
};


// Manoever: {
//     "name": {
//         "possible": false,
//         "selected": false,
//     },
// }

ILARIS.manoever_nahkampf = {
    "kbak": {
        "selected": false
    },
    "vlof": {
        "selected": false
    },
    "vldf": {
        "selected": false
    },
    "rwdf": {
        "selected": "0"
    },
    "rkaz": {
        "selected": 0
    },
    "km_ausw": {
        "possible": true,
        "selected": false,
    },
    "km_bind": {
        "possible": true,
        "selected": 0,
    },
    "km_ever": {
        "possible": true,
        "selected": false,
    },
    "km_entw": {
        "possible": true,
        "selected_at": false,
        "selected_vt": false,
    },
    "km_gzsl": {
        "possible": true,
        "selected": false,
    },
    "km_umre": {
        "possible": true,
        "selected": false,
    },
    "km_wusl": {
        "possible": true,
        "selected": 0,
    },
    "km_aufl": {
        "possible": false,
        "selected": false,
    },
    "km_rust": {
        "possible": false,
        "selected": false,
    },
    "km_shsp": {
        "possible": false,
        "selected": false,
    },
    "km_stsl": {
        "possible": false,
        "selected": false,
    },
    "km_umkl": {
        "possible": false,
        "selected": 0,
    },
    "km_ausf": {
        "possible": false,
        "selected": false,
    },
    "km_befr": {
        "possible": false,
        "selected": false,
    },
    "km_dppl": {
        "possible": false,
        "selected": false,
    },
    "km_hmsl": {
        "possible": false,
        "selected": false,
    },
    "km_kltz": {
        "possible": false,
        "selected": false,
    },
    "km_ndwf": {
        "possible": false,
        "selected": false,
    },
    "km_rpst": {
        "possible": false,
        "selected": false,
    },
    "km_shwl": {
        "possible": false,
        "selected": false,
    },
    "km_stag": {
        "possible": false,
        "selected": false,
        "gs": 0,
    },
    "km_tdst": {
        "possible": false,
        "selected": false,
    },
    "km_uebr": {
        "possible": false,
        "selected": false,
        "gs": 0,
    },
    "km_utlf": {
        "possible": false,
        "selected": false,
    }
}











// Manoever: {
//     "name": {
//         "possible": true,         //vss für das manöver erfüllt?
//         "selected": false,        //Manöver ausgewählt (im Dialog)
//         "auto": false,            //Automatisches Manöver durch Waffeneigenschaft? zB Niederwerfen
//         "mod_choosable": false,   // Selbst wählbarer Modifikator? zB Wuchtschlag
//         "mod_choosable_max": 0,   // Begrenzung des selbstgewählten Zuschlags?
//         "mod_be": true,           // Wird BE als Erschwernis eingerechnet?
//         "mod_chosen": 0,          // Selbst gewählte Erschwernis (im Dialog)
//         "mod_hardcoded": 0,       // Feste Schwierigkeit des Manövers
//         "schaden": 0,             // Schadensänderung: "-": kein Schaden, nicht kombinierbar mit anderen "-" Manövern
//     }
// }

// ILARIS.manoever_at = {
//     "km_ever": {
//         "possible": true,
//         "selected": false,
//         "auto": false,
//         "mod_choosable": false,
//         "mod_be": true,
//         "mod_chosen": 0,
//         "mod_hardcoded": 0,
//         "schaden": 0,
//     },
//     "km_entw": {
//         "possible": true,
//         "selected": false,
//         "auto": false,
//         "mod_choosable": false,
//         "mod_be": false,
//         "mod_chosen": 0,
//         "mod_hardcoded": -4,
//         "schaden": "-",
//     },
//     "km_gzsl": {
//         "possible": true,
//         "selected": false,
//         "auto": false,
//         "mod_choosable": false,
//         "mod_be": false,
//         "mod_chosen": 0,
//         "mod_hardcoded": -2,
//         "schaden": 0,
//     },
//     "km_umre": {
//         "possible": true,
//         "selected": false,
//         "auto": false,
//         "mod_choosable": false,
//         "mod_be": false,
//         "mod_chosen": 0,
//         "mod_hardcoded": 0,
//         "schaden": "-",
//     },
//     "km_wusl": {
//         "possible": true,
//         "selected": false,
//         "auto": false,
//         "mod_choosable": true,
//         "mod_be": false,
//         "mod_chosen": 0,
//         "mod_hardcoded": 0,
//         "schaden": "@mod_chosen",
//     },
//     "km_rust": {
//         "possible": false,
//         "selected": false,
//         "auto": false,
//         "mod_choosable": false,
//         "mod_be": false,
//         "mod_chosen": 0,
//         "mod_hardcoded": -4,
//         "schaden": 0,
//     },
//     "km_shsp": {
//         "possible": true,
//         "selected": false,
//         "auto": false,
//         "mod_choosable": false,
//         "mod_be": false,
//         "mod_chosen": 0,
//         "mod_hardcoded": +2,
//         "schaden": 0,
//     },
//     "km_stsl": {
//         "possible": true,
//         "selected": false,
//         "auto": false,
//         "mod_choosable": false,
//         "mod_be": false,
//         "mod_chosen": 0,
//         "mod_hardcoded": +2,
//         "schaden": 0,
//     },
//     "km_umkl": {
//         "possible": false,
//         "selected": false,
//         "auto": false,
//         "mod_choosable": true,
//         "mod_be": false,
//         "mod_chosen": 0,
//         "mod_hardcoded": 0,
//         "schaden": "-",
//     },
//     "km_ausf": {
//         "possible": false,
//         "selected": false,
//         "auto": false,
//         "mod_choosable": false,
//         "mod_be": true,
//         "mod_chosen": 0,
//         "mod_hardcoded": -2,
//         "schaden": 0,
//     },
//     "km_befr": {
//         "possible": false,
//         "selected": false,
//         "auto": false,
//         "mod_choosable": false,
//         "mod_be": false,
//         "mod_chosen": 0,
//         "mod_hardcoded": -4,
//         "schaden": 0,
//     },
//     "km_dppl": {
//         "possible": false,
//         "selected": false,
//         "auto": false,
//         "mod_choosable": false,
//         "mod_be": false,
//         "mod_chosen": 0,
//         "mod_hardcoded": -4,
//         "schaden": 0,
//     },
//     "km_hmsl": {
//         "possible": false,
//         "selected": false,
//         "auto": false,
//         "mod_choosable": false,
//         "mod_be": false,
//         "mod_chosen": 0,
//         "mod_hardcoded": -8,
//         "schaden": "x2",
//     },
//     "km_kltz": {
//         "possible": false,
//         "selected": false,
//         "auto": false,
//         "mod_choosable": false,
//         "mod_be": false,
//         "mod_chosen": 0,
//         "mod_hardcoded": -4,
//         "schaden": 0,
//     },
//     "km_ndwf": {
//         "possible": false,
//         "selected": false,
//         "auto": false,
//         "mod_choosable": false,
//         "mod_be": false,
//         "mod_chosen": 0,
//         "mod_hardcoded": -4,
//         "schaden": 0,
//     },
//     "km_stag": {
//         "possible": false,
//         "selected": false,
//         "auto": false,
//         "mod_choosable": false,
//         "mod_be": false,
//         "mod_chosen": 0,
//         "mod_hardcoded": 0,
//         "schaden": "@target.gs",
//     },
//     "km_tdst": {
//         "possible": false,
//         "selected": false,
//         "auto": false,
//         "mod_choosable": false,
//         "mod_be": false,
//         "mod_chosen": 0,
//         "mod_hardcoded": -8,
//         "schaden": 0,
//     },
//     "km_uebr": {
//         "possible": false,
//         "selected": false,
//         "auto": false,
//         "mod_choosable": false,
//         "mod_be": false,
//         "mod_chosen": 0,
//         "mod_hardcoded": 0,
//         "schaden": "gs",
//     },
// };
