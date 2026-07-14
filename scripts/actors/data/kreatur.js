import { IlarisActor } from './actor.js'
import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
} from '../../settings/configure-game-settings.model.js'

export class KreaturActor extends IlarisActor {
    async _preCreate(data, options, user) {
        // Prototype token defaults are set in IlarisActor.createDocuments()
        // which runs before document construction (PF2e pattern).
        await super._preCreate(data, options, user)
    }

    prepareData() {
        super.prepareData()
        this._initializeActor()
    }

    _initializeActor() {
        // TODO: wird das irgendwo anders gebraucht? sonst kann das auch direkt teil der prepareData() sein
        if (!this.system.modifikatoren) {
            this.system.modifikatoren = {}
        }
        if (!this.system.modifikatoren.manuellermod) {
            this.system.modifikatoren.manuellermod = 0
        }
        if (!this.system.modifikatoren.nahkampfmod) {
            this.system.modifikatoren.nahkampfmod = 0
        }
        if (!this.system.modifikatoren.verteidigungmod) {
            this.system.modifikatoren.verteidigungmod = 0
        }
        const useLepSystem = game.settings.get(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.lepSystem,
        )

        if (useLepSystem) {
            this.system.gesundheit.hp.max = this.system.kampfwerte.ws
            this.system.gesundheit.hp.value = this.system.kampfwerte.ws
        }
        this._sortItems(this)
        this._calculateWounds(this.system)
        this._calculateFear(this.system)
        this._calculateModifikatoren(this.system)
        this._calculateUebernatuerlichProbendiag(this)
        this._calculateUebernaturlichTalente(this)
        this._setManoever()
        this.system.initiative = this.system.kampfwerte.ini
    }

    _setManoever() {
        console.log('Setze Manöver')
        console.log(this)
        for (let angriff of this.angriffe) {
            console.log('Angriff:')
            console.log(angriff)
            angriff.system.manoever =
                angriff.system.manoever || foundry.utils.deepClone(CONFIG.ILARIS.manoever_nahkampf)
            console.log(angriff)
        }
    }
}
