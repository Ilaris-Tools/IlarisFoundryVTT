export class IlarisActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {
    /**
     * Add the Ilaris Dauer part alongside core parts.
     * Core parts: header, tabs, details, duration, changes, footer
     * @override
     */
    static PARTS = {
        ...foundry.applications.sheets.ActiveEffectConfig.PARTS,
        duration: {
            template: 'systems/Ilaris/scripts/effects/templates/ilaris-duration-tab.hbs',
        },
    }

    /**
     * Add Ilaris Dauer tab to the existing sheet tab group.
     * Core tabs: details, duration, changes
     * @override
     */
    static TABS = {
        sheet: {
            ...foundry.applications.sheets.ActiveEffectConfig.TABS.sheet,
            tabs: [
                ...foundry.applications.sheets.ActiveEffectConfig.TABS.sheet.tabs,
                { id: 'duration', icon: 'fa-solid fa-clock', label: 'Ilaris Dauer' },
            ],
        },
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        context.ilarisTiming = this._getIlarisTimingData()
        context.ilarisDurationTypes = {
            ownerTurns: 'Eigener Zug',
            '': 'Keine (Standard)',
        }
        context.ilarisExpiresOnOptions = {
            turnStart: 'Rundenbeginn',
            turnEnd: 'Rundenende',
        }
        context.tabs = this._prepareTabs('sheet')
        return context
    }

    /** @override */
    async _preparePartContext(partId, context) {
        if (partId === 'duration') {
            context.ilarisTiming = this._getIlarisTimingData()
            context.ilarisDurationTypes = {
                '': 'Keine (Standard)',
                ownerTurns: 'Eigener Zug',
            }
            context.ilarisExpiresOnOptions = {
                turnEnd: 'Rundenende',
                turnStart: 'Rundenbeginn',
            }
            context.tab = context.tabs[partId]
        }
        return super._preparePartContext(partId, context)
    }

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options)

        // Sync remaining when originalValue changes
        const origInput = this.element.querySelector(
            'input[name="system.ilarisTiming.originalValue"]',
        )
        const remInput = this.element.querySelector('input[name="system.ilarisTiming.remaining"]')
        if (origInput && remInput) {
            origInput.addEventListener('input', () => {
                remInput.value = origInput.value
            })
        }

        // Add datalist for attribute key autocomplete on the changes tab
        this.#injectKeySuggestions()
    }

    /**
     * Injects a <datalist> with valid Actor attribute keys into the changes tab,
     * providing autocomplete suggestions for the key input fields.
     */
    #injectKeySuggestions() {
        const changesTab = this.element.querySelector("section[data-tab='changes']")
        if (!changesTab) return

        const datalist = document.createElement('datalist')
        datalist.id = 'ilaris-effect-keys'

        // Collect all leaf field paths from registered Actor data models
        const keys = []
        for (const model of Object.values(CONFIG.Actor.dataModels || {})) {
            this.#collectFieldPaths(model, 'system', keys)
        }

        // Deduplicate and sort
        ;[...new Set(keys)].sort().forEach((key) => {
            const option = document.createElement('option')
            option.value = key
            datalist.appendChild(option)
        })

        changesTab.appendChild(datalist)

        // Attach datalist to all key input fields
        const keyInputs = changesTab.querySelectorAll('.key input')
        keyInputs.forEach((input) => input.setAttribute('list', datalist.id))
    }

    /**
     * Recursively collects dotted field paths from a DataModel schema.
     * @param {typeof foundry.abstract.TypeDataModel} model - The data model class
     * @param {string} prefix - Current path prefix
     * @param {string[]} out - Output array
     */
    #collectFieldPaths(model, prefix, out) {
        const schema = model.defineSchema?.()
        if (!schema) return

        for (const [name, field] of Object.entries(schema)) {
            const path = `${prefix}.${name}`
            if (field instanceof foundry.data.fields.SchemaField) {
                this.#collectSchemaFieldPaths(field, path, out)
                out.push(path)
            } else {
                out.push(path)
            }
        }
    }

    /**
     * Recursively collects paths from a nested SchemaField.
     */
    #collectSchemaFieldPaths(schemaField, prefix, out) {
        for (const [name, field] of Object.entries(schemaField.fields)) {
            const path = `${prefix}.${name}`
            if (field instanceof foundry.data.fields.SchemaField) {
                this.#collectSchemaFieldPaths(field, path, out)
                out.push(path)
            } else {
                out.push(path)
            }
        }
    }

    /**
     * Build timing data from the current effect document.
     * @returns {object}
     */
    _getIlarisTimingData() {
        const timing = this.document.system?.ilarisTiming || {}
        return {
            durationType: timing.durationType || 'ownerTurns',
            remaining: timing.remaining ?? 0,
            originalValue: timing.originalValue ?? 0,
            expiresOn: timing.expiresOn || 'turnStart',
        }
    }
}
