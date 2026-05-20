/**
 * hooks-debug-example.js
 *
 * Beispieldatei: Alle Ilaris-Fertigkeitsdialog-Hooks werden hier registriert
 * und loggen ihre Parameter per console.log.
 *
 * Diese Datei dient ausschließlich zur Entwicklung und Dokumentation.
 * Sie wird NICHT im System-Produktivbetrieb geladen.
 *
 * Verwendung in der Browser-Console oder als temporäres Modul:
 *   import 'systems/Ilaris/scripts/skills/hooks-debug-example.js'
 */

/* ------------------------------------------------------------------ */
/* Dialog-Lebenszyklus                                                 */
/* ------------------------------------------------------------------ */

Hooks.on('Ilaris.preSkillDialog', (actor, options) => {
    console.log('[Ilaris.preSkillDialog]', { actor, options })
    // return false
})

Hooks.on('Ilaris.skillDialogRendered', (dialog, state) => {
    console.log('[Ilaris.skillDialogRendered]', { dialog, state })
})

Hooks.on('Ilaris.skillDialogStateChanged', (dialog, state) => {
    console.log('[Ilaris.skillDialogStateChanged]', { dialog, state })
})

/* ------------------------------------------------------------------ */
/* Würfelwürfe                                                         */
/* ------------------------------------------------------------------ */

Hooks.on('Ilaris.preSkillRoll', (dialog, payload) => {
    console.log('[Ilaris.preSkillRoll]', { dialog, payload })
    // return false
})

Hooks.on('Ilaris.postSkillRoll', (dialog, payload) => {
    console.log('[Ilaris.postSkillRoll]', { dialog, payload })
})

/* ------------------------------------------------------------------ */
/* Schips                                                              */
/* ------------------------------------------------------------------ */

Hooks.on('Ilaris.preSkillSchipsConsumption', (dialog, payload) => {
    console.log('[Ilaris.preSkillSchipsConsumption]', { dialog, payload })
    // return false
})

Hooks.on('Ilaris.postSkillSchipsConsumption', (dialog, payload) => {
    console.log('[Ilaris.postSkillSchipsConsumption]', { dialog, payload })
})
