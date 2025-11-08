import {DataBindingProvider, Destroyable} from "../CommonInterfaces.ts";

/**
 * Обеспечивает связь вложенных компонент из тегов с переменной модели.
 */
export class BackrefDefinition {
    private readonly nodePath: number[];
    private readonly bindingName: string;

    constructor(nodePath: number[], bindingName: string) {
        this.nodePath = nodePath;
        this.bindingName = bindingName;
    }

    createInstance(instanceRoot: Element, binding: DataBindingProvider): Destroyable {
        let targetNode: Element = instanceRoot;
        for (let i = 0; i < this.nodePath.length; i++) {
            targetNode = targetNode.childNodes.item(this.nodePath[i]) as Element;
        }
        binding.get(this.bindingName).setValue(targetNode);
        return {destroy: () => binding.get(this.bindingName).setValue(null)};
    }

}