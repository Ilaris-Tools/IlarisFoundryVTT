import { wuerfelwurf } from '../common/wuerfel.js'
import { ILARIS } from '../config.js'

export class IlarisActorSheet extends ActorSheet {
    /*
      data ist nicht actor. Ändern, so dass ich nicht mehr in Actor, sondern über data schreibe?
      Und welche Items soll ich nehmen? Actor, data, oder direkt?
      Ansehen, was references und was copys sind.
    */

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['ilaris', 'sheet', 'actor'],
            width: 850,
            height: 750,
            tabs: [
                { navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'kampf' },
            ],
            scrollY: ['.herotab'], // Preserves scroll position for scrollable tab content!
        })
    }

    async getData() {
        const context = super.getData()
        console.log(context)

        context.enrichedBiography = await TextEditor.enrichHTML(this.actor.system.notes, {
            async: true,
        })
        return context
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('.ausklappen-trigger').click((ev) => this._ausklappView(ev))
        html.find('.rollable').click((ev) => this._onRollable(ev))
        html.find('.clickable').click((ev) => this._onClickable(ev))
        html.find('.item-create').click((ev) => this._onItemCreate(ev))
        html.find('.item-edit').click((ev) => this._onItemEdit(ev))
        html.find('.item-delete').click((ev) => this._onItemDelete(ev))
        // html.find('.item-toggle').click(this._onToggleItem.bind(this));
        html.find('.item-toggle').click((ev) => this._onToggleItem(ev))
        html.find('.toggle-bool').click((ev) => this._onToggleBool(ev))
        html.find('.hp-update').on('input change', (ev) => this._onHpUpdate(ev))

        // Add listeners for wound and exhaustion fields on hero sheets (input for real-time updates)
        html.find('input[name="system.gesundheit.wunden"]').on('input', (ev) =>
            this._onHealthValueChange(ev),
        )
        html.find('input[name="system.gesundheit.erschoepfung"]').on('input', (ev) =>
            this._onHealthValueChange(ev),
        )

        // Add listener for sync items button
        html.find('.sync-items').click((ev) => this._onSyncItems(ev))
    }

    _ausklappView(event) {
        // Beachte Block: Ausklappen bei asp/kap sieht kacke aus -> inline
        const targetkey = $(event.currentTarget).data('ausklappentarget')
        const targetId = 'ausklappen-view-'.concat(targetkey)
        var toggleView = document.getElementById(targetId)
        if (toggleView.style.display === 'none') {
            toggleView.style.display = 'table-row'
        } else {
            toggleView.style.display = 'none'
        }
    }

    async _onToggleBool(event) {
        const togglevariable = event.currentTarget.dataset.togglevariable
        let attr = `${togglevariable}`
        let bool_status = foundry.utils.getProperty(this.actor, attr)
        await this.actor.update({ [attr]: !bool_status })

        // Update open combat dialogs if wound penalties were toggled
        if (togglevariable === 'system.gesundheit.wundenignorieren') {
            this._updateOpenCombatDialogs()
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

    async _onToggleItem(event) {
        const itemId = event.currentTarget.dataset.itemid
        const item = this.actor.items.get(itemId)
        console.log(item.system)
        const toggletype = event.currentTarget.dataset.toggletype
        let attr = `system.${toggletype}`
        const otherHandType = toggletype === 'hauptwaffe' ? 'nebenwaffe' : 'hauptwaffe'
        const otherHandAttr = `system.${otherHandType}`

        if (toggletype == 'hauptwaffe' || toggletype == 'nebenwaffe') {
            let item_status = foundry.utils.getProperty(item, attr)

            // Handle two-handed ranged weapons
            if (
                item_status &&
                item.type === 'fernkampfwaffe' &&
                item.system.computed?.handsRequired === 2
            ) {
                await this._unequipWeapon(itemId)
                return
            }

            if (item_status == false) {
                // Handle switching hands for one-handed weapons
                if (
                    (toggletype == 'hauptwaffe' && item.system.nebenwaffe) ||
                    (toggletype == 'nebenwaffe' && item.system.hauptwaffe)
                ) {
                    if (item.system.computed?.handsRequired !== 2) {
                        await item.update({ [otherHandAttr]: false })
                    }
                }

                // Unequip two-handed ranged weapons when equipping any other weapon
                this._unequipTwoHandedRangedWeapons()

                // If equipping a two-handed weapon, unequip all other weapons
                if (item.system.computed?.handsRequired === 2) {
                    this._unequipAllWeaponsExcept(itemId)
                } else {
                    // For one-handed weapons, only unequip from the toggled hand
                    this._unequipHandWeapons(toggletype)

                    // If a two-handed weapon is equipped in both hands, unequip it
                    this._unequipTwoHandedWeaponsInBothHands()
                }
            }

            // For two-handed weapons, always equip in both hands by default
            if (item.system.computed?.handsRequired === 2 && !item_status) {
                await item.update({ [otherHandAttr]: true })
            }

            await item.update({ [attr]: !item_status })
        } else {
            attr = `system.${toggletype}`
            await item.update({ [attr]: !foundry.utils.getProperty(item, attr) })
        }
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

    async _onRollable(event) {
        let systemData = this.actor.system
        // console.log($(event.currentTarget));
        let rolltype = $(event.currentTarget).data('rolltype')
        if (rolltype == 'basic') {
            // NOTE: als Einfaches Beispiel ohne weitere Dialoge und logische Verknüpfungen.
            let label = $(event.currentTarget).data('label')
            let formula = $(event.currentTarget).data('formula')
            let roll = new Roll(formula)
            console.log(formula)
            let speaker = ChatMessage.getSpeaker({ actor: this.actor })
            await roll.evaluate()
            const html_roll = await renderTemplate(
                'systems/Ilaris/templates/chat/probenchat_profan.hbs',
                { title: `${label}` },
            )
            // console.log(html_roll);
            roll.toMessage({
                speaker: speaker,
                flavor: html_roll,
            })
            return 0
        }
        let globalermod = systemData.abgeleitete.globalermod
        let pw = 0
        let label = 'Probe'
        let dice = '3d20dl1dh1'
        // TODO: rolltype=dialog, diagtype=nahkampf/profan/simple usw..
        let dialoge = [
            'angriff_diag',
            'nahkampf_diag',
            'simpleprobe_diag',
            'simpleformula_diag',
            'fernkampf_diag',
            'magie_diag',
            'karma_diag',
            'uefert_diag',
            'fertigkeit_diag',
        ]
        console.log('rolltype')
        console.log(rolltype)
        if (dialoge.includes(rolltype)) {
            console.log('diag')
            wuerfelwurf(event, this.actor)
            return 0
        }
        if (rolltype == 'at') {
            // TODO: simplify this: if rolltype in [...]
            dice = '1d20'
            label = $(event.currentTarget).data('item')
            label = `Attacke (${label})`
            pw = $(event.currentTarget).data('pw')
        } else if (rolltype == 'vt') {
            dice = '1d20'
            label = $(event.currentTarget).data('item')
            label = `Verteidigung (${label})`
            pw = $(event.currentTarget).data('pw')
        } else if (rolltype == 'fk') {
            dice = '1d20'
            label = $(event.currentTarget).data('item')
            label = `Fernkampf (${label})`
            pw = $(event.currentTarget).data('pw')
        } else if (rolltype == 'schaden') {
            label = $(event.currentTarget).data('item')
            label = `Schaden (${label})`
            pw = $(event.currentTarget).data('pw').replace(/[Ww]/g, 'd')
        } else if (rolltype == 'attribut') {
            const attribut_name = $(event.currentTarget).data('attribut')
            label = CONFIG.ILARIS.label[attribut_name]
            pw = systemData.attribute[attribut_name].pw
        } else if (rolltype == 'profan_fertigkeit_pw') {
            label = $(event.currentTarget).data('fertigkeit')
            pw = $(event.currentTarget).data('pw')
        } else if (rolltype == 'profan_fertigkeit_pwt') {
            label = $(event.currentTarget).data('fertigkeit')
            label = label.concat(' (Talent)')
            pw = $(event.currentTarget).data('pwt')
        } else if (rolltype == 'profan_talent') {
            label = $(event.currentTarget).data('fertigkeit')
            label = label.concat(' (', $(event.currentTarget).data('talent'), ')')
            pw = $(event.currentTarget).data('pw')
        } else if (rolltype == 'freie_fertigkeit') {
            label = $(event.currentTarget).data('fertigkeit')
            // console.log($(event.currentTarget).data("pw"))
            pw = Number($(event.currentTarget).data('pw')) * 8 - 2
            // } else if (rolltype == "magie_fertigkeit" || rolltype == "karma_fertigkeit") {
        } else if (rolltype == 'uebernatuerliche_fertigkeit') {
            label = $(event.currentTarget).data('fertigkeit')
            pw = $(event.currentTarget).data('pw')
        } else if (rolltype == 'zauber' || rolltype == 'liturgie') {
            label = $(event.currentTarget).data('talent')
            pw = $(event.currentTarget).data('pw')
        }
        let formula = `${dice} + ${pw} + ${globalermod}`
        if (rolltype == 'at') {
            formula += ` ${systemData.modifikatoren.nahkampfmod > 0 ? '+' : ''}${
                systemData.modifikatoren.nahkampfmod
            }`
        }
        if (rolltype == 'vt') {
            formula += ` ${systemData.modifikatoren.verteidigungmod > 0 ? '+' : ''}${
                systemData.modifikatoren.verteidigungmod
            }`
        }
        if (rolltype == 'schaden') {
            formula = pw
        }
        // let formula = `${data.pw} + 3d20dhdl`;
        let roll = new Roll(formula)
        // roll.roll();
        await roll.evaluate()
        // console.log(roll);
        // let critfumble = roll.result.split(" + ")[1];
        let critfumble = roll.dice[0].results.find((a) => a.active == true).result
        let fumble = false
        let crit = false
        if (critfumble == 20) {
            crit = true
        } else if (critfumble == 1) {
            fumble = true
        }
        // let templateData = {
        //     // title: `${label}-Probe`,
        //     title: label,
        //     crit: crit,
        //     fumble: fumble
        // };
        // // console.log(templateData);
        // let template = 'systems/Ilaris/templates/chat/dreid20.hbs';
        // renderTemplate(template, templateData, roll).then(content => {
        //     if (formula != null) {
        //         roll.toMessage({
        //             flavor: content
        //         });
        //     }
        // });
        let speaker = ChatMessage.getSpeaker({ actor: this.actor })
        // console.log(speaker);
        // console.log(speaker.alias);
        // console.log(this.actor.id);
        const html_roll = await renderTemplate(
            'systems/Ilaris/templates/chat/probenchat_profan.hbs',
            {
                // user: speaker.alias,
                // user: this.actor.id,
                // speaker: speaker.alias,
                title: `${label}`,
                crit: crit,
                fumble: fumble, //,wunden
            },
        )
        // console.log(html_roll);
        roll.toMessage({
            speaker: speaker,
            flavor: html_roll,
        })
    }

    async _onClickable(event) {
        let systemData = this.actor.system
        // console.log($(event.currentTarget));
        let clicktype = $(event.currentTarget).data('clicktype')
        if (clicktype == 'shorten_money') {
            let kreuzer = systemData.geld.kreuzer
            let heller = systemData.geld.heller
            let silbertaler = systemData.geld.silbertaler
            let dukaten = systemData.geld.dukaten
            if (kreuzer > 10) {
                let div = Math.floor(kreuzer / 10)
                heller += div
                kreuzer -= div * 10
            }
            if (heller > 10) {
                let div = Math.floor(heller / 10)
                silbertaler += div
                heller -= div * 10
            }
            if (silbertaler > 10) {
                let div = Math.floor(silbertaler / 10)
                dukaten += div
                silbertaler -= div * 10
            }
            this.actor.update({ 'system.geld.kreuzer': kreuzer })
            this.actor.update({ 'system.geld.heller': heller })
            this.actor.update({ 'system.geld.silbertaler': silbertaler })
            this.actor.update({ 'system.geld.dukaten': dukaten })
        } /* else if (clicktype == "togglewundenignorieren") {
            data.gesundheit.wundenignorieren = !data.gesundheit.wundenignorieren;
        } */
    }

    _onHpUpdate(event) {
        // console.log("HpUpdate");
        // this.actor.token.refresh();
        // console.log(event);
        let einschraenkungen = Math.floor(
            this.actor.system.gesundheit.wunden + this.actor.system.gesundheit.erschoepfung,
        )
        // let old_hp = this.actor.data.data.gesundheit.hp.value;
        let new_hp = this.actor.system.gesundheit.hp.max - einschraenkungen
        // this.actor.data.data.gesundheit.hp.value = new_hp;
        this.actor.update({ 'system.gesundheit.hp.value': new_hp })
        // this.actor.token.actor.data.data.gesundheit.hp.value = new_hp;
        // this.actor.token?.refresh();
        console.log(this.actor)

        // Update open combat dialogs when wounds or exhaustion change (with debouncing)
        if (this._hpUpdateTimeout) {
            clearTimeout(this._hpUpdateTimeout)
        }

        this._hpUpdateTimeout = setTimeout(() => {
            this._updateOpenCombatDialogs()
        }, 300)

        // let token = this.actor.token;
        // console.log(token);
        // this.actor.token.update();
        // token.refresh();
        // console.log(token);
        // console.log(this.actor.token);
        // if (old_hp != new_hp) {
        //     // this.actor.data.data.gesundheit.hp.value = new_hp;
        //     // // console.log(data);
        //     // let actor = game.actors.get(data._id);
        //     // // console.log(actor);
        //     // // eigentlich async:
        //     // if (actor) {
        //     //     actor.update({ "data.gesundheit.hp.value": new_hp });
        //     // }
        //     this.actor.update({ "data.gesundheit.hp.value": new_hp });
        // }
    }

    _onSelectedKampfstil(event) {
        console.log('_onSelectedKampfstil')
        // console.log(event);
        // var selectElement = event.target;
        // console.log(selectElement);
        // var value = selectElement.value;
        let selected_kampfstil = event.target.value
        console.log(selected_kampfstil)
        this.actor.system.misc.selected_kampfstil = selected_kampfstil
        this.actor.update({ 'system.misc.selected_kampfstil': selected_kampfstil })
    }

    _onSelectedUebernatuerlichenStil(event) {
        console.log('_onSelectedUebernatuerlichenStil')
        let selected_stil = event.target.value
        console.log(selected_stil)
        this.actor.system.misc.selected_uebernatuerlicher_stil = selected_stil
        this.actor.update({ 'system.misc.selected_uebernatuerlicher_stil': selected_stil })
    }

    _onDropItemCreate(item) {
        if (item.type == 'manoever') {
            let bogen = 'Bogen'
            if (this.actor.type == 'held') {
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

    async _onItemCreate(event) {
        console.log('ItemCreate')
        let itemclass = $(event.currentTarget).data('itemclass')
        console.log(itemclass)

        // Get item templates from config
        const itemTemplates = ILARIS.itemTemplates

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

        console.log(template.logMessage)

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

        // Log for generic items
        if (!itemTemplates[itemclass]) {
            console.log(itemclass)
            console.log(itemData)
        }

        // Create the item and render its sheet
        const created = await this.actor.createEmbeddedDocuments('Item', [itemData])
        if (created && created.length > 0) {
            created[0].sheet.render(true)
        }
    }

    _onItemEdit(event) {
        console.log('ItemEdit')
        const itemID = event.currentTarget.dataset.itemid
        const itemClass = event.currentTarget.dataset.itemclass

        // Handle effects differently from items
        if (itemClass === 'effect') {
            const effect = this.actor.appliedEffects.find((e) => e.id === itemID)
            if (effect) {
                effect.sheet.render(true)
            } else {
                console.error('Effect not found with ID:', itemID)
            }
            return
        }

        const item = this.actor.items.get(itemID)
        item.sheet.render(true)
    }

    _onItemDelete(event) {
        console.log('ItemDelete')
        const itemID = event.currentTarget.dataset.itemid
        const itemClass = event.currentTarget.dataset.itemclass
        if (itemClass === 'effect') {
            this.actor.deleteEmbeddedDocuments('ActiveEffect', [itemID])
        } else {
            this.actor.deleteEmbeddedDocuments('Item', [itemID])
        }
        // li.slideUp(200, () => this.render(false));
    }

    async _onSyncItems(event) {
        console.log('Sync Items (Vorteile, Übernatürliche Talente, and Waffen)')

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

            console.log(`Found ${selectedPacks.length} Item compendiums to search`)

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

            console.log(`Found ${itemsToSync.length} items to sync`)

            if (itemsToSync.length === 0) {
                ui.notifications.info(
                    'Keine Vorteile, Übernatürliche Talente oder Waffen zum Synchronisieren gefunden.',
                )
                return
            }

            let updatedCount = 0
            const updatePromises = []

            // Get items from selected compendium packs
            for (const packId of selectedPacks) {
                const pack = game.packs.get(packId)
                if (!pack) continue

                const packItems = await pack.getDocuments()

                console.log(`Checking pack: ${pack.metadata.label} with ${packItems.length} items`)

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
                        if (actorItem.name === 'Bannfluch des Heiligen Khalid') {
                            console.log('Bannfluch des Heiligen Khalid needs update:', needsUpdate)
                        }

                        if (needsUpdate) {
                            // Prepare update data based on item type
                            const updateData = {
                                _id: actorItem.id,
                                'system.text': compendiumItem.system.text,
                            }

                            // Update type if it changed
                            if (typeChanged) {
                                updateData['type'] = compendiumItem.type
                                console.log(
                                    `Type mismatch for ${actorItem.name}: ${actorItem.type} -> ${compendiumItem.type}`,
                                )
                            }

                            // Add type-specific fields (use compendiumItem.type since that's the correct type)
                            if (compendiumItem.type === 'vorteil') {
                                updateData['system.sephrastoScript'] =
                                    compendiumItem.system.sephrastoScript
                                updateData['system.stilBedingungen'] =
                                    compendiumItem.system.stilBedingungen
                                updateData['system.foundryScript'] =
                                    compendiumItem.system.foundryScript
                                updateData['system.voraussetzung'] =
                                    compendiumItem.system.voraussetzung

                                // Update active effects for vorteile
                                // Delete ALL old effects from the item
                                const oldEffects = Array.from(actorItem.effects)
                                if (oldEffects.length > 0) {
                                    await actorItem.deleteEmbeddedDocuments(
                                        'ActiveEffect',
                                        oldEffects.map((e) => e.id),
                                    )
                                }

                                // Create new effects from compendium
                                if (compendiumItem.effects && compendiumItem.effects.size > 0) {
                                    const newEffects = Array.from(compendiumItem.effects).map((e) =>
                                        e.toObject(),
                                    )
                                    await actorItem.createEmbeddedDocuments(
                                        'ActiveEffect',
                                        newEffects,
                                    )
                                }
                            } else if (
                                compendiumItem.type === 'zauber' ||
                                compendiumItem.type === 'liturgie' ||
                                compendiumItem.type === 'anrufung'
                            ) {
                                // Update all übernatürlich_talent template fields
                                if (compendiumItem.system.fertigkeiten !== undefined) {
                                    updateData['system.fertigkeiten'] =
                                        compendiumItem.system.fertigkeiten
                                }
                                if (compendiumItem.system.fertigkeit_ausgewaehlt !== undefined) {
                                    updateData['system.fertigkeit_ausgewaehlt'] =
                                        compendiumItem.system.fertigkeit_ausgewaehlt
                                }
                                if (compendiumItem.system.maechtig !== undefined) {
                                    updateData['system.maechtig'] = compendiumItem.system.maechtig
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
                                    updateData['system.erlernen'] = compendiumItem.system.erlernen
                                }
                            } else if (
                                compendiumItem.type === 'nahkampfwaffe' ||
                                compendiumItem.type === 'fernkampfwaffe'
                            ) {
                                // Update weapon-specific fields
                                if (compendiumItem.system.eigenschaften !== undefined) {
                                    updateData['system.eigenschaften'] =
                                        compendiumItem.system.eigenschaften
                                }
                                if (compendiumItem.system.gewicht !== undefined) {
                                    updateData['system.gewicht'] = compendiumItem.system.gewicht
                                }
                                if (compendiumItem.system.preis !== undefined) {
                                    updateData['system.preis'] = compendiumItem.system.preis
                                }
                                if (compendiumItem.system.tp !== undefined) {
                                    updateData['system.tp'] = compendiumItem.system.tp
                                }
                                if (compendiumItem.system.at_mod !== undefined) {
                                    updateData['system.at_mod'] = compendiumItem.system.at_mod
                                }
                                if (compendiumItem.system.vt_mod !== undefined) {
                                    updateData['system.vt_mod'] = compendiumItem.system.vt_mod
                                }
                                if (compendiumItem.system.beschreibung !== undefined) {
                                    updateData['system.beschreibung'] =
                                        compendiumItem.system.beschreibung
                                }

                                // Additional fields for fernkampfwaffe
                                if (compendiumItem.type === 'fernkampfwaffe') {
                                    if (compendiumItem.system.reichweite_mod !== undefined) {
                                        updateData['system.reichweite_mod'] =
                                            compendiumItem.system.reichweite_mod
                                    }
                                    if (compendiumItem.system.ladezeit !== undefined) {
                                        updateData['system.ladezeit'] =
                                            compendiumItem.system.ladezeit
                                    }
                                }
                            }

                            updatePromises.push(updateData)
                            updatedCount++
                            console.log(`Updating ${actorItem.name} (${actorItem.type})`)
                        }
                    }
                }
            }

            // Apply all updates at once
            if (updatePromises.length > 0) {
                await this.actor.updateEmbeddedDocuments('Item', updatePromises)
                ui.notifications.info(`${updatedCount} Items erfolgreich synchronisiert.`)
            } else {
                ui.notifications.info('Alle Items sind bereits aktuell.')
            }
        } catch (error) {
            console.error('Error syncing items:', error)
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
                (compendiumItem.system.gewicht !== undefined &&
                    actorItem.system.gewicht !== compendiumItem.system.gewicht) ||
                (compendiumItem.system.preis !== undefined &&
                    actorItem.system.preis !== compendiumItem.system.preis) ||
                (compendiumItem.system.tp !== undefined &&
                    actorItem.system.tp !== compendiumItem.system.tp) ||
                (compendiumItem.system.at_mod !== undefined &&
                    actorItem.system.at_mod !== compendiumItem.system.at_mod) ||
                (compendiumItem.system.vt_mod !== undefined &&
                    actorItem.system.vt_mod !== compendiumItem.system.vt_mod) ||
                (compendiumItem.system.beschreibung !== undefined &&
                    actorItem.system.beschreibung !== compendiumItem.system.beschreibung) ||
                (compendiumItem.type === 'fernkampfwaffe' &&
                    ((compendiumItem.system.reichweite_mod !== undefined &&
                        actorItem.system.reichweite_mod !== compendiumItem.system.reichweite_mod) ||
                        (compendiumItem.system.ladezeit !== undefined &&
                            actorItem.system.ladezeit !== compendiumItem.system.ladezeit)))
        }
        return needsUpdate
    }

    async _onSyncKampfstile(event) {
        // Keep the old method for backward compatibility, but redirect to new one
        return this._onSyncItems(event)
    }

    _needsKampfstilUpdate(actorItem, compendiumItem) {
        // Keep for backward compatibility
        return this._needsItemUpdate(actorItem, compendiumItem)
    }
}
