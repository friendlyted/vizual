import {DataBindingProvider, TextChunk} from "../CommonInterfaces.ts";

export class ConstTextChunk implements TextChunk {
    private readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    getValue(): string {
        return this.value;
    }
}

export class VariableTextChunk implements TextChunk {
    private readonly varName: string;

    constructor(varName: string) {
        this.varName = varName;
    }

    getValue(binding: DataBindingProvider): string {
        return binding.get(this.varName).getValue();
    }
}

export class FunctionTextChunk implements TextChunk {

    constructor(
        private readonly fnName: string,
        private readonly fnParams: string[]
    ) {
    }

    getValue(binding: DataBindingProvider): string {
        const fn = binding.get(this.fnName).getValue();
        if (typeof fn !== "function") {
            throw Error("Binding '" + this.fnName + "' is not a function");
        }

        const args = this.fnParams.map(p => binding.get(p).getValue());
        let result = fn(...args);
        return result;
    }
}