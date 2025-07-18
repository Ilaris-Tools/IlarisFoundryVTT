import { IlarisItem } from './item.js'
import { ManoeverItem } from './manoever.js'
import { AngriffItem } from './angriff.js'
import { WaffeItem } from './waffe.js'
import { CombatItem } from './combat.js'

const handler = {
    construct(_, args) {
        switch (args[0]?.type) {
            case 'angriff':
                return new AngriffItem(...args)
            case 'nahkampfwaffe':
            case 'fernkampfwaffe':
                return new WaffeItem(...args)
            case 'zauber':
            case 'liturgie':
            case 'anrufung':
                return new CombatItem(...args)
            case 'manoever':
                return new ManoeverItem(...args)
            default:
                return new IlarisItem(...args)
        }
    },
}

export const IlarisItemProxy = new Proxy(IlarisItem, handler)
