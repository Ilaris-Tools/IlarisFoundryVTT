import { expect, test } from '@playwright/test'

import { foundryConfig, loginAndJoinWorld } from '../../shared/fixtures/foundry'

test.describe('E2E-029 Token-Status-HUD', () => {
    test('Statusarten sind nach Konfigurationsreihenfolge zeilenweise angeordnet und eingefärbt', async ({
        page,
    }) => {
        await loginAndJoinWorld(page, foundryConfig)

        const expectedStatusIds = await page.evaluate(async () => {
            const token = canvas.tokens?.placeables?.[0]
            if (!token)
                throw new Error(
                    'Die E2E-Baseline benötigt mindestens einen Token in der aktiven Szene.',
                )

            await canvas.hud.token.bind(token)
            canvas.hud.token.togglePalette('effects', true)
            return Object.values(CONFIG.statusEffects)
                .sort((left: any, right: any) => left.order - right.order)
                .slice(0, 8)
                .map((status: any) => status.id)
        })

        const controls = page.locator('.status-effects:visible .effect-control')
        await expect(controls.first()).toBeVisible({ timeout: 10000 })

        const visibleStatusIds = await controls.evaluateAll((nodes) =>
            nodes.map((node) => (node as HTMLElement).dataset.statusId),
        )
        expect(visibleStatusIds.slice(0, expectedStatusIds.length)).toEqual(expectedStatusIds)

        const geometry = await controls.evaluateAll((nodes) =>
            nodes.slice(0, 8).map((node) => {
                const element = node as HTMLElement
                const rect = element.getBoundingClientRect()
                return {
                    left: rect.left,
                    tint: CONFIG.statusEffects[element.dataset.statusId ?? '']?.tint,
                    top: rect.top,
                }
            }),
        )

        expect(geometry).toHaveLength(8)
        for (const control of geometry) {
            expect(control.tint).toMatch(/^#[0-9A-F]{6}$/)
        }
        expect(geometry[1].top).toBe(geometry[0].top)
        expect(geometry[3].top).toBe(geometry[0].top)
        expect(geometry[4].top).toBeGreaterThan(geometry[0].top)
    })
})
