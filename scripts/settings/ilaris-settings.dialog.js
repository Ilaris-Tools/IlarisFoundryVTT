import {
    IlarisGameSettingNames,
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
            //  previewClick: FertigkeitDialog.#onPreviewClick,
        },
        id: 'settings-dialog',
    }

    /** @override - Subclasses must define their own PARTS with the correct template */
    static PARTS = {
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
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        // Add tab data for template
        context.tabs = this._prepareTabs('primary')

        return {
            ...context,
            packs: this.generatePacks(),
            // actor: this.actor,
            // probeType: this.probeType,
            // fertigkeitKey: this.fertigkeitKey,
            // fertigkeitName: this.fertigkeitName,
            // pw: this.pw,
            // talentList: this.talentList,
            // hasTalents: Object.keys(this.talentList).length > 0,
            // choices_xd20: CONFIG.ILARIS.xd20_choice,
            // checked_xd20: '1',
            // choices_schips: CONFIG.ILARIS.schips_choice,
            // checked_schips: '0',
            // hasSchips,
            // rollModes: CONFIG.Dice.rollModes,
            // defaultRollMode: game.settings.get('core', 'rollMode'),
            dialogId: 'settings-dialog',
        }
    }

    async _preparePartContext(partId, context) {
        debugger
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

    async _onRender(context, options) {
        await super._onRender(context, options)

        // const html = this.element

        // // Store modifier element reference
        // this._modifierElement = html.querySelector('#modifier-summary')

        // // Add listeners for real-time preview updates
        // const inputs = html.querySelectorAll('input, select')
        // inputs.forEach((input) => {
        //     input.addEventListener('change', () => this._handleInputChange())
        //     input.addEventListener('input', () => this._handleInputChange())
        // })

        // // Initial preview update
        // setTimeout(() => this._updateModifierDisplay(), 100)
    }

    generatePacks() {
        const currentSelection = JSON.parse(
            game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.fertigkeitenPacks,
            ),
        )
        // Get all available packs that contain fertigkeiten
        const availablePacks = []
        for (const pack of game.packs) {
            if (pack.metadata.type === 'Item' && pack.index.size > 0) {
                // Check if any item in the pack has type 'fertigkeit'
                const hasFertigkeit = pack.index.contents.some(
                    (item) =>
                        item.type === 'fertigkeit' || item.type === 'uebernatuerliche_fertigkeit',
                )
                if (hasFertigkeit) {
                    availablePacks.push({
                        id: pack.collection,
                        name: pack.metadata.label,
                        selected: currentSelection.includes(pack.collection),
                    })
                }
            }
        }
        return availablePacks
    }
}
