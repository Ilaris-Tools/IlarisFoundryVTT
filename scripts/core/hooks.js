/**
 * Core hooks orchestrator for the Ilaris system.
 * This is the entry point declared in system.json esmodules.
 *
 * Imports init.js (core setup) and all feature hook files.
 * Feature hooks will be progressively added as features are migrated.
 */

// Core initialization (init + ready orchestrator)
import './init.js'

// Feature hooks
import '../actors/hooks.js'
import '../items/hooks.js'
import '../waffe/hooks.js'
import '../combat/hooks.js'
import '../dice/hooks.js'
import '../effects/hooks.js'
import '../tokens/hooks.js'
import '../importer/hooks.js'
import '../settings/hooks.js'
import '../changelog/hooks.js'
import '../skills/hooks.js'
