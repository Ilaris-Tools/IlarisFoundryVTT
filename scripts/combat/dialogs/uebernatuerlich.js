import { evaluate_roll_with_crit, postRollToChat } from '../../dice/wuerfel_misc.js'
import { signed } from '../../dice/chatutilities.js'
import { handleModifications } from './shared-dialog-helpers.js'
import { CombatDialog } from './combat-dialog.js'
import * as hardcoded from '../../actors/data/hardcodedvorteile.js'
import { sanitizeEnergyCost, isNumericCost, formatDiceFormula } from '../../core/utilities.js'
import {
    IlarisGameSettingNames,
    IlarisAutomatisierungSettingNames,
    ConfigureGameSettingsCategories,
} from '../../settings/configure-game-settings.model.js'
import { ILARIS } from '../../core/config.js'
import {
    callIlarisHookAllWithGlobalMirror,
    callIlarisHookWithGlobalMirror,
} from '../hooks/global_combat_hooks.js'
import { applyPreEffects } from '../../effects/pre-effects/pre-effects-processor.js'
import { IlarisModifierTarget } from '../../effects/utils/ilaris-modifier-constants.js'
import {
    getIlarisSituationTags as expandIlarisSituationTags,
    getRelevantSupernaturalSituationControls,
} from '../../effects/utils/ilaris-roll-situations.js'
import {
    normalizeSpellModifications,
    resolveSpellModificationContext,
} from '../../items/data/spell-modifications.js'
import { getCasterToken, placeZonePreview } from '../zones/zone-region-adapter.js'
import { resolvePersistentZoneDuration } from '../zones/zone-profile.js'
import {
    createPersistentZone,
    createZoneDraftRegion,
    deleteZoneDraftRegion,
    resolveInstantZoneTargets,
} from '../zones/zone-lifecycle.js'
import { resolveCastSkillContext } from './cast-skill-context.js'
import {
    createMagicResistanceChallenge,
    resolveMagicResistanceTarget,
} from '../magic-resistance.js'
import { handleMagicResistanceRequest } from '../magic-resistance-chat.js'
import {
    resolveDamageExecutorUserId,
    resolveTargetActorForDamage,
} from './shared-dialog-helpers.js'
import {
    getCreatureSourceOptions,
    normalizeCreatureTypes,
} from '../../effects/pre-effects/summoned-creatures.js'

export class UebernatuerlichDialog extends CombatDialog {
    /** @override */
    static DEFAULT_OPTIONS = {
        ...super.DEFAULT_OPTIONS,
        classes: ['uebernatuerlich-dialog'],
        actions: {
            ...super.DEFAULT_OPTIONS.actions,
            energieErfolg: UebernatuerlichDialog.#onEnergieErfolg,
            energieMisserfolg: UebernatuerlichDialog.#onEnergieMisserfolg,
            placeZone: UebernatuerlichDialog.#onPlaceZone,
            requestMagicResistance: UebernatuerlichDialog.#onRequestMagicResistance,
        },
    }

    /** @override */
    static PARTS = {
        settings: {
            template: 'systems/Ilaris/scripts/combat/templates/dialogs/uebernatuerlich.hbs',
        },
        summaries: {
            template: 'systems/Ilaris/scripts/combat/templates/dialogs/summaries.hbs',
        },
    }

    constructor(actor, item, options = {}) {
        super(actor, item, {
            ...options,
            window: { title: `Übernatürliche Fertigkeit: ${item.name}` },
        })

        // Specific properties for supernatural abilities
        this.text_energy = ''
        this.is16OrHigher = false
        // Dialog-session state — never written to the item document
        this.blutmagie = { value: 0 }
        this.verbotene_pforten = { multiplier: 4, activated: false }
        this.set_energy_cost = { value: null }
        this.calculatedWounds = 0
        this.ilarisSituationSelection = []
        this.ilarisSituationControls = { boolean: [], exclusive: [] }
        this.armedInputValues = {}
        this.selectedSpellModificationIds = []
        this.spellModificationContext = resolveSpellModificationContext(this.item, [])
        this.zonePlacement = null
        this.zoneCasterTokenId = ''
        this.zoneRangeBonus = 0
        this.castSkillContext = resolveCastSkillContext(actor, item)
        this.castSkill = this.castSkillContext.castSkill
        this.magicResistanceChallenge = null
        this.summonCreatureSelections = new Map()
    }

    /**
     * @override
     * @param {object} context - Prepared context data
     * @param {object} options - Render options
     */
    async _onRender(context, options) {
        await super._onRender(context, options)

        // Setup modifier display with debounced listeners
        this.setupModifierDisplay()
        this.element.querySelectorAll('.spell-modification').forEach((input) => {
            input.addEventListener('change', async () => {
                await this._discardZoneDraft()
                this._updateSpellModificationSelection()
                await this.render()
                await this.updateModifierDisplay()
            })
        })
        this.element.querySelectorAll('.summon-creature-type').forEach((input) => {
            input.addEventListener('change', () => {
                const index = Number(input.dataset.preEffectIndex)
                const selection = this.summonCreatureSelections.get(index) || {}
                this.summonCreatureSelections.set(index, {
                    ...selection,
                    kreaturentyp: input.value,
                    uuid: '',
                    option: null,
                })
                this.spellModificationContext = null
                this.render()
            })
        })
        this.element.querySelectorAll('.summon-creature-source').forEach((input) => {
            input.addEventListener('change', () => {
                const index = Number(input.dataset.preEffectIndex)
                const selection = this.summonCreatureSelections.get(index) || {}
                this.summonCreatureSelections.set(index, { ...selection, uuid: input.value })
                this.spellModificationContext = null
                this.render()
            })
        })
    }

    /* -------------------------------------------- */
    /*  Action Handlers                             */
    /* -------------------------------------------- */

    /**
     * Handle the "energieErfolg" action button click.
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async #onEnergieErfolg(event, target) {
        await this._energieAbrechnenKlick(true)
    }

    /**
     * Handle the "energieMisserfolg" action button click.
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async #onEnergieMisserfolg(event, target) {
        await this._energieAbrechnenKlick(false)
    }

    static async #onPlaceZone(event, target) {
        await this._placeZone()
    }

    static async #onRequestMagicResistance(event, target) {
        await this._requestMagicResistance()
    }

    /**
     * Returns base values specific to UebernatuerlichDialog
     */
    getBaseValues() {
        return {
            basePW: this.castSkillContext.basePW ?? (this.item.system.pw || 0),
        }
    }

