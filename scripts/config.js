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
    "fm_gzss": "Gezielter Schuss",
    "fm_rwrh": "Reichweite erhöhen",
    "fm_srfs": "Scharfschuss",
    "fm_zlen": "Zielen",
    "fm_msts": "Meisterschuss",
    "fm_rust": "Rüstungsbrecher",
    "fm_snls": "Schnellschuss",
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
    "pssl": {
        "selected": false
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
        "selected": "0",
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
        "possible": true,
        "selected": false,
        "gs": 0
    },
    "km_rust": {
        "possible": false,
        "selected": false,
    },
    "km_shsp": {
        "possible": true,
        "selected": false,
    },
    "km_stsl": {
        "possible": false,
        "selected": false,
    },
    "km_umkl": {
        "possible": false,
        "selected": false,
        "mod": 0
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
    },
    "mod": {
        "selected": "0",
    },
    "rllm": {
        "selected": "roll",
    }
};

ILARIS.manoever_fernkampf = {
    "kbak": {
        "selected": false
    },
    "vldf": {
        "possible": false,
        "selected": false
    },
    "gzkl": {
        "selected": "0"
    },
    "umge": {
        "selected": "0"
    },
    "bwng": {
        "selected": "0"
    },
    "lcht": {
        "selected": "0"
    },
    "wttr": {
        "selected": "0"
    },
    "dckg": {
        "selected": "0"
    },
    "kgtl": {
        "selected": "0"
    },
    "brtn": {
        "selected": false,
        "rtk": false
    },
    "rflx": false,
    "rw": {
        "0": "1 Schritt",
        "1": "2 Schritt",
        "2": "3 Schritt",
    },
    "fm_gzss": {
        "possible": true,
        "selected": "0",
    },
    "fm_rwrh": {
        "possible": true,
        "seleted": "0",
    },
    "fm_srfs": {
        "possible": true,
        "selected": false,
    },
    "fm_zlen": {
        "possible": true,
        "ruhige_hand": false,
        "selected": false,
    },
    "fm_msts": {
        "possible": false,
        "selected": false,
    },
    "fm_rust": {
        "possible": false,
        "selected": false,
    },
    "fm_snls": {
        "possible": false,
        "selected": "0",
    },
    "mod": {
        "selected": "0",
    },
    "rllm": {
        "selected": "roll",
    }
};
