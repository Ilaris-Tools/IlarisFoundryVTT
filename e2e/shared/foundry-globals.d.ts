export {}

declare global {
    const game: any

    const ChatMessage: {
        deleteDocuments(ids: string[]): Promise<unknown>
    }
}
