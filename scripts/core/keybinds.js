export function initializeKeybinds() {
    registerNewKeybinds()
}

function registerNewKeybinds() {
    registerHeldTabbing()
}

// TAB keybind to rotate through "Held" sheet tabs with TAB key
function registerHeldTabbing() {
    game.keybindings.register('Ilaris', 'rotateInHeldSheet', {
        name: 'Held Tabs rotieren',
        hint: 'Rotiere durch die Tabs im Heldenbogen.',
        uneditable: [],
        namespace: 'Ilaris',
        editable: [
            {
                key: 'Tab',
                modifiers: ['Shift'],
            },
        ],
        repeat: true,
        onDown: () => {
            const heldTab = document.getElementsByClassName('herotabnavigation')

            if (heldTab.length == 0) {
                // If Held sheet is closed - do nothing
                return
            }
            console.log('tab info', heldTab)

            // Set Tab to next Tab in Tab view
            console.log('getting children')
            const childElements = heldTab[0].children
            console.log('childElements', childElements)
            const totalTabs = childElements.length
            console.log('totalTabs', totalTabs)
            let activeIndex = 0
            Array.from(childElements).forEach((child, i) => {
                if (child.classList.contains('active')) {
                    activeIndex = i
                }
            })
            console.log('tab details', 'activeIndex', activeIndex)
            let nextTab = activeIndex + 1
            if (nextTab > totalTabs - 1) {
                nextTab = 0
            }
            childElements[activeIndex].classList.remove('active')
            childElements[nextTab].classList.add('active')
            // Maybe if right shift used - go left (with exact key comparison)
        },
        onUp: () => {},
        precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
    })
}
