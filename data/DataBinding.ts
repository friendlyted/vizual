import {
    ChangeCallback,
    DataBinding,
    DataBindingProvider,
    ListenerRegistration,
    RichObject
} from "../CommonInterfaces.ts";

export class DefaultDataBindingProvider extends Map<string, DataBinding> implements DataBindingProvider {
    constructor(...values: (readonly [string, DataBinding])[]) {
        super(values);
    }

    get(name: string): DataBinding {
        if (!this.has(name)) {
            throw new Error(`Binding has no variable with name '${name}'`)
        }
        return super.get(name);
    }
}

export class DefaultDataBinding<T extends RichObject<T>, F extends keyof T> implements DataBinding {
    private readonly data: T;
    private readonly attr: F;

    constructor(data: T, attr: F) {
        this.data = data;
        this.attr = attr;
    }

    addChangeListener(callback: ChangeCallback): ListenerRegistration {
        return this.data.$__addFieldListener(this.attr, callback);
    }

    getValue(): any {
        return this.data[this.attr];
    }

    setValue(value: any) {
        (this.data as any)[this.attr] = value;
    }

    static simple<T extends RichObject<T>, F extends keyof T>(data: T, ...keys: F[]): [string, DataBinding][] {
        return keys.map(key => [String(key), new DefaultDataBinding(data, key)]);
    }

    static all<T extends RichObject<T>>(data: T): [string, DataBinding][] {
        return Object.keys(data)
            .map(key => [String(key), new DefaultDataBinding(data, key as keyof T)]);
    }
}
