export function getFirstNumberFromString(str) {
    if (str) {
        return str.match(/\d+/)[0]
    }
    return null
}

export function getLastWordFromString(str) {
    return str.split(' ').pop()
}

export function multiplyString(reichweite, multiplier) {
    let distance = getFirstNumberFromString(reichweite)
    distance *= multiplier
    return distance + ' ' + getLastWordFromString(reichweite)
}

export function signed(i) {
    if (i < 0) {
        return `${i}`
    } else if (i > 0) {
        return `+${i}`
    } else {
        return ''
    }
}
