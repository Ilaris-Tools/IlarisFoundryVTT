export class IlarisActor extends Actor {

    prepareData() {
        super.prepareData();
        if (this.data.type === "held") {
            this._initializeHeld(this.data);
        }
    }

    _initializeHeld(data) {
        this._computePWAttribute(data);
        this._computeWerteFertigkeiten(data);
        this._calculateWounds(data);
    }

    _computePWAttribute(data) {
        for (let attribut of Object.values(data.data.attribute)) {
            attribut.pw = 2 * attribut.wert;
        }
    }

    _computeWerteFertigkeiten(data) {
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

}
