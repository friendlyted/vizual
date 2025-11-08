import {Component, ComponentModel} from "../CommonInterfaces.ts";

export class DefaultComponentRegister {
    private components: Map<string, Component> = new Map<string, Component>();

    register(name: string, component: Component) {
        this.components.set(name.toLowerCase(), component);
    }

    getComponent(name: string): Component {
        return this.components.get(name.toLowerCase());
    }

    getComponentM(model: ComponentModel): Component {
        return this.getComponent(model.modelName());
    }

    getComponentT<T extends Component>(name: string): T {
        return this.getComponent(name.toLowerCase()) as T;
    }

    getComponentTM<T extends Component>(model: ComponentModel): T {
        return this.getComponentT(model.modelName());
    }
}