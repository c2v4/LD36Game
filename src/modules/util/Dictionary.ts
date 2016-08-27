interface IDictionary<V> {
    add(key: string, value: V): void;
    remove(key: string): void;
    containsKey(key: string): boolean;
    keys(): string[];
    values(): V[];
}

class Dictionary<V> {

    _keys: string[] = [];
    _values: V[] = [];

    constructor(init: { key: string; value: V; }[]) {

        for (var x = 0; x < init.length; x++) {
            this[init[x].key] = init[x].value;
            this._keys.push(init[x].key);
            this._values.push(init[x].value);
        }
    }

    add(key: string, value: V) {
        this[key] = value;
        this._keys.push(key);
        this._values.push(value);
    }

    remove(key: string) {
        var index = this._keys.indexOf(key, 0);
        this._keys.splice(index, 1);
        this._values.splice(index, 1);

        delete this[key];
    }

    keys(): string[] {
        return this._keys;
    }

    values(): any[] {
        return this._values;
    }

    containsKey(key: string) {
        return typeof this[key] !== "undefined";
    }

    toLookup(): IDictionary<V> {
        return this;
    }
}