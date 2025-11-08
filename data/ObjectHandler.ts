import {AttributeListener, AttrKey, ListenerRegistration, RichObject} from "../CommonInterfaces.ts";
import {createArray} from "./ArrayHandler.ts";
import {equals, hash} from "./Utils.ts";

export function createRichVoid() {
    return createObject({});
}

export function createObject<T extends object>(source?: T, rawFields: (keyof T)[] = []): T & RichObject<T> {
    return ObjectHandler.create<T>(source, rawFields);
}

export class ObjectHandler<T extends object> implements ProxyHandler<T> {

    private readonly attributeListeners = new Map<AttrKey, AttributeListener[]>();
    private readonly rawFields: (keyof T)[];

    static create<T extends object>(source?: T, rawFields: (keyof T)[] = []): T & RichObject<T> {
        if ((source as any)?.$__isManaged?.()) {
            return source as T & RichObject<T>;
        }
        const target = {} as T;
        return new Proxy(target, new ObjectHandler<T>(source, target, rawFields)) as T & RichObject<T>;
    }

    private constructor(source: T, target: T, rawFields?: (keyof T)[]) {
        this.rawFields = rawFields;
        this.merge(target)(source);
    }

    set(target: T, key: AttrKey, newValue: any): boolean {
        if (this.rawFields.includes(key as keyof T)) {
            target[key] = newValue;
            return true;
        }

        const oldValue = target[key];
        if (equals(oldValue, newValue)) return true;

        target[key] = newValue;
        if (this.attributeListeners.has(key)) {
            this.attributeListeners.get(key).forEach(l => l(key, oldValue));
        }


        return true;
    }

    get(target: T, key: AttrKey, receiver: any): any {
        switch (key) {
            case "$__addFieldListener":
                return this.addFieldListener(target);
            case "$__removeFieldListener":
                return this.removeFieldListener(target);
            case "$__merge":
                return this.merge(target);
            case "$__hash":
                return this.hash(target);
            case "$__isManaged":
                return this.isManaged(target);
            case "$__triggerUpdate":
                return this.triggerUpdate(target);
            default:
                return target?.[key];
        }
    }

    triggerUpdate(target: T) {
        return (key: AttrKey) => {
            if (this.attributeListeners.has(key)) {
                this.attributeListeners.get(key).forEach(l => l(key, target[key]));
            }
        }
    }

    addFieldListener(target: T) {
        return (attributeName: keyof T, listener: AttributeListener): ListenerRegistration => {
            if (!this.attributeListeners.has(attributeName)) {
                this.attributeListeners.set(attributeName, []);
            }
            this.attributeListeners.get(attributeName).push(listener);
            return {
                destroy: () => {
                    this.removeFieldListener(target)(attributeName, listener);
                }
            };
        }
    }

    removeFieldListener(target: T) {
        return (attributeName: keyof T, listener: AttributeListener) => {
            const lst = this.attributeListeners.get(attributeName);
            const index = lst.indexOf(listener);
            if (index >= 0) {
                lst.splice(index, 1);
            }
        };
    }

    merge(target: T) {
        return (other: T) => {
            if (!other) other = {} as T;
            const otherKeys = [...Object.getOwnPropertyNames(other), ...Object.getOwnPropertySymbols(other)];
            for (const key of otherKeys) {
                let value1 = target[key];
                let value2 = other[key];

                if (equals(value1, value2)) continue;

                if (typeof value2 === "function") {
                    if (value1 === null || value1 === undefined) {
                        target[key] = value2;
                    }
                } else if (typeof value2 === "object") {
                    if (typeof value1 === "object" && value1.$__isManaged?.()) {
                        value1.$__merge(value2);
                    } else {
                        if (value2 instanceof Array) {
                            this.set(target, key, createArray(value2));
                        } else {
                            this.set(target, key, createObject(value2));
                        }
                    }
                } else {
                    this.set(target, key, value2);
                }
            }

            [...Object.getOwnPropertyNames(target), ...Object.getOwnPropertySymbols(target)]
                .filter(k => !otherKeys.includes(k))
                .forEach(key => {
                    delete target[key];
                });
        }
    }

    isManaged(target: T) {
        return () => true;
    }

    hash(target: T) {
        return () => hash(this);
    }
}