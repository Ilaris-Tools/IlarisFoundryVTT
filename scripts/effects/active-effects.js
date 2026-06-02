/**
 * Hook handler for Active Effect duration management
 * Automatically decrements duration.turns for all active effects at the start of each combatant's turn
 *
 * BEHAVIOR:
 * ---------
 * - Duration is decremented at the START of the actor's turn in combat
 * - When duration.turns reaches 0, the effect is automatically removed
 * - A chat message is posted when an effect expires
 * - All effects with duration.turns are processed (not just DOT effects)
 * - Only effects with duration.turns !== null and !== undefined are processed
 * - Each effect is only processed once per turn (even if it has multiple changes)
 *
 * TECHNICAL NOTES:
 * ----------------
 * - Uses the 'combatTurn' and 'combatRound' hooks to detect turn changes
 * - Only processed by the GM to avoid duplicate applications
 * - Error handling ensures one failing effect doesn't break others
 */

/**
 * Handle combat turn changes to decrement effect durations
 * Fired when any combatant's turn ends and a new turn begins
 */
