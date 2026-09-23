import { wuerfelwurf } from '../../dice/wuerfel.js'
import { ILARIS } from '../../core/config.js'
import {
    createNahkampfwaffeDefaults,
    createFernkampfwaffeDefaults,
} from '../../items/model-data/shared.js'
import { startOpposedEscape } from '../../effects/opposed-escape.js'
import { removeConditionSource } from '../../effects/status-conditions.js'

const { HandlebarsApplicationMixin } = foundry.applications.api
const { ActorSheetV2 } = foundry.applications.sheets
const TextEditor = foundry.applications.ux.TextEditor.implementation

export class IlarisActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'actor'],
        position: {
            width: 850,
            height: 750,
        },
        window: {
            resizable: true,
        },
        form: {
            submitOnChange: true,
            closeOnSubmit: false,
        },
        actions: {
            editImage: IlarisActorSheet.onEditImage,
            ausklappView: IlarisActorSheet.ausklappView,
            rollable: IlarisActorSheet.onRollable,
            clickable: IlarisActorSheet.onClickable,
            itemCreate: IlarisActorSheet.onItemCreate,
            itemEdit: IlarisActorSheet.onItemEdit,
            itemDelete: IlarisActorSheet.onItemDelete,
            escapeEffect: IlarisActorSheet.onEscapeEffect,
            toggleBool: IlarisActorSheet.onToggleBool,
            syncItems: IlarisActorSheet.onSyncItems,
        },
    }

    /** @override */
    static PARTS = {}

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        // Add actor reference for templates
        context.actor = this.actor

        // Add configuration
        context.config = CONFIG.ILARIS

        return context
    }

    /**
     * Bind event listeners after render
     * @param {ApplicationRenderContext} context - The render context
     * @param {RenderOptions} options - Render options
     * @protected
     */
    _onRender(context, options) {
        super._onRender(context, options)

        // These selectors intentionally bind to canonical system paths that are
        // stabilized via TypeDataModel schemas and migration normalization.
        // Bind input listeners for real-time health updates
        const woundsInput = this.element.querySelector('input[name="system.gesundheit.wunden"]')
        if (woundsInput) {
            woundsInput.addEventListener('input', (ev) => this._onHealthValueChange(ev))
        }

        const exhaustionInput = this.element.querySelector(
            'input[name="system.gesundheit.erschoepfung"]',
        )
        if (exhaustionInput) {
            exhaustionInput.addEventListener('input', (ev) => this._onHealthValueChange(ev))
        }

        // Bind input listener for hp updates
        const hpUpdates = this.element.querySelectorAll('.hp-update')
        for (const elem of hpUpdates) {
            elem.addEventListener('input', (ev) => this._onHpUpdate(ev))
        }
    }

    /**
     * Toggle visibility of expandable sections
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The target element with data-action
     */
    static ausklappView(event, target) {
        const targetkey = target.dataset.ausklappentarget
        const targetId = `ausklappen-view-${targetkey}`
        const toggleView = this.element.querySelector(`#${targetId}`)
        if (toggleView) {
            toggleView.classList.toggle('hero-expandable-row-hidden')
        }
    }

    /**
     * Open file picker to edit actor profile image
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The target element with data-action
     */
    static async onEditImage(event, target) {
        if (!this.isEditable) return

        const current = this.actor.img || ''
        const root = this.positioned ?? { left: 0, top: 0 }

        const picker = new FilePicker({
            type: 'imagevideo',
            current,
            top: root.top + 40,
            left: root.left + 10,
            callback: async (path) => {
                await this.actor.update({ img: path })
            },
        })

        return picker.browse()
    }

    /**
     * Toggle a boolean value on the actor
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The target element with data-action
     */
    static async onToggleBool(event, target) {
        try {
            const togglevariable = target.dataset.togglevariable
            const attr = `${togglevariable}`
            // Keep toggle paths schema-backed (no ad-hoc keys), otherwise updates can fail validation.
            const bool_status = foundry.utils.getProperty(this.actor, attr)
            await this.actor.update({ [attr]: !bool_status })

            // Update open combat dialogs if wound penalties were toggled
            if (togglevariable === 'system.gesundheit.wundenignorieren') {
                this._updateOpenCombatDialogs()
            }
        } catch (err) {
            console.error('ILARIS | Error toggling boolean:', err)
            ui.notifications.error('Fehler beim Umschalten des Wertes.')
        }
    }

    _updateOpenCombatDialogs() {
        // Find all open dialogs that belong to this actor
        const openDialogs = Object.values(ui.windows).filter((dialog) => {
            return (
                (dialog.constructor.name === 'AngriffDialog' ||
                    dialog.constructor.name === 'FernkampfAngriffDialog' ||
                    dialog.constructor.name === 'UebernatuerlichDialog') &&
                dialog.actor?.id === this.actor.id
            )
        })

        // Update modifier display in each combat dialog
        openDialogs.forEach((dialog) => {
            if (typeof dialog.updateModifierDisplay === 'function') {
                // AngriffDialog has sophisticated modifier display
                const html = dialog.element
                if (html && html.length > 0) {
                    dialog.updateModifierDisplay(html)
                }
            } else {
                // For other dialogs, just refresh their render to pick up the new wound penalty status
                dialog.render(false)
            }
        })
    }

    _onHealthValueChange(event) {
        // Update open combat dialogs when wound or exhaustion values change on hero sheets
        // Use debouncing to prevent too many rapid updates while typing
        if (this._healthUpdateTimeout) {
            clearTimeout(this._healthUpdateTimeout)
        }

        this._healthUpdateTimeout = setTimeout(() => {
            this._updateOpenCombatDialogs()
        }, 300)
    }

    // Helper method to unequip a specific weapon from both hands
    async _unequipWeapon(weaponId) {
        const weapon = this.actor.items.get(weaponId)
        if (weapon) {
            await weapon.update({
                'system.hauptwaffe': false,
                'system.nebenwaffe': false,
            })
        }
    }

    // Helper method to unequip all two-handed ranged weapons
    async _unequipTwoHandedRangedWeapons() {
        for (let waffe of this.actor.fernkampfwaffen) {
            if (
                waffe.system.computed?.handsRequired === 2 &&
                (waffe.system.hauptwaffe || waffe.system.nebenwaffe)
            ) {
                await this._unequipWeapon(waffe.id)
            }
        }
    }

    // Helper method to unequip all weapons except the specified one
    async _unequipAllWeaponsExcept(exceptItemId) {
        // Unequip all melee weapons except the specified one
        for (let waffe of this.actor.nahkampfwaffen) {
            if (waffe.id !== exceptItemId && (waffe.system.hauptwaffe || waffe.system.nebenwaffe)) {
                await this._unequipWeapon(waffe.id)
            }
        }

        // Unequip all ranged weapons except the specified one
        for (let waffe of this.actor.fernkampfwaffen) {
            if (waffe.id !== exceptItemId && (waffe.system.hauptwaffe || waffe.system.nebenwaffe)) {
                await this._unequipWeapon(waffe.id)
            }
        }
    }

    // Helper method to unequip two-handed weapons that are equipped in both hands
    async _unequipTwoHandedWeaponsInBothHands() {
        // Check melee weapons
        for (let waffe of this.actor.nahkampfwaffen) {
            if (
                waffe.system.computed?.handsRequired === 2 &&
                waffe.system.hauptwaffe &&
                waffe.system.nebenwaffe
            ) {
                await this._unequipWeapon(waffe.id)
            }
        }

        // Check ranged weapons
        for (let waffe of this.actor.fernkampfwaffen) {
            if (
                waffe.system.computed?.handsRequired === 2 &&
                waffe.system.hauptwaffe &&
                waffe.system.nebenwaffe
            ) {
                await this._unequipWeapon(waffe.id)
            }
        }
    }

    // Helper method to unequip weapons from a specific hand
    async _unequipHandWeapons(handType) {
        // Unequip melee weapons from the specified hand
        for (let waffe of this.actor.nahkampfwaffen) {
            if (waffe.system[handType]) {
                await this.actor.items.get(waffe.id).update({
                    [`system.${handType}`]: false,
                })
            }
        }

        // Unequip ranged weapons from the specified hand
        for (let waffe of this.actor.fernkampfwaffen) {
            if (waffe.system[handType]) {
                await this.actor.items.get(waffe.id).update({
                    [`system.${handType}`]: false,
                })
            }
        }
    }

    /**
     * Handle rollable actions (dice rolls)
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The target element with data-action
     */
    static async onRollable(event, target) {
        const systemData = this.actor.system
        const rolltype = target.dataset.rolltype

        console.log('ILARIS | onRollable triggered', event, target, rolltype)
        if (rolltype === 'basic') {
            // NOTE: als Einfaches Beispiel ohne weitere Dialoge und logische Verknüpfungen.
            const label = target.dataset.label
            const formula = target.dataset.formula
            const roll = new Roll(formula)
            const speaker = ChatMessage.getSpeaker({ actor: this.actor })
            await roll.evaluate()
            const html_roll = await foundry.applications.handlebars.renderTemplate(
                'systems/Ilaris/scripts/skills/templates/chat/probenchat_profan.hbs',
                { title: `${label}` },
            )
            roll.toMessage({
                speaker: speaker,
                flavor: html_roll,
            })
            return 0
        }
        const globalermod = systemData.abgeleitete.globalermod
        let pw = 0
        let label = 'Probe'
        let dice = '3d20dl1dh1'
        const dialoge = [
            'angriff_diag',
            'nahkampf_diag',
            'simpleprobe_diag',
            'simpleformula_diag',
            'fernkampf_diag',
            'magie_diag',
            'karma_diag',
            'anrufung_diag',
            'uefert_diag',
            'fertigkeit_diag',
        ]
        if (dialoge.includes(rolltype)) {
            console.log(event.currentTarget)
            wuerfelwurf(target, this.actor)
            return 0
        }
        if (rolltype === 'at') {
            dice = '1d20'
            label = target.dataset.item
            label = `Attacke (${label})`
            pw = target.dataset.pw
            console.log('ILARIS | onRollable AT', { label, pw, globalermod, target })
        } else if (rolltype === 'vt') {
            dice = '1d20'
            label = target.dataset.item
            label = `Verteidigung (${label})`
            pw = target.dataset.pw
        } else if (rolltype === 'fk') {
            dice = '1d20'
            label = target.dataset.item
            label = `Fernkampf (${label})`
            pw = target.dataset.pw
        } else if (rolltype === 'schaden') {
            label = target.dataset.item
            label = `Schaden (${label})`
            pw = target.dataset.pw.replace(/[Ww]/g, 'd')
        } else if (rolltype === 'attribut') {
            const attribut_name = target.dataset.attribut
            label = CONFIG.ILARIS.label[attribut_name]
            pw = systemData.attribute[attribut_name].pw
        } else if (rolltype === 'profan_fertigkeit_pw') {
            label = target.dataset.fertigkeit
            pw = target.dataset.pw
        } else if (rolltype === 'profan_fertigkeit_pwt') {
            label = target.dataset.fertigkeit
            label = label.concat(' (Talent)')
            pw = target.dataset.pwt
        } else if (rolltype === 'profan_talent') {
            label = target.dataset.fertigkeit
            label = label.concat(' (', target.dataset.talent, ')')
            pw = target.dataset.pw
        } else if (rolltype === 'freieFertigkeit' || rolltype === 'freie_fertigkeit') {
            label = target.dataset.fertigkeit
            pw = Number(target.dataset.pw) * 8 - 2
        } else if (
            rolltype === 'uebernatuerlicheFertigkeit' ||
            rolltype === 'uebernatuerliche_fertigkeit'
        ) {
            label = target.dataset.fertigkeit
            pw = target.dataset.pw
        } else if (rolltype === 'zauber' || rolltype === 'liturgie' || rolltype === 'anrufung') {
            label = target.dataset.talent
            pw = target.dataset.pw
        }
        let formula = `${dice} + ${pw} + ${globalermod}`
        if (rolltype === 'at') {
            formula += ` ${systemData.modifikatoren.nahkampfmod >= 0 ? '+' : ''}${
                systemData.modifikatoren.nahkampfmod
            }`
        }
        if (rolltype === 'vt') {
            formula += ` ${systemData.modifikatoren.verteidigungmod >= 0 ? '+' : ''}${
                systemData.modifikatoren.verteidigungmod
            }`
        }
        if (rolltype === 'schaden') {
            formula = pw
        }
        console.log('ILARIS | onRollable final formula', formula)
        const roll = new Roll(formula)
        await roll.evaluate()
        const critfumble = roll.dice[0].results.find((a) => a.active === true).result
        let fumble = false
        let crit = false
        if (critfumble === 20) {
            crit = true
        } else if (critfumble === 1) {
            fumble = true
        }
        const speaker = ChatMessage.getSpeaker({ actor: this.actor })
        const html_roll = await foundry.applications.handlebars.renderTemplate(
            'systems/Ilaris/scripts/skills/templates/chat/probenchat_profan.hbs',
            {
                title: `${label}`,
                crit: crit,
                fumble: fumble,
            },
        )
        roll.toMessage({
            speaker: speaker,
            flavor: html_roll,
        })
    }

    /**
     * Handle clickable actions (non-roll clicks)
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The target element with data-action
     */
    static async onClickable(event, target) {
        const clicktype = target.dataset.clicktype
        if (clicktype === 'shorten_money') {
            const form = target.closest('form') ?? this.element
            const getValue = (name) => {
                const input = form.querySelector(`[name="${name}"]`)
                return input
                    ? Number(input.value) || 0
                    : this.actor.system.geld[name.split('.').pop()]
            }
            let kreuzer = getValue('system.geld.kreuzer')
            let heller = getValue('system.geld.heller')
            let silbertaler = getValue('system.geld.silbertaler')
            let dukaten = getValue('system.geld.dukaten')
            if (kreuzer > 10) {
                const div = Math.floor(kreuzer / 10)
                heller += div
                kreuzer -= div * 10
            }
            if (heller > 10) {
                const div = Math.floor(heller / 10)
                silbertaler += div
                heller -= div * 10
            }
            if (silbertaler > 10) {
                const div = Math.floor(silbertaler / 10)
                dukaten += div
                silbertaler -= div * 10
            }
            await this.actor.update({
                'system.geld.kreuzer': kreuzer,
                'system.geld.heller': heller,
                'system.geld.silbertaler': silbertaler,
                'system.geld.dukaten': dukaten,
            })
        }
    }

    /**
     * Handle HP update when wounds/exhaustion change
     * @param {Event} event - The input event
     * @protected
     */
    _onHpUpdate(event) {
        const einschraenkungen = Math.floor(
            this.actor.system.gesundheit.wunden + this.actor.system.gesundheit.erschoepfung,
        )
        const new_hp = this.actor.system.gesundheit.hp.max - einschraenkungen
        this.actor.update({ 'system.gesundheit.hp.value': new_hp })

        // Update open combat dialogs when wounds or exhaustion change (with debouncing)
        if (this._hpUpdateTimeout) {
            clearTimeout(this._hpUpdateTimeout)
        }

        this._hpUpdateTimeout = setTimeout(() => {
            this._updateOpenCombatDialogs()
        }, 300)
    }

    _onSelectedKampfstil(event) {
        const selected_kampfstil = event.target.value
        this.actor.update({ 'system.misc.selected_kampfstil': selected_kampfstil })
    }

    _onSelectedUebernatuerlichenStil(event) {
        const selected_stil = event.target.value
        this.actor.update({ 'system.misc.selected_uebernatuerlicher_stil': selected_stil })
    }

    async _onDropActiveEffect(event, data) {
        const effect = await ActiveEffect.fromDropData(data)
        if (!effect) return

        const effectData = effect.toObject()
        delete effectData._id
        effectData.origin = this.actor.uuid
        foundry.utils.setProperty(effectData, 'flags.ilaris.sourceType', 'manual')

        const created = await this.actor.createEmbeddedDocuments('ActiveEffect', [effectData])
        if (created?.length > 0) {
            ui.notifications.info(
                `Effekt "${effect.name}" wurde auf ${this.actor.name} angewendet.`,
            )
        }
        return created
    }

    _onDropItemCreate(item) {
        if (item.type === 'manoever') {
            let bogen = 'Bogen'
            if (this.actor.type === 'held') {
                bogen = 'Heldenbogen'
            } else {
                bogen = 'Werteblock'
            }
            Dialog.prompt({
                content: `Manöver stehen automatisch zur Verfügung, wenn die Vorraussetzungen erfüllt sind. Um ein neues aufbauendes Manöver zu lernen, ziehe den Entsprechenden Vorteil auf den ${bogen}.`,
                callback: () => {},
            })
        } else {
            super._onDropItemCreate(item)
        }
    }

    /**
     * Handle item creation
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The target element with data-action
     */
    static async onItemCreate(event, target) {
        const itemclass = target.dataset.itemclass

        // Get item templates from config
        const itemTemplates = ILARIS.itemTemplates

        // Handle special case for ActiveEffect
        if (itemclass === 'effect') {
            const created = await this.actor.createEmbeddedDocuments('ActiveEffect', [
                { name: 'Neuer Effekt', icon: 'icons/svg/aura.svg' },
            ])
            if (created && created.length > 0) {
                created[0].sheet.render(true)
            }
            return
        }

        // Handle special case for vorteil
        if (itemclass === 'vorteil') {
            game.packs.get('Ilaris.vorteile').render(true)
            Dialog.prompt({
                content:
                    'Du kannst Vorteile direkt aus den Kompendium Packs auf den Statblock ziehen. Für eigene Vor/Nachteile zu erstellen, die nicht im Regelwerk enthalten sind, benutze die Eigenschaften.',
                callback: () => {},
            })
            return
        }

        // Get template or use generic fallback
        const template = itemTemplates[itemclass] || {
            name: 'Neues generisches Item',
            type: itemclass,
            system: {},
            logMessage: 'Neues generisches Item',
        }

        // Create base item data
        let itemData = {
            name: template.name,
            type: template.type,
            system: { ...template.system },
        }

        // Apply custom handler if present
        if (template.customHandler) {
            template.customHandler(itemData, event)
        }

        try {
            // Create the item and render its sheet
            const created = await this.actor.createEmbeddedDocuments('Item', [itemData])
            if (created && created.length > 0) {
                created[0].sheet.render(true)
            }
        } catch (err) {
            console.error('ILARIS | Error creating item:', err)
            ui.notifications.error('Fehler beim Erstellen des Items.')
        }
    }

    /**
     * Handle item editing
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The target element with data-action
     */
    static onItemEdit(event, target) {
        const itemID = target.dataset.itemid
        const itemClass = target.dataset.itemclass

        // Handle effects differently from items
        if (itemClass === 'effect') {
            const effect = this.actor.appliedEffects.find((e) => e.id === itemID)
            if (effect) {
                effect.sheet.render(true)
            } else {
                ui.notifications.warn('Effekt nicht gefunden.')
            }
            return
        }

        const item = this.actor.items.get(itemID)
        if (item) {
            item.sheet.render(true)
        } else {
            ui.notifications.warn('Item nicht gefunden.')
        }
    }

    /**
     * Handle item deletion
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The target element with data-action
     */
    static async onItemDelete(event, target) {
        const itemID = target.dataset.itemid
        const itemClass = target.dataset.itemclass

        try {
            if (itemClass === 'effect') {
                const effect = this.actor.appliedEffects.find((entry) => entry.id === itemID)
                const nachbrennenSource = effect?.system?.ilarisCondition?.sources?.find(
                    (source) => source.type === 'nachbrennen',
                )
                // The existing effect-row trash control is the extinguishing action.
                // Preserve any independent source entries sharing this condition effect.
                if (nachbrennenSource) {
                    await removeConditionSource(this.actor, effect, nachbrennenSource.id)
                    return
                }
                await this.actor.deleteEmbeddedDocuments('ActiveEffect', [itemID])
            } else {
                await this.actor.deleteEmbeddedDocuments('Item', [itemID])
            }
        } catch (err) {
            console.error('ILARIS | Error deleting item:', err)
            ui.notifications.error('Fehler beim Löschen des Items.')
        }
    }

    static async onEscapeEffect(event, target) {
        await startOpposedEscape(this.actor, target.dataset.itemid)
    }

    /**
     * Sync items from compendium
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The target element with data-action
     */
    static async onSyncItems(event, target) {
        try {
            // Get all available Item compendiums in the world
            const selectedPacks = []
            for (const pack of game.packs) {
                if (pack.metadata.type === 'Item') {
                    selectedPacks.push(pack.collection)
                }
            }

            if (!selectedPacks || selectedPacks.length === 0) {
                ui.notifications.warn('Keine Item-Kompendien gefunden.')
                return
            }

            // Get all vorteile, übernatürliche talente, and waffen from the actor
            const itemsToSync = this.actor.items.filter(
                (item) =>
                    item.type === 'vorteil' ||
                    item.type === 'zauber' ||
                    item.type === 'liturgie' ||
                    item.type === 'anrufung' ||
                    item.type === 'nahkampfwaffe' ||
                    item.type === 'fernkampfwaffe',
            )

            if (itemsToSync.length === 0) {
                ui.notifications.info(
                    'Keine Vorteile, Übernatürliche Talente oder Waffen zum Synchronisieren gefunden.',
                )
                return
            }

            let updatedCount = 0
            const updatePromises = []
            const itemsToDelete = []
            const itemsToAdd = []

            // Get items from selected compendium packs
            for (const packId of selectedPacks) {
                const pack = game.packs.get(packId)
                if (!pack) continue

                const packItems = await pack.getDocuments()

                for (const actorItem of itemsToSync) {
                    // Find matching item in compendium by name (ignore type as it might be wrong)
                    const compendiumItem = packItems.find(
                        (packItem) => packItem.name === actorItem.name,
                    )

                    if (compendiumItem) {
                        // Check if type matches, if not we need to update
                        const typeChanged = actorItem.type !== compendiumItem.type

                        // Check if update is needed by comparing key fields
                        const needsUpdate =
                            typeChanged || this._needsItemUpdate(actorItem, compendiumItem)

                        if (needsUpdate) {
                            // For vorteile or type changes, delete and re-add from compendium
                            // (Foundry VTT does not allow changing an item's type via update)
                            if (compendiumItem.type === 'vorteil' || typeChanged) {
                                itemsToDelete.push(actorItem.id)
                                itemsToAdd.push(compendiumItem.toObject())
                                updatedCount++
                            } else {
                                // For other item types, use the update approach
                                // Prepare update data based on item type
                                const updateData = {
                                    _id: actorItem.id,
                                    'system.text': compendiumItem.system.text,
                                }

                                // Add type-specific fields (use compendiumItem.type since that's the correct type)
                                if (
                                    compendiumItem.type === 'zauber' ||
                                    compendiumItem.type === 'liturgie' ||
                                    compendiumItem.type === 'anrufung'
                                ) {
                                    // Update all übernatürlich_talent template fields
                                    if (compendiumItem.system.fertigkeiten !== undefined) {
                                        updateData['system.fertigkeiten'] =
                                            compendiumItem.system.fertigkeiten
                                    }
                                    if (
                                        compendiumItem.system.fertigkeit_ausgewaehlt !== undefined
                                    ) {
                                        updateData['system.fertigkeit_ausgewaehlt'] =
                                            compendiumItem.system.fertigkeit_ausgewaehlt
                                    }
                                    if (compendiumItem.system.maechtig !== undefined) {
                                        updateData['system.maechtig'] =
                                            compendiumItem.system.maechtig
                                    }
                                    if (compendiumItem.system.schwierigkeit !== undefined) {
                                        updateData['system.schwierigkeit'] =
                                            compendiumItem.system.schwierigkeit
                                    }
                                    if (compendiumItem.system.modifikationen !== undefined) {
                                        updateData['system.modifikationen'] =
                                            compendiumItem.system.modifikationen
                                    }
                                    if (compendiumItem.system.vorbereitung !== undefined) {
                                        updateData['system.vorbereitung'] =
                                            compendiumItem.system.vorbereitung
                                    }
                                    if (compendiumItem.system.ziel !== undefined) {
                                        updateData['system.ziel'] = compendiumItem.system.ziel
                                    }
                                    if (compendiumItem.system.reichweite !== undefined) {
                                        updateData['system.reichweite'] =
                                            compendiumItem.system.reichweite
                                    }
                                    if (compendiumItem.system.wirkungsdauer !== undefined) {
                                        updateData['system.wirkungsdauer'] =
                                            compendiumItem.system.wirkungsdauer
                                    }
                                    if (compendiumItem.system.kosten !== undefined) {
                                        updateData['system.kosten'] = compendiumItem.system.kosten
                                    }
                                    if (compendiumItem.system.erlernen !== undefined) {
                                        updateData['system.erlernen'] =
                                            compendiumItem.system.erlernen
                                    }
                                } else if (
                                    compendiumItem.type === 'nahkampfwaffe' ||
                                    compendiumItem.type === 'fernkampfwaffe'
                                ) {
                                    // Initialize ALL weapon fields from data model schema.
                                    // Use compendium value first, then fall back to schema default.
                                    // This ensures JSON-imported actors get fully initialized even
                                    // when both the actor item and compendium source lack a field.
                                    //
                                    // Fields intentionally NOT synced (actor-local state):
                                    //   hauptwaffe, nebenwaffe (equip status), computed (derived),
                                    //   quantity (top-level Item property, not system)

                                    const defaults =
                                        compendiumItem.type === 'nahkampfwaffe'
                                            ? createNahkampfwaffeDefaults()
                                            : createFernkampfwaffeDefaults()

                                    // Exclude actor-local fields from sync
                                    const SKIP = new Set(['hauptwaffe', 'nebenwaffe', 'quantity'])

                                    for (const field of Object.keys(defaults)) {
                                        if (SKIP.has(field)) continue
                                        // Prefer compendium value, then fall back to schema default
                                        const value =
                                            compendiumItem.system[field] ?? defaults[field]
                                        if (value !== undefined) {
                                            updateData[`system.${field}`] = value
                                        }
                                    }
                                }

                                updatePromises.push(updateData)
                                updatedCount++
                            }
                        }
                    }
                }
            }

            // First, delete items marked for deletion (vorteile)
            if (itemsToDelete.length > 0) {
                await this.actor.deleteEmbeddedDocuments('Item', itemsToDelete)
            }

            // Then add new items from compendium (vorteile)
            if (itemsToAdd.length > 0) {
                await this.actor.createEmbeddedDocuments('Item', itemsToAdd)
            }

            // Apply updates for other item types
            if (updatePromises.length > 0) {
                await this.actor.updateEmbeddedDocuments('Item', updatePromises)
            }

            // Show notification
            if (updatedCount > 0) {
                ui.notifications.info(`${updatedCount} Items erfolgreich synchronisiert.`)
            } else {
                ui.notifications.info('Alle Items sind bereits aktuell.')
            }
        } catch (err) {
            console.error('ILARIS | Error syncing items:', err)
            ui.notifications.error('Fehler beim Synchronisieren der Items.')
        }
    }

    _needsItemUpdate(actorItem, compendiumItem) {
        // Compare key fields to determine if update is needed
        let needsUpdate = actorItem.system.text !== compendiumItem.system.text

        // Check type-specific fields
        if (actorItem.type === 'vorteil') {
            needsUpdate =
                needsUpdate ||
                actorItem.system.sephrastoScript !== compendiumItem.system.sephrastoScript ||
                actorItem.system.stilBedingungen !== compendiumItem.system.stilBedingungen ||
                actorItem.system.foundryScript !== compendiumItem.system.foundryScript ||
                actorItem.system.voraussetzung !== compendiumItem.system.voraussetzung
        } else if (
            actorItem.type === 'zauber' ||
            actorItem.type === 'liturgie' ||
            actorItem.type === 'anrufung'
        ) {
            // Check all übernatürlich_talent template fields
            needsUpdate =
                needsUpdate ||
                (compendiumItem.system.fertigkeiten !== undefined &&
                    actorItem.system.fertigkeiten !== compendiumItem.system.fertigkeiten) ||
                (compendiumItem.system.fertigkeit_ausgewaehlt !== undefined &&
                    actorItem.system.fertigkeit_ausgewaehlt !==
                        compendiumItem.system.fertigkeit_ausgewaehlt) ||
                (compendiumItem.system.maechtig !== undefined &&
                    actorItem.system.maechtig !== compendiumItem.system.maechtig) ||
                (compendiumItem.system.schwierigkeit !== undefined &&
                    actorItem.system.schwierigkeit !== compendiumItem.system.schwierigkeit) ||
                (compendiumItem.system.modifikationen !== undefined &&
                    actorItem.system.modifikationen !== compendiumItem.system.modifikationen) ||
                (compendiumItem.system.vorbereitung !== undefined &&
                    actorItem.system.vorbereitung !== compendiumItem.system.vorbereitung) ||
                (compendiumItem.system.ziel !== undefined &&
                    actorItem.system.ziel !== compendiumItem.system.ziel) ||
                (compendiumItem.system.reichweite !== undefined &&
                    actorItem.system.reichweite !== compendiumItem.system.reichweite) ||
                (compendiumItem.system.wirkungsdauer !== undefined &&
                    actorItem.system.wirkungsdauer !== compendiumItem.system.wirkungsdauer) ||
                (compendiumItem.system.kosten !== undefined &&
                    actorItem.system.kosten !== compendiumItem.system.kosten) ||
                (compendiumItem.system.erlernen !== undefined &&
                    actorItem.system.erlernen !== compendiumItem.system.erlernen)
        } else if (actorItem.type === 'nahkampfwaffe' || actorItem.type === 'fernkampfwaffe') {
            // Check weapon-specific fields
            // Helper function to compare eigenschaften arrays
            const eigenschaftenChanged = () => {
                const actorEigen = actorItem.system.eigenschaften
                const compEigen = compendiumItem.system.eigenschaften

                // If both are arrays, compare them
                if (Array.isArray(actorEigen) && Array.isArray(compEigen)) {
                    if (actorEigen.length !== compEigen.length) return true
                    const sortedActor = [...actorEigen].sort()
                    const sortedComp = [...compEigen].sort()
                    return sortedActor.some((val, idx) => val !== sortedComp[idx])
                }

                // If formats differ (one is object, one is array), needs update
                if (typeof actorEigen !== typeof compEigen) return true

                // If both are objects (old format), compare them
                if (
                    typeof actorEigen === 'object' &&
                    !Array.isArray(actorEigen) &&
                    typeof compEigen === 'object' &&
                    !Array.isArray(compEigen)
                ) {
                    return JSON.stringify(actorEigen) !== JSON.stringify(compEigen)
                }

                return false
            }

            needsUpdate =
                needsUpdate ||
                eigenschaftenChanged() ||
                (compendiumItem.system.tp !== undefined &&
                    actorItem.system.tp !== compendiumItem.system.tp) ||
                (compendiumItem.system.fertigkeit !== undefined &&
                    actorItem.system.fertigkeit !== compendiumItem.system.fertigkeit) ||
                (compendiumItem.system.talent !== undefined &&
                    actorItem.system.talent !== compendiumItem.system.talent) ||
                (compendiumItem.system.rw !== undefined &&
                    actorItem.system.rw !== compendiumItem.system.rw) ||
                (compendiumItem.system.text !== undefined &&
                    actorItem.system.text !== compendiumItem.system.text) ||
                (compendiumItem.system.manoverausgleich !== undefined &&
                    JSON.stringify(actorItem.system.manoverausgleich) !==
                        JSON.stringify(compendiumItem.system.manoverausgleich)) ||
                (compendiumItem.system.haerte !== undefined &&
                    actorItem.system.haerte !== compendiumItem.system.haerte) ||
                (compendiumItem.system.beschaedigung !== undefined &&
                    actorItem.system.beschaedigung !== compendiumItem.system.beschaedigung) ||
                (compendiumItem.system.aufbewahrungs_ort !== undefined &&
                    actorItem.system.aufbewahrungs_ort !==
                        compendiumItem.system.aufbewahrungs_ort) ||
                (compendiumItem.system.bewahrt_auf !== undefined &&
                    JSON.stringify(actorItem.system.bewahrt_auf) !==
                        JSON.stringify(compendiumItem.system.bewahrt_auf)) ||
                (compendiumItem.system.gewicht_summe !== undefined &&
                    actorItem.system.gewicht_summe !== compendiumItem.system.gewicht_summe) ||
                (compendiumItem.system.gewicht !== undefined &&
                    actorItem.system.gewicht !== compendiumItem.system.gewicht) ||
                (compendiumItem.system.preis !== undefined &&
                    actorItem.system.preis !== compendiumItem.system.preis) ||
                (compendiumItem.system.quantity !== undefined &&
                    actorItem.system.quantity !== compendiumItem.system.quantity) ||
                // Nahkampfwaffe-specific
                (compendiumItem.type === 'nahkampfwaffe' &&
                    ((compendiumItem.system.wm_at !== undefined &&
                        actorItem.system.wm_at !== compendiumItem.system.wm_at) ||
                        (compendiumItem.system.wm_vt !== undefined &&
                            actorItem.system.wm_vt !== compendiumItem.system.wm_vt) ||
                        (compendiumItem.system.rw_mod !== undefined &&
                            actorItem.system.rw_mod !== compendiumItem.system.rw_mod))) ||
                // Fernkampfwaffe-specific
                (compendiumItem.type === 'fernkampfwaffe' &&
                    ((compendiumItem.system.wm_fk !== undefined &&
                        actorItem.system.wm_fk !== compendiumItem.system.wm_fk) ||
                        (compendiumItem.system.lz !== undefined &&
                            actorItem.system.lz !== compendiumItem.system.lz) ||
                        (compendiumItem.system.rw_mod !== undefined &&
                            actorItem.system.rw_mod !== compendiumItem.system.rw_mod)))
        }
        return needsUpdate
    }

    async _onSyncKampfstile(event) {
        // Keep the old method for backward compatibility, but redirect to new one
        return IlarisActorSheet.onSyncItems.call(this, event, event.currentTarget)
    }

    _needsKampfstilUpdate(actorItem, compendiumItem) {
        // Keep for backward compatibility
        return this._needsItemUpdate(actorItem, compendiumItem)
    }
}
