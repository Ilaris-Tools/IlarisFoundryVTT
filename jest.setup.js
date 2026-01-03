// Mock Foundry VTT globals for Jest tests

// Mock FormApplication
global.FormApplication = class FormApplication {
    static get defaultOptions() {
        return {
            classes: [],
            template: '',
            width: 600,
            height: 'auto',
        }
    }

    constructor(object = {}, options = {}) {
        this.object = object
        this.options = options
    }

    getData() {
        return {}
    }

    activateListeners(html) {}

    async _updateObject(event, formData) {}
}

// Mock foundry.utils
global.foundry = {
    utils: {
        mergeObject: (original, other = {}, options = {}) => {
            return { ...original, ...other }
        },
        deepClone: (obj) => {
            return JSON.parse(JSON.stringify(obj))
        },
        duplicate: (obj) => {
            return JSON.parse(JSON.stringify(obj))
        },
        setProperty: (object, key, value) => {
            const parts = key.split('.')
            let target = object
            for (let i = 0; i < parts.length - 1; i++) {
                if (!target[parts[i]]) target[parts[i]] = {}
                target = target[parts[i]]
            }
            target[parts[parts.length - 1]] = value
            return true
        },
        getProperty: (object, key) => {
            const parts = key.split('.')
            let target = object
            for (const part of parts) {
                if (target === undefined || target === null) return undefined
                target = target[part]
            }
            return target
        },
        randomID: (length = 16) => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            let result = ''
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length))
            }
            return result
        },
    },
}

// Mock game object
global.game = {
    settings: {
        register: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
    },
    i18n: {
        localize: jest.fn((key) => key),
        format: jest.fn((key, data) => key),
    },
}

// Mock Handlebars (will be overridden in specific tests as needed)
global.Handlebars = {
    registerHelper: jest.fn(),
    registerPartial: jest.fn(),
}
