import {
    Component,
    ComponentInstance,
    ComponentModel,
    ComponentRegister,
    DataBindingProvider,
    RichObject
} from "../CommonInterfaces.ts";

export class SubDefinition {
    private readonly nodePath: number[];
    private readonly componentName: string;
    private readonly bindingName: string;
    private readonly isListContainer: boolean;

    constructor(nodePath: number[], componentName: string, bindingName: string, isListContainer: boolean) {
        this.nodePath = nodePath;
        this.componentName = componentName;
        this.bindingName = bindingName;
        this.isListContainer = isListContainer;
    }

    createInstance(instanceRoot: Element, binding: DataBindingProvider, register: ComponentRegister): ComponentInstance[] {
        const data = binding.get(this.bindingName).getValue();

        let targetNode: Element = instanceRoot;
        for (let i = 0; i < this.nodePath.length; i++) {
            targetNode = targetNode.childNodes.item(this.nodePath[i]) as Element;
        }

        if (this.isListContainer) {
            const fragment = new DocumentFragment();
            const instances = data.map((value: any) => this.createListElement(value, register, fragment));
            targetNode.append(fragment);

            data.$__addInsertListener((index: number, value: any) => {
                this.createListElement(value, register, targetNode);
            });

            return instances;
        } else {
            const component = register.getComponent(data.modelName())
            const instance = component.create(data, register);
            instance.replaceElement(targetNode);
            return [instance];
        }


    }

    createListElement(data: any, register: ComponentRegister, container: ParentNode) {
        const component = register.getComponent(data.modelName());
        const instance = component.create(data, register);
        instance.attachToContainer(container);
        return instance;
    }
}

