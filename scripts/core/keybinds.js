export function initializeKeybinds() {
    registerNewKeybinds()
}

function registerNewKeybinds() {
    registerHeldTabbing()
}

// TAB keybind to rotate through "Held" sheet tabs with TAB key
function registerHeldTabbing() {
    // NOTE: Would be nice to block the default TAB core.cycleView behaviour
    // When a Actor sheet for Ilaris is open
    game.keybindings.register('Ilaris', 'rotateInHeldSheet', {
        name: 'Held Tabs rotieren',
        hint: 'Rotiere durch die Tabs im Heldenbogen.',
        uneditable: [],
        namespace: 'Ilaris',
        editable: [
            {
                key: 'Tab',
            },
        ],
        reservedModifiers: ['SHIFT'],
        repeat: true,
        onDown: (ctx) => {
            const heldTab = document.getElementsByClassName('herotabnavigation')

            if (heldTab.length == 0) {
                // If Held sheet is closed - do nothing
                return
            }
            // Risky lookup of actor sheet ID based on code structure
            const actorId = heldTab[0].parentNode.parentNode.id.split('-')[2]
            const actor = game.actors.get(actorId)

            // Set Tab to next Tab in Tab view
            const childElements = heldTab[0].children
            const totalTabs = childElements.length
            let activeIndex = 0
            Array.from(childElements).forEach((child, i) => {
                if (child.classList.contains('active')) {
                    activeIndex = i
                }
            })

            let nextTab = activeIndex + 1
            if (nextTab > totalTabs - 1) {
                nextTab = 0
            }
            // Reverse with Shift clicked
            if (ctx.isShift) {
                let previousTab = activeIndex - 1
                if (previousTab < 0) {
                    previousTab = totalTabs - 1
                }
                nextTab = previousTab
            }
            actor._sheet.changeTab(childElements[nextTab].dataset.tab, 'primary')
            // Maybe if shift used - go left
        },
        onUp: () => {},
        precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
    })
}
