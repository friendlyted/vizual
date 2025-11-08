import {DataBinding, DataBindingProvider, Destroyable} from "../CommonInterfaces.ts";

export class InputDefinition {
    private readonly nodePath: number[];
    private readonly eventType: string;
    private readonly bindingName: string;

    constructor(nodePath: number[], eventType: string, bindingName: string) {
        this.nodePath = nodePath;
        this.eventType = eventType;
        this.bindingName = bindingName;
    }

    createInstance(instanceRoot: Element, bindingProvider: DataBindingProvider): InputInstance {
        let targetNode: Node = instanceRoot;
        for (let i = 0; i < this.nodePath.length; i++) {
            targetNode = targetNode.childNodes.item(this.nodePath[i]);
        }
        return new InputInstance(targetNode, this.eventType, bindingProvider.get(this.bindingName));
    }
}

export class InputInstance implements Destroyable {
    private readonly targetNode: Node;
    private readonly eventType: string;
    private readonly listener: (event: Event) => void;

    constructor(targetNode: Node, eventType: string, binding: DataBinding) {
        this.targetNode = targetNode;
        this.eventType = eventType;
        this.listener = event => {
            const value = binding.getValue();
            if (typeof value === "function") {
                value(event);
                return;
            }

            if (event.type === "input") {
                const element = event.target as HTMLInputElement;
                binding.setValue(element.value);
            } else if (event.type === "keydown") {
                const inputEvent = (event as KeyboardEvent);
                binding.setValue(inputEvent.key);
            } else {
                binding.setValue(event);
            }
        }
        this.targetNode.addEventListener(eventType, this.listener, {passive: false});
    }

    destroy() {
        this.targetNode.removeEventListener(this.eventType, this.listener);
    }
}