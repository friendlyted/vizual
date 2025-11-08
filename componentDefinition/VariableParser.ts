export class VariableParser {
    static readonly VAR_REGEX = /{{\s*([\w]+)(:?\(([\w\s,]*)\))?\s*}}/g;

    public static parse<T>(
        text: string,
        constProvider: (text: string) => T,
        dataProvider: (varName: string) => T,
        fnProvider: (fnName: string, fnParams: string[]) => T
    ): T[] {
        let result: T[] = [];

        if (text === null) return;
        let matches = text.matchAll(VariableParser.VAR_REGEX);
        if (!matches) return result;

        let cursor = 0;

        for (let match of matches) {
            let start = match.index;
            let length = match[0].length
            let varName = match[1];
            let fnParams = match[3];

            if (cursor !== start) {
                result.push(constProvider(text.substring(cursor, start)));
            }

            if (fnParams !== undefined) {
                result.push(fnProvider(varName, fnParams.split(/\s*,\s*/).map(it => it.trim()).filter(it => it !== "")))
            } else {
                result.push(dataProvider(varName));
            }

            cursor = start + length;
        }
        if (cursor <= text.length - 1) {
            result.push(constProvider(text.substring(cursor)));
        }
        return result;
    }
}
