import {
    IlarisGameSettingNames,
    IlarisAutomatisierungSettingNames,
    ConfigureGameSettingsCategories,
} from './configure-game-settings.model.js'

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api
const TAB_IDS = {
    USED_COMPENDIEN: 'USED_COMPENDIEN',
    AUTOMATION: 'AUTOMATION',
    GENERAL: 'GENERAL',
}

export class IlarisSettingsDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'settings-dialog'],
        position: {
            width: 900,
            height: 'auto',
        },
        window: {
            resizable: true,
            title: 'Ilaris Einstellungen',
        },
        actions: {
            saveSettings: IlarisSettingsDialog.#onSaveSettings,
            resetSettings: IlarisSettingsDialog.#onResetSettings,
        },
        id: 'settings-dialog',
    }

    /** @override */
    static PARTS = {
        header: {
            template: 'systems/Ilaris/scripts/settings/templates/ilaris-settings_header.hbs',
        },
        tabs: {
            template: 'systems/Ilaris/scripts/settings/templates/ilaris-settings_navigation.hbs',
        },
        [TAB_IDS.AUTOMATION]: {
            template: 'systems/Ilaris/scripts/settings/templates/ilaris-settings_automation.hbs',
            scrollable: [''],
        },
        [TAB_IDS.USED_COMPENDIEN]: {
            template: 'systems/Ilaris/scripts/settings/templates/ilaris-settings_compendien.hbs',
            scrollable: [''],
        },
        [TAB_IDS.GENERAL]: {
            template: 'systems/Ilaris/scripts/settings/templates/ilaris-settings_general.hbs',
            scrollable: [''],
        },
        footer: {
            template: 'systems/Ilaris/scripts/settings/templates/ilaris-settings_footer.hbs',
        },
    }

    /** @override */
    static TABS = {
        primary: {
            initial: TAB_IDS.USED_COMPENDIEN,
            tabs: [
                { id: TAB_IDS.USED_COMPENDIEN, label: 'Benutzte Kompendien' },
                { id: TAB_IDS.GENERAL, label: 'Allgemein' },
                { id: TAB_IDS.AUTOMATION, label: 'Automatisierung' },
            ],
        },
    }

    constructor(options = {}) {
        super(options)
        this.damageTypes = null
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        if (!game.user.isGM && this.tabGroups.primary !== TAB_IDS.GENERAL) {
            this.tabGroups.primary = TAB_IDS.GENERAL
        }
        context.tabs = this._prepareTabs('primary')
        context.isGM = game.user.isGM
        context.compendienPacks = this._generateAllPacksContext()
        context.defaultRangedDodgeOptions = await this._getDefaultRangedDodgeOptions()
        context.settings = {
            useSceneEnvironment: game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisAutomatisierungSettingNames.useSceneEnvironment,
            ),
            useTargetSelection: game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisAutomatisierungSettingNames.useTargetSelection,
            ),
            weaponSpaceRequirement: game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.weaponSpaceRequirement,
            ),
            realFumbleCrits: game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.realFumbleCrits,
            ),
            expandWeaponDamageMultipliers: game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.expandWeaponDamageMultipliers,
            ),
            renameTriumphWithCrit: game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.renameTriumphWithCrit,
            ),
            restrictEnergyCostSetting: game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.restrictEnergyCostSetting,
            ),
            hideSyncKampfstileButton: game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.hideSyncKampfstileButton,
            ),
            enableTabbingCharacterSheet: game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.enableTabbingCharacterSheet,
            ),
            showDiceRollInChat: game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.showDiceRollInChat,
            ),
            hexTokenShapes: game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.hexTokenShapes,
            ),
            defaultRangedDodgeTalent: game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.defaultRangedDodgeTalent,
            ),
            lepSystem: game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.lepSystem,
            ),
            supernaturalEffectStacking: game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.supernaturalEffectStacking,
            ),
            llmApiUrl: game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.llmApiUrl,
            ),
            llmApiKey: game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.llmApiKey,
            ),
            llmModel: game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.llmModel,
            ),
        }

        context.damageTypes = this.damageTypes ??= this._parseDamageTypes()

        return context
    }

    _parseDamageTypes() {
        try {
            const raw = game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.damageTypes,
            )
            const damageTypes = JSON.parse(raw || '[]')
            if (!Array.isArray(damageTypes)) return []
            return damageTypes.map((type) => ({
                value: type.value || '',
                label: type.label || '',
                behavior: {
                    healing: type.behavior?.healing === true,
                    targetsErschoepfung: type.behavior?.targetsErschoepfung === true,
                    bypassesArmor: type.behavior?.bypassesArmor === true,
                },
            }))
        } catch (e) {
            console.warn('Ilaris | Failed to parse damageTypes setting:', e)
            return []
        }
    }

    async _getDefaultRangedDodgeOptions() {
        const options = [{ value: '', label: '-- Kein Alternativ-Talent --' }]

        // Talent options only from selected talente packs
        const selectedTalentePacks = JSON.parse(
            game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.talentePacks,
            ) || '[]',
        )

        const talents = new Map()
        for (const packId of selectedTalentePacks) {
            const pack = game.packs.get(packId)
            if (!pack || pack.metadata.type !== 'Item') continue
            try {
                const index = pack.index?.size ? pack.index : await pack.getIndex()
                for (const indexEntry of index) {
                    if (indexEntry.type !== 'talent') continue
                    const uuid = `Compendium.${pack.collection}.${indexEntry._id}`
                    talents.set(uuid, indexEntry.name)
                }
            } catch (error) {
                console.warn(`Could not read pack index for ${pack.collection}`, error)
            }
        }

        const sortedTalents = Array.from(talents.entries()).sort((a, b) =>
            a[1].localeCompare(b[1], 'de'),
        )
        for (const [value, label] of sortedTalents) {
            options.push({ value, label })
        }

        return options
    }

    async _preparePartContext(partId, context) {
        switch (partId) {
            case TAB_IDS.USED_COMPENDIEN:
            case TAB_IDS.AUTOMATION:
            case TAB_IDS.GENERAL:
                context.tab = context.tabs[partId]
                break
            default:
        }
        return context
    }

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options)

        this.element.querySelector('.add-damage-type')?.addEventListener('click', async (event) => {
            event.preventDefault()
            const damageType = await this.#openDamageTypeDialog()
            if (!damageType) return
            this.damageTypes.push(damageType)
            this.render()
        })

        this.element
            .querySelector('.damage-type-list')
            ?.addEventListener('click', async (event) => {
                const btn = event.target.closest('.delete-damage-type')
                const editBtn = event.target.closest('.edit-damage-type')
                if (!btn && !editBtn) return
                event.preventDefault()

                const index = Number((btn || editBtn).dataset.index)
                if (index < 0) return

                if (btn) {
                    this.damageTypes.splice(index, 1)
                    this.render()
                    return
                }

                const damageType = await this.#openDamageTypeDialog(this.damageTypes[index])
                if (!damageType) return
                this.damageTypes[index] = damageType
                this.render()
            })
    }

    async #openDamageTypeDialog(existing = null) {
        const html = await foundry.applications.handlebars.renderTemplate(
            'systems/Ilaris/scripts/settings/templates/damage-type-dialog.hbs',
            {
                value: existing?.value || '',
                label: existing?.label || '',
                behavior: existing?.behavior || {},
            },
        )
        const content = document.createElement('div')
        content.innerHTML = html
        const formData = await foundry.applications.api.DialogV2.input({
            window: { title: existing ? 'Schadenstyp bearbeiten' : 'Neuer Schadenstyp' },
            content,
            ok: { label: 'Übernehmen' },
        })
        if (!formData) return null

        const value = formData.value?.trim()
        const label = formData.label?.trim()
        if (!value || !label) {
            ui.notifications.warn('Schadenstypen benötigen einen Key und einen Anzeigenamen.')
            return null
        }

        return {
            value,
            label,
            behavior: {
                healing: formData.healing === true || formData.healing === 'on',
                targetsErschoepfung:
                    formData.targetsErschoepfung === true || formData.targetsErschoepfung === 'on',
                bypassesArmor: formData.bypassesArmor === true || formData.bypassesArmor === 'on',
            },
        }
    }

    _generateAllPacksContext() {
        const getSelection = (settingName) =>
            JSON.parse(game.settings.get(ConfigureGameSettingsCategories.Ilaris, settingName))

        const fertigkeitenSelection = getSelection(IlarisGameSettingNames.fertigkeitenPacks)
        const waffenSelection = getSelection(IlarisGameSettingNames.waffenPacks)
        const gegenstandeSelection = getSelection(IlarisGameSettingNames.gegenstandPacks)
        const kreaturenSelection = getSelection(IlarisGameSettingNames.kreaturenPacks)
        const talenteSelection = getSelection(IlarisGameSettingNames.talentePacks)
        const manoeverSelection = getSelection(IlarisGameSettingNames.manoeverPacks)
        const vorteileSelection = getSelection(IlarisGameSettingNames.vorteilePacks)
        const waffeneigenschaftenSelection = getSelection(
            IlarisGameSettingNames.waffeneigenschaftenPacks,
        )
        const abgeleiteteWerteSelection = getSelection(IlarisGameSettingNames.abgeleiteteWertePacks)

        const result = {
            fertigkeiten: [],
            waffen: [],
            gegenstande: [],
            kreaturen: [],
            talente: [],
            manoever: [],
            vorteile: [],
            waffeneigenschaften: [],
            abgeleiteteWerte: [],
        }

        for (const pack of game.packs) {
            if (pack.index.size === 0) continue

            const isSystemPack = pack.metadata.id?.startsWith('Ilaris.')
            const entry = (selected) => ({
                id: pack.collection,
                name: pack.metadata.label,
                selected,
                isSystemPack,
            })
            const contents = pack.index.contents

            if (pack.metadata.type === 'Actor') {
                if (contents.some((i) => i.type === 'kreatur')) {
                    result.kreaturen.push(entry(kreaturenSelection.includes(pack.collection)))
                }
                continue
            }

            if (pack.metadata.type !== 'Item') continue

            if (
                contents.some(
                    (i) =>
                        i.type === 'fertigkeit' ||
                        i.type === 'uebernatuerliche_fertigkeit' ||
                        i.type === 'uebernatuerlicheFertigkeit',
                )
            ) {
                result.fertigkeiten.push(entry(fertigkeitenSelection.includes(pack.collection)))
            }
            if (contents.some((i) => i.type === 'fernkampfwaffe' || i.type === 'nahkampfwaffe')) {
                result.waffen.push(entry(waffenSelection.includes(pack.collection)))
            }
            if (contents.some((i) => i.type === 'gegenstand')) {
                result.gegenstande.push(entry(gegenstandeSelection.includes(pack.collection)))
            }
            if (
                contents.some(
                    (i) => i.type === 'talent' || i.type === 'liturgie' || i.type === 'zauber',
                )
            ) {
                result.talente.push(entry(talenteSelection.includes(pack.collection)))
            }
            if (contents.some((i) => i.type === 'manoever')) {
                result.manoever.push(entry(manoeverSelection.includes(pack.collection)))
            }
            if (contents.some((i) => i.type === 'vorteil')) {
                result.vorteile.push(entry(vorteileSelection.includes(pack.collection)))
            }
            if (contents.some((i) => i.type === 'waffeneigenschaft')) {
                result.waffeneigenschaften.push(
                    entry(waffeneigenschaftenSelection.includes(pack.collection)),
                )
            }
            if (
                contents.some(
                    (i) => i.type === 'abgeleiteterWert' || i.type === 'abgeleiteter-wert',
                )
            ) {
                result.abgeleiteteWerte.push(
                    entry(abgeleiteteWerteSelection.includes(pack.collection)),
                )
            }
        }

        return result
    }

    static async #onSaveSettings(event, target) {
        const isGM = game.user.isGM
        const form = this.element
        let hasChanges = false

        const setIfChanged = async (settingName, newValue) => {
            const oldValue = game.settings.get(ConfigureGameSettingsCategories.Ilaris, settingName)
            if (String(oldValue) === String(newValue)) return
            await game.settings.set(ConfigureGameSettingsCategories.Ilaris, settingName, newValue)
            hasChanges = true
        }

        // Compendien Packs (World-Settings, GM only)
        if (isGM) {
            const packGroups = [
                {
                    groupKey: 'fertigkeiten',
                    settingName: IlarisGameSettingNames.fertigkeitenPacks,
                },
                { groupKey: 'waffen', settingName: IlarisGameSettingNames.waffenPacks },
                {
                    groupKey: 'gegenstande',
                    settingName: IlarisGameSettingNames.gegenstandPacks,
                },
                { groupKey: 'kreaturen', settingName: IlarisGameSettingNames.kreaturenPacks },
                { groupKey: 'talente', settingName: IlarisGameSettingNames.talentePacks },
                { groupKey: 'manoever', settingName: IlarisGameSettingNames.manoeverPacks },
                { groupKey: 'vorteile', settingName: IlarisGameSettingNames.vorteilePacks },
                {
                    groupKey: 'waffeneigenschaften',
                    settingName: IlarisGameSettingNames.waffeneigenschaftenPacks,
                },
                {
                    groupKey: 'abgeleiteteWerte',
                    settingName: IlarisGameSettingNames.abgeleiteteWertePacks,
                },
            ]
            for (const { groupKey, settingName } of packGroups) {
                const checkboxes = form.querySelectorAll(`input[name^="compendien.${groupKey}."]`)
                const selected = Array.from(checkboxes)
                    .filter((cb) => cb.checked)
                    .map((cb) => cb.name.slice(`compendien.${groupKey}.`.length))
                await setIfChanged(settingName, JSON.stringify(selected))
            }
        }

        // Automation Settings (World-Settings, GM only)
        if (isGM) {
            const automationDefs = [
                {
                    key: 'useSceneEnvironment',
                    name: IlarisAutomatisierungSettingNames.useSceneEnvironment,
                },
                {
                    key: 'useTargetSelection',
                    name: IlarisAutomatisierungSettingNames.useTargetSelection,
                },
            ]
            for (const s of automationDefs) {
                const input = form.querySelector(`input[name="automation.${s.key}"]`)
                if (input) await setIfChanged(s.name, input.checked)
            }
        }

        // General Settings
        const generalDefs = [
            {
                key: 'weaponSpaceRequirement',
                name: IlarisGameSettingNames.weaponSpaceRequirement,
                scope: 'world',
                inputType: 'checkbox',
            },
            {
                key: 'realFumbleCrits',
                name: IlarisGameSettingNames.realFumbleCrits,
                scope: 'world',
                inputType: 'checkbox',
            },
            {
                key: 'expandWeaponDamageMultipliers',
                name: IlarisGameSettingNames.expandWeaponDamageMultipliers,
                scope: 'world',
                inputType: 'checkbox',
            },
            {
                key: 'renameTriumphWithCrit',
                name: IlarisGameSettingNames.renameTriumphWithCrit,
                scope: 'world',
                inputType: 'checkbox',
            },
            {
                key: 'restrictEnergyCostSetting',
                name: IlarisGameSettingNames.restrictEnergyCostSetting,
                scope: 'world',
                inputType: 'checkbox',
            },
            {
                key: 'hideSyncKampfstileButton',
                name: IlarisGameSettingNames.hideSyncKampfstileButton,
                scope: 'client',
                inputType: 'checkbox',
            },
            {
                key: 'enableTabbingCharacterSheet',
                name: IlarisGameSettingNames.enableTabbingCharacterSheet,
                scope: 'client',
                inputType: 'checkbox',
            },
            {
                key: 'showDiceRollInChat',
                name: IlarisGameSettingNames.showDiceRollInChat,
                scope: 'client',
                inputType: 'checkbox',
            },
            {
                key: 'hexTokenShapes',
                name: IlarisGameSettingNames.hexTokenShapes,
                scope: 'world',
                inputType: 'checkbox',
            },
            {
                key: 'defaultRangedDodgeTalent',
                name: IlarisGameSettingNames.defaultRangedDodgeTalent,
                scope: 'world',
                inputType: 'text',
            },
            {
                key: 'lepSystem',
                name: IlarisGameSettingNames.lepSystem,
                scope: 'world',
                inputType: 'checkbox',
            },
            {
                key: 'supernaturalEffectStacking',
                name: IlarisGameSettingNames.supernaturalEffectStacking,
                scope: 'world',
                inputType: 'select',
            },
            {
                key: 'llmApiUrl',
                name: IlarisGameSettingNames.llmApiUrl,
                scope: 'client',
                inputType: 'text',
            },
            {
                key: 'llmApiKey',
                name: IlarisGameSettingNames.llmApiKey,
                scope: 'client',
                inputType: 'text',
            },
            {
                key: 'llmModel',
                name: IlarisGameSettingNames.llmModel,
                scope: 'client',
                inputType: 'text',
            },
        ]
        for (const s of generalDefs) {
            if (s.scope === 'world' && !isGM) continue
            const field = form.querySelector(
                `input[name="general.${s.key}"], select[name="general.${s.key}"]`,
            )
            if (!field) continue
            const newValue = s.inputType === 'checkbox' ? field.checked : field.value
            await setIfChanged(s.name, newValue)
        }

        if (isGM) {
            await setIfChanged(
                IlarisGameSettingNames.damageTypes,
                JSON.stringify(this.damageTypes ?? this._parseDamageTypes()),
            )
        }

        await this.close()
        if (hasChanges) SettingsConfig.reloadConfirm()
    }

    static async #onResetSettings(event, target) {
        const isGM = game.user.isGM

        if (isGM) {
            const packDefaults = [
                {
                    name: IlarisGameSettingNames.fertigkeitenPacks,
                    value: '["Ilaris.fertigkeiten-und-talente","Ilaris.fertigkeiten-und-talente-advanced","Ilaris.ubernaturliche-fertigkeiten"]',
                },
                { name: IlarisGameSettingNames.waffenPacks, value: '["Ilaris.waffen"]' },
                {
                    name: IlarisGameSettingNames.gegenstandPacks,
                    value: '["Ilaris.gegenstande"]',
                },
                { name: IlarisGameSettingNames.kreaturenPacks, value: '["Ilaris.kreaturen"]' },
                {
                    name: IlarisGameSettingNames.talentePacks,
                    value: '["Ilaris.fertigkeiten-und-talente","Ilaris.fertigkeiten-und-talente-advanced","Ilaris.liturgien-und-mirakel","Ilaris.zauberspruche-und-rituale","Ilaris.zaubertricks-advanced"]',
                },
                { name: IlarisGameSettingNames.manoeverPacks, value: '["Ilaris.manover"]' },
                { name: IlarisGameSettingNames.vorteilePacks, value: '["Ilaris.vorteile"]' },
                {
                    name: IlarisGameSettingNames.waffeneigenschaftenPacks,
                    value: '["Ilaris.waffeneigenschaften"]',
                },
                { name: IlarisGameSettingNames.abgeleiteteWertePacks, value: '[]' },
            ]
            for (const p of packDefaults) {
                await game.settings.set(ConfigureGameSettingsCategories.Ilaris, p.name, p.value)
            }

            const worldDefaults = [
                { name: IlarisGameSettingNames.weaponSpaceRequirement, value: false },
                { name: IlarisGameSettingNames.realFumbleCrits, value: false },
                { name: IlarisGameSettingNames.expandWeaponDamageMultipliers, value: false },
                { name: IlarisGameSettingNames.renameTriumphWithCrit, value: false },
                { name: IlarisGameSettingNames.restrictEnergyCostSetting, value: false },
                { name: IlarisGameSettingNames.hexTokenShapes, value: false },
                { name: IlarisGameSettingNames.defaultRangedDodgeTalent, value: '' },
                { name: IlarisGameSettingNames.lepSystem, value: false },
                { name: IlarisGameSettingNames.supernaturalEffectStacking, value: 'ilaris' },
                {
                    name: IlarisGameSettingNames.damageTypes,
                    value: '[{"value":"PROFAN","label":"Profan (Wunden)","behavior":{"healing":false,"targetsErschoepfung":false,"bypassesArmor":false}},{"value":"STUMPF","label":"Stumpf (Erschöpfung)","behavior":{"healing":false,"targetsErschoepfung":true,"bypassesArmor":false}},{"value":"MAGISCH","label":"Magisch","behavior":{"healing":false,"targetsErschoepfung":false,"bypassesArmor":false}},{"value":"GEWEIHT","label":"Geweiht","behavior":{"healing":false,"targetsErschoepfung":false,"bypassesArmor":false}},{"value":"DAEMONISCH","label":"Dämonisch","behavior":{"healing":false,"targetsErschoepfung":false,"bypassesArmor":false}},{"value":"FEUER","label":"Feuer","behavior":{"healing":false,"targetsErschoepfung":false,"bypassesArmor":false}},{"value":"EIS","label":"Eis","behavior":{"healing":false,"targetsErschoepfung":false,"bypassesArmor":false}},{"value":"ERZ","label":"Erz","behavior":{"healing":false,"targetsErschoepfung":false,"bypassesArmor":false}},{"value":"HUMUS","label":"Humus","behavior":{"healing":false,"targetsErschoepfung":false,"bypassesArmor":false}},{"value":"LUFT","label":"Luft","behavior":{"healing":false,"targetsErschoepfung":false,"bypassesArmor":false}},{"value":"WASSER","label":"Wasser","behavior":{"healing":false,"targetsErschoepfung":false,"bypassesArmor":false}},{"value":"HEALING_WOUND","label":"Heilung (Wunden)","behavior":{"healing":true,"targetsErschoepfung":false,"bypassesArmor":false}},{"value":"HEALING_EXHAUSTION","label":"Heilung (Erschöpfung)","behavior":{"healing":true,"targetsErschoepfung":true,"bypassesArmor":false}},{"value":"TRUE_DAMAGE","label":"SP-Schaden","behavior":{"healing":false,"targetsErschoepfung":false,"bypassesArmor":true}}]',
                },
                { name: IlarisAutomatisierungSettingNames.useSceneEnvironment, value: true },
                { name: IlarisAutomatisierungSettingNames.useTargetSelection, value: false },
            ]
            for (const s of worldDefaults) {
                await game.settings.set(ConfigureGameSettingsCategories.Ilaris, s.name, s.value)
            }
        }

        // Client settings (always reset)
        await game.settings.set(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.hideSyncKampfstileButton,
            true,
        )
        await game.settings.set(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.enableTabbingCharacterSheet,
            false,
        )
        await game.settings.set(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.llmApiUrl,
            '',
        )
        await game.settings.set(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.llmApiKey,
            '',
        )
        await game.settings.set(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.llmModel,
            '',
        )
        await game.settings.set(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.showDiceRollInChat,
            false,
        )

        this.render()
    }
}
