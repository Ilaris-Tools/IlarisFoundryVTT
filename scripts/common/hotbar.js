/**
 * Hotbar integration for Ilaris system
 * Allows dragging combat items (weapons, spells) to the hotbar
 */

/**
 * Create a macro for opening a combat dialog from the hotbar
 * @param {Object} data - The dropped data containing item information
 * @param {number} slot - The hotbar slot number
 */
export async function createIlarisMacro(data, slot) {
    // Validate the drop data
    if (data.type !== 'Item') return

    // Get the item
    const item = await Item.implementation.fromDropData(data)
    if (!item) return

    // Only create macros for combat-relevant items
    const validTypes = ['nahkampfwaffe', 'fernkampfwaffe', 'zauber', 'liturgie']
    if (!validTypes.includes(item.type)) return

    // Determine the rolltype based on item type
    let rollType
    let macroName
    let iconPath

    switch (item.type) {
        case 'nahkampfwaffe':
            rollType = 'angriff_diag'
            macroName = `${item.name} (Nahkampf)`
            iconPath = item.img || 'systems/Ilaris/assets/images/icon/sword.svg'
            break
        case 'fernkampfwaffe':
            rollType = 'fernkampf_diag'
            macroName = `${item.name} (Fernkampf)`
            iconPath = item.img || 'systems/Ilaris/assets/images/icon/bow.svg'
            break
        case 'zauber':
            rollType = 'magie_diag'
            macroName = `${item.name} (Zauber)`
            iconPath = item.img || 'systems/Ilaris/assets/images/icon/spell.svg'
            break
        case 'liturgie':
            rollType = 'karma_diag'
            macroName = `${item.name} (Liturgie)`
            iconPath = item.img || 'systems/Ilaris/assets/images/icon/liturgy.svg'
            break
        default:
            return
    }

    // Create the macro command
    const command = `// Ilaris Combat Dialog Macro
const actorId = "${item.actor?.id || ''}";
const itemId = "${item.id}";
const rollType = "${rollType}";

// Get the actor
let actor;
if (actorId) {
    actor = game.actors.get(actorId);
}

// If no specific actor, try to get the controlled token's actor
if (!actor) {
    const tokens = canvas.tokens?.controlled;
    if (tokens && tokens.length === 1) {
        actor = tokens[0].actor;
    }
}

// If still no actor, try the user's assigned character
if (!actor) {
    actor = game.user.character;
}

if (!actor) {
    ui.notifications.warn("Kein Charakter ausgewählt. Bitte wähle einen Token oder weise deinem Benutzer einen Charakter zu.");
    return;
}

// Find the item on the actor
const item = actor.items.get(itemId);
if (!item) {
    ui.notifications.warn(\`Item "\${itemId}" nicht auf dem Charakter "\${actor.name}" gefunden.\`);
    return;
}

// Create a synthetic event to trigger the combat dialog
const event = {
    currentTarget: {
        dataset: {
            rolltype: rollType,
            itemid: itemId
        }
    }
};

// Import and call wuerfelwurf
const { wuerfelwurf } = await import('/systems/Ilaris/scripts/common/wuerfel.js');
await wuerfelwurf(event, actor);`

    // Check if a macro with this name already exists
    let macro = game.macros.find((m) => m.name === macroName)

    if (!macro) {
        // Create new macro
        macro = await Macro.create({
            name: macroName,
            type: 'script',
            img: iconPath,
            command: command,
            flags: {
                'Ilaris.itemMacro': true,
                'Ilaris.itemId': item.id,
                'Ilaris.actorId': item.actor?.id,
            },
        })
    }

    // Assign the macro to the hotbar slot
    if (macro) {
        game.user.assignHotbarMacro(macro, slot)
    }
}

/**
 * Hook handler for hotbar drops
 */
export function onHotbarDrop(bar, data, slot) {
    if (data.type === 'Item') {
        createIlarisMacro(data, slot)
        return false // Prevent default behavior
    }
}
