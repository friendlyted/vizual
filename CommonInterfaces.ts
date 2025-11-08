import {NodeUpdaterDefinition} from "./componentDefinition/NodeUpdater.ts";
import {InputDefinition} from "./componentDefinition/Input.ts";
import {SubDefinition} from "./componentDefinition/Sub.ts";
import {BackrefDefinition} from "./componentDefinition/Backref.ts";

export type AttrKey = string | number | symbol;

export interface TextChunk {
    getValue(binding: DataBindingProvider): string;
}

export interface ChangeCallback {
    (): void;
}

export interface Destroyable {
    destroy(): void;
}

export interface DataBindingProvider {
    get(name: string): DataBinding
}

export interface DataBinding {
    addChangeListener(callback: ChangeCallback): Destroyable;

    getValue(): any;

    setValue(value: any): void;
}

export interface AttributeListener {
    (name: AttrKey, oldValue: any): void
}

export interface InsertListener<T> {
    (index: number, value: T): void
}

export interface DeleteListener {
    (index: number): void
}

export interface ReplaceListener {
    (oldIndex: number, newIndex: number): void
}

export interface ListenerRegistration extends Destroyable {
}

export interface Component {
    create(data: object, register: ComponentRegister): ComponentInstance;
}

export interface ComponentDefinition {
    createInstance(binding: DataBindingProvider, register: ComponentRegister): ComponentInstance;
}

export interface ComponentInstance extends Destroyable {
    attachToContainer(domContainer: ParentNode): void;

    replaceElement(element: Element): void;

    detach(): void;
}

export interface ComponentRegister {
    register(name: string, component: Component): void;

    getComponent(name: string): Component;

    getComponentT<T extends Component>(name: string): T;
}

export interface RichObject<T> {
    $__addFieldListener(attributeName: keyof T, listener: AttributeListener): ListenerRegistration;

    $__removeFieldListener(attributeName: keyof T, listener: AttributeListener): void;

    $__merge(other: T): void;

    $__hash(): number;

    $__isManaged(): boolean;

    $__triggerUpdate(attributeName: keyof T): void;
}

export interface RichArray<T> extends Array<T> {
    $__addInsertListener(l: InsertListener<T>): ListenerRegistration;

    $__addDeleteListener(l: DeleteListener): ListenerRegistration;

    $__addReplaceListener(l: ReplaceListener): ListenerRegistration;

    $__hash(): number;

    $__isManaged(): boolean;
}

export interface TemplateAnalyzer {
    analyzeNode(element: Element): TemplateAnalyzeResult;
}

export interface TemplateAnalyzeResult {
    nodeUpdaters: NodeUpdaterDefinition[];
    nodeInputs: InputDefinition[];
    nodeSubs?: SubDefinition[];
    backrefs?: BackrefDefinition[];
}

export interface ComponentModel {
    modelName(): string;
}