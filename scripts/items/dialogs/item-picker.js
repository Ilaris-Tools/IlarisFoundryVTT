import {
    resolvePickerContext,
    matchesPickerContext,
    getAccessibleItemPacks,
    loadPickerEntries,
    filterPickerEntries,
    preparePickerImport,
    createBlankItemData,
} from './item-picker-data.js'

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api
const PREVIEW_ACTIONS = new Set(['close', 'tab', 'toggleControls', 'copyUuid'])

/** Reuse the registered sheet's templates, without its editing listeners or actions. */
function createReadOnlyPreview(document) {
    class ItemPickerPreview extends document.sheet.constructor {
        get isEditable() {
            return false
        }

        _onRender(context, options) {
            foundry.applications.api.DocumentSheetV2.prototype._onRender.call(
                this,
                context,
                options,
            )
            for (const control of this.element.querySelectorAll('.window-content [data-action]')) {
                if (PREVIEW_ACTIONS.has(control.dataset.action)) continue
                if (control.tagName === 'IMG') control.removeAttribute('data-action')
                else control.hidden = true
            }
        }

        _onClickAction(event, target) {
            if (PREVIEW_ACTIONS.has(target.dataset.action))
                return super._onClickAction(event, target)
            event.preventDefault()
        }

        _onChangeForm() {}
        _onSubmitForm() {}
    }
    return new ItemPickerPreview({
        document,
        canImport: false,
        canCreate: false,
        ownershipConfig: false,
        sheetConfig: false,
    })
}

