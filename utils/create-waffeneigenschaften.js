/**
 * Script to create waffeneigenschaft items in Foundry
 * Run this in the Foundry console or as a macro
 *
 * Usage: Copy and paste this entire script into the Foundry console and press Enter
 */

const eigenschaften = [
    {
        name: 'Kopflastig',
        beschreibung:
            'Die Waffe kann zusätzliche Kraft besonders effizient in Schaden umwandeln. Der Schadensbonus durch hohe KK zählt für sie doppelt.',
        kategorie: 'modifier',
        modifiers: {
            schadenFormula: '@actor.system.attribute.KK.wert',
        },
    },
    {
        name: 'Schwer (4)',
        beschreibung:
            'Du brauchst mindestens Körperkraft 4, um die Waffe ohne Einschränkungen führen zu können. Darunter erleidest du einen Malus von -2 AT und -2 VT.',
        kategorie: 'conditional',
        conditions: [
            {
                type: 'attribute_check',
                attribute: 'KK',
                operator: '<',
                value: 4,
                onFailure: {
                    at: -2,
                    vt: -2,
                    schaden: 0,
                    message: 'KK < 4: -2 AT/VT',
                },
            },
        ],
    },
    {
        name: 'Schwer (8)',
        beschreibung:
            'Du brauchst mindestens Körperkraft 8, um die Waffe ohne Einschränkungen führen zu können. Darunter erleidest du einen Malus von -4 AT und -4 VT.',
        kategorie: 'conditional',
        conditions: [
            {
                type: 'attribute_check',
                attribute: 'KK',
                operator: '<',
                value: 8,
                onFailure: {
                    at: -4,
                    vt: -4,
                    schaden: 0,
                    message: 'KK < 8: -4 AT/VT',
                },
            },
        ],
    },
    {
        name: 'Zweihändig',
        beschreibung:
            "Die Waffe muss beidhändig geführt werden. Als Nebenwaffe: -4 AT/-4 VT (außer mit Vorteil 'Beidhändiger Kampf I'). Nur Hauptwaffe: -2 VT.",
        kategorie: 'wielding',
        wieldingRequirements: {
            hands: 2,
            penalties: {
                hauptOnly: { at: 0, vt: -2 },
                nebenOnly: { at: -4, vt: -4 },
                nebenWithoutExemption: { at: -4, vt: -4 },
            },
        },
    },
    {
        name: 'Unberechenbar',
        beschreibung:
            'Die Waffe verursacht eine zusätzliche Komplikation bei 19-20. Bei einer 1 im Angriffswurf trifft die Waffe den Angreifer selbst.',
        kategorie: 'combat_mechanic',
        combatMechanics: {
            fumbleThreshold: 1,
            critThreshold: 19,
        },
        conditionalModifiers: [
            {
                trigger: 'fumble',
                effect: 'Waffe trifft den Angreifer selbst',
            },
        ],
    },
    {
        name: 'Niederwerfen',
        beschreibung:
            'Bei einem Treffer kann das Ziel versuchen, mit einer KK-Probe nicht niedergeworfen zu werden.',
        kategorie: 'target_effect',
        targetEffect: {
            name: 'Niederwerfen',
            trigger: 'on_hit',
            resistCheck: {
                attribute: 'KK',
                difficulty: 0,
            },
            effect: {
                type: 'condition',
                value: 'Liegend',
            },
        },
    },
    {
        name: 'Niederwerfen (4)',
        beschreibung:
            'Bei einem Treffer kann das Ziel versuchen, mit einer KK-Probe -4 nicht niedergeworfen zu werden.',
        kategorie: 'target_effect',
        targetEffect: {
            name: 'Niederwerfen',
            trigger: 'on_hit',
            resistCheck: {
                attribute: 'KK',
                difficulty: -4,
            },
            effect: {
                type: 'condition',
                value: 'Liegend',
            },
        },
    },
    {
        name: 'Niederwerfen (8)',
        beschreibung:
            'Bei einem Treffer kann das Ziel versuchen, mit einer KK-Probe -8 nicht niedergeworfen zu werden.',
        kategorie: 'target_effect',
        targetEffect: {
            name: 'Niederwerfen',
            trigger: 'on_hit',
            resistCheck: {
                attribute: 'KK',
                difficulty: -8,
            },
            effect: {
                type: 'condition',
                value: 'Liegend',
            },
        },
    },
    {
        name: 'Umklammern',
        beschreibung:
            'Bei einem Treffer kann das Ziel versuchen, mit einer KK-Probe nicht umklammert zu werden.',
        kategorie: 'target_effect',
        targetEffect: {
            name: 'Umklammern',
            trigger: 'on_hit',
            resistCheck: {
                attribute: 'KK',
                difficulty: 0,
            },
            effect: {
                type: 'grapple',
                value: 'Umklammert',
            },
        },
    },
    {
        name: 'Umklammern (-2; 12)',
        beschreibung:
            'Bei einem Treffer kann das Ziel versuchen, mit einer KK-Probe -2 (Mindestwurf 12) nicht umklammert zu werden.',
        kategorie: 'target_effect',
        targetEffect: {
            name: 'Umklammern',
            trigger: 'on_hit',
            resistCheck: {
                attribute: 'KK',
                difficulty: -2,
                minimumRoll: 12,
            },
            effect: {
                type: 'grapple',
                value: 'Umklammert',
            },
        },
    },
    {
        name: 'Umklammern (-4; 16)',
        beschreibung:
            'Bei einem Treffer kann das Ziel versuchen, mit einer KK-Probe -4 (Mindestwurf 16) nicht umklammert zu werden.',
        kategorie: 'target_effect',
        targetEffect: {
            name: 'Umklammern',
            trigger: 'on_hit',
            resistCheck: {
                attribute: 'KK',
                difficulty: -4,
                minimumRoll: 16,
            },
            effect: {
                type: 'grapple',
                value: 'Umklammert',
            },
        },
    },
    {
        name: 'Umklammern (-8; 16)',
        beschreibung:
            'Bei einem Treffer kann das Ziel versuchen, mit einer KK-Probe -8 (Mindestwurf 16) nicht umklammert zu werden.',
        kategorie: 'target_effect',
        targetEffect: {
            name: 'Umklammern',
            trigger: 'on_hit',
            resistCheck: {
                attribute: 'KK',
                difficulty: -8,
                minimumRoll: 16,
            },
            effect: {
                type: 'grapple',
                value: 'Umklammert',
            },
        },
    },
    {
        name: 'Parierwaffe',
        beschreibung: 'Die Waffe ist besonders gut zum Parieren geeignet.',
        kategorie: 'passive',
    },
    {
        name: 'Stumpf',
        beschreibung: 'Die Waffe verursacht stumpfen Schaden.',
        kategorie: 'passive',
    },
    {
        name: 'Zerbrechlich',
        beschreibung: 'Die Waffe kann leicht zerbrechen.',
        kategorie: 'passive',
    },
    {
        name: 'Unzerstörbar',
        beschreibung: 'Die Waffe kann nicht zerstört werden.',
        kategorie: 'passive',
    },
    {
        name: 'Wendig',
        beschreibung: 'Die Waffe ist besonders leicht und wendig zu führen.',
        kategorie: 'passive',
    },
    {
        name: 'Rüstungsbrechend',
        beschreibung: 'Die Waffe kann Rüstungen besonders effektiv durchdringen.',
        kategorie: 'passive',
    },
    {
        name: 'Schild',
        beschreibung: 'Diese Waffe ist ein Schild.',
        kategorie: 'passive',
    },
    {
        name: 'Reittier',
        beschreibung: 'Diese natürliche Waffe gehört zu einem Reittier.',
        kategorie: 'passive',
    },
    {
        name: 'kein Malus als Nebenwaffe',
        beschreibung: 'Diese Waffe kann ohne Malus als Nebenwaffe geführt werden.',
        kategorie: 'passive',
    },
    {
        name: 'kein Reiter',
        beschreibung: 'Diese Waffe kann nicht von einem Reiter benutzt werden.',
        kategorie: 'passive',
    },
    {
        name: 'stationär',
        beschreibung: 'Diese Waffe ist stationär und kann nicht bewegt werden.',
        kategorie: 'passive',
    },
    {
        name: 'Magazin',
        beschreibung: 'Diese Waffe verfügt über ein Magazin.',
        kategorie: 'passive',
    },
]

