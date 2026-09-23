import { resolveCastSkillContext } from '../cast-skill-context.js'

const actor = (skills) => ({ uebernatuerlich: { fertigkeiten: skills } })
const skill = (name, pw) => ({ name, system: { pw } })

describe('resolveCastSkillContext', () => {
    it('uses the configured fixed skill', () => {
        expect(
            resolveCastSkillContext(actor([skill('Dämonisch', 14)]), {
                system: {
                    fertigkeit_ausgewaehlt: 'Dämonisch',
                    fertigkeiten: 'Dämonisch, Einfluss',
                },
            }),
        ).toMatchObject({ castSkill: 'Dämonisch', requiresSelection: false })
    })

    it('selects the unique highest automatic skill', () => {
        expect(
            resolveCastSkillContext(actor([skill('Dämonisch', 14), skill('Einfluss', 12)]), {
                system: { fertigkeit_ausgewaehlt: 'auto', fertigkeiten: 'Dämonisch, Einfluss' },
            }),
        ).toMatchObject({ castSkill: 'Dämonisch', basePW: 14, requiresSelection: false })
    })

    it('selects the alphabetically later tied automatic skill', () => {
        expect(
            resolveCastSkillContext(actor([skill('Dämonisch', 14), skill('Einfluss', 14)]), {
                system: { fertigkeit_ausgewaehlt: 'auto', fertigkeiten: 'Dämonisch, Einfluss' },
            }),
        ).toMatchObject({
            castSkill: 'Einfluss',
            basePW: 14,
            requiresSelection: false,
            options: [],
        })
    })

    it('orders tied automatic skills by German locale for umlaut names', () => {
        expect(
            resolveCastSkillContext(actor([skill('Äther', 16), skill('Zaubern', 16)]), {
                system: { fertigkeit_ausgewaehlt: 'auto', fertigkeiten: 'Äther, Zaubern' },
            }),
        ).toMatchObject({
            castSkill: 'Zaubern',
            basePW: 16,
            requiresSelection: false,
        })
    })
})
