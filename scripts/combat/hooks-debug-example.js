/**
 * hooks-debug-example.js
 *
 * Beispieldatei: Alle Ilaris-Kampfdialog-Hooks werden hier registriert
 * und loggen ihre Parameter per console.log.
 *
 * Diese Datei dient ausschließlich zur Entwicklung und Dokumentation.
 * Sie wird NICHT im System-Produktivbetrieb geladen.
 *
 * Verwendung in der Browser-Console oder als temporäres Modul:
 *   import 'systems/Ilaris/scripts/combat/hooks-debug-example.js'
 */

/* ------------------------------------------------------------------ */
/* Dialog-Lebenszyklus                                                 */
/* ------------------------------------------------------------------ */

/**
 * Ilaris.preCombatDialog (cancellable)
 * Wird gefeuert bevor der Kampfdialog instanziiert wird.
 * Rückgabe false verhindert das Öffnen.
 */
Hooks.on('Ilaris.preCombatDialog', (actor, item, type, options) => {
    console.log('[Ilaris.preCombatDialog]', { actor, item, type, options })
    // return false  // <- auskommentieren, um das Öffnen zu blockieren
})

/**
 * Ilaris.combatDialogRendered
 * Wird am Ende jedes _onRender-Aufrufs des CombatDialogs gefeuert.
 */
Hooks.on('Ilaris.combatDialogRendered', (dialog) => {
    console.log('[Ilaris.combatDialogRendered]', { dialog })
})

/* ------------------------------------------------------------------ */
/* Zielauswahl                                                         */
/* ------------------------------------------------------------------ */

/**
 * Ilaris.preTargetSelection (cancellable)
 * Wird gefeuert bevor Ziele gesetzt werden.
 * candidates ist null, wenn der manuelle TargetSelectionDialog geöffnet wird.
 */
Hooks.on('Ilaris.preTargetSelection', (dialog, candidates) => {
    console.log('[Ilaris.preTargetSelection]', { dialog, candidates })
    // return false  // <- auskommentieren, um die Zielauswahl zu blockieren
})

/**
 * Ilaris.targetSelectionComplete
 * Wird gefeuert nachdem this.selectedActors gesetzt wurde.
 */
Hooks.on('Ilaris.targetSelectionComplete', (dialog, selectedActors) => {
    console.log('[Ilaris.targetSelectionComplete]', { dialog, selectedActors })
})

/* ------------------------------------------------------------------ */
/* Angriff                                                             */
/* ------------------------------------------------------------------ */

/**
 * Ilaris.preAngriff (cancellable)
 * Wird zu Beginn von _angreifenKlick() in allen drei Dialog-Klassen gefeuert.
 */
Hooks.on('Ilaris.preAngriff', (dialog) => {
    console.log('[Ilaris.preAngriff]', { dialog })
    // return false  // <- auskommentieren, um den Würfelwurf zu blockieren
})

/**
 * Ilaris.postAngriff
 * Wird nach evaluate_roll_with_crit() in allen drei Dialog-Klassen gefeuert.
 * Ersetzt den früheren Hook Ilaris.fernkampfAngriffClick.
 */
Hooks.on('Ilaris.postAngriff', (rollResult, dialog) => {
    console.log('[Ilaris.postAngriff]', { total: rollResult.roll.total, rollResult, dialog })
})

/* ------------------------------------------------------------------ */
/* Verteidigung                                                        */
/* ------------------------------------------------------------------ */

/**
 * Ilaris.preVerteidigung (cancellable)
 * Wird zu Beginn von AngriffDialog._verteidigenKlick() gefeuert.
 */
Hooks.on('Ilaris.preVerteidigung', (dialog) => {
    console.log('[Ilaris.preVerteidigung]', { dialog })
    // return false  // <- auskommentieren, um den Verteidigungswurf zu blockieren
})

/**
 * Ilaris.postVerteidigung
 * Wird nach dem Verteidigungswurf in AngriffDialog._verteidigenKlick() gefeuert.
 */
Hooks.on('Ilaris.postVerteidigung', (rollResult, dialog) => {
    console.log('[Ilaris.postVerteidigung]', { total: rollResult.roll.total, rollResult, dialog })
})

/* ------------------------------------------------------------------ */
/* Schaden                                                             */
/* ------------------------------------------------------------------ */

/**
 * Ilaris.preSchaden (cancellable)
 * Wird zu Beginn von _schadenKlick() in AngriffDialog und FernkampfAngriffDialog gefeuert.
 */
Hooks.on('Ilaris.preSchaden', (dialog) => {
    console.log('[Ilaris.preSchaden]', { dialog })
    // return false  // <- auskommentieren, um den Schadenswurf zu blockieren
})

/**
 * Ilaris.postSchaden
 * Wird nach dem Schadenswurf in _schadenKlick() gefeuert.
 */
Hooks.on('Ilaris.postSchaden', (rollResult, dialog) => {
    console.log('[Ilaris.postSchaden]', { total: rollResult.roll.total, rollResult, dialog })
})
