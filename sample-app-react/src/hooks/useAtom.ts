import { useSyncExternalStore, useCallback } from "react";
import { get, set, subscribe, type Atom } from "sangtae-js";

/**
 * @description atom을 사용하여 상태를 관리하는 훅
 * @param {Atom<T>} atom atom 객체
 * @returns {[T, (newValue: T) => void]} [atom의 현재 값, atom의 값을 변경할 수 있는 함수]
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

export default useAtom;
