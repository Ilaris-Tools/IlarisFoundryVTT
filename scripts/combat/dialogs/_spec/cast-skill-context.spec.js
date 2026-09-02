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

    it('requires a choice for tied automatic skills', () => {
        expect(
            resolveCastSkillContext(actor([skill('Dämonisch', 14), skill('Einfluss', 14)]), {
                system: { fertigkeit_ausgewaehlt: 'auto', fertigkeiten: 'Dämonisch, Einfluss' },
            }),
        ).toMatchObject({
            castSkill: '',
            requiresSelection: true,
            options: [{ name: 'Dämonisch' }, { name: 'Einfluss' }],
        })
    })
})
