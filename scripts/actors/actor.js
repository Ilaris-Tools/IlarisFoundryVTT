export class IlarisActor extends Actor {

    prepareData() {
        super.prepareData();
        if (this.data.type === "held") {
            this._initializeHeld(this.data);
        }
    }

    _initializeHeld(data) {
        this._sortItems(data);
        this._calculatePWAttribute(data);
        this._calculateWerteFertigkeiten(data);
        this._calculateWounds(data);
        this._calculateWundschwellenRuestung(data);
    }

    _calculatePWAttribute(data) {
        for (let attribut of Object.values(data.data.attribute)) {
            attribut.pw = 2 * attribut.wert;
        }
    }

    _calculateWerteFertigkeiten(data) {
        for (let fertigkeit of Object.values(data.data.fertigkeiten)) {
            let basiswert = 0;
            for (const attribut of fertigkeit.attribute) {
                basiswert = basiswert + Number(data.data.attribute[attribut].wert);
            }
            basiswert = Math.round(basiswert/3);
            fertigkeit.basis = basiswert;
            fertigkeit.pw = basiswert + Math.round(Number(fertigkeit.fw)*0.5);
            fertigkeit.pwt = basiswert + Number(fertigkeit.fw);
        }
    }

    _calculateWounds(data) {
        console.log(data.data);
        console.log(data.data.gesundheit.wunden.wert);
        console.log(data.data.gesundheit.erschoepfung.wert);
        let einschraenkungen = data.data.gesundheit.wunden.wert + data.data.gesundheit.erschoepfung.wert;
        let abzuege = 0;
        if (einschraenkungen == 0) {
            data.data.gesundheit.wundabzuege = 0;
            data.data.gesundheit.display = "Volle Gesundheit";
        }
        else if (einschraenkungen > 0 && einschraenkungen <= 2) {
            data.data.gesundheit.wundabzuege = 0;
            data.data.gesundheit.display = "Keine Abzüge";
        }
        else if (einschraenkungen >= 3 && einschraenkungen <= 4) {
            abzuege = -(einschraenkungen - 2) * 2;
            data.data.gesundheit.wundabzuege = abzuege;
            data.data.gesundheit.display = `${abzuege} auf alle Proben`;
        }
        else if (einschraenkungen >= 5 && einschraenkungen <= 8) {
            abzuege = -(einschraenkungen - 2) * 2;
            data.data.gesundheit.wundabzuege = abzuege;
            data.data.gesundheit.display = `${abzuege} auf alle Proben (Kampfunfähig)`;
        }
        else if (einschraenkungen >= 9) {
            abzuege = -(einschraenkungen - 2) * 2;
            data.data.gesundheit.wundabzuege = abzuege;
            data.data.gesundheit.display = 'Tod';
        }
        else {
            data.data.gesundheit.display = 'Irgendetwas ist schief gelaufen';
        }
    }

    _calculateWundschwellenRuestung(data){
        let ws = 4 + Math.floor(data.data.attribute.KO.wert / 4);
        data.data.abgeleitete.ws = ws;
        data.data.abgeleitete.ws_stern = ws;
        data.data.abgeleitete.be = 0;
        data.data.abgeleitete.ws_beine = ws;
        data.data.abgeleitete.ws_larm = ws;
        data.data.abgeleitete.ws_rarm = ws;
        data.data.abgeleitete.ws_bauch = ws;
        data.data.abgeleitete.ws_brust = ws;
        data.data.abgeleitete.ws_kopf = ws;
        for (let ruestung of data.ruestungen){
            console.log(ruestung.data.aktiv);
            if (ruestung.data.aktiv == true){
                data.data.abgeleitete.ws_stern += ruestung.data.rs;
                data.data.abgeleitete.be += ruestung.data.be;
                data.data.abgeleitete.ws_beine += ruestung.data.rs_beine;
                data.data.abgeleitete.ws_larm += ruestung.data.rs_larm;
                data.data.abgeleitete.ws_rarm += ruestung.data.rs_rarm;
                data.data.abgeleitete.ws_bauch += ruestung.data.rs_bauch;
                data.data.abgeleitete.ws_brust += ruestung.data.rs_brust;
                data.data.abgeleitete.ws_kopf += ruestung.data.rs_kopf;
            }
        }
    }

    _sortItems(data){
        console.log("In sort_Items");
        console.log(data);
        let ruestungen = [];
        for (let i of data.items) {
            let item = i.data;
            if (i.type == "ruestung"){
                console.log("Rüstung gefunden");
                console.log(i);
                ruestungen.push(i);
            }
        }
        data.ruestungen = ruestungen;
        console.log(data);
            // let item = i.data;
            // i.img = i.img || DEFAULT_TOKEN;
            // // Append to gear.
            // if (i.type === 'item') {
            //     gear.push(i);
            // }
            // // Append to features.
            // else if (i.type === 'feature') {
            //     features.push(i);
            // }
            // // Append to spells.
            // else if (i.type === 'spell') {
            //     if (i.data.spellLevel != undefined) {
            //         spells[i.data.spellLevel].push(i);
            //     }
            // }
        // Assign and return
        // actorData.gear = gear;
        // actorData.features = features;
        // actorData.spells = spells;
        }

}
