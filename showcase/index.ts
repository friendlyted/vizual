import {DefaultComponentRegister} from "../componentDefinition/DefaultComponentRegister.ts";
import {createObject} from "../data/ObjectHandler.ts";
import {TestBlockComponent, TestBlockModel} from "./SimpleComponent.ts";


export function main() {
    const components = new DefaultComponentRegister();
    components.register(TestBlockModel.name, new TestBlockComponent());

    const testBlockModel = createObject(new TestBlockModel());
    const component = components.getComponentTM<TestBlockComponent>(testBlockModel)
        .create(testBlockModel, components);

    component.attachToContainer(document.getElementById("app"))
}