import {TemplateAnalyzer, TemplateAnalyzeResult, TextChunk} from "../CommonInterfaces.ts";
import {ConstTextChunk, FunctionTextChunk, VariableTextChunk} from "./TextChunk.ts";
import {NodeUpdaterDefinition} from "./NodeUpdater.ts";
import {VariableParser} from "./VariableParser.ts";
import {InputDefinition} from "./Input.ts";
import {SubDefinition} from "./Sub.ts";
import {BackrefDefinition} from "./Backref.ts";


export class DefaultTemplateAnalyzer implements TemplateAnalyzer {
    private static readonly BINDING_PATTERN = /\{\{.+}}/;

    public analyzeNode(element: Element, currentPath: number[] = []): TemplateAnalyzeResult {
        const nodeUpdaters: NodeUpdaterDefinition[] = [];
        const nodeInputs: InputDefinition[] = [];
        const nodeSubs: SubDefinition[] = [];
        const backrefs: BackrefDefinition[] = [];
        const result = {nodeUpdaters, nodeInputs, nodeSubs, backrefs};

        if (element.localName.startsWith("ftd:")) {
            let name = element.localName.substring(4);
            const sub = new SubDefinition(
                currentPath,
                name,
                element.getAttribute("data"),
                false
            );
            nodeSubs.push(sub);
            return result;
        }

        let attrsResult = this.analyzeAttributes(element, currentPath);
        nodeUpdaters.push(...attrsResult.nodeUpdaters);
        nodeInputs.push(...attrsResult.nodeInputs);
        nodeSubs.push(...attrsResult.nodeSubs);
        backrefs.push(...attrsResult.backrefs);

        element.childNodes.forEach((node: Node, i) => {
            if (node.nodeType === Node.TEXT_NODE) {
                let text = this.analyzeTextNode(node as Text, [...currentPath, i]);
                if (text) nodeUpdaters.push(text);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                let childResult = this.analyzeNode(node as Element, [...currentPath, i]);
                nodeUpdaters.push(...childResult.nodeUpdaters);
                nodeInputs.push(...childResult.nodeInputs);
                nodeSubs.push(...childResult.nodeSubs);
                backrefs.push(...childResult.backrefs);
            }
        })

        return result;
    }

    public analyzeTextNode(textNode: Text, currentPath: number[]): NodeUpdaterDefinition {
        let value = textNode.textContent;
        if (!value.match(DefaultTemplateAnalyzer.BINDING_PATTERN)) return null;

        const [textChunks, variables] = this.analyzeValuedText(value);

        return new NodeUpdaterDefinition(currentPath, textChunks, variables);
    }

    public analyzeAttributes(element: Element, currentPath: number[]): TemplateAnalyzeResult {
        const nodeUpdaters: NodeUpdaterDefinition[] = [];
        const nodeInputs: InputDefinition[] = [];
        const nodeSubs: SubDefinition[] = [];
        const backrefs: BackrefDefinition[] = [];
        const result = {nodeUpdaters, nodeInputs, nodeSubs, backrefs};

        let attrs = element.attributes;
        for (let i = 0; i < attrs?.length; i++) {
            const attr = attrs.item(i);
            if (attr.name.startsWith("ftd:")) {
                let eventType: string;
                if (attr.name === "ftd:pressTarget".toLowerCase()) {
                    eventType = "keydown";
                } else if (attr.name === "ftd:changeTarget".toLowerCase()) {
                    eventType = "input";
                } else if (attr.name === "ftd:mousemoveTarget".toLowerCase()) {
                    eventType = "mousemove";
                } else if (attr.name === "ftd:mousedownTarget".toLowerCase()) {
                    eventType = "mousedown";
                } else if (attr.name === "ftd:mouseupTarget".toLowerCase()) {
                    eventType = "mouseup";
                } else if (attr.name === "ftd:mousewheelTarget".toLowerCase()) {
                    eventType = "mousewheel";
                } else {
                    if (attr.name === "ftd:list") {
                        const templateName = attr.textContent;
                        const data = element.getAttribute("ftd:data");
                        const sub = new SubDefinition(
                            currentPath,
                            templateName,
                            data,
                            true
                        );
                        nodeSubs.push(sub);
                    } else if (attr.name === "ftd:backref") {
                        backrefs.push(new BackrefDefinition(currentPath, attr.value));
                    }
                    continue;
                }

                const input = new InputDefinition(currentPath, eventType, attr.value);
                nodeInputs.push(input);
            }

            const updater = this.analyzeAttribute(attr, currentPath);
            if (updater) nodeUpdaters.push(updater);
        }
        return result;
    }

    public analyzeAttribute(attr: Attr, currentPath: number[]): NodeUpdaterDefinition {
        const name = attr.localName;
        const value = attr.value;

        if (!value.match(DefaultTemplateAnalyzer.BINDING_PATTERN)) return null;

        const [textChunks, triggeredBy] = this.analyzeValuedText(value);
        return new NodeUpdaterDefinition(currentPath, textChunks, triggeredBy, name);
    }

    public analyzeValuedText(text: string): [TextChunk[], string[]] {
        const triggeredBy: string[] = [];
        const chunks = VariableParser.parse<TextChunk>(
            text,
            value => new ConstTextChunk(value),
            varName => {
                triggeredBy.push(varName);
                return new VariableTextChunk(varName)
            },
            (fnName, fnParams)=>{
                triggeredBy.push(...fnParams);
                return new FunctionTextChunk(fnName, fnParams);
            }
        );

        return [chunks, triggeredBy];
    }
}