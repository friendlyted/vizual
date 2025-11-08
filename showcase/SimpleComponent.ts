import {Component, ComponentInstance, ComponentModel, RichObject} from "../CommonInterfaces.ts";
import {DefaultComponentDefinition} from "../componentDefinition/Component.ts";
import {DefaultComponentRegister} from "../componentDefinition/DefaultComponentRegister.ts";
import {DefaultDataBinding, DefaultDataBindingProvider} from "../data/DataBinding.ts";

const TEMPLATE = `
    <div id="testBlock"><h1>Test Component</h1></div>
`

export type RichTestComponentModel = TestBlockModel & RichObject<TestBlockModel>;

export class TestBlockModel implements ComponentModel {
    public modelName = () => this.constructor.name;

    constructor(
        public x: number = 0,
        public y: number = 0,
        public selected: boolean = false,
        public readonly selectedClass = s => s ? "selected-shadow" : ""
    ) {
    }
}

export class TestBlockComponent implements Component {
    private static definition = new DefaultComponentDefinition(TEMPLATE);

    create(data: RichTestComponentModel, register: DefaultComponentRegister): ComponentInstance {

        const binding = new DefaultDataBindingProvider(
            ...DefaultDataBinding.all(data)
        );

        return TestBlockComponent.definition.createInstance(binding, register);
    }
}
