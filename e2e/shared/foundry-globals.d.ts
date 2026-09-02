export {}

declare global {
    const game: any

    const ChatMessage: {
        deleteDocuments(ids: string[]): Promise<unknown>
        create(data: unknown, options?: unknown): Promise<unknown>
        getSpeaker(options?: unknown): unknown
    }

    const Item: {
        createDocuments(data: unknown[], options?: unknown): Promise<any[]>
        [key: string]: unknown
    }

    const CONFIG: {
        Dice: {
            randomUniform?: () => number
            [key: string]: unknown
        }
        [key: string]: unknown
    }

    /** Foundry client UI singleton (sidebar, chat, notifications, …). */
    const ui: {
        sidebar?: {
            changeTab?: (tabName: string, group?: string, options?: unknown) => void
            activateTab?: (tabName: string) => void
            [key: string]: unknown
        }
        chat?: {
            scrollBottom?: () => void
            [key: string]: unknown
        }
        notifications?: {
            info?: (message: string) => void
            warn?: (message: string) => void
            error?: (message: string) => void
            [key: string]: unknown
        }
        [key: string]: unknown
    }

    /** Foundry namespace with utilities and document classes. */
    const foundry: {
        utils: {
            deepClone: <T>(original: T, options?: { strict?: boolean }) => T
            mergeObject: (original: object, other?: object, options?: object) => object
            expandObject: (obj: object) => object
            randomID: (length?: number) => string
            fromUuid: (uuid: string) => Promise<unknown>
            [key: string]: unknown
        }
        [key: string]: unknown
    }
}
