// 내부 저장소 키
const VALUE = Symbol("ATOM_VALUE");
const LISTENERS = Symbol("ATOM_LISTENERS");
type InternalAtom<T> = {
  [VALUE]: T;
  [LISTENERS]: Set<Listener<T>> | null;
};

/** 구독 리스너*/
export type Listener<T> = (value: T) => void;

/** atom 타입 */
export type Atom<T> = Readonly<InternalAtom<T>>;

/**
 * @description 초기 값을 받아 새 atom을 생성합니다.
 * @param {T} initialValue atom이 보관할 초깃값
 * @returns {Atom<T>} newly created atom
 */
export const createAtom = <T>(initialValue: T): Atom<T> => ({
  [VALUE]: initialValue,
  [LISTENERS]: null,
});

/**
 * @description atom의 현재 상태 값을 반환합니다
 * @param {Atom<T>} atom atom 객체
 * @returns {T} atom의 현재 상태 값
 */
export const get = <T>(atom: Atom<T>): T => {
  return atom[VALUE];
};

export const getAsync = async <T>(atom: Atom<T>) => {
  try {
    return get(atom);
  } catch (thrown) {
    if (thrown instanceof Promise) {
      return (await thrown) as T;
    }
    throw thrown;
  }
};

/**
 * @description atom 값을 갱신하고 구독자에게 알림을 전파합니다.
 * @param {Atom<T>} atom 갱신할 atom
 * @param {T} newValue 설정할 새 값
 */
export const set = <T>(atom: Atom<T>, newValue: T) => {
  const internal = atom as InternalAtom<T>;

  if (Object.is(internal[VALUE], newValue)) {
    return;
  }

  internal[VALUE] = newValue;

  internal[LISTENERS]?.forEach((listener) => listener(newValue));
};

/**
 * @description atom 변경을 구독하고 unsubscribe 핸들러를 반환합니다.
 * @param {Atom<T>} atom 구독할 atom
 * @param {Listener<T>} callback 상태 변경 콜백
 * @returns {() => void} 구독 해지 함수
 */
export const subscribe = <T>(
  atom: Atom<T>,
  callback: Listener<T>
): (() => void) => {
  let listeners = atom[LISTENERS];

  if (listeners === null) {
    listeners = new Set<Listener<T>>();
    (atom as InternalAtom<T>)[LISTENERS] = listeners;
  }

  listeners.add(callback);

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

const asyncAtomCache = new WeakMap<Promise<any>, Atom<any>>();

/**
 * @description 의존 atom들로부터 값을 계산하는 파생 atom을 생성합니다.
 * 의존성이 변경되면 자동으로 재계산하며 Suspense 흐름도 전파합니다.
 * @param {(read: <U>(atom: Atom<U>) => U) => T} compute 파생 값을 계산하는 함수
 * @returns {Atom<T>} derived atom
 */
export const createDerivedAtom = <T>(
  compute: (read: <U>(atom: Atom<U>) => U) => T
): Atom<T> => {
  const internal: InternalAtom<T> = {
    [VALUE]: undefined as unknown as T,
    [LISTENERS]: null,
  };

  let status: "idle" | "pending" | "error" = "idle";
  let pending: Promise<unknown> | null = null;
  let lastError: unknown;

  const subscriptions: Array<() => void> = [];

  const cleanupSubscriptions = () => {
    while (subscriptions.length) {
      const unsubscribe = subscriptions.pop();
      if (unsubscribe) {
        unsubscribe();
      }
    }
  };

  const notifyListeners = () => {
    internal[LISTENERS]?.forEach((listener) => listener(internal[VALUE]));
  };

  const recompute = () => {
    cleanupSubscriptions();
    const dependencies = new Set<Atom<any>>();

    const read = <U>(atom: Atom<U>): U => {
      dependencies.add(atom as Atom<any>);
      return get(atom);
    };

    try {
      const nextValue = compute(read);

      status = "idle";
      pending = null;
      lastError = undefined;

      dependencies.forEach((dep) => {
        subscriptions.push(subscribe(dep, () => recompute()));
      });

      set(internal as Atom<T>, nextValue);
    } catch (thrown) {
      dependencies.forEach((dep) => {
        subscriptions.push(subscribe(dep, () => recompute()));
      });

      if (thrown instanceof Promise) {
        status = "pending";
        pending = thrown;
        notifyListeners();

        thrown.then(
          () => {
            if (pending === thrown) {
              recompute();
            }
          },
          (error) => {
            if (pending === thrown) {
              status = "error";
              pending = null;
              lastError = error;
              notifyListeners();
            }
          }
        );
      } else {
        status = "error";
        pending = null;
        lastError = thrown;
        notifyListeners();
      }
    }
  };

  const proxy = new Proxy(internal, {
    get(target, property, receiver) {
      if (property === VALUE) {
        if (status === "pending" && pending) {
          throw pending;
        }

        if (status === "error") {
          throw lastError;
        }
      }

      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property === VALUE) {
        status = "idle";
        pending = null;
        lastError = undefined;
      }

      return Reflect.set(target, property, value, receiver);
    },
  });

  recompute();

  return proxy as Atom<T>;
};

/**
 * @description Promise 기반 비동기 atom을 생성하고 Suspense 대응이 가능하도록 Proxy를 제공합니다.
 * 같은 Promise로 요청 시 캐시된 atom을 재사용합니다.
 * @param {Promise<T>} promise 로드할 비동기 연산
 * @returns {Atom<T>} Suspense-aware atom
 */
export const createAsyncAtom = <T>(promise: Promise<T>): Atom<T> => {
  // 이미 캐시된 Proxy atom이 있으면 반환
  if (asyncAtomCache.has(promise)) {
    return asyncAtomCache.get(promise) as Atom<T>;
  }

  // 초기 상태: Promise가 아직 완료되지 않음
  let status: "pending" | "success" | "error" = "pending";
  let data: T | undefined;
  let error: any;

  // atom 생성 (초기값은 undefined이지만, get 호출 시 Promise throw)
  const atom: InternalAtom<T> = {
    [VALUE]: undefined as any, // 타입 체크를 위한 임시 값
    [LISTENERS]: null,
  };

  // Promise 완료 처리
  promise.then(
    (value) => {
      status = "success";
      data = value;
      // atom 값 업데이트
      atom[VALUE] = value;
      // 구독자들에게 알림
      atom[LISTENERS]?.forEach((listener) => listener(value));
    },
    (err) => {
      status = "error";
      error = err;
    }
  );

  // Proxy를 사용해서 get 호출 시 Suspense 대응
  const proxyAtom = new Proxy(atom, {
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
        if (Object.is(target[VALUE], value)) {
          return true;
        }
        // 실제 atom에 값 설정
        target[VALUE] = value;
        // 상태도 업데이트 (이미 완료된 것으로 간주)
        status = "success";
        data = value;
        return true;
      }
      // 다른 속성 (LISTENERS 등)은 그대로 설정
      target[property as keyof typeof target] = value;
      return true;
    },
  });

  // Proxy atom을 캐시에 저장
  asyncAtomCache.set(promise, proxyAtom);

  return proxyAtom;
};
