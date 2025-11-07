// 내부 저장소 키
const VALUE = Symbol("ATOM_VALUE");
const LISTENERS = Symbol("ATOM_LISTENERS");

/** 내부 아톰 타입 */
type InternalAtom<T> = {
  [VALUE]: T;
  [LISTENERS]: Set<Listener<T>> | null;
};

/** 구독 리스너*/
export type Listener<T> = (value: T) => void;

/** atom 타입 */
export type Atom<T> = Readonly<InternalAtom<T>>;

/**
 * @description 초기값을 받아 새로운 atom을 생성합니다
 * @param {T} initialValue
 * @returns {Atom<T>} 아톰 객체
 */
export const createAtom = <T>(initialValue: T): Atom<T> => {
  return {
    [VALUE]: initialValue,
    [LISTENERS]: null,
  };
};

/**
 * @description 새로운 파생 아톰을 생성합니다
 * @param callback 아톰의 값이 변경될 때 호출되는 콜백함수
 * @returns {Atom<T>} 아톰 객체
 */
export const createDerivedAtom = <T>(
  callback: (get: <U>(atom: Atom<U>) => U) => T
): Atom<T> => {
  const atoms = new Set<Atom<unknown>>();

  const initialValue = callback((atom) => {
    atoms.add(atom as Atom<unknown>);
    return atom[VALUE];
  });
  const derivedAtom: InternalAtom<T> = {
    [VALUE]: initialValue,
    [LISTENERS]: null,
  };
  // 아톰들을 구독하고 있는 아톰이 변경되면 파생 아톰의 값을 업데이트
  atoms.forEach((atom) => {
    subscribe(atom, () => {
      const newValue = callback(get);
      if (!Object.is(derivedAtom[VALUE], newValue)) {
        derivedAtom[VALUE] = newValue;

        // 구독자들에게 알림
        derivedAtom[LISTENERS]?.forEach((listener) => listener(newValue));
      }
    });
  });
  return derivedAtom;
};

// 비동기 atom 캐시 (같은 Promise에 대해 같은 atom 반환)
// WeakMap을 사용하여 Promise가 더 이상 참조되지 않으면 자동으로 GC 처리
const asyncAtomCache = new WeakMap<Promise<any>, Atom<any>>();

/**
 * @description promise를 받아 비동기 아톰을 생성합니다
 * @param promise promise 객체
 * @returns {Atom<T>} 비동기 아톰 객체
 */
export const createAsyncAtom = <T>(promise: Promise<T>): Atom<T> => {
  // 이미 캐시된 atom이 있으면 반환
  if (asyncAtomCache.has(promise)) {
    return asyncAtomCache.get(promise) as Atom<T>;
  }

  // 초기 상태: Promise가 아직 완료되지 않음
  let status: "pending" | "success" | "error" = "pending";
  let data: T | undefined;
  let error: any;

  // Promise 완료 처리
  promise.then(
    (value) => {
      status = "success";
      data = value;
      // atom 값 업데이트
      const atom = asyncAtomCache.get(promise) as InternalAtom<T>;
      if (atom) {
        atom[VALUE] = value;
        // 구독자들에게 알림
        atom[LISTENERS]?.forEach((listener) => listener(value));
      }
    },
    (err) => {
      status = "error";
      error = err;
    }
  );

  // atom 생성 (초기값은 undefined이지만, get 호출 시 Promise throw)
  const atom: InternalAtom<T> = {
    [VALUE]: undefined as any, // 타입 체크를 위한 임시 값
    [LISTENERS]: null,
  };

  // 캐시에 저장
  asyncAtomCache.set(promise, atom);

  // Proxy를 사용해서 get 호출 시 Suspense 대응
  return new Proxy(atom, {
    get(target, property) {
      if (property === VALUE) {
        // Promise가 아직 완료되지 않았으면 throw (Suspense가 catch)
        if (status === "pending") throw promise;
        // 에러가 발생했으면 throw
        if (status === "error") throw error;

        // 성공했으면 값 반환
        return data;
      }
      return target[property as keyof typeof target];
    },
    set(target, property, value) {
      // VALUE 속성에 값을 설정할 때
      if (property === VALUE) {
        // 실제 atom에 값 설정
        target[VALUE] = value;
        // 상태도 업데이트 (이미 완료된 것으로 간주)
        status = "success";
        data = value;
        // 구독자들에게 알림
        target[LISTENERS]?.forEach((listener) => listener(value));
        return true;
      }
      // 다른 속성 (LISTENERS 등)은 그대로 설정
      target[property as keyof typeof target] = value;
      return true;
    },
  });
};

/**
 * @description atom의 현재 상태 값을 반환합니다
 * @param {Atom<T>} atom atom 객체
 * @returns {T} atom의 현재 상태 값
 */
export const get = <T>(atom: Atom<T>): T => atom[VALUE];

/**
 * @description atom의 값을 `newValue`로 업데이트합니다
 * @param {Atom<T>} atom atom 객체
 * @param {T} newValue 새로운 값
 */
export const set = <T>(atom: Atom<T>, newValue: T) => {
  if (!Object.is(atom[VALUE], newValue)) {
    // 값이 변경되었다면 값을 업데이트하고 구독자에게 알림
    (atom as InternalAtom<T>)[VALUE] = newValue;

    atom[LISTENERS]?.forEach((listener) => listener(newValue));
  }
};

/**
 * @description atom의 값이 변경되었을 때, 등록된 콜백 함수를 실행하는 기능입니다
 * @param {Atom<T>} atom atom 객체
 * @param {Listener<T>} callback 구독 콜백 함수
 * @returns {() => void} 구독 해지 함수
 */
export const subscribe = <T>(atom: Atom<T>, callback: Listener<T>) => {
  let listeners = atom[LISTENERS];

  if (listeners === null) {
    listeners = new Set<Listener<T>>();
    (atom as InternalAtom<T>)[LISTENERS] = listeners;
  }

  listeners.add(callback);
  // callback(atom[VALUE]);

  return () => {
    // atom에서 현재 listeners를 가져와서 실제 상태 확인
    const currentListeners = atom[LISTENERS];
    if (currentListeners !== null) {
      currentListeners.delete(callback);
      // 마지막 구독자가 `unsubscribe`하면 atom의 내부 listener Set도 GC 대상에 포함
      if (currentListeners.size === 0) {
        (atom as InternalAtom<T>)[LISTENERS] = null;
      }
    }
  };
};
