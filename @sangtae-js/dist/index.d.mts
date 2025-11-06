type Listener<T> = (value: T) => void;
declare const VALUE: unique symbol;
declare const LISTENERS: unique symbol;
type Atom<T> = {
    readonly [VALUE]: T;
    readonly [LISTENERS]: Set<Listener<T>>;
};
declare const createAtom: <T>(initialValue: T) => Atom<T>;
declare const get: <T>(atom: Atom<T>) => T;
declare const set: <T>(atom: Atom<T>, newValue: T) => void;
declare function subscribe<T>(atom: Atom<T>, callback: Listener<T>): () => void;

export { type Atom, createAtom, get, set, subscribe };
