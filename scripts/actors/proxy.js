import { IlarisActor } from "./actor.js";
import { HeldActor } from "./held.js";
import { KreaturActor } from "./kreatur.js";

const handler = {
    construct(_, args) {
        switch (args[0]?.type) {
            case "held":
                return new HeldActor(...args);
            case "kreatur":
                return new KreaturActor(...args);
            default:
                return new IlarisActor(...args);
        }
    },
};

export const IlarisActorProxy = new Proxy(IlarisActor, handler);
