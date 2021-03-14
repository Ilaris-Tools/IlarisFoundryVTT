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

}