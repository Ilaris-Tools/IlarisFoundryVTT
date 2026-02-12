import { IlarisItem } from './item.js'
import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
    IlarisAutomatisierungSettingNames,
} from './../settings/configure-game-settings.model.js'
import { ILARIS, MANOEVER_GRUPPE } from '../config.js'

export class CombatItem extends IlarisItem {
    // Create a maneuver object from an item
    _createManeuverFromItem(item) {
        return {
            ...item,
            id: item._id,
            inputValue: {
                ...item.system.input,
                value: '',
            },
        }
    }

    // Parse modifikationen string and create dynamic maneuvers
    // Format: NAME (ERSCHWERNIS,ZIEL,WIRKUNGSDAUER,KOSTEN,PKOSTEN;BESCHREIBUNG)
    _parseModifikationen(modifikationenString) {
        if (!modifikationenString || typeof modifikationenString !== 'string') {
            return []
        }

        const maneuvers = []
        // Split by pattern: ) followed by capital letter (start of new modification)
        // Use lookbehind to keep the closing parenthesis
        const modifications = modifikationenString
            .split(/(?<=\))\s*(?=[A-Z\u00C0-\u00FF])/)
            .map((mod) => mod.trim())
            .filter((mod) => mod.length > 0)

        modifications.forEach((modString, index) => {
            // Match pattern: NAME (PARAMS;DESCRIPTION) or NAME (PARAMS)
            const match = modString.match(/^(.+?)\s*\(([^)]+)\)$/)
            if (!match) return

            const [, name, content] = match

            // Split content by semicolon to separate parameters from description
            const parts = content.split(';')
            const params = parts[0].trim()
            const description = parts.length > 1 ? parts.slice(1).join(';').trim() : ''
            // Split parameters by comma
            const paramParts = params.split(',').map((p) => p.trim())

            // Parse parameters in order: ERSCHWERNIS, ZIEL, WIRKUNGSDAUER, KOSTEN, PKOSTEN
            let erschwernis = 0
            let ziel = ''
            let wirkungsdauer = ''
            let kosten = ''
            let pkosten = ''
            const nonErschwernisParams = []

            paramParts.forEach((param, index) => {
                if (!param || param === '') return

                // Try to identify parameter by pattern first, then fall back to position
                if (param.match(/^[+\-–—]?\d+$/)) {
                    // Difficulty modifier (ERSCHWERNIS) - accepts +, -, en dash (–), em dash (—)
                    erschwernis = parseInt(param.replace(/[–—]/g, '-'))
                } else if (param.match(/^\d+\s*g(AsP|KaP|Energie|Eng)$/i)) {
                    // Permanent resource cost (PKOSTEN)
                    pkosten = param
                    nonErschwernisParams.push(param)
                } else if (param.match(/^\d+\s*(AsP|KaP|Energie|Eng)$/i)) {
                    // Resource cost (KOSTEN)
                    kosten = param
                    nonErschwernisParams.push(param)
                } else if (param.toLowerCase().includes('wirkungsdauer')) {
                    // Duration (WIRKUNGSDAUER)
                    wirkungsdauer = param
                    nonErschwernisParams.push(param)
                } else if (
                    param.match(
                        /^(einzelziel|einzelobjekt|zone|einzelperson|selbst|berührung|bereich)/i,
                    )
                ) {
                    // Target (ZIEL)
                    ziel = param
                    nonErschwernisParams.push(param)
                } else {
                    // Other parameters that aren't erschwernis
                    nonErschwernisParams.push(param)
                }
            })

            // Reconstruct content without erschwernis for text display
            const contentWithoutErschwernis =
                nonErschwernisParams.length > 0
                    ? nonErschwernisParams.join(', ') + (description ? ';' + description : '')
                    : description

            // Determine input field type based on description
            const isMehrfachWaehlbar = description.toLowerCase().includes('mehrfach wählbar')
            const fieldType = isMehrfachWaehlbar ? 'NUMBER' : 'CHECKBOX'
            const defaultValue = isMehrfachWaehlbar ? null : false

            // Create the maneuver object
            const maneuver = {
                name: name.trim(),
                id: 'mod' + index,
                type: 'manoever',
                system: {
                    gruppe:
                        this.type === 'zauber'
                            ? MANOEVER_GRUPPE.ZAUBER
                            : this.type === 'liturgie'
                              ? MANOEVER_GRUPPE.LITURGIE
                              : MANOEVER_GRUPPE.ANRUFUNG,
                    probe: erschwernis,
                    text: contentWithoutErschwernis || name.trim(),
                    modifications: {},
                    input: {
                        field: fieldType,
                        name: name.trim(),
                    },
                    // Store parsed modification data for potential UI display
                    modificationData: {
                        erschwernis,
                        ziel,
                        wirkungsdauer,
                        kosten,
                        pkosten,
                        beschreibung: description || '',
                    },
                },
                inputValue: {
                    field: fieldType,
                    value: defaultValue,
                    name: name.trim(),
                },
                _manoeverRequirementsFulfilled: () => true, // Modifications are always available
            }

            let modIndex = 0

            // Add difficulty modification if specified
            if (erschwernis !== 0) {
                maneuver.system.modifications[modIndex++] = {
                    type: 'ATTACK',
                    value: erschwernis,
                    operator: 'ADD',
                    target: '',
                    affectedByInput: isMehrfachWaehlbar,
                }
            }

            // Add energy cost modification if specified
            if (kosten) {
                const costMatch = kosten.match(/(\d+)\s*(AsP|KaP)/i)
                if (costMatch) {
                    const [, amount] = costMatch
                    maneuver.system.modifications[modIndex++] = {
                        type: 'SPECIAL_RESOURCE',
                        value: parseInt(amount),
                        operator: 'SET', // Set the cost to this value
                        target: '',
                        affectedByInput: false,
                    }
                }
            }

            // Add permanent cost information as special text if specified
            if (pkosten) {
                maneuver.system.modifications[modIndex++] = {
                    type: 'SPECIAL_TEXT',
                    value: `Permanente Kosten: ${pkosten}`,
                    operator: 'ADD',
                    target: '',
                    affectedByInput: false,
                }
            }

            // Add target modification text if specified
            if (ziel) {
                maneuver.system.modifications[modIndex++] = {
                    type: 'SPECIAL_TEXT',
                    value: `Ziel: ${ziel}`,
                    operator: 'ADD',
                    target: '',
                    affectedByInput: false,
                }
            }

            // Add duration modification text if specified
            if (wirkungsdauer) {
                maneuver.system.modifications[modIndex++] = {
                    type: 'SPECIAL_TEXT',
                    value: wirkungsdauer,
                    operator: 'ADD',
                    target: '',
                    affectedByInput: false,
                }
            }

            maneuvers.push(maneuver)
        })

        return maneuvers
    }

    /**
     * Apply scene environment settings to the item's manoevers if available
     * Only applies scene-specific settings: light and weather
     * Target-specific settings (movement, cover, melee, size) remain at their defaults
     * @private
     */
    _applySceneEnvironment() {
        // Check if the feature is enabled in world settings
        const useSceneEnvironment = game.settings.get(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisAutomatisierungSettingNames.useSceneEnvironment,
        )
        if (!useSceneEnvironment) return

        const scene = game.scenes.viewed
        if (!scene) return

        const environment = scene.getFlag('Ilaris', 'sceneConditions')
        if (!environment) return

        // Apply only scene-specific environment settings (light and weather)
        if (this.system.manoever.lcht !== undefined && environment.lcht !== undefined) {
            this.system.manoever.lcht.selected = String(environment.lcht)
        }
        if (this.system.manoever.wttr !== undefined && environment.wttr !== undefined) {
            this.system.manoever.wttr.selected = String(environment.wttr)
        }
        // Note: Movement (bwng), Cover (dckg), Melee (kgtl), and Size (gzkl) are target-specific
        // and should be set per-combat, not per-scene
    }

    async setManoevers() {
        // TODO: this needs to be changed sooner than later, system is not the right place for this
        console.log('Setting maneuvers for item:', this.name)
        this.system.manoever = {
            kbak: { selected: false },
            mod: { selected: false },
            rllm: { selected: game.settings.get('core', 'rollMode') },
        }

        // Get selected maneuver packs from settings
        const selectedPacks = JSON.parse(
            game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.manoeverPacks,
            ),
        )

        // Get maneuvers from selected packs
        const packItems = []
        for await (const packId of selectedPacks) {
            const pack = game.packs.get(packId)
            if (pack) {
                packItems.push(...(await pack.getDocuments()))
            }
        }

        this.manoever = []
        if (
            'nahkampfwaffe' === this.type ||
            ('angriff' === this.type && this.system.typ === 'Nah')
        ) {
            this.system.manoever = ILARIS.manoever_nahkampf

            // Apply scene environment settings if available
            this._applySceneEnvironment()

            this.manoever = []
            packItems.forEach((item) => {
                if (
                    item.type === 'manoever' &&
                    (item.system.gruppe == MANOEVER_GRUPPE.NAHKAMPF ||
                        item.system.gruppe == MANOEVER_GRUPPE.VERTEIDIGUNG) &&
                    item._manoeverRequirementsFulfilled(this.actor, this)
                ) {
                    this.manoever.push(this._createManeuverFromItem(item))
                }
            })

            // Sort maneuvers by gruppe (0 before 4) and then by name
            this.manoever.sort((a, b) => {
                // First sort by gruppe
                if (a.system.gruppe !== b.system.gruppe) {
                    return a.system.gruppe - b.system.gruppe
                }
                // Then sort by name
                return a.name.localeCompare(b.name)
            })
        }
        if (
            'fernkampfwaffe' === this.type ||
            ('angriff' === this.type && this.system.typ === 'Fern')
        ) {
            // Add specific properties for fernkampfwaffe or angriff with Fern type
            this.system.manoever = ILARIS.manoever_fernkampf

            // Apply scene environment settings if available
            this._applySceneEnvironment()

            this.manoever = []
            packItems.forEach((item) => {
                if (
                    item.type === 'manoever' &&
                    item.system.gruppe == MANOEVER_GRUPPE.FERNKAMPF &&
                    item._manoeverRequirementsFulfilled(this.actor, this)
                ) {
                    this.manoever.push(this._createManeuverFromItem(item))
                }
            })
        }
        if ('zauber' === this.type) {
            this.system.manoever = ILARIS.manoever_ueber
            this.manoever = []
            packItems.forEach((item) => {
                if (
                    item.type === 'manoever' &&
                    item.system.gruppe == MANOEVER_GRUPPE.ZAUBER &&
                    item._manoeverRequirementsFulfilled(this.actor, this)
                ) {
                    this.manoever.push(this._createManeuverFromItem(item))
                }
            })

            // Parse modifikationen string and add dynamic maneuvers
            const dynamicManeuvers = this._parseModifikationen(this.system.modifikationen)
            this.manoever.push(...dynamicManeuvers)
        }
        if ('liturgie' === this.type) {
            this.system.manoever = ILARIS.manoever_ueber
            this.manoever = []
            packItems.forEach((item) => {
                if (
                    item.type === 'manoever' &&
                    item.system.gruppe == MANOEVER_GRUPPE.LITURGIE &&
                    item._manoeverRequirementsFulfilled(this.actor, this)
                ) {
                    this.manoever.push(this._createManeuverFromItem(item))
                }
            })

            // Parse modifikationen string and add dynamic maneuvers
            const dynamicManeuvers = this._parseModifikationen(this.system.modifikationen)
            this.manoever.push(...dynamicManeuvers)
        }
        if ('anrufung' === this.type) {
            this.system.manoever = ILARIS.manoever_ueber
            this.manoever = []
            // TODO Bug 347 https://github.com/Ilaris-Tools/IlarisFoundryVTT/issues/347
            // packItems.forEach((item) => {
            //     if (
            //         item.type === 'manoever' &&
            //         item.system.gruppe == 4 &&
            //         item._manoeverRequirementsFulfilled(this.actor, this)
            //     ) {
            //         this.manoever.push(this._createManeuverFromItem(item))
            //     }
            // })

            // Parse modifikationen string and add dynamic maneuvers
            const dynamicManeuvers = this._parseModifikationen(this.system.modifikationen)
            this.manoever.push(...dynamicManeuvers)
        }
    }
}
