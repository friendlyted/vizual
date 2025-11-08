import {DefaultTemplateAnalyzer,} from "./TemplateAnalyzer.ts";
import {
    ComponentInstance,
    ComponentRegister,
    DataBindingProvider,
    Destroyable,
    TemplateAnalyzeResult
} from "../CommonInterfaces.ts";

export class DefaultComponentDefinition {
    private readonly rootElement: Element;
    private readonly templateInfo: TemplateAnalyzeResult;

    constructor(templateContent: string, svg: boolean = false) {
        if (svg) {
            this.rootElement = DefaultComponentDefinition.parseSvg(templateContent);
        } else {
            this.rootElement = DefaultComponentDefinition.parseTemplate(templateContent);
        }
        this.templateInfo = new DefaultTemplateAnalyzer().analyzeNode(this.rootElement);

        this.cleanupFtdData();
    }

    private static parseSvg(content: string) {
        const doc = new DOMParser().parseFromString(content, "image/svg+xml");
        return doc.firstElementChild;
    }

    private static parseTemplate(content: string) {
        const doc = new DOMParser().parseFromString(content, "text/html");
        return doc.body.firstElementChild;
    }

    private cleanupFtdData() {
        const elements = Array.from(this.rootElement.querySelectorAll("*"));
        for (const el of elements) {
            const attrNames = el.getAttributeNames();
            for (const attrName of attrNames) {
                if (attrName.startsWith("ftd:")) {
                    el.removeAttribute(attrName);
                }
            }
        }
    }

    createInstance(binding: DataBindingProvider, register: ComponentRegister, resources: Destroyable[] = []): ComponentInstance {
        const instanceRoot = this.rootElement.cloneNode(true) as Element;

        const updaters = this.templateInfo.nodeUpdaters
            .map(it => it.createInstance(instanceRoot, binding));

        const inputs = this.templateInfo.nodeInputs
            .map(it => it.createInstance(instanceRoot, binding));

        const subs = this.templateInfo.nodeSubs
            .flatMap(it => it.createInstance(instanceRoot, binding, register));

        const backrefs = this.templateInfo.backrefs
            .map(it => it.createInstance(instanceRoot, binding));

        return new DefaultComponentInstance(instanceRoot, ...updaters, ...inputs, ...subs, ...backrefs, ...resources);
    }

}

export class DefaultComponentInstance implements ComponentInstance {
    private readonly rootElement: Element;
    private readonly dependencies: Destroyable[];

    constructor(rootElement: Element, ...dependencies: Destroyable[]) {
        this.rootElement = rootElement;
        this.dependencies = dependencies;
    }

    attachToContainer(domContainer: ParentNode) {
        this.detach();
        domContainer.append(this.rootElement);
    }

    replaceElement(element: Element) {
        this.detach();
        element.parentElement.insertBefore(this.rootElement, element);
        element.remove();
    }

    detach() {
        this.rootElement.remove();
    }

    destroy() {
        this.detach();
        this.dependencies.forEach(it => it.destroy());
    }
}
