export const E2E_BASELINE = {
    revision: 'r1',
    world: {
        id: 'ilaris-e2e-world-v14363-r1',
        name: 'ilaris-e2e-world-v14363-r1',
        systemId: 'Ilaris',
    },
    users: {
        gm: 'e2e-gm',
        player: 'e2e-player',
    },
    actors: {
        allCapabilities: 'HatAlles',
        hero: 'Testlauf-Held',
        npc: 'Testlauf-Npc',
    },
    weapons: {
        shortSword: 'Kurzschwert',
        customAnderthalbhander: 'CustomAnderthalbhänder',
    },
    spells: {
        ignifaxius: 'Ignifaxius',
        ignifaxiusFlammenstrahl: 'Ignifaxius Flammenstrahl',
        daemonenbann: 'Dämonenbann',
        axxeleratus: 'Axxeleratus',
    },
    ownership: {
        actor: 'Testlauf-Held',
        user: 'e2e-player',
    },
    settingDefaults: {
        renameTriumphWithCrit: false,
        lepSystem: false,
        useTargetSelection: false,
    },
    compendiums: {
        creatureLabel: 'kreatur',
        spellLabel: 'zauberspruch',
    },
} as const

/**
 * Restores the explicitly declared E2E world-setting defaults after an interrupted
 * E2E case left a setting behind. This deliberately touches no other world state;
 * {@link assertE2EBaseline} remains responsible for validating all dependencies.
 */
export async function restoreE2EBaselineSettings(
    page: import('@playwright/test').Page,
): Promise<void> {
    const unrestored = await page.evaluate(async (baseline) => {
        const failures: string[] = []

        for (const [settingName, expectedValue] of Object.entries(baseline.settingDefaults)) {
            try {
                if (game.settings.get(baseline.world.systemId, settingName) !== expectedValue) {
                    await game.settings.set(baseline.world.systemId, settingName, expectedValue)
                }

                if (game.settings.get(baseline.world.systemId, settingName) !== expectedValue) {
                    failures.push(
                        `${baseline.world.systemId}.${settingName}=${String(expectedValue)}`,
                    )
                }
            } catch {
                failures.push(`${baseline.world.systemId}.${settingName}=${String(expectedValue)}`)
            }
        }

        return failures
    }, E2E_BASELINE)

    if (unrestored.length > 0) {
        throw new Error(
            `Unable to restore E2E baseline setting defaults: ${unrestored.join(', ')}. ` +
                'Join as a GM or reset the published baseline world.',
        )
    }
}

export async function assertE2EBaseline(page: import('@playwright/test').Page): Promise<void> {
    const missing = await page.evaluate((baseline) => {
        const missingDependencies: string[] = []

        if (game.world?.id !== baseline.world.id)
            missingDependencies.push(`world:${baseline.world.id}`)
        if (game.system?.id !== baseline.world.systemId) {
            missingDependencies.push(`system:${baseline.world.systemId}`)
        }

        for (const userName of Object.values(baseline.users)) {
            if (!game.users?.getName(userName)) missingDependencies.push(`user:${userName}`)
        }
        for (const actorName of Object.values(baseline.actors)) {
            if (!game.actors?.getName(actorName)) missingDependencies.push(`actor:${actorName}`)
        }

        const player = game.users?.getName(baseline.ownership.user)
        const ownedActor = game.actors?.getName(baseline.ownership.actor)
        if (
            !ownedActor ||
            !player ||
            !ownedActor.testUserPermission(player, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
        ) {
            missingDependencies.push(`owner:${baseline.ownership.user}:${baseline.ownership.actor}`)
        }

        for (const [settingName, expectedValue] of Object.entries(baseline.settingDefaults)) {
            try {
                const actualValue = game.settings.get(baseline.world.systemId, settingName)
                if (actualValue !== expectedValue) {
                    missingDependencies.push(
                        `setting:${baseline.world.systemId}.${settingName}=${String(expectedValue)}`,
                    )
                }
            } catch {
                missingDependencies.push(`setting:${baseline.world.systemId}.${settingName}`)
            }
        }

        if (!canvas?.scene && !game.scenes?.active) missingDependencies.push('scene:active')

        return missingDependencies
    }, E2E_BASELINE)

    if (missing.length > 0) {
        throw new Error(
            `E2E baseline ${E2E_BASELINE.revision} is incomplete: ${missing.join(', ')}. ` +
                'Use the published baseline archive or an isolated server with the same baseline.',
        )
    }
}
