function splitSkills(value) {
    return String(value || '')
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean)
}

function actorSkills(actor) {
    const skills =
        actor?.uebernatuerlich?.fertigkeiten || actor?.system?.uebernatuerlich?.fertigkeiten
    return Array.isArray(skills) ? skills : []
}

/** Resolve the concrete supernatural skill that supplies a cast's PW. */
export function resolveCastSkillContext(actor, item) {
    const selected = item?.system?.fertigkeit_ausgewaehlt
    if (selected && selected !== 'auto')
        return { castSkill: selected, options: [], requiresSelection: false }

    const candidates = splitSkills(item?.system?.fertigkeiten)
    const eligible = candidates
        .map((name) => {
            const skill = actorSkills(actor).find((entry) => entry?.name === name)
            return skill ? { name, pw: Number(skill.system?.pw || 0) } : null
        })
        .filter(Boolean)
    const bestPw = Math.max(...eligible.map((entry) => entry.pw), Number.NEGATIVE_INFINITY)
    const best = eligible.filter((entry) => entry.pw === bestPw)
    if (best.length === 1)
        return {
            castSkill: best[0].name,
            options: [],
            requiresSelection: false,
            basePW: best[0].pw,
        }
    if (best.length > 1)
        return { castSkill: '', options: best, requiresSelection: true, basePW: best[0].pw }
    return { castSkill: '', options: [], requiresSelection: false }
}
