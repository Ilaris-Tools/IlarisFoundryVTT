import {
    getSupernaturalPreEffectOptions,
    isSupernaturalTalentItem,
    normalizeSupernaturalPreEffect,
} from './supernatural-pre-effect.js'

const renderTemplate = foundry.applications.handlebars.renderTemplate

function isSupernaturalItemEffect(effect) {
    return isSupernaturalTalentItem(effect?.parent)
}

async function onRenderActiveEffectConfig(app, html) {
    const effect = app.document ?? app.object
    if (!isSupernaturalItemEffect(effect)) return

    const form = app.form || html.querySelector?.('form') || html
    if (!form || form.querySelector('.supernatural-pre-effect-fields')) return

    const preEffect = normalizeSupernaturalPreEffect(
        effect.getFlag?.('Ilaris', 'preEffect') ?? effect.flags?.Ilaris?.preEffect,
    )

    const rendered = await renderTemplate(
        'systems/Ilaris/scripts/effects/templates/supernatural-pre-effect-fields.hbs',
        {
            preEffect,
            options: getSupernaturalPreEffectOptions(),
        },
    )

    const wrapper = document.createElement('div')
    wrapper.innerHTML = rendered.trim()
    const fields = wrapper.firstElementChild
    if (!fields) return

    const footer = form.querySelector('footer')
    if (footer?.parentNode) {
        footer.parentNode.insertBefore(fields, footer)
        return
    }

    form.append(fields)
}

export function registerSupernaturalPreEffectConfig() {
    if (window._ilarisSupernaturalPreEffectConfigRegistered) return
    window._ilarisSupernaturalPreEffectConfigRegistered = true

    Hooks.on('renderActiveEffectConfig', onRenderActiveEffectConfig)
}
