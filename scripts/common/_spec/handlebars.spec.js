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
        describe('standard dice formulas', () => {
            test.each`
                description                             | input           | expected
                ${'3d20dl1dh1 -> 3W20 (Median)'}        | ${'3d20dl1dh1'} | ${'3W20 (Median)'}
                ${'2d20dl1 -> 2W20 (Schip)'}            | ${'2d20dl1'}    | ${'2W20 (Schip)'}
                ${'3d20dl2 -> 3W20 (Schip)'}            | ${'3d20dl2'}    | ${'3W20 (Schip)'}
                ${'4d20dl2dh1 -> 4W20 (Median, Schip)'} | ${'4d20dl2dh1'} | ${'4W20 (Median, Schip)'}
                ${'1d20 -> 1W20'}                       | ${'1d20'}       | ${'1W20'}
                ${'5d20dl3dh1 -> 5W20 (Median, Schip)'} | ${'5d20dl3dh1'} | ${'5W20 (Median, Schip)'}
                ${'2d6 -> 2W6'}                         | ${'2d6'}        | ${'2W6'}
                ${'1d6 -> 1W6'}                         | ${'1d6'}        | ${'1W6'}
            `('$description', ({ input, expected }) => {
                expect(helpers.formatDiceFormula(input)).toBe(expected)
            })
        })

        describe('edge cases', () => {
            test.each`
                description                       | input        | expected
                ${'null returns null'}            | ${null}      | ${null}
                ${'undefined returns undefined'}  | ${undefined} | ${undefined}
                ${'empty string returns empty'}   | ${''}        | ${''}
                ${'invalid format returns input'} | ${'invalid'} | ${'invalid'}
                ${'invalid format returns input'} | ${'abc123'}  | ${'abc123'}
            `('$description', ({ input, expected }) => {
                expect(helpers.formatDiceFormula(input)).toBe(expected)
            })
        })
    })
})
