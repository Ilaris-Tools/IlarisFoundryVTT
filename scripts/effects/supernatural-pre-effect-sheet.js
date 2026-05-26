import {
    buildSupernaturalPreEffectFromForm,
    createNewSupernaturalPreEffect,
    getSupernaturalPreEffectById,
    getSupernaturalPreEffectOptions,
    saveSupernaturalPreEffect,
    stringifySupernaturalChanges,
} from './supernatural-pre-effect.js'

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class SupernaturalPreEffectSheet extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'supernatural-pre-effect-sheet'],
        tag: 'form',
        position: {
            width: 720,
            height: 'auto',
        },
        window: {
            title: 'Uebernatuerlichen Zieleffekt bearbeiten',
            icon: 'fas fa-bolt',
        },
        actions: {
            close: SupernaturalPreEffectSheet.#onClose,
        },
        form: {
            handler: SupernaturalPreEffectSheet.#onSubmitForm,
            submitOnChange: false,
            closeOnSubmit: true,
        },
    }

    static PARTS = {
        form: {
            template: 'systems/Ilaris/scripts/effects/templates/supernatural-pre-effect-config.hbs',
        },
    }

    constructor(item, preEffectId = null, options = {}) {
        super(options)
        this.item = item
        this.preEffectId = preEffectId
    }

    get title() {
        return `${this.item.name}: Zieleffekt`
    }

    async _onRender(context, options) {
        await super._onRender(context, options)

        const targetModeSelect = this.element?.querySelector('#pre-effect-target-mode')
        if (!targetModeSelect) return

        this.#syncTargetModePanels(targetModeSelect.value)
        targetModeSelect.addEventListener('change', (event) => {
            this.#syncTargetModePanels(event.currentTarget.value)
        })
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        const preEffect = this.preEffectId
            ? getSupernaturalPreEffectById(this.item, this.preEffectId)
            : createNewSupernaturalPreEffect(this.item)

        return {
            ...context,
            item: this.item,
            preEffect,
            preEffectChangesJson: stringifySupernaturalChanges(preEffect.changes),
            showTemplatePreparation: preEffect.targetMode === 'template',
            showAreaPreparation: preEffect.targetMode === 'area',
            options: getSupernaturalPreEffectOptions(),
        }
    }

    static async #onSubmitForm(event, form, formData) {
        try {
            const fallback = this.preEffectId
                ? getSupernaturalPreEffectById(this.item, this.preEffectId)
                : createNewSupernaturalPreEffect(this.item)
            const nextPreEffect = buildSupernaturalPreEffectFromForm(formData.object, fallback)

            await saveSupernaturalPreEffect(this.item, nextPreEffect)
        } catch (error) {
            ui.notifications?.error(`Zieleffekt konnte nicht gespeichert werden: ${error.message}`)
            throw error
        }
    }

    static async #onClose() {
        await this.close()
    }

    #syncTargetModePanels(targetMode) {
        const templatePanel = this.element?.querySelector('[data-pre-effect-panel="template"]')
        const areaPanel = this.element?.querySelector('[data-pre-effect-panel="area"]')

        if (templatePanel) {
            templatePanel.hidden = targetMode !== 'template'
        }

        if (areaPanel) {
            areaPanel.hidden = targetMode !== 'area'
        }
    }
}
