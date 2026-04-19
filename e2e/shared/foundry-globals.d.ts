export {}

declare global {
    const game: any

    const ChatMessage: {
        deleteDocuments(ids: string[]): Promise<unknown>
    }

    const CONFIG: {
        Dice: {
            randomUniform?: () => number
            [key: string]: unknown
        }
        [key: string]: unknown
    }
}
