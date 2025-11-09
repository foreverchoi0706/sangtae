import { useSyncExternalStore, useCallback } from "react";
import { get, set, subscribe, type Atom } from "sangtae-js";

const useAtom = <T>(atom: Atom<T>): [T, (newValue: T) => void] => {
  const subscribeAtom = useCallback<Parameters<typeof useSyncExternalStore>[0]>(
    (onStoreChange) => subscribe(atom, onStoreChange),
    [atom]
  );

  const getSnapshot = useCallback(() => get(atom), [atom]);

  const setValue = useCallback((newValue: T) => set(atom, newValue), [atom]);

  const value = useSyncExternalStore(subscribeAtom, getSnapshot, getSnapshot);

  return [value, setValue];
};

export { useAtom };
