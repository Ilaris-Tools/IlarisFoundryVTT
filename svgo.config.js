export default {
    plugins: [
        // Enable default plugins
        'preset-default',
        // Remove editor-specific data like Inkscape/Sodipodi metadata
        'removeEditorsNSData',
        // Remove metadata
        'removeMetadata',
        // Remove empty containers
        'removeEmptyContainers',
        // Remove unused namespaces
        'removeUnusedNS',
        // Remove hidden elements
        'removeHiddenElems',
        // Remove empty attributes
        'removeEmptyAttrs',
        // Cleanup IDs
        'cleanupIds',
        // Minify styles
        'minifyStyles',
        // Convert colors to shorter format
        'convertColors',
        // Remove comments
        'removeComments',
        // Customize removals for Inkscape/Sodipodi specific elements
        {
            name: 'removeAttrs',
            params: {
                attrs: ['inkscape:*', 'sodipodi:*', 'data-name'],
            },
        },
    ],
}
