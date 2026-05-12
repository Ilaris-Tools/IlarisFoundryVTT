const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

class MiniApp extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options)
        this.state = options.state || { counter: 0, items: [], refreshedAt: null }
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: 'mini-app',
            classes: ['mini-app'],
            template: 'modules/yourmodule/templates/mini-app.hbs',
            popOut: false,
            resizable: false,
            width: 400,
            height: 'auto',
        })
    }

    getData() {
        return mergeObject({}, this.state, this.options.data || {})
    }

    // Keep a reference to parent container so future renders mount into it
    async _renderInner(data, options) {
        if (options?.parent instanceof HTMLElement) this.parent = options.parent
        return super._renderInner(data, options)
    }

    updateState(patch = {}) {
        this.state = mergeObject(this.state, patch)
        // re-render only the mini-app into its parent container
        this.render(false, { parent: this.parent || this.options.parent })
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('.mini-refresh').on('click', () => {
            this.updateState({ refreshedAt: new Date().toLocaleString() })
        })
        html.find('.mini-add').on('click', (ev) => {
            const input = html.find('.mini-new-item')
            const val = input.val()?.trim()
            if (!val) return
            const items = Array.from(this.state.items || [])
            items.push(val)
            this.updateState({ items })
            input.val('')
        })
        html.find('.mini-items').on('click', 'li', (ev) => {
            const li = ev.currentTarget
            const idx = Number(li.dataset.index)
            const items = Array.from(this.state.items || [])
            items.splice(idx, 1)
            this.updateState({ items })
        })
    }
}
