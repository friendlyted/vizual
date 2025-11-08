import {DeleteListener, InsertListener, ReplaceListener, RichArray, RichObject} from "../CommonInterfaces.ts";
import {hash} from "./Utils.ts";

type AttrKey = string | number | symbol;

export function createArray<T extends object>(source?: T[]): T[] & RichArray<T> {
    return ArrayHandler.create<T>(source);
}

export class ArrayHandler<T> implements ProxyHandler<T[]> {
    private readonly replaceListeners: ReplaceListener[];
    private readonly insertListeners: InsertListener<T>[];
    private readonly deleteListeners: DeleteListener[];

    static create<T>(source?: T[]): RichArray<T> {
        if ((source as any)?.$__isManaged?.()) {
            return source as RichArray<T>;
        }
        if (source === undefined) source = [];
        return new Proxy([...source], new ArrayHandler<T>()) as RichArray<T>;
    }

    private constructor() {
        this.replaceListeners = [];
        this.insertListeners = []
        this.deleteListeners = [];
    }

    get(target: T[], prop: AttrKey, receiver: any): any {
        switch (prop) {
            case "shift":
                return this.shift(target);
            case "unshift":
                return this.unshift(target);
            case "splice":
                return this.splice(target, receiver);
            case "$__addInsertListener":
                return this.addInsertListener(target);
            case "$__addDeleteListener":
                return this.addDeleteListener(target);
            case "$__addReplaceListener":
                return this.addReplaceListener(target);
            case "$__hash":
                return this.hash(target);
            case "$__isManaged":
                return this.isManaged(target);
            default:
                return target?.[prop];
        }
    }

    set(target: T[], prop: AttrKey, value: any) {
        const index = Number(prop);
        if (Number.isInteger(index) && index >= target.length) {
            if (target[prop] === value) {
                return true;
            }
            for (const l of this.insertListeners) {
                l?.(index, value)
            }
        }
        target[prop] = value;
        return true;
    }

    deleteProperty(target: T[], prop: AttrKey) {
        const index = Number(prop);
        if (Number.isInteger(index)) {
            for (const l of this.deleteListeners) {
                l?.(index)
            }
        }
        delete target[prop];
        return true;
    }

    isManaged(target: T[]) {
        return () => true;
    }

    hash(target: T[]) {
        return () => hash(this);
    }

    shift(target: T[]) {
        return (): T => {
            const result = target.shift();
            for (const l of this.deleteListeners) {
                l?.(0)
            }
            for (let i = 0; i < target.length; i++) {
                for (const l of this.replaceListeners) {
                    l?.(i + 1, i);
                }
            }
            return result;
        }
    }

    unshift(target: T[]) {
        return (value: T) => {
            let result = target.unshift(value);
            for (let i = target.length - 1; i >= 1; i--) {
                for (const l of this.replaceListeners) {
                    l?.(i - 1, i);
                }
            }
            for (const l of this.insertListeners) {
                l?.(0, value)
            }
            return result;
        }
    }

    splice(target: T[], receiver: any) {
        return (start: number, deleteCount: number, ...items: T[]): T[] => {
            let initLength = target.length;
            target.splice(start, deleteCount, ...items);
            for (let i = start + deleteCount - 1; i >= start; i--) {
                for (const l of this.deleteListeners) {
                    l?.(i)
                }
            }
            for (let i = start + deleteCount; i < initLength; i++) {
                for (const l of this.replaceListeners) {
                    l?.(i, i - deleteCount);
                }
            }
            for (let i = 0; i < items.length; i++) {
                for (const l of this.insertListeners) {
                    l?.(start + i, items[i]);
                }
            }
            return receiver;
        }
    }

    addInsertListener(target: T[]) {
        return (l: InsertListener<T>) => {
            return ArrayHandler.addListener(this.insertListeners, l);
        }
    }

    addDeleteListener(target: T[]) {
        return (l: DeleteListener) => {
            return ArrayHandler.addListener(this.deleteListeners, l);
        }
    }

    addReplaceListener(target: T[]) {
        return (l: ReplaceListener) => {
            return ArrayHandler.addListener(this.replaceListeners, l);
        }
    }

    private static addListener<T>(arr: T[], listener: T) {
        arr.push(listener);
        return () => {
            arr.splice(arr.indexOf(listener), 1);
        }
    }

}