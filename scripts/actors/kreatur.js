import { IlarisActor } from "./actor.js";

export class KreaturActor extends IlarisActor {

    async _preCreate(data, options, user) {
        mergeObject(data, {
            'token.bar1': { attribute: 'gesundheit.hp' },
            'token.displayName': CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
            'token.displayBars': CONST.TOKEN_DISPLAY_MODES.ALWAYS,
            'token.disposition': CONST.TOKEN_DISPOSITIONS.FRIENDLY,
            'token.name': data.name
        });
        data.token.disposition = CONST.TOKEN_DISPOSITIONS.NEUTRAL;
        if (!data.img) {
            data.img = 'systems/Ilaris/assets/images/token/kreaturentypen/tier.png';
        }
        await super._preCreate(data, options, user);  // IlarisActor._preCreate() -> Actor._preCreate()
    }

    prepareData() {
        super.prepareData();
        this._initializeActor();
    }

    _initializeActor() {
        // TODO: wird das irgendwo anders gebraucht? sonst kann das auch direkt teil der prepareData() sein
        let data = this.data;
        if (!this.system.modifikatoren) {
            this.system.modifikatoren = {}
        }
        if (!this.system.modifikatoren.manuellermod) {
            this.system.modifikatoren.manuellermod = 0;
        }
        if (!this.system.modifikatoren.nahkampfmod) {
            this.system.modifikatoren.nahkampfmod = 0;
        }
        this._sortItems(this);
        this._calculateWounds(this.system);
        this._calculateFear(this.system);
        this._calculateModifikatoren(this.system);
        this._calculateUebernatuerlichProbendiag(this);
        this._calculateUebernaturlichTalente(this);
        this._setManoever();
        this.system.initiative = this.system.kampfwerte.ini;
    }

    _setManoever() {
        console.log("Setze Manöver")
        console.log(this);
        for (let angriff of this.angriffe) {
            console.log("Angriff:");
            console.log(angriff);   
            angriff.system.manoever = 
                angriff.system.manoever || 
                foundry.utils.deepClone(CONFIG.ILARIS.manoever_nahkampf);
            console.log(angriff);   
        }
    }

}