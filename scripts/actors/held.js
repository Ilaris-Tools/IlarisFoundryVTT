import { IlarisActor } from "./actor.js";

export class HeldActor extends IlarisActor {

    async _preCreate(data, options, user) {
        mergeObject(data, {
            'token.bar1': { attribute: 'gesundheit.hp' },
            'token.displayName': CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
            'token.displayBars': CONST.TOKEN_DISPLAY_MODES.ALWAYS,
            'token.disposition': CONST.TOKEN_DISPOSITIONS.FRIENDLY,
            'token.name': data.name
        });
        data.img = 'systems/Ilaris/assets/images/token/kreaturentypen/humanoid.png';
        data.token.vision = true;
        data.token.actorLink = true;
        data.token.brightSight = 15;
        data.token.dimSight = 5;
        await super._preCreate(data, options, user);  // IlarisActor._preCreate() -> Actor._preCreate()
    }
    
    prepareData() {  // sieht jetzt gleich aus, kann in actor.js?
        super.prepareData();
        this._initializeActor();  // TODO: warum wird data überall durchgegeben, ist doch sowieso instanziert??
    }

    _initializeActor() {
        // NOTE: sieht aus als wäre _initialize eine methode von Actor, 
        // die man nicht einfach überschreiben sollte
        // daher umbenannt in initialiseActor
        let data = this.data;
        this._sortItems(data); //Als erstes, darauf basieren Berechnungen
        this._calculatePWAttribute(data);
        this._calculateWounds(data); // muss vor _calculateAbgeleitete kommen (wegen globalermod)
        this._calculateFear(data); // muss vor _calculateAbgeleitete kommen (wegen globalermod)
        this._calculateWundschwellenRuestung(data);
        this._calculateModifikatoren(data);
        this._calculateAbgeleitete(data);
        this._calculateProfanFertigkeiten(data);
        this._calculateUebernaturlichFertigkeiten(data);
        this._calculateUebernaturlichTalente(data); //Nach Uebernatürliche Fertigkeiten
        this._calculateKampf(data);
        this._calculateUebernatuerlichProbendiag(data);
    }
}