class Hash {
    static MIN_INT_VALUE = -(2 ^ 31);
    static MAX_INT_VALUE = (2 ^ 31) - 1;
    static NULL_VALUE = Hash.MIN_INT_VALUE + 1;
    static UNDEFINED_VALUE = Hash.MIN_INT_VALUE + 2;
    static FUNCTION_VALUE = Hash.MIN_INT_VALUE + 3;
    static OTHER_VALUE = Hash.MIN_INT_VALUE + 3;

    static BASE_MAGIC = 2166136261;
    static BASE_MAGIC_N = BigInt(Hash.BASE_MAGIC);
    static STEP_MAGIC = 16777619;
    static STEP_MAGIC_N = BigInt(Hash.STEP_MAGIC);

    static BIGINT_32BIT_MASK = 0xFFFFFFFFn;

    static fnv32a(value) {
        if (value === null) return Hash.NULL_VALUE;
        if (value === undefined) return Hash.UNDEFINED_VALUE;

        const type = typeof value;
        if (type === "function") {
            return Hash.FUNCTION_VALUE;
        }
        if (type === "boolean") {
            return value ? 1 : 0;
        }
        if (type === "symbol") {
            return Hash.fnv32a(value.toString());
        }


        if (type === "bigint") {
            let h = Hash.BASE_MAGIC_N;
            let tmpValue = value;
            while (tmpValue > 0n) {
                const part = value & Hash.BIGINT_32BIT_MASK;
                h = (h ^ part) * Hash.STEP_MAGIC_N;
                tmpValue >>= 32n;
            }
            return Number(h >>> 0n);
        }

        let h = Hash.BASE_MAGIC;
        if (type === "number" || type === "string") {
            let bytes;

            if (Number.isInteger(value)) {
                if (value >= Hash.MIN_INT_VALUE && value <= Hash.MAX_INT_VALUE) {
                    return value;
                }
                bytes = new Uint8Array(new Uint32Array([value]).buffer);
            } else if (type === "string") {
                bytes = new TextEncoder().encode(value);
            } else {
                bytes = new Uint8Array(new Float64Array([value]).buffer);
            }
            for (let i = 0; i < bytes.length; i++) {
                h = (h ^ bytes[i]) * Hash.STEP_MAGIC;
            }
        } else if (type === "object") {
            for (const key of Object.getOwnPropertySymbols(value)) {
                h = (h ^ Hash.fnv32a(key)) * Hash.STEP_MAGIC;
                const val = value[key];
                h = (h ^ Hash.fnv32a(val)) * Hash.STEP_MAGIC;
            }
            for (const key of Object.getOwnPropertyNames(value)) {
                h = (h ^ Hash.fnv32a(key)) * Hash.STEP_MAGIC;
                const val = value[key];
                h = (h ^ Hash.fnv32a(val)) * Hash.STEP_MAGIC;
            }
        } else {
            return Hash.OTHER_VALUE;
        }
        return h >>> 0; // Преобразуем в беззнаковое 32-битное число
    }
}

export function hash(value) {
    return Hash.fnv32a(value);
}

export function equals<T extends any>(a: T, b: T): boolean {
    if (a === b) return true;
    if ((a === null && b !== null) || (b == null && a !== null)) return false;
    if ((a === undefined && b === null) || (a === null && b === undefined)) return false;

    const aType = typeof a;
    const bType = typeof b;

    if (aType !== bType) return false;

    if (aType !== "object" || bType !== "object") {
        return a === b;
    }

    const aKeys = [...Object.getOwnPropertyNames(a), ...Object.getOwnPropertySymbols(a)];
    const bKeys = [...Object.getOwnPropertyNames(b), ...Object.getOwnPropertySymbols(b)];

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
        if (!bKeys.includes(key) || !equals(a[key], b[key])) {
            return false;
        }
    }

    return true;
}