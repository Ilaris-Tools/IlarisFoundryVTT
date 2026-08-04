const release = ({
    importRequired = 'Ja',
    tutorials = true,
    body = 'Ein Hinweis.',
} = {}) => `# Changelog

## v14

### v14.0

#### Breaking Changes

Import erforderlich: ${importRequired}
${tutorials ? 'Tutorials: @UUID[Compendium.Ilaris.kurzuebersichten.JournalEntry.kurzimport001]{Charakter-Import}' : ''}
${body}
`

describe('generate-breaking-changes release parser', () => {
    let parseReleaseMetadata

    beforeAll(async () => {
        ;({ parseReleaseMetadata } = await import('../changelog-parser.js'))
    })

    it('parses the major release, import status, and existing tutorial reference', () => {
        const metadata = parseReleaseMetadata(release(), '14.0.0')

        expect(metadata).toMatchObject({
            version: '14.0',
            majorVersion: '14',
            hasBreakingChanges: true,
            importRequired: true,
        })
        expect(metadata.tutorials).toHaveLength(1)
        expect(metadata.markdown).toContain(
            'Charaktere müssen nach diesem Update neu importiert werden.',
        )
    })

    it('does not add the re-import disclaimer when import is not required', () => {
        const metadata = parseReleaseMetadata(release({ importRequired: 'Nein' }), '14.0.0')

        expect(metadata.importRequired).toBe(false)
        expect(metadata.markdown).not.toContain('neu importiert werden')
        expect(metadata.markdown).toContain('Ein Hinweis.')
    })

    it('rejects a missing major heading', () => {
        expect(() => parseReleaseMetadata('### v14.0\n', '14.0.0')).toThrow(
            'Missing major changelog heading',
        )
    })

    it('rejects a missing release heading', () => {
        expect(() => parseReleaseMetadata('## v14\n', '14.0.0')).toThrow(
            'Missing release changelog heading',
        )
    })

    it('rejects a breaking section without an explicit import marker', () => {
        expect(() =>
            parseReleaseMetadata(
                '## v14\n### v14.0\n#### Breaking Changes\nTutorials: @UUID[x]{Tutorial}\n',
                '14.0.0',
            ),
        ).toThrow('Import erforderlich')
    })

    it('rejects a major release without an existing tutorial reference', () => {
        expect(() => parseReleaseMetadata(release({ tutorials: false }), '14.0.0')).toThrow(
            'must reference at least one existing tutorial',
        )
    })
})