export class IlarisItemPicker extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'item-picker-dialog'],
        tag: 'form',
        form: { handler: () => {}, submitOnChange: false, closeOnSubmit: false },
        position: { width: 600, height: 560 },
        window: { resizable: true, icon: 'fa-solid fa-book-open' },
        actions: {
            add: IlarisItemPicker.onAdd,
            createBlank: IlarisItemPicker.onCreateBlank,
            cancel: IlarisItemPicker.onCancel,
            preview: IlarisItemPicker.onPreview,
            retry: IlarisItemPicker.onRetry,
        },
    }

    static PARTS = {
        filters: { template: 'systems/Ilaris/scripts/items/templates/item-picker-filters.hbs' },
        results: {
            template: 'systems/Ilaris/scripts/items/templates/item-picker-results.hbs',
            scrollable: ['.picker-result-list'],
        },
        footer: { template: 'systems/Ilaris/scripts/items/templates/item-picker-footer.hbs' },
    }

    constructor({ actor, itemclass, profan }, options = {}) {
        super(options)
        this.actor = actor
        this.context = resolvePickerContext(actor.type, { itemclass, profan })
        this.packs = getAccessibleItemPacks(game.packs, game.user)
        this.entries = []
        this.filters = { search: '', pack: '' }
        this.selectedKey = null
        this.loading = true
        this.busy = false
        this.closed = false
        this.error = ''
        this.failures = []
        this.loadVersion = 0
    }

    get title() {
        return this.context.title
    }

    get visibleEntries() {
        return filterPickerEntries(this.entries, this.filters)
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        const entries = this.visibleEntries
        return {
            ...context,
            ...this.filters,
            loading: this.loading,
            busy: this.busy,
            error: this.error,
            failures: this.failures.join(', '),
            blankLabel: this.context.blankLabel,
            entries: entries.map((entry) => ({
                ...entry,
                selected: entry.key === this.selectedKey,
            })),
            count: entries.length,
            canAdd:
                !this.busy &&
                !this.loading &&
                this.actor.isOwner &&
                entries.some((entry) => entry.key === this.selectedKey),
            canCreateBlank: !this.busy && this.actor.isOwner,
            packs: this.packs.map((pack) => ({
                value: pack.collection,
                label: pack.title,
                selected: pack.collection === this.filters.pack,
            })),
        }
    }

    _onFirstRender(context, options) {
        super._onFirstRender(context, options)
        this.element.querySelector('input[name="search"]')?.focus()
        void this.loadEntries()
    }

    _attachPartListeners(partId, element, options) {
        super._attachPartListeners(partId, element, options)
        if (partId === 'filters') {
            element
                .querySelector('[name="search"]')
                .addEventListener('input', (event) =>
                    this.updateFilters({ search: event.target.value }),
                )
            element
                .querySelector('[name="pack"]')
                .addEventListener('change', (event) =>
                    this.updateFilters({ pack: event.target.value }),
                )
        }
        if (partId === 'results') {
            element.addEventListener('change', (event) => {
                if (event.target.matches('input[name="item"]')) this.selectEntry(event.target.value)
            })
        }
    }

    refresh(parts = ['results', 'footer']) {
        if (!this.closed) return this.render({ parts })
    }

    async loadEntries() {
        if (this.closed || this.busy) return
        const firstLoad = this.loadVersion === 0
        const version = ++this.loadVersion
        this.loading = true
        this.packs = getAccessibleItemPacks(game.packs, game.user)
        if (!this.packs.some((pack) => pack.collection === this.filters.pack))
            this.filters.pack = ''
        await this.refresh(firstLoad ? ['results', 'footer'] : ['filters', 'results', 'footer'])
        if (this.closed) return
        const result = await loadPickerEntries(this.packs, this.context)
        if (this.closed || version !== this.loadVersion) return
        this.entries = result.entries
        this.failures = result.failures
        this.loading = false
        if (!this.visibleEntries.some((entry) => entry.key === this.selectedKey))
            this.selectedKey = null
        await this.refresh()
    }

    updateFilters(filters) {
        if (this.busy || this.closed) return
        Object.assign(this.filters, filters)
        if (!this.visibleEntries.some((entry) => entry.key === this.selectedKey))
            this.selectedKey = null
        this.error = ''
        return this.refresh()
    }

    selectEntry(key) {
        if (this.busy || this.closed) return
        this.selectedKey = this.visibleEntries.some((entry) => entry.key === key) ? key : null
        this.error = ''
        return this.refresh(['footer'])
    }

    async resolveEntry(key) {
        const entry = this.visibleEntries.find((candidate) => candidate.key === key)
        const pack = entry && game.packs.get(entry.pack)
        const readable = () => pack && getAccessibleItemPacks([pack], game.user).length > 0
        if (!readable()) throw new Error('Der Eintrag ist nicht mehr zugänglich.')
        const document = await pack.getDocument(entry.id)
        if (!readable() || !document || !matchesPickerContext(document, this.context)) {
            throw new Error(
                'Der Eintrag ist nicht mehr verfügbar oder passt nicht zu dieser Auswahl.',
            )
        }
        return document
    }

    async previewEntry(key) {
        if (this.closed || this.busy) return
        try {
            const document = await this.resolveEntry(key)
            if (this.closed) return
            const preview = createReadOnlyPreview(document)
            await preview.render({ force: true })
            return preview
        } catch (error) {
            this.error = `Vorschau konnte nicht geöffnet werden. ${error.message}`
            await this.refresh(['footer'])
        }
    }

    async createItem(dataProvider, { openSheet = false } = {}) {
        if (this.busy || this.closed) return
        if (!this.actor.isOwner) {
            this.error = 'Du darfst diesem Akteur keine Items hinzufügen.'
            await this.refresh(['footer'])
            return
        }
        this.busy = true
        this.error = ''
        try {
            // Disable editing controls while retaining the native close/cancel action.
            await this.refresh(['filters', 'results', 'footer'])
            if (this.closed) return
            const data = await dataProvider()
            if (this.closed) return
            if (!this.actor.isOwner)
                throw new Error('Du darfst diesem Akteur keine Items hinzufügen.')
            const created = await this.actor.createEmbeddedDocuments('Item', [data])
            if (!created?.length) throw new Error('Es wurde kein Item erstellt.')
            await this.close()
            if (openSheet) await created[0].sheet.render(true)
            return created[0]
        } catch (error) {
            this.error = `Item konnte nicht hinzugefügt werden. ${error.message}`
        } finally {
            this.busy = false
            await this.refresh(['filters', 'results', 'footer'])
        }
    }

    addSelected() {
        const key = this.selectedKey
        if (!key || this.loading || !this.visibleEntries.some((entry) => entry.key === key)) return
        return this.createItem(async () =>
            preparePickerImport(await this.resolveEntry(key), this.context),
        )
    }

    createBlank() {
        return this.createItem(() => createBlankItemData(this.context), { openSheet: true })
    }

    cancel() {
        return this.close()
    }

    async close(options = {}) {
        this.closed = true
        ++this.loadVersion
        return super.close(options)
    }

    static onAdd() {
        return this.addSelected()
    }
    static onCreateBlank() {
        return this.createBlank()
    }
    static onCancel() {
        return this.cancel()
    }
    static onPreview(event, target) {
        return this.previewEntry(target.dataset.key)
    }
    static onRetry() {
        return this.loadEntries()
    }
}
