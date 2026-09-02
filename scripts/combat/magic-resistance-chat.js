import { acceptMagicResistanceResult } from './magic-resistance.js'

function processedRequests() {
    globalThis.window ??= globalThis
    window._ilarisProcessedMagicResistanceRequests ??= new Set()
    return window._ilarisProcessedMagicResistanceRequests
}

function rememberRequest(requestId) {
    const requests = processedRequests()
    if (requests.has(requestId)) return false
    requests.add(requestId)
    if (requests.size > 1000) requests.delete(requests.values().next().value)
    return true
}

function whisperRecipients(executorUserId) {
    const recipients = new Set([executorUserId])
    for (const user of game.users || []) {
        if (user.active && user.isGM) recipients.add(user.id)
    }
    return Array.from(recipients)
}

function requestContent(request) {
    const encoded = encodeURIComponent(JSON.stringify(request))
    return `<div class="ilaris-magic-resistance-prompt"><p><strong>Magieresistenz: ${request.targetName}</strong></p><p>MR ${request.magicResistance} + 1W20 bestimmt die Zauberschwierigkeit.</p><button class="magic-resistance-roll-button" data-magic-resistance-request="${encoded}"><i class="fas fa-dice-d20"></i> MR würfeln</button></div>`
}

export async function handleMagicResistanceRequest(request) {
    if (!request?.id || request.executorUserId !== game.user?.id || !rememberRequest(request.id))
        return
    await ChatMessage.create({
        content: requestContent(request),
        speaker: { alias: 'Magieresistenz' },
        whisper: whisperRecipients(request.executorUserId),
        flags: { ilaris: { magicResistanceRequest: true, requestId: request.id } },
    })
}

export function applyMagicResistanceResultToDialog(result) {
    const dialog = globalThis.window?._ilarisCombatDialogs?.get(result?.dialogId)
    if (!dialog?.magicResistanceChallenge) return false
    const accepted = acceptMagicResistanceResult(dialog.magicResistanceChallenge, result)
    if (!accepted) return false
    dialog.magicResistanceChallenge = accepted
    dialog.render?.()
    return true
}

export async function handleMagicResistanceResult(result) {
    return applyMagicResistanceResultToDialog(result)
}

export function registerMagicResistanceChatHook() {
    if (window._ilarisMagicResistanceChatHookRegistered) return
    window._ilarisMagicResistanceChatHookRegistered = true
    Hooks.on('renderChatMessageHTML', (_message, htmlDOM) => {
        htmlDOM.querySelectorAll('.magic-resistance-roll-button').forEach((button) => {
            button.addEventListener('click', async () => {
                if (button.disabled) return
                button.disabled = true
                let request
                try {
                    request = JSON.parse(
                        decodeURIComponent(button.dataset.magicResistanceRequest || '{}'),
                    )
                } catch (_error) {
                    ui.notifications.warn('Die Magieresistenz-Anfrage ist ungültig.')
                    return
                }
                if (!request?.id || request.executorUserId !== game.user?.id) return
                const roll = await new Roll('1d20').evaluate()
                const d20 = Number(roll.total ?? roll._total)
                if (!Number.isInteger(d20) || d20 < 1 || d20 > 20) {
                    ui.notifications.warn(
                        'Der W20 für die Magieresistenz konnte nicht ausgewertet werden.',
                    )
                    button.disabled = false
                    return
                }
                const result = {
                    requestId: request.id,
                    dialogId: request.dialogId,
                    targetActorUuid: request.targetActorUuid,
                    d20,
                }
                await ChatMessage.create({
                    content: `<div class="ilaris-magic-resistance-result"><p><strong>Magieresistenz: ${request.targetName}</strong></p><p>MR ${request.magicResistance} + W20 ${d20} = <strong>${request.magicResistance + d20}</strong></p></div>`,
                    speaker: { alias: 'Magieresistenz' },
                    whisper: whisperRecipients(request.executorUserId),
                    flags: { ilaris: { magicResistanceResult: true, requestId: request.id } },
                })
                game.socket.emit('system.Ilaris', { type: 'resolveMagicResistance', data: result })
                await applyMagicResistanceResultToDialog(result)
            })
        })
    })
}
