import { IlarisItem } from './item.js'
import { ManoeverItem } from './manoever.js'
import { AngriffItem } from './angriff.js'
import { WaffeItem } from '../../waffe/data/waffe.js'
import { CombatItem } from './combat-item.js'
import { EffectItem } from './effect-item.js'

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
            case 'effect-item':
                return new EffectItem(...args)
            default:
                return new IlarisItem(...args)
        }
    },
}

export const IlarisItemProxy = new Proxy(IlarisItem, handler)
