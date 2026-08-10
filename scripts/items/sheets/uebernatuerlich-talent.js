import { PreEffectItemSheet, toPreEffectArray } from './pre-effect-item.js'

export class UebernatuerlichTalentSheet extends PreEffectItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        ...PreEffectItemSheet.DEFAULT_OPTIONS,
        classes: [...PreEffectItemSheet.DEFAULT_OPTIONS.classes, 'uebernatuerlich-talent'],
    }

    /** @override */
    static PARTS = {
        ...PreEffectItemSheet.PARTS,
        form: {
            template: 'systems/Ilaris/scripts/items/templates/uebernatuerlich_talent.hbs',
        },
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        if (context.hasOwner) {
            context.fertigkeit_list = this.document.actor.misc.uebernatuerlich_fertigkeit_list
        }
        context.hasLLMPreEffectGeneration =
            game.user.isGM &&
            !!game.settings.get('Ilaris', 'llmApiUrl') &&
            !!game.settings.get('Ilaris', 'llmApiKey')
        return context
    }

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options)
        this.element.querySelector('.generate-pre-effect')?.addEventListener('click', async () => {
            await this.#handleLLMGenerate()
        })
        this.element
            .querySelector('.spell-modification-editor')
            ?.addEventListener('click', (event) => {
                this.#handleSpellModificationEditorClick(event)
            })
    }

    #cloneSpellModifications() {
        return toPreEffectArray(foundry.utils.deepClone(this.document.system.spellModifications))
    }

    #cloneSpellModificationGroups() {
        return toPreEffectArray(
            foundry.utils.deepClone(this.document.system.spellModificationGroups),
        )
    }

    #defaultSpellModification() {
        return {
            id: `form-${foundry.utils.randomID(8)}`,
            name: 'Neue Zaubermodifikation',
            description: '',
            group: '',
            effectMode: 'inherit',
            profile: {
                difficulty: 0,
                cost: { mode: 'add', value: 0 },
                permanentCost: '',
                target: '',
                range: '',
                duration: '',
            },
            preEffects: [],
        }
    }

    async #handleSpellModificationEditorClick(event) {
        const button = event.target.closest('button')
        if (!button) return
        const formIndex = Number(button.dataset.formIndex)
        const groupIndex = Number(button.dataset.groupIndex)
        const updateForms = async (forms) =>
            this.document.update({ 'system.spellModifications': forms })

        if (button.closest('.add-spell-modification-group')) {
            const groups = this.#cloneSpellModificationGroups()
            groups.push({
                id: `gruppe-${foundry.utils.randomID(8)}`,
                label: 'Neue Gruppe',
                required: false,
            })
            await this.document.update({ 'system.spellModificationGroups': groups })
            return
        }
        if (button.closest('.delete-spell-modification-group')) {
            const groups = this.#cloneSpellModificationGroups()
            const [removed] = groups.splice(groupIndex, 1)
            const forms = this.#cloneSpellModifications().map((form) =>
                form.group === removed?.id ? { ...form, group: '' } : form,
            )
            await this.document.update({
                'system.spellModificationGroups': groups,
                'system.spellModifications': forms,
            })
            return
        }
        if (button.closest('.add-spell-modification')) {
            const forms = this.#cloneSpellModifications()
            forms.push(this.#defaultSpellModification())
            await updateForms(forms)
            return
        }
        if (button.closest('.delete-spell-modification')) {
            const forms = this.#cloneSpellModifications()
            forms.splice(formIndex, 1)
            await updateForms(forms)
            return
        }
        if (button.closest('.move-spell-modification')) {
            const forms = this.#cloneSpellModifications()
            const targetIndex = formIndex + Number(button.dataset.direction)
            if (targetIndex < 0 || targetIndex >= forms.length) return
            ;[forms[formIndex], forms[targetIndex]] = [forms[targetIndex], forms[formIndex]]
            await updateForms(forms)
            return
        }
        if (button.closest('.add-spell-modification-pre-effect')) {
            const forms = this.#cloneSpellModifications()
            if (!forms[formIndex]) return
            forms[formIndex].preEffects = toPreEffectArray(forms[formIndex].preEffects)
            forms[formIndex].preEffects.push(this._defaultPreEffect())
            await updateForms(forms)
            return
        }
        if (button.closest('.delete-spell-modification-pre-effect')) {
            const forms = this.#cloneSpellModifications()
            if (!forms[formIndex]) return
            forms[formIndex].preEffects = toPreEffectArray(forms[formIndex].preEffects)
            forms[formIndex].preEffects.splice(Number(button.dataset.preEffectIndex), 1)
            await updateForms(forms)
        }
    }

    /** Call the configured LLM API to generate Pre-Effects for this spell. */
    async #handleLLMGenerate() {
        const button = this.element.querySelector('.generate-pre-effect')
        if (!button) return
        const originalText = button.textContent
        button.textContent = '⏳ Wird generiert...'
        button.disabled = true

        try {
            const apiUrl = game.settings.get('Ilaris', 'llmApiUrl')
            const apiKey = game.settings.get('Ilaris', 'llmApiKey')
            const model = game.settings.get('Ilaris', 'llmModel')
            if (!apiUrl || !apiKey) {
                ui.notifications.warn('LLM API URL oder Key ist nicht konfiguriert.')
                return
            }

            const { collectActorSystemPaths } =
                await import('../../effects/utils/field-path-collector.js')
            const { buildPreEffectPrompt } =
                await import('../../effects/utils/llm-prompt-builder.js')
            const requestBody = buildPreEffectPrompt(
                this.document.system,
                this.document.name,
                this._getDamageTypeOptions(),
                collectActorSystemPaths(),
                model,
            )
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({ model: requestBody.model, messages: requestBody.messages }),
            })
            if (!response.ok) {
                throw new Error(`API Fehler ${response.status}: ${await response.text()}`)
            }
            const content = (await response.json()).choices?.[0]?.message?.content
            if (!content) throw new Error('Keine Antwort vom LLM erhalten.')
            const parsed = JSON.parse(
                content
                    .replace(/```json\n?/g, '')
                    .replace(/```\n?/g, '')
                    .trim(),
            )
            if (!Array.isArray(parsed.preEffects)) {
                throw new Error('LLM-Antwort enthält kein preEffects-Array.')
            }
            await this.document.update({ 'system.preEffects': parsed.preEffects })
            ui.notifications.info('Pre-Effects erfolgreich generiert!')
        } catch (error) {
            console.error('Ilaris | LLM generate failed:', error)
            ui.notifications.error(`LLM-Generierung fehlgeschlagen: ${error.message}`)
        } finally {
            button.textContent = originalText
            button.disabled = false
        }
    }
}
