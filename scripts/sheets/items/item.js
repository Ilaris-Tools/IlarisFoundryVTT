export class IlarisItemSheet extends ItemSheet {
    // Setze ich das an der richtigen Stelle?
    getData() {
        const data = super.getData();
        data.hasOwner = this.item.actor != null;
        // if(data.hasOwner) {
        //     console.log(this.item.actor.data.misc.profan_fertigkeit_list);
        //     data.profan_fertigkeit_list = this.item.actor.data.misc.profan_fertigkeit_list;
        // };
        // console.log("In item.js");
        // console.log(data.actor);
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.item-delete').click((ev) => this._onItemDelete(ev));
    }

    _onItemDelete(event) {
        console.log('ItemDelete');
        console.log(event);
        console.log(this.actor);
        const itemID = event.currentTarget.dataset.itemid;
        console.log(itemID);
        this.actor.deleteEmbeddedDocuments('Item', [itemID]);
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
