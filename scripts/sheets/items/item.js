const { HandlebarsApplicationMixin } = foundry.applications.api
const { ItemSheetV2 } = foundry.applications.sheets

export class IlarisItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item'],
        position: {
            width: 600,
            height: 'auto',
        },
        actions: {
            deleteItem: IlarisItemSheet.#onDeleteItem,
        },
        form: {
            handler: IlarisItemSheet.#onSubmitForm,
            submitOnChange: true,
            closeOnSubmit: false,
        },
        window: {
            icon: 'fas fa-suitcase',
            controls: [],
        },
    }

    // NOTE: PARTS must be defined in subclasses with their specific templates
    // Example: static PARTS = { form: { template: 'path/to/template.hbs' } }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        // Items sind editierbar, wenn der Actor einem Spieler gehört
        // UND der Actor nicht mehr im Compendium ist (pack == null bedeutet "in der World")
        const hasActor = this.document.actor != null
        const isOwner = this.document.actor?.isOwner
        const notInPack = this.document.actor?.pack == null
        context.item = this.item

        context.hasOwner = hasActor && isOwner && notInPack

        return context
    }

    /**
     * Handle form submission
     * @param {SubmitEvent} event - The form submit event
     * @param {HTMLFormElement} form - The form element
     * @param {FormDataExtended} formData - The form data
     */
    static async #onSubmitForm(event, form, formData) {
        try {
            const updateData = foundry.utils.expandObject(formData.object)
            await this.document.update(updateData)
        } catch (error) {
            console.error('Item update failed:', error)
            ui.notifications?.error(game.i18n.format('ERROR.ItemUpdate', { error: error.message }))
            throw error
        }
    }

    /**
     * Handle delete item action
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The clicked element
     */
    static async #onDeleteItem(event, target) {
        const confirm = await foundry.applications.api.DialogV2.confirm({
            window: { title: game.i18n.localize('ITEM.DeleteTitle') },
            content: `<p>${game.i18n.localize('ITEM.DeleteConfirm')}</p>`,
            rejectClose: false,
            modal: true,
        })

        if (!confirm) return

        try {
            await this.document.delete()
            this.close()
        } catch (error) {
            console.error('Item delete failed:', error)
            ui.notifications?.error(game.i18n.format('ERROR.ItemDelete', { error: error.message }))
        }
    }

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options)
        // Hook for subclasses to add non-action event listeners
    }
}
