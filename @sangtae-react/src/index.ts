import { useSyncExternalStore, useCallback } from "react";
import { get, set, subscribe, type Atom } from "sangtae-js";

/**
 * Atom의 현재값과 값을 변경할 수 있는 함수를 반환합니다.
 * @param {Atom<T>} atom Atom
 * @returns {[T, (newValue: T) => void]} Atom의 현재 값, Atom의 값을 변경할 수 있는 함수
 */
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
