// 내부 저장소 키
const VALUE = Symbol("ATOM_VALUE");
const LISTENERS = Symbol("ATOM_LISTENERS");

// 구독 리스너
type Listener<T> = (value: T) => void;

// 내부 심볼로 접근하여 직접 접근 가능
type InternalAtom<T> = {
  [VALUE]: T;
  [LISTENERS]: Set<Listener<T>> | null;
};

// 외부로 노출되는 타입 - 내부 심볼로 접근하여 직접 접근 불가능
export type Atom<T> = Readonly<InternalAtom<T>>;

export const createAtom = <T>(initialValue: T): Atom<T> => {
  return {
    [VALUE]: initialValue,
    [LISTENERS]: null,
  };
};

export const createDerivedAtom = <T>(
  callback: (get: <U>(atom: Atom<U>) => U) => T
) => {
  const dependencies = new Set<Atom<unknown>>();

  const initialValue = callback((atom) => {
    dependencies.add(atom as Atom<unknown>);
    return atom[VALUE];
  });
  const derivedAtom = {
    [VALUE]: initialValue,
    [LISTENERS]: null,
  };
  dependencies.forEach((dependency) => {
    subscribe(dependency, () => {
      const newValue = callback(get);
      if (!Object.is(derivedAtom[VALUE], newValue)) {
        derivedAtom[VALUE] = newValue;
      }
    });
  });
  return derivedAtom;
};

export const get = <T>(atom: Atom<T>): T => atom[VALUE];

export const set = <T>(atom: Atom<T>, newValue: T) => {
  if (Object.is(atom[VALUE], newValue)) return;
  // 값이 변경되었다면 값을 업데이트하고 구독자에게 알림
  (atom as InternalAtom<T>)[VALUE] = newValue;
  const listeners = atom[LISTENERS];

  if (listeners !== null) listeners.forEach((listener) => listener(newValue));
};

export const subscribe = <T>(atom: Atom<T>, callback: Listener<T>) => {
  let listeners = atom[LISTENERS];

  if (listeners === null) {
    listeners = new Set<Listener<T>>();
    (atom as InternalAtom<T>)[LISTENERS] = listeners;
  }

  listeners.add(callback);
  callback(atom[VALUE]);

  return () => {
    // atom에서 현재 listeners를 가져와서 실제 상태 확인
    const currentListeners = atom[LISTENERS];
    if (currentListeners === null) return;

    currentListeners.delete(callback);
    // 마지막 구독자가 `unsubscribe`하면 atom의 내부 listener Set도 GC 대상에 포함
    if (currentListeners.size === 0) {
      (atom as InternalAtom<T>)[LISTENERS] = null;
    }
  };
};
