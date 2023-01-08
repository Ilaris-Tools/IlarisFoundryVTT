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
        if (!data.data.modifikatoren) {
            data.data.modifikatoren = {}
        }
        if (!data.data.modifikatoren.manuellermod) {
            data.data.modifikatoren.manuellermod = 0;
        }
        if (!data.data.modifikatoren.nahkampfmod) {
            data.data.modifikatoren.nahkampfmod = 0;
        }
        this._sortItems(data);
        this._calculateWounds(data);
        this._calculateFear(data);
        this._calculateModifikatoren(data);
        this._calculateUebernatuerlichProbendiag(data);
        this._calculateUebernaturlichTalente(data);
        data.data.initiative = data.data.kampfwerte.ini;
    }

}