async function createWaffeneigenschaften() {
    console.log('🔄 Starting to create waffeneigenschaft items...\n')

    // Get or create the waffeneigenschaften pack
    const packName = 'Ilaris.waffeneigenschaften'
    let pack = game.packs.get(packName)

    if (!pack) {
        ui.notifications.error(
            `Pack ${packName} not found! Make sure it's registered in system.json`,
        )
        return
    }

    // Unlock the pack if it's locked
    if (pack.locked) {
        console.log('🔓 Unlocking pack...')
        await pack.configure({ locked: false })
    }

    let created = 0
    let skipped = 0
    let errors = 0

    for (const eigenschaftData of eigenschaften) {
        try {
            // Check if item already exists
            const existing = pack.index.find((i) => i.name === eigenschaftData.name)
            if (existing) {
                console.log(`⏭️  ${eigenschaftData.name} - already exists`)
                skipped++
                continue
            }

            // Create the complete item data structure
            const itemData = {
                name: eigenschaftData.name,
                type: 'waffeneigenschaft',
                system: {
                    beschreibung: eigenschaftData.beschreibung || '',
                    kategorie: eigenschaftData.kategorie || 'passive',
                    modifiers: eigenschaftData.modifiers || {
                        at: 0,
                        vt: 0,
                        schaden: 0,
                        schadenFormula: '',
                        rw: 0,
                    },
                    conditions: eigenschaftData.conditions || [],
                    wieldingRequirements: eigenschaftData.wieldingRequirements || {
                        hands: 1,
                        penalties: {
                            hauptOnly: null,
                            nebenOnly: null,
                            nebenWithoutExemption: null,
                        },
                    },
                    targetEffect: eigenschaftData.targetEffect || {
                        name: '',
                        trigger: '',
                        resistCheck: {
                            attribute: '',
                            difficulty: 0,
                        },
                        effect: {
                            type: '',
                            duration: '',
                            value: '',
                        },
                    },
                    combatMechanics: eigenschaftData.combatMechanics || {
                        fumbleThreshold: null,
                        critThreshold: null,
                        ignoreCover: false,
                        ignoreArmor: false,
                        additionalDice: 0,
                    },
                    conditionalModifiers: eigenschaftData.conditionalModifiers || [],
                    actorModifiers: eigenschaftData.actorModifiers || {
                        initiative: 0,
                        movement: 0,
                        conditions: [],
                    },
                    customScript: '',
                },
            }

            // Create the item in the compendium
            await Item.create(itemData, { pack: packName })
            console.log(`✅ Created: ${eigenschaftData.name}`)
            created++
        } catch (error) {
            console.error(`❌ Error creating ${eigenschaftData.name}:`, error)
            errors++
        }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 Summary:')
    console.log(`   Created: ${created}`)
    console.log(`   Skipped: ${skipped}`)
    console.log(`   Errors:  ${errors}`)
    console.log(`   Total:   ${eigenschaften.length}`)
    console.log('='.repeat(60))

    if (created > 0) {
        ui.notifications.info(`Successfully created ${created} waffeneigenschaft items!`)
    }
}

// Run the function
createWaffeneigenschaften()
