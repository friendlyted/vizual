import {DataBindingProvider, Destroyable, TextChunk} from "../CommonInterfaces.ts";

export class NodeUpdaterDefinition {
    private readonly nodePath: number[];
    private readonly textChunks: TextChunk[];
    private readonly attribute: string;
    private readonly triggeredBy: string[];

    constructor(nodePath: number[], textChunks: TextChunk[], triggeredBy: string[], attribute: string = null) {
        this.nodePath = nodePath;
        this.textChunks = textChunks;
        this.triggeredBy = triggeredBy;
        this.attribute = attribute;
    }

    createInstance(instanceRoot: Element, binding: DataBindingProvider): NodeUpdater {
        let targetNode: Node = instanceRoot;
        for (let i = 0; i < this.nodePath.length; i++) {
            targetNode = targetNode.childNodes.item(this.nodePath[i]);
        }
        if (this.attribute) {
            targetNode = (targetNode as Element).getAttributeNode(this.attribute);
        }
        return new NodeUpdater(targetNode, binding, this.textChunks, this.triggeredBy);
    }
}

export class NodeUpdater implements Destroyable {
    private readonly targetNode: Node;
    private readonly binding: DataBindingProvider;
    private readonly textChunks: TextChunk[];
    private readonly dependencies: Destroyable[] = [];
    // Если в одном текстовом куске изменились "одновременно" несколько переменных,
    // не надо планировать обновление несколько раз
    private updateScheduled = false;

    constructor(targetNode: Node, binding: DataBindingProvider, textChunks: TextChunk[], triggeredBy: string[]) {
        this.targetNode = targetNode;
        this.binding = binding;
        this.textChunks = textChunks;

        for (let varName of triggeredBy) {
            const listenerRegistration = binding.get(varName).addChangeListener(() => this.scheduleUpdate());
            this.dependencies.push(listenerRegistration);
            this.scheduleUpdate();
        }
    }

    private update(): void {
        const newValue = this.textChunks.map(tch => tch.getValue(this.binding)).join("");
        if (this.targetNode.textContent !== newValue) {
            this.targetNode.textContent = newValue;
        }
        this.updateScheduled = false;
    }

    scheduleUpdate() {
        if (!this.updateScheduled) {
            this.updateScheduled = true;
            this.scheduleUpdateWithMicros();
        }
    }

    private scheduleUpdateWithMicros() {
        queueMicrotask(() => this.update());
    }

    private scheduleUpdateBeforeFrame() {
        requestAnimationFrame(() => this.update());
    }

    destroy(): void {
        for (let dep of this.dependencies) {
            dep.destroy();
        }
    }
}
