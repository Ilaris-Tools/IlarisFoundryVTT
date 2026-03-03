/**
 * Changelog feature hooks.
 * Shows breaking changes dialog when the system is updated.
 *
 * TODO Phase 3: Remove legacy import from core/hooks.js and use this instead:
 * import '../changelog/hooks.js'
 *
 * At that point, fix template path in changelog-notification.js:
 * - Change: `systems/${game.system.id}/templates/changes/breaking-changes-${version}.hbs`
 * - To:     `systems/${game.system.id}/scripts/changelog/templates/breaking-changes-${version}.hbs`
 */

import './changelog-notification.js'
