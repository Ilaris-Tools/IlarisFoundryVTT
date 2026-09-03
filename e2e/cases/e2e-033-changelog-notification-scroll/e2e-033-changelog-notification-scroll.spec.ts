/**
 * E2E-033 – Changelog Notification Scroll
 *
 * @spec openspec/changes/fix-changelog-dialog-scrolling/specs/release/spec.md
 * @scenario Long generated changelog is scrollable
 */

import { expect, test } from '@playwright/test'

import { foundryConfig, loginAndJoinWorld } from '../../shared/fixtures/foundry'

test.describe('E2E-033 · Changelog notification scrolling', () => {
    test('keeps the acknowledgement action visible while generated content scrolls', async ({
        page,
    }) => {
        await loginAndJoinWorld(page, foundryConfig)

        await page.evaluate(async () => {
            const notification = await import(
                `/systems/${game.system.id}/scripts/changelog/changelog-notification.js`
            )
            const longGeneratedContent = Array.from(
                { length: 80 },
                (_, index) => `<p>Generated breaking change ${index + 1}</p>`,
            ).join('')
            notification.showChangelogNotification(
                '14.1',
                `<div class="ilaris-changelog-content">
                    <p class="ilaris-changelog-intro">Generated breaking changes</p>
                    <div class="ilaris-changelog-body">${longGeneratedContent}</div>
                </div>`,
            )
        })

        // loginAndJoinWorld registers an overlay handler for the regular
        // changelog. Inspect this deliberately-created dialog in page context
        // so that handler cannot acknowledge it before the assertions run.
        const layout = await page.evaluate(() => {
            const dialog = document.querySelector<HTMLElement>('.ilaris-changelog-notification')
            const content = dialog?.querySelector<HTMLElement>('.ilaris-changelog-window-content')
            const body = dialog?.querySelector<HTMLElement>('.ilaris-changelog-body')
            const footer = dialog?.querySelector<HTMLElement>('.form-footer')
            const acknowledge = dialog?.querySelector<HTMLButtonElement>(
                'button[data-action="acknowledge"]',
            )
            if (!dialog || !content || !body || !footer || !acknowledge) {
                throw new Error(
                    'Expected changelog window content, body, footer, and acknowledgement action',
                )
            }

            const dialogBounds = dialog.getBoundingClientRect()
            const footerBounds = footer.getBoundingClientRect()
            return {
                contentVisible: content.checkVisibility(),
                bodyVisible: body.checkVisibility(),
                acknowledgeVisible: acknowledge.checkVisibility(),
                overflowY: getComputedStyle(body).overflowY,
                scrollHeight: body.scrollHeight,
                clientHeight: body.clientHeight,
                footerTop: footerBounds.top,
                footerBottom: footerBounds.bottom,
                dialogTop: dialogBounds.top,
                dialogBottom: dialogBounds.bottom,
            }
        })

        expect(layout.contentVisible).toBe(true)
        expect(layout.bodyVisible).toBe(true)
        expect(layout.acknowledgeVisible).toBe(true)
        expect(layout.overflowY).toBe('auto')
        expect(layout.scrollHeight).toBeGreaterThan(layout.clientHeight)
        expect(layout.footerTop).toBeGreaterThanOrEqual(layout.dialogTop)
        expect(layout.footerBottom).toBeLessThanOrEqual(layout.dialogBottom)

        await page.evaluate(() => {
            const acknowledge = document.querySelector<HTMLButtonElement>(
                '.ilaris-changelog-notification button[data-action="acknowledge"]',
            )
            if (!acknowledge) throw new Error('Expected acknowledgement action')
            acknowledge.click()
        })
        await page.waitForFunction(() => !document.querySelector('.ilaris-changelog-notification'))
    })
})