    getResolvedCastSkill() {
        return this.castSkill || ''
    }

    getIlarisFertigkeitContext() {
        return this.getResolvedCastSkill() || super.getIlarisFertigkeitContext()
    }

    /**
     * Override getDiceFormula to handle the special xd20 logic for supernatural abilities.
     */
    getDiceFormula(xd20_choice = null) {
        if (xd20_choice === null) {
            xd20_choice =
                Number(this.element.querySelector('input[name="xd20"]:checked')?.value) || 0
            xd20_choice = xd20_choice == 0 ? 1 : 3
        }
        return super.getDiceFormula(xd20_choice)
    }

    getSummaryContext(baseValues, statusMods, nahkampfMods, diceFormula) {
        const { basePW } = baseValues
        return {
            title: 'Würfelaktionen:',
            isEmpty: false,
            isError: false,
            sections: [
                this.getTalentSummaryContext(basePW, statusMods, nahkampfMods, diceFormula),
                this.getEnergySummaryContext(),
            ],
        }
    }

    /**
     * Creates talent/spell roll summary
     */
    getTalentSummaryContext(basePW, statusMods, nahkampfMods, diceFormula) {
        const maneuverMod = this.mod_at || 0
        const totalMod = maneuverMod + statusMods + nahkampfMods
        const finalPW = basePW + totalMod
        const formattedDice = formatDiceFormula(diceFormula)
        const finalFormula =
            finalPW >= 0 ? `${formattedDice}+${finalPW}` : `${formattedDice}${finalPW}`

        const itemType = this.item.type === 'zauber' ? 'Zauber' : 'Liturgie'
        const icon = this.item.type === 'zauber' ? '🔮' : '✨'

        const difficultyRows = []
        const schwierigkeit = this.getEffectiveSpellProfile().difficulty
        const difficulty = this._getCastingDifficulty()
        if (difficulty !== null) {
            if (this._isAutomaticMagicResistance()) {
                difficultyRows.push({
                    label: 'Magieresistenz',
                    value: `${difficulty}`,
                    cssClass: 'modifier-item base-value',
                })
            } else {
                difficultyRows.push({
                    label: 'Schwierigkeit',
                    value: `${difficulty}`,
                    cssClass: 'modifier-item base-value',
                })
            }
        } else if (schwierigkeit) {
            difficultyRows.push({
                label: 'Schwierigkeit',
                value: `${schwierigkeit}`,
                cssClass: 'modifier-item neutral',
            })
        }

        const maneuverSection = this._buildModifierSectionData(this.text_at, {
            sectionTitle: 'Manöver:',
        })
        const ilarisProbeResult =
            this.ilarisProbeResult || this.getIlarisModifierResult(IlarisModifierTarget.Probe)

        const rollDisabled = this._isRollDisabled()
        return {
            action: rollDisabled ? null : 'angreifen',
            cssClass: `modifier-summary talent-summary ${rollDisabled ? 'zone-roll-disabled' : 'clickable-summary'}`,
            heading: `${icon} ${itemType}: ${finalFormula}`,
            rows: [
                {
                    label: 'Basis PW',
                    value: `${basePW}`,
                    cssClass: 'modifier-item base-value',
                },
                ...difficultyRows,
                this._buildSignedModifierData(statusMods, 'Status (Wunden/Furcht)'),
                this._buildSignedModifierData(nahkampfMods, 'Token Status'),
                ...this.getIlarisModifierRows(ilarisProbeResult),
            ].filter((row) => row),
            sections: maneuverSection ? [maneuverSection] : [],
            totalRow: this._buildTotalModifierData(totalMod),
            suppression: this.getIlarisSuppressionContext(ilarisProbeResult),
            showDivider: Boolean(maneuverSection || totalMod),
        }
    }

    /**
     * Creates energy cost summary
     */
    getEnergySummaryContext() {
        const baseEnergy = this.mod_energy || 0
        const icon = '⚡'

        // Base energy cost
        let originalCost = this.getEffectiveSpellProfile().cost
        if (this.energy_override != null) {
            originalCost = this.energy_override
        }
        const availableEnergy = this.getAvailableEnergy()

        const modifierSection = this._buildModifierSectionData(this.text_energy, {
            sectionTitle: 'Modifikatoren:',
            getLineClass: (line) => {
                if (line.includes('-')) return 'positive'
                if (line.includes('+')) return 'negative'
                return 'neutral'
            },
        })

        const footerRows = [
            {
                label: 'Verfügbar',
                value: `${availableEnergy} Energie`,
                cssClass: 'modifier-item base-value',
            },
        ]

        if (baseEnergy > availableEnergy) {
            const shortage = baseEnergy - availableEnergy
            footerRows.push({
                text: `Fehlend: ${shortage} Energie`,
                cssClass: 'modifier-item negative',
                strong: true,
            })
        } else {
            const remaining = availableEnergy - baseEnergy
            footerRows.push({
                label: 'Verbleibend',
                value: `${remaining} Energie`,
                cssClass: 'modifier-item positive',
            })
        }

        const difficulty = this._getCastingDifficulty()
        const isNonStandardDifficulty = difficulty === null

        const rollDisabled = this._isRollDisabled()
        return {
            cssClass: 'modifier-summary energy-summary',
            heading: `${icon} Energiekosten: ${baseEnergy} Energie`,
            rows: [
                {
                    label: 'Basiskosten',
                    value: `${originalCost} Energie`,
                    cssClass: 'modifier-item base-value',
                },
            ],
            sections: modifierSection ? [modifierSection] : [],
            footerRows,
            actionButtons: isNonStandardDifficulty
                ? [
                      {
                          action: rollDisabled ? null : 'energieErfolg',
                          text: '✅ Erfolgreich gewirkt',
                          cssClass: `clickable-summary energie-erfolg ${rollDisabled ? 'zone-roll-disabled' : ''}`,
                          style: 'cursor: pointer; padding: 8px; margin: 4px 0; background: rgba(0, 150, 0, 0.1); border: 1px solid rgba(0, 150, 0, 0.3); border-radius: 4px; text-align: center;',
                      },
                      {
                          action: rollDisabled ? null : 'energieMisserfolg',
                          text: '❌ Misslungen',
                          cssClass: `clickable-summary energie-misserfolg ${rollDisabled ? 'zone-roll-disabled' : ''}`,
                          style: 'cursor: pointer; padding: 8px; margin: 4px 0; background: rgba(220, 0, 0, 0.1); border: 1px solid rgba(220, 0, 0, 0.3); border-radius: 4px; text-align: center;',
                      },
                  ]
                : [],
            showDivider: true,
        }
    }

