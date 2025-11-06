declare const VALUE: unique symbol;
declare const LISTENERS: unique symbol;
type Listener<T> = (value: T) => void;
type InternalAtom<T> = {
    [VALUE]: T;
    [LISTENERS]: Set<Listener<T>> | null;
};
type Atom<T> = Readonly<InternalAtom<T>>;
declare const createAtom: <T>(initialValue: T) => Atom<T>;
declare const createDerivedAtom: <T>(callback: (get: <U>(atom: Atom<U>) => U) => T) => {
    [VALUE]: T;
    [LISTENERS]: null;
};
declare const get: <T>(atom: Atom<T>) => T;
declare const set: <T>(atom: Atom<T>, newValue: T) => void;
declare const subscribe: <T>(atom: Atom<T>, callback: Listener<T>) => () => void;

export { type Atom, createAtom, createDerivedAtom, get, set, subscribe };
