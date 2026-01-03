/**
 * Register tour on setup hook
 */
Hooks.once('setup', async function () {
    console.log('Ilaris: Loading world settings and system options tour')
    const welteinstellungenTour = await Tour.fromJSON(
        'systems/Ilaris/tours/welteinstellungen-und-systemoptionen.json',
    )
    console.log('Ilaris: Registering world settings and system options tour', welteinstellungenTour)
    game.tours.register('Ilaris', 'Ilaris.welteinstellungen-tour', welteinstellungenTour)
})

/**
 * Auto-start tour when Ilaris world settings are opened
 */
Hooks.on('renderSettingsConfig', async function (app, html, data) {
    console.log('Ilaris: SettingsConfig rendered', { app, data })

    // Prüfen ob es sich um Welt-Einstellungen handelt und die Ilaris-Kategorie aktiv ist
    // Defensive Programmierung: Prüfe erst ob die Properties existieren
    // Tour aus der Registry abrufen
    const tour = game.tours.get('Ilaris.Ilaris.welteinstellungen-tour')

    if (tour) {
        console.log('Ilaris: Tour found, status:', tour.status)

        // Prüfen ob die Tour noch nicht gestartet wurde
        if (tour.status === 'unstarted') {
            console.log('Ilaris: Starting contextual tour for Ilaris world settings')

            // Tour starten (der erste Schritt ist jetzt "einstellungen-dialog")
            await tour.start()
        }
    } else {
        console.warn('Ilaris: Tour not found in registry')
    }
})
