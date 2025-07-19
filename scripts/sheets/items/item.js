export class IlarisItemSheet extends ItemSheet {
    // Setze ich das an der richtigen Stelle?
    async getData() {
        const data = super.getData()
        // Items sind editierbar, wenn der Actor einem Spieler gehört
        // UND der Actor nicht mehr im Compendium ist (pack == null bedeutet "in der World")
        const hasActor = this.item.actor != null
        const isOwner = this.item.actor?.isOwner
        const notInPack = this.item.actor?.pack == null

        data.hasOwner = hasActor && isOwner && notInPack

        return data
    }

    async _updateObject(event, formData) {
        try {
            // Try normal update first
            const result = await super._updateObject(event, formData)

            // If super failed, try direct update with proper method for embedded items
            if (!result) {
                let directResult
                if (this.item.isEmbedded) {
                    // For embedded items, update through the parent Actor
                    directResult = await this.item.actor.updateEmbeddedDocuments('Item', [
                        { _id: this.item.id, ...formData },
                    ])
                } else {
                    // For standalone items, update directly
                    directResult = await this.item.update(formData)
                }
                return directResult
            }

            return result
        } catch (error) {
            console.error('Item update failed:', error)
            throw error
        }
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('.item-delete').click((ev) => this._onItemDelete(ev))
    }

    _onItemDelete(event) {
        const itemID = event.currentTarget.dataset.itemid
        if (!itemID) {
            ui.notifications?.warn('Cannot delete item: No item ID found')
            return
        }

        if (this.actor) {
            // If item is embedded in an actor, delete it from the actor
            this.actor.deleteEmbeddedDocuments('Item', [itemID])
        } else {
            // If item is not embedded, delete the item itself
            this.item.delete()
        }
    }

    // activateListeners(html) {
    //     super.activateListeners(html);
    //     html.find("input").focusin(ev => this._onFocusIn(ev));
    // }

    // _getHeaderButtons() {
    //     let buttons = super._getHeaderButtons();
    //     buttons = [
    //         {
    //             label: game.i18n.localize("BUTTON.POST_ITEM"),
    //             class: "item-post",
    //             icon: "fas fa-comment",
    //             onclick: (ev) => this.item.sendToChat(),
    //         }
    //     ].concat(buttons);
    //     return buttons;
    // }

    // _onFocusIn(event) {
    //     $(event.currentTarget).select();
    // }
}