    /**
     * @override
     * @param {object} options - Render options
     * @returns {Promise<object>} Context data for the template
     */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        this.ilarisSituationControls = getRelevantSupernaturalSituationControls(this.actor, {
            fertigkeit: this.getIlarisFertigkeitContext(),
        })

        const hasBlutmagie =
            this.actor.vorteil.magie.some((v) => v.name === 'Blutmagie') &&
            this.item.type === 'zauber'

        const restrictEnergyCostSetting = game.settings.get(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.restrictEnergyCostSetting,
        )

        const canSetEnergyCost =
            !restrictEnergyCostSetting ||
            this.actor.vorteil?.magie?.some((v) => v.name === 'Unitatio') ||
            !isNumericCost(sanitizeEnergyCost(this.item.system.kosten))

        const hasVerbotenePforten = this.hasVerbotenePfortenAccess()

        const difficulty = this._getCastingDifficulty()
        const isNonStandardDifficulty = difficulty === null
        const summonCreatureSelectors = await this._getSummonCreatureSelectors()

        const zonePlacementEnabled = this._hasZonePlacementRequirement()
        return {
            ...context,
            choices_xd20: CONFIG.ILARIS.xd20_choice,
            checked_xd20: '1',
            choices_verbotene_pforten: {
                0: 'Deaktiviert',
                4: '1 Vorteil (WS+4)',
                8: '2 Vorteile (WS+8)',
            },
            hasBlutmagie,
            hasVerbotenePforten,
            isNonStandardDifficulty,
            canSetEnergyCost,
            blutmagie: this.blutmagie,
            verbotene_pforten: this.verbotene_pforten,
            set_energy_cost: this.set_energy_cost,
            ilarisSituationControls: this.ilarisSituationControls,
            armedInputs: this._getArmedInputs(),
            zonePlacement: this.zonePlacement,
            zonePlacementEnabled,
            zonePlacementReady: this._hasZoneDraft(),
            magicResistance: this._getMagicResistanceTemplateContext(),
            summonCreatureSelectors,
            ...this._getSpellModificationTemplateContext(),
        }
    }

    /* -------------------------------------------- */
    /*  Combat Actions                              */
    /* -------------------------------------------- */

    async _angreifenKlick() {
        if (this._isMagicResistancePending()) {
            ui.notifications.warn('Fordere zuerst den W20 für die Magieresistenz an.')
            return
        }
        if (callIlarisHookWithGlobalMirror('Ilaris.preAngriff', this) === false) return
        let xd20_choice =
            Number(this.element.querySelector('input[name="xd20"]:checked')?.value) || 0
        xd20_choice = xd20_choice == 0 ? 1 : 3
        let diceFormula = this.getDiceFormula(xd20_choice)
        if ((await this.manoeverAuswaehlen()) === false) return
        await this.updateManoeverMods()
        this.updateStatusMods()
        if (!(await this._requireZonePlacement())) return

        // Initialize and check energy values
        await this.initializeEnergyValues()

        let label = `${this.item.name}`
        let formula = `${diceFormula} ${signed(this.item.system.pw)} \
            ${signed(this.at_abzuege_mod)} \
            ${signed(this.mod_at)}`

        // Parse difficulty from item's schwierigkeit
        let difficulty = this._getCastingDifficulty()
        let additionalText = ''
        const schwierigkeit = this.getEffectiveSpellProfile().difficulty
        if (difficulty === null && schwierigkeit) {
            const parsedDifficulty = parseInt(schwierigkeit)
            if (!isNaN(parsedDifficulty)) {
                difficulty = parsedDifficulty
            } else {
                additionalText = `\n${schwierigkeit}`
            }
        }
        additionalText += this.getEffectiveSpellProfileText()

        const rollResult = await evaluate_roll_with_crit(
            formula,
            label,
            this.text_at +
                '\n' +
                this.getIlarisModifierText(this.ilarisProbeResult || { selected: [] }) +
                '\n' +
                this.text_energy +
                additionalText,
            difficulty,
            this.fumble_val,
            true,
        )

        await postRollToChat(rollResult, this.speaker, this.rollmode)
        callIlarisHookAllWithGlobalMirror('Ilaris.postAngriff', rollResult, this)

        const isSuccess = rollResult.success
        const is16OrHigher = rollResult.is16OrHigher

        this.is16OrHigher = is16OrHigher
        if (difficulty) {
            await this.applyEnergyCost(isSuccess, is16OrHigher)
            // If not enough resources, show error
            if (this.currentEnergy < this.endCost) {
                ui.notifications.error(
                    `Nicht genug Ressourcen! Benötigt: ${this.endCost}, Vorhanden: ${this.currentEnergy}. Unter bestimmten Voraussetzungen zieht dir das System einfach Energie ab, bis du bei 0 angelangt bist. Du kannst diese Information nach eigenem Ermessen weiterverwenden.`,
                )
            }
            // Refresh dialog data after energy application
            const preEffectManeuverState = {
                maneuverDurationBonus: this.maneuverDurationBonus || 0,
                maechtigeMagieQs: this.maechtigeMagieQs || 0,
            }
            await this.refreshActorData()
            Object.assign(this, preEffectManeuverState)
        }
        super._updateSchipsStern()

        if (isSuccess) await this._resolveSuccessfulSpellEffects(rollResult)
        else await this._discardZoneDraft()
    }

    async _energieAbrechnenKlick(isSuccess) {
        if (this._isMagicResistancePending()) {
            ui.notifications.warn('Fordere zuerst den W20 für die Magieresistenz an.')
            return
        }
        if ((await this.manoeverAuswaehlen()) === false) return
        await this.updateManoeverMods()
        if (!(await this._requireZonePlacement())) return
        // Initialize and check energy values
        await this.initializeEnergyValues()

        await this.applyEnergyCost(isSuccess, this.is16OrHigher)

        if (isSuccess) await this._resolveSuccessfulSpellEffects({ success: true })
        else await this._discardZoneDraft()

        // If not enough resources, show error
        if (this.currentEnergy < this.endCost) {
            ui.notifications.error(
                `Nicht genug Ressourcen! Benötigt: ${this.endCost}, Vorhanden: ${this.currentEnergy}. Unter bestimmten Voraussetzungen zieht dir das System einfach Energie ab, bis du bei 0 angelangt bist. Du kannst diese Information nach eigenem Ermessen weiterverwenden.`,
            )
        }

        // Refresh dialog data after energy application
        await this.refreshActorData()

        // Create chat message with energy cost information
        const label = `${this.item.name} (Kosten: ${this.endCost} Energie)`
        const html_roll = await foundry.applications.handlebars.renderTemplate(
            'systems/Ilaris/scripts/skills/templates/chat/probenchat_profan.hbs',
            {
                title: label,
                text: isSuccess ? this.text_energy : '',
            },
        )

        await ChatMessage.create({
            speaker: this.speaker,
            content: html_roll,
            style: CONST.CHAT_MESSAGE_STYLES.ROLL,
            whisper:
                this.rollmode === 'gmroll'
                    ? ChatMessage.getWhisperRecipients('GM')
                    : this.rollmode === 'selfroll'
                      ? [game.user.id]
                      : undefined,
            blind: this.rollmode === 'blindroll',
        })
    }

    /* -------------------------------------------- */
    /*  Energy Management                           */
    /* -------------------------------------------- */

    _isZoneAutomationEnabled() {
        return game.settings.get(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisAutomatisierungSettingNames.useTargetSelection,
        )
    }

    _isAutomaticMagicResistance() {
        const requirement = this.getEffectiveSpellProfile().magicResistance
        return Boolean(this._isZoneAutomationEnabled() && requirement?.enabled)
    }

    _resolveMagicResistanceTarget() {
        return resolveMagicResistanceTarget(this.selectedActors, {
            resolveActor: (target) => resolveTargetActorForDamage(target).targetActor,
        })
    }

    _getCastingDifficulty() {
        if (this._isAutomaticMagicResistance()) {
            return Number.isFinite(this.magicResistanceChallenge?.difficulty)
                ? this.magicResistanceChallenge.difficulty
                : null
        }
        if (!Number.isFinite(Number.parseInt(this.item.system.schwierigkeit, 10))) return null
        const difficulty = Number.parseInt(this.getEffectiveSpellProfile().difficulty, 10)
        return Number.isFinite(difficulty) ? difficulty : null
    }

    _isMagicResistancePending() {
        return this._isAutomaticMagicResistance() && this._getCastingDifficulty() === null
    }

    _isRollDisabled() {
        return this._isZonePlacementMissing() || this._isMagicResistancePending()
    }

    _getMagicResistanceTemplateContext() {
        if (!this._isAutomaticMagicResistance()) return { enabled: false }
        const target = this._resolveMagicResistanceTarget()
        if (!target) {
            return {
                enabled: true,
                status: 'missing-target',
                message: 'Wähle genau ein Actor-Ziel für die Magieresistenz.',
            }
        }
        const challenge = this.magicResistanceChallenge
        if (
            challenge?.targetActorUuid === target.actor.uuid &&
            Number.isFinite(challenge.difficulty)
        ) {
            return {
                enabled: true,
                status: 'resolved',
                targetName: target.actor.name,
                magicResistance: challenge.magicResistance,
                d20: challenge.d20,
                difficulty: challenge.difficulty,
            }
        }
        return {
            enabled: true,
            status: 'pending',
            targetName: target.actor.name,
            magicResistance: target.magicResistance,
        }
    }

    async _requestMagicResistance() {
        const target = this._resolveMagicResistanceTarget()
        if (!this._isAutomaticMagicResistance() || !target) {
            ui.notifications.warn('Wähle genau ein Actor-Ziel für die Magieresistenz.')
            return false
        }
        const executorUserId = resolveDamageExecutorUserId(target.actor)
        if (!executorUserId) {
            ui.notifications.warn(
                `Keine berechtigte Benutzerinstanz für ${target.actor.name} ist aktiv.`,
            )
            return false
        }
        const challenge = createMagicResistanceChallenge({
            dialogId: this.dialogId,
            target,
            executorUserId,
            requestId: foundry.utils.randomID(16),
        })
        if (!challenge) return false
        this.magicResistanceChallenge = challenge
        const request = { ...challenge, spellName: this.item.name }
        game.socket.emit('system.Ilaris', { type: 'requestMagicResistance', data: request })
        if (executorUserId === game.user.id) await handleMagicResistanceRequest(request)
        await this.render()
        return true
    }

    _hasZonePlacementRequirement() {
        const zone = this.getEffectiveSpellModificationContext().zone
        return Boolean(this._isZoneAutomationEnabled() && zone)
    }

    _hasZoneDraft() {
        return Boolean(this.zonePlacement?.draftId)
    }

    _isZonePlacementMissing() {
        return this._hasZonePlacementRequirement() && !this._hasZoneDraft()
    }

    async _requireZonePlacement() {
        if (!this._isZonePlacementMissing()) return true
        ui.notifications.warn('Platziere zuerst die Zone.')
        return false
    }

    async _placeZone() {
        if ((await this.manoeverAuswaehlen()) === false) return
        await this.updateManoeverMods()
        const zone = this.getEffectiveSpellModificationContext().zone
        if (!this._isZoneAutomationEnabled() || !zone) return

        await this._discardZoneDraft()

        const casterToken = getCasterToken(this.actor)
        if (!globalThis.canvas?.scene || !casterToken) {
            ui.notifications.error(
                'Zonenplatzierung benötigt eine aktive Szene und einen Zauberer-Token.',
            )
            return
        }

        const placement = await placeZonePreview(zone, casterToken, {
            rangeBonus: this.zoneRangeBonus,
        })
        if (!placement) {
            await this.updateModifierDisplay()
            return
        }

        const draftId =
            globalThis.foundry?.utils?.randomID?.(16) ||
            globalThis.crypto?.randomUUID?.() ||
            `${Date.now()}`
        this.zonePlacement = { ...placement, draftId }
        this.zoneCasterTokenId = casterToken.id
        const draftRequest = {
            sceneId: canvas.scene.id,
            regionData: placement.regionData,
            draftId,
            ownerUserId: game.user.id,
            dialogId: this.dialogId,
        }
        if (game.user.isGM) {
            const draft = await createZoneDraftRegion({ scene: canvas.scene, ...draftRequest })
            if (!draft) {
                this.zonePlacement = null
                this.zoneCasterTokenId = ''
                ui.notifications.error('Die Zonenplatzierung konnte nicht gespeichert werden.')
                await this.updateModifierDisplay()
                return
            }
            this.zonePlacement.draftId = draft.id
        } else game.socket.emit('system.Ilaris', { type: 'createZoneDraft', data: draftRequest })
        ui.notifications.info('Zone platziert. Jetzt kann der Zauber gewirkt werden.')
        await this.updateModifierDisplay()
    }

    async _discardZoneDraft() {
        const draftId = this.zonePlacement?.draftId
        if (!draftId) {
            this.zonePlacement = null
            this.zoneCasterTokenId = ''
            return false
        }
        const request = {
            sceneId: canvas.scene?.id,
            draftId,
            ownerUserId: game.user.id,
            dialogId: this.dialogId,
        }
        if (game.user.isGM) await deleteZoneDraftRegion({ scene: canvas.scene, ...request })
        else game.socket.emit('system.Ilaris', { type: 'deleteZoneDraft', data: request })
        this.zonePlacement = null
        this.zoneCasterTokenId = ''
        return true
    }

    async _resolveSuccessfulSpellEffects(rollResult) {
        const context = this.getEffectiveSpellModificationContext()
        const preEffectContext = {
            preEffects: context.preEffects,
            spellModificationId: this.getSelectedSpellModificationId(),
        }
        if (!context.zone || !this._isZoneAutomationEnabled() || !this.zonePlacement) {
            if (context.preEffects.length)
                await applyPreEffects(rollResult, this, this.armedInputValues, preEffectContext)
            return
        }

        if (context.zone.lifecycle === 'persistent') {
            const zone = resolvePersistentZoneDuration(context.zone, this.actor)
            if (!zone) {
                ui.notifications.error('Die Dauerquelle der Zone konnte nicht aufgelöst werden.')
                return
            }
            const persistentContext = { ...context, zone }
            if (!game.user.isGM) {
                game.socket.emit('system.Ilaris', {
                    type: 'createPersistentZone',
                    data: this._serializePersistentZoneRequest(persistentContext),
                })
                this.zonePlacement = null
                this.zoneCasterTokenId = ''
                return
            }
            await createPersistentZone({
                scene: canvas.scene,
                regionData: this.zonePlacement.regionData,
                dialog: this,
                zone,
                preEffects: context.preEffects,
            })
            await this._discardZoneDraft()
            return
        }

        this.selectedActors = await resolveInstantZoneTargets(this.zonePlacement.regionData, {
            zone: context.zone,
            casterTokenId: this.zoneCasterTokenId,
        })
        if (context.preEffects.length)
            await applyPreEffects(rollResult, this, this.armedInputValues, preEffectContext)
        await this._discardZoneDraft()
    }

    _serializePersistentZoneRequest(context) {
        return {
            sceneId: canvas.scene.id,
            regionData: this.zonePlacement.regionData,
            zone: context.zone,
            preEffects: context.preEffects,
            casterActorUuid: this.actor.uuid,
            casterTokenId: this.zoneCasterTokenId,
            spellUuid: this.item.uuid,
            spellModificationId: this.getSelectedSpellModificationId(),
            armedInputValues: this.armedInputValues,
            maneuverDurationBonus: this.maneuverDurationBonus || 0,
            maechtigeMagieQs: this.maechtigeMagieQs || 0,
            draftRegionId: this.zonePlacement.draftId,
            draftOwnerUserId: game.user.id,
            dialogId: this.dialogId,
        }
    }

    async close(options = {}) {
        await this._discardZoneDraft()
        return super.close(options)
    }

    async initializeEnergyValues() {
        // Check if we have enough resources
        if (this.actor.type == 'held') {
            if (this.item.type === 'zauber') {
                this.currentEnergy = this.actor.system.abgeleitete.asp_stern
                this.energyPath = 'system.abgeleitete.asp_stern'
            } else {
                this.currentEnergy = this.actor.system.abgeleitete.kap_stern
                this.energyPath = 'system.abgeleitete.kap_stern'
            }
        } else {
            if (this.item.type === 'zauber') {
                this.currentEnergy = this.actor.system.energien.asp.value
                this.energyPath = 'system.energien.asp.value'
            } else {
                this.currentEnergy = this.actor.system.energien.kap.value
                this.energyPath = 'system.energien.kap.value'
            }
        }
    }

    async applyEnergyCost(isSuccess, is16OrHigher) {
        let costModifier = 2
        // hardcoded failed liturgie cost
        if (
            this.actor.type == 'held' &&
            this.item.type == 'liturgie' &&
            this.actor.vorteil.karma.some((v) => v.name == 'Liturgische Sorgfalt')
        ) {
            costModifier = 4
        }
        // Calculate cost based on success
        let cost = isSuccess
            ? this.mod_energy
            : Math.ceil(this.getEffectiveSpellProfile().cost / costModifier)

        // Apply all cost modifications from advantages and styles
        cost = hardcoded.calculateModifiedCost(
            this.actor,
            this.item,
            isSuccess,
            is16OrHigher,
            cost,
            this.energy_override,
        )

        // Update resources and apply wounds if using Verbotene Pforten
        const updates = {
            [this.energyPath]: Math.max(0, this.currentEnergy - cost),
        }

        // Apply wounds from Verbotene Pforten if any
        if (this.verbotene_pforten?.activated && this.calculatedWounds > 0) {
            updates['system.gesundheit.wunden'] =
                this.actor.system.gesundheit.wunden + this.calculatedWounds
        }

        this.endCost = cost

        await this.actor.update(updates)

        // Create chat message with energy cost information
        const html_roll = await foundry.applications.handlebars.renderTemplate(
            'systems/Ilaris/scripts/dice/templates/spell_result.hbs',
            {
                success: isSuccess,
                cost: this.endCost,
                costModifier: costModifier,
            },
        )

        await ChatMessage.create({
            speaker: this.speaker,
            content: html_roll,
            style: CONST.CHAT_MESSAGE_STYLES.ROLL,
            whisper:
                this.rollmode === 'gmroll'
                    ? ChatMessage.getWhisperRecipients('GM')
                    : this.rollmode === 'selfroll'
                      ? [game.user.id]
                      : undefined,
            blind: this.rollmode === 'blindroll',
        })
    }

    /* -------------------------------------------- */
    /*  Maneuver Processing                         */
    /* -------------------------------------------- */

    /**
     * Parse maneuver selections from the dialog form.
     */
    async manoeverAuswaehlen() {
        this._updateSpellModificationSelection()
        const spellModificationContext = this.getEffectiveSpellModificationContext()
        if (!spellModificationContext.valid) {
            ui.notifications.error(spellModificationContext.errors.join(' '))
            return false
        }
        // Ensure manoever exists
        if (!this.item.system.manoever) {
            this.item.system.manoever = ILARIS.manoever_ueber
        }
        let manoever = this.item.system.manoever

        // Ensure all required manoever properties exist
        if (!manoever.kbak) {
            manoever.kbak = { selected: false }
        }
        if (!manoever.mod) {
            manoever.mod = { selected: 0 }
        }
        // allgemeine optionen
        manoever.kbak.selected = this.element.querySelector('#kbak')?.checked || false // Kombinierte Aktion

        // Read Blutmagie/Verbotene Pforten/EnergieOverride into dialog-local state (not item document)
        this.blutmagie.value = Number(this.element.querySelector('#blutmagie')?.value) || 0

        // For verbotene_pforten, check if a radio button is selected (not the default "0")
        const verbotenePfortenValue = this.element.querySelector(
            'input[name="verbotene_pforten_toggle"]:checked',
        )?.value
        this.verbotene_pforten = {
            multiplier: Number(verbotenePfortenValue) || 4,
            activated: verbotenePfortenValue !== undefined && verbotenePfortenValue !== '0',
        }

        const energyOverride = this.element.querySelector(
            'input[name="item.system.manoever.energyOverride"]',
        )?.value
        this.set_energy_cost.value =
            energyOverride !== '' && energyOverride != null ? +energyOverride : null

        this.armedInputValues = {}
        for (const input of this._getArmedInputs()) {
            this.armedInputValues[input.key] = this.element.querySelector(
                `[name="ilaris-armed-input-${input.key}"]`,
            )?.value
        }

        manoever.mod.selected =
            Number(this.element.querySelector(`#modifikator-${this.dialogId}`)?.value) || 0 // Modifikator
        await super.manoeverAuswaehlen()
        return true
    }

    _getArmedInputs() {
        const inputs = []
        for (const preEffect of this.getEffectiveSpellModificationContext().preEffects) {
            for (const input of preEffect?.armedCombat?.inputs || []) {
                if (input?.key && !inputs.some((entry) => entry.key === input.key))
                    inputs.push(input)
            }
        }
        return inputs
    }

    /**
     * Gets the available energy for the current actor and item type
     * @returns {number} Available energy (AsP or KaP)
     */
    getAvailableEnergy() {
        if (this.actor.type == 'held') {
            if (this.item.type === 'zauber') {
                return this.actor.system.abgeleitete.asp_stern
            } else {
                return this.actor.system.abgeleitete.kap_stern
            }
        } else {
            if (this.item.type === 'zauber') {
                return this.actor.system.energien.asp.value
            } else {
                return this.actor.system.energien.kap.value
            }
        }
    }

    /**
     * Determines whether the actor has access to Verbotene Pforten functionality
     * @returns {boolean} True if the actor can use Verbotene Pforten
     */
    hasVerbotenePfortenAccess() {
        // Direct advantage "Verbotene Pforten"
        if (this.actor.vorteil.magie.some((v) => v.name === 'Verbotene Pforten')) {
            return true
        }

        if (this.actor.uebernatuerlich.zauber.some((z) => z.name === 'Blut des Dolches (passiv)')) {
            return true
        }

        // Borbaradianer tradition access (only for spells)
        if (this.item.type === 'zauber') {
            if (this.actor.type === 'kreatur') {
                // For creatures, check in all advantage categories
                return (
                    this.actor.vorteil.allgemein.some((v) => v.name.includes('Borbaradianer')) ||
                    this.actor.vorteil.magie.some((v) => v.name.includes('Borbaradianer')) ||
                    this.actor.vorteil.zaubertraditionen.some((v) =>
                        v.name.includes('Borbaradianer'),
                    )
                )
            } else {
                // For heroes, check selected style
                return hardcoded
                    .getSelectedStil(this.actor, 'uebernatuerlich')
                    ?.name.includes('Borbaradianer')
            }
        }

        return false
    }

    /**
     * Calculates the number of wounds needed to provide enough energy
     * @param {number} ws - Wundschwelle of the character
     * @param {number} multiplier - Selected multiplier (4 or 8)
     * @param {number} energyNeeded - Amount of energy still needed
     * @returns {number} Number of wounds required
     */
    calculateRequiredWounds(ws, multiplier, energyNeeded) {
        if (energyNeeded <= 0) return 0
        const energyPerWound = ws + multiplier
        return Math.ceil(energyNeeded / energyPerWound)
    }

    /**
     * Refreshes the dialog's actor reference and updates displays after actor changes.
     */
    async refreshActorData() {
        // Get the updated actor from the game
        const updatedActor = game.actors.get(this.actor.id)
        if (updatedActor) {
            // Update the dialog's actor reference
            this.actor = updatedActor

            // Update energy values based on the refreshed actor
            await this.initializeEnergyValues()

            if (this.element) {
                this.updateModifierDisplay()
            }
        }
    }

    async updateManoeverMods() {
        this._updateIlarisSituationSelection()
        const spellModificationContext = this.getEffectiveSpellModificationContext()
        this.spellModificationContext = spellModificationContext
        let manoever = this.item.system.manoever

        let mod_at = 0
        let mod_vt = 0
        let mod_dm = 0
        let mod_energy = spellModificationContext.profile.cost
        this.energy_override = spellModificationContext.selectedForms.length
            ? spellModificationContext.profile.cost
            : null
        if (this.set_energy_cost?.value != null) {
            mod_energy = this.set_energy_cost.value
            this.energy_override = this.set_energy_cost.value
        }
        let text_at = ''
        let text_vt = ''
        let text_dm = ''
        let text_energy = ''
        let schaden = null
        let nodmg = { name: '', value: false }
        let trefferzone = 0
        let fumble_val = 1
        let damageType = 'NORMAL'
        let trueDamage = false
        let durationBonus = 0
        let maechtigeMagieQs = 0

        // Get the minimum available resource based on actor and item type
        const availableEnergy = this.getAvailableEnergy()

        // Collect all modifications from all maneuvers
        const allModifications = []
        let manoeverAmount = 0
        let baseManoeverCount = 0

        this.item.manoever.forEach((dynamicManoever) => {
            let check = undefined
            let number = undefined
            let trefferZoneInput = undefined
            if (dynamicManoever.inputValue.value) {
                if (dynamicManoever.inputValue.field == 'CHECKBOX') {
                    check = dynamicManoever.inputValue.value
                } else if (dynamicManoever.inputValue.field == 'NUMBER') {
                    number = dynamicManoever.inputValue.value
                } else if (dynamicManoever.inputValue.field == 'SELECTOR') {
                    number = 1
                } else {
                    trefferZoneInput = dynamicManoever.inputValue.value
                }
            }
            if (
                check == undefined &&
                (number == undefined || number == 0) &&
                (trefferZoneInput == undefined || trefferZoneInput == 0)
            )
                return

            manoeverAmount++

            // Count base maneuvers for Gildenmagier II bonus
            if (dynamicManoever.system.isBaseManoever) {
                baseManoeverCount++
            }

            // Add valid modifications to the collection
            Object.values(dynamicManoever.system.modifications).forEach((modification) => {
                allModifications.push({
                    modification,
                    manoever: dynamicManoever,
                    number,
                    check,
                    trefferZoneInput,
                })
            })
        })

        // Zone-capable casting maneuvers can declare an additive RANGE or
        // ZONE_RANGE modification. Existing maneuvers remain unchanged.
        this.zoneRangeBonus = allModifications.reduce((total, { modification }) => {
            if (!['RANGE', 'ZONE_RANGE'].includes(modification?.type)) return total
            const value = Number(modification.value)
            if (!Number.isFinite(value)) return total
            return total + (modification.operator === 'SUBTRACT' ? -value : value)
        }, 0)

        // Process all modifications in order
        ;[
            mod_at,
            mod_vt,
            mod_dm,
            mod_energy,
            text_at,
            text_vt,
            text_dm,
            text_energy,
            trefferzone,
            schaden,
            nodmg,
            damageType,
            trueDamage,
            durationBonus,
            maechtigeMagieQs,
            this.energy_override,
        ] = handleModifications(allModifications, {
            mod_at,
            mod_vt,
            mod_dm,
            mod_energy,
            text_at,
            text_vt,
            text_dm,
            text_energy,
            trefferzone,
            schaden: null,
            nodmg: null,
            damageType,
            trueDamage,
            durationBonus,
            maechtigeMagieQs,
            context: this,
        })

        // Kombinierte Aktion kbak
        if (manoever.kbak.selected) {
            mod_at -= 4
            text_at = text_at.concat('Kombinierte Aktion\n')
        }

        // Modifikator
        let modifikator = Number(manoever.mod.selected)
        if (modifikator != 0) {
            mod_vt += modifikator
            mod_at += modifikator
            text_vt = text_vt.concat(`Modifikator: ${modifikator}\n`)
            text_at = text_at.concat(`Modifikator: ${modifikator}\n`)
        }

        // Gildenmagier II Bonus: +2 wenn mindestens 2 verschiedene Basismanöver verwendet werden
        if (baseManoeverCount >= 2 && this.actor.type === 'held' && this.item.type === 'zauber') {
            const selectedStil = hardcoded.getSelectedStil(this.actor, 'uebernatuerlich')
            if (selectedStil?.name.includes('Gildenmagier') && selectedStil.stufe >= 2) {
                mod_at += 2
                text_at = text_at.concat('Gildenmagier II: +2\n')
            }
        }

        // Handle Blutmagie and Verbotene Pforten
        if (this.blutmagie?.value || this.verbotene_pforten?.activated) {
            // Handle Blutmagie
            if (this.blutmagie?.value) {
                const blutmagieReduction = Math.min(mod_energy, this.blutmagie.value)
                if (blutmagieReduction > 0) {
                    mod_energy -= blutmagieReduction
                    text_energy = text_energy.concat(`Blutmagie: -${blutmagieReduction} Energie\n`)
                }
            }

            // Handle Verbotene Pforten
            if (this.verbotene_pforten?.activated) {
                const ws =
                    this.actor.type === 'held'
                        ? this.actor.system.abgeleitete.ws
                        : this.actor.system.kampfwerte.ws
                const multiplier = this.verbotene_pforten.multiplier

                // Ensure mod_energy doesn't go below availableEnergy
                const maxReduction = mod_energy - availableEnergy

                // Calculate required wounds using the extracted method
                this.calculatedWounds = this.calculateRequiredWounds(ws, multiplier, maxReduction)

                if (this.calculatedWounds > 0 && maxReduction > 0) {
                    const verbotenePfortenReduction = (ws + multiplier) * this.calculatedWounds
                    const actualReduction = Math.min(verbotenePfortenReduction, maxReduction)
                    mod_energy -= actualReduction
                    text_energy = text_energy.concat(
                        `Verbotene Pforten (${this.calculatedWounds} Wunden): ${actualReduction} Energie\n`,
                    )
                }
            }
        }

        // Ensure mod_energy is never less than 0
        mod_energy = Math.max(0, mod_energy)

        this.ilarisProbeResult = this.getIlarisModifierResult(IlarisModifierTarget.Probe)
        mod_at += this.ilarisProbeResult.value

        // Track Mächtige Magie QS and maneuver duration bonus for pre-effects
        this.maechtigeMagieQs = maechtigeMagieQs || 0
        this.maneuverDurationBonus = durationBonus || 0

        this.mod_at = mod_at
        this.mod_vt = mod_vt
        this.mod_dm = mod_dm
        this.mod_energy = mod_energy
        this.text_at = text_at
        this.text_vt = text_vt
        this.text_dm = text_dm
        this.text_energy = text_energy
        this.schaden = schaden
        this.fumble_val = fumble_val
        this.damageType = damageType
        this.trueDamage = trueDamage
    }

    getEffectiveSpellProfileText() {
        const context = this.getEffectiveSpellModificationContext()
        if (!context.selectedForms.length) return ''
        const profile = context.profile
        const formNames = context.selectedForms.map((form) => form.name).join(', ')
        const descriptions = context.selectedForms
            .map((form) => form.description)
            .filter(Boolean)
            .join('\n')
        return `\nZaubermodifikation: ${formNames}\nZiel: ${profile.target || this.item.system.ziel}\nReichweite: ${profile.range || this.item.system.reichweite}\nWirkungsdauer: ${profile.duration || this.item.system.wirkungsdauer}${profile.permanentCost ? `\nPermanente Kosten: ${profile.permanentCost}` : ''}${descriptions ? `\nWirkung: ${descriptions}` : ''}`
    }

    _updateSpellModificationSelection() {
        if (!this.element?.querySelectorAll) return
        this.selectedSpellModificationIds = Array.from(
            this.element.querySelectorAll('.spell-modification:checked'),
        )
            .map((input) => input.value)
            .filter(Boolean)
        this.spellModificationContext = resolveSpellModificationContext(
            this.item,
            this.selectedSpellModificationIds,
        )
    }

    getEffectiveSpellModificationContext() {
        if (!this.spellModificationContext) {
            const context = resolveSpellModificationContext(
                this.item,
                this.selectedSpellModificationIds,
            )
            context.preEffects = foundry.utils.deepClone(context.preEffects)
            for (const [index, selection] of this.summonCreatureSelections) {
                if (context.preEffects[index]?.summonCreature && selection.uuid) {
                    context.preEffects[index].summonCreature.selectedCreatureUuid = selection.uuid
                }
            }
            this.spellModificationContext = context
        }
        return this.spellModificationContext
    }

    getEffectiveSpellProfile() {
        const profile = { ...this.getEffectiveSpellModificationContext().profile }
        const selectedCreature = Array.from(this.summonCreatureSelections.values()).find(
            (selection) => selection.option?.uuid === selection.uuid,
        )?.option
        if (selectedCreature) {
            profile.difficulty = selectedCreature.summoningDifficulty
            profile.cost = selectedCreature.summoningCost
        }
        return profile
    }

    async _getSummonCreatureSelectors() {
        const selectors = []
        for (const [
            index,
            preEffect,
        ] of this.getEffectiveSpellModificationContext().preEffects.entries()) {
            const config = preEffect?.summonCreature
            if (!config?.enabled) continue
            // A fixed source is resolved by summonCreatureFromPreEffect. It must
            // not depend on the generic picker or its configured-pack index.
            if (config.sourceUuid) continue
            const kreaturentypen = normalizeCreatureTypes(config.kreaturentypen)
            const current = this.summonCreatureSelections.get(index) || {}
            const kreaturentyp = kreaturentypen.includes(current.kreaturentyp)
                ? current.kreaturentyp
                : kreaturentypen[0] || ''
            const options = await getCreatureSourceOptions(kreaturentyp ? [kreaturentyp] : [])
            const option =
                options.find((entry) => entry.uuid === current.uuid) || options[0] || null
            this.summonCreatureSelections.set(index, {
                kreaturentyp,
                uuid: option?.uuid || '',
                option,
            })
            if (option && this.spellModificationContext?.preEffects[index]?.summonCreature) {
                this.spellModificationContext.preEffects[
                    index
                ].summonCreature.selectedCreatureUuid = option.uuid
            }
            selectors.push({
                index,
                kreaturentypen,
                kreaturentyp,
                options,
                selectedUuid: option?.uuid || '',
            })
        }
        return selectors
    }

    getSelectedSpellModificationId() {
        return this.getEffectiveSpellModificationContext().selectedForms.at(-1)?.id || ''
    }

    _getSpellModificationTemplateContext() {
        const { groups, modifications } = normalizeSpellModifications(this.item.system)
        const selectedIds = this.selectedSpellModificationIds
        return {
            spellModificationGroups: groups.map((group) => ({
                ...group,
                forms: modifications
                    .filter((form) => form.group === group.id)
                    .map((form) => ({ ...form, selected: selectedIds.includes(form.id) })),
            })),
            ungroupedSpellModifications: modifications
                .filter((form) => !form.group)
                .map((form) => ({ ...form, selected: selectedIds.includes(form.id) })),
            spellModificationProfile: this.getEffectiveSpellProfile(),
            spellModificationErrors: this.getEffectiveSpellModificationContext().errors,
        }
    }

    getIlarisSituationTags() {
        return expandIlarisSituationTags(this.ilarisSituationSelection)
    }

    _updateIlarisSituationSelection() {
        const element = this.element
        if (!element?.querySelectorAll) return

        const selected = Array.from(
            element.querySelectorAll('input[name="ilaris-situation"]:checked'),
        ).map((input) => input.value)
        for (const group of this.ilarisSituationControls.exclusive) {
            const input = element.querySelector(
                `input[name="ilaris-situation-${group.id}"]:checked`,
            )
            if (input?.value) selected.push(input.value)
        }
        this.ilarisSituationSelection = selected
    }
}
