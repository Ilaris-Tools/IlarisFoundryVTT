import { initializeHandlebars } from '../handlebars.js'

describe('handlebars', () => {
    var helpers = {}
    global.loadTemplates = jest.fn()

    beforeEach(() => {
        helpers = {}
        global.Handlebars = {
            registerHelper: (helperName, callback) => {
                helpers[helperName] = callback
            },
        }
        initializeHandlebars()
    })

    describe('ifGt', () => {
        describe('error', () => {
            test.each`
                description            | val1              | val2
                ${'val1 !number'}      | ${'invalid Val1'} | ${2}
                ${'val1 == null'}      | ${null}           | ${2}
                ${'val2 !number'}      | ${123}            | ${'string val2'}
                ${'val2 == undefined'} | ${123}            | ${undefined}
            `('$description', ({ val1, val2 }) => {
                expect(() => {
                    helpers.ifGt(val1, val2)
                }).toThrow('handelbars.js - ifGt - atleast one parameter is not a number')
            })
        })

        describe('all numbers', () => {
            test.each`
                description       | val1  | val2  | resultValue
                ${'val1 > val2'}  | ${3}  | ${1}  | ${true}
                ${'val1 < val2'}  | ${-3} | ${13} | ${false}
                ${'val1 == val2'} | ${3}  | ${3}  | ${false}
            `('$description', ({ val1, val2, resultValue }) => {
                expect(helpers.ifGt(val1, val2)).toBe(resultValue)
            })
        })
    })

    describe('formatDiceFormula', () => {
        test('should be registered and delegate to utility function', () => {
            // Test that the helper is registered
            expect(helpers.formatDiceFormula).toBeDefined()

            // Test a basic case to ensure it delegates correctly
            expect(helpers.formatDiceFormula('3d20dl1dh1')).toBe('3W20 (Median)')
            expect(helpers.formatDiceFormula('1d20')).toBe('1W20')
        })
    })
})
