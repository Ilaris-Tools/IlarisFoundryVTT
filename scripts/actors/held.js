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
        console.log("init")
        console.log(this)
        this._sortItems(this); //Als erstes, darauf basieren Berechnungen
        this._calculatePWAttribute(this.system);
        this._calculateWounds(this.system); // muss vor _calculateAbgeleitete kommen (wegen globalermod)
        this._calculateFear(this.system); // muss vor _calculateAbgeleitete kommen (wegen globalermod)
        this._calculateWundschwellenRuestung(this);
        this._calculateModifikatoren(this.system);
        this._calculateAbgeleitete(this);
        this._calculateProfanFertigkeiten(this);
        this._calculateUebernaturlichFertigkeiten(this);
        this._calculateUebernaturlichTalente(this); //Nach Uebernatürliche Fertigkeiten
        this._calculateKampf(this);
        this._calculateUebernatuerlichProbendiag(this);
    }
}