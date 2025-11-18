// 내부 저장소 키
const VALUE = Symbol("ATOM_VALUE");
const LISTENERS = Symbol("ATOM_LISTENERS");

/** 구독 리스너*/
export type Listener<T> = (value: T) => void;

/** 내부 아톰 타입 */
type InternalAtom<T> = {
  [VALUE]: T;
  [LISTENERS]: Set<Listener<T>> | null;
};

/** atom 타입 */
export type Atom<T> = Readonly<InternalAtom<T>>;

// async atom의 현재 상태 정보를 모아둔 객체
enum ASYNC_ATOM_STATUS {
  SUCCESS = "SUCCESS",
  PENDING = "PENDING",
  ERROR = "ERROR",
}

/**
 * @description 초기값을 받아 새로운 atom을 생성합니다
 * @param {T} initialValue 초기값
 * @returns {Atom<T>} 아톰 객체
 */
export const createAtom = <T>(initialValue: T): Atom<T> => ({
  [VALUE]: initialValue,
  [LISTENERS]: null,
});

/**
 * @description 새로운 파생 아톰을 생성합니다
 * @param {(get: <U>(atom: Atom<U>) => U) => T} callback 아톰의 값이 변경될 때 호출되는 콜백함수
 * @returns {Atom<T>} 아톰 객체
 */
export const createDerivedAtom = <T>(
  callback: (get: <U>(atom: Atom<U>) => U) => T
): Atom<T> => {
  const state: {
    status: ASYNC_ATOM_STATUS;
    promise: Promise<unknown> | null;
    error: unknown;
  } = {
    status: ASYNC_ATOM_STATUS.PENDING,
    promise: null,
    error: undefined,
  };

  // 직전 평가에서 읽힌 atom 집합을 추적해서 구독을 자동으로 관리
  const subscriptions = new Map<Atom<unknown>, () => void>();

  // 상태만 바꾸는 대신 관련 필드를 한 번에 초기화하는 유틸
  const setStatus = (status: ASYNC_ATOM_STATUS) => {
    state.status = status;
    if (status !== ASYNC_ATOM_STATUS.ERROR) state.error = undefined;
    if (status !== ASYNC_ATOM_STATUS.PENDING) state.promise = null;
  };

  let atoms = new Set<Atom<unknown>>();
  // 새로 읽힌 atom들과 비교해 끊어진 구독은 정리하고 새 의존성은 구독
  const applySubscriptions = (nextTrackedAtoms: Set<Atom<unknown>>) => {
    nextTrackedAtoms.forEach((atom) => {
      if (!subscriptions.has(atom)) {
        const unsubscribe = subscribe(atom, () => evaluate(true));
        subscriptions.set(atom, unsubscribe);
      }
    });

    atoms.forEach((atom) => {
      if (!nextTrackedAtoms.has(atom)) {
        subscriptions.get(atom)?.();
        subscriptions.delete(atom);
      }
    });

    atoms = nextTrackedAtoms;
  };

  const derivedAtom: InternalAtom<T> = {
    [VALUE]: undefined as any,
    [LISTENERS]: null,
  };

  // 파생 atom 값이 변경될 때 구독자들에게 알림
  const emit = () =>
    derivedAtom[LISTENERS]?.forEach((listener) => listener(derivedAtom[VALUE]));

  // 파생 atom 재평가 로직: 의존성 추적 > 값 계산 > 상태 업데이트 > 구독자에게 알림
  const evaluate = (suppressErrors = false) => {
    const nextTrackedAtoms = new Set<Atom<unknown>>();

    const trackedGet = <U>(atom: Atom<U>): U => {
      nextTrackedAtoms.add(atom as Atom<unknown>);
      return get(atom);
    };

    try {
      const newValue = callback(trackedGet);
      setStatus(ASYNC_ATOM_STATUS.SUCCESS);
      applySubscriptions(nextTrackedAtoms);

      if (!Object.is(derivedAtom[VALUE], newValue)) {
        derivedAtom[VALUE] = newValue;
        emit();
      }
    } catch (thrown) {
      applySubscriptions(nextTrackedAtoms);

      if (thrown instanceof Promise) {
        // callback이 Promise를 던졌을 때 Suspense 플로우를 유지하도록 처리
        state.status = ASYNC_ATOM_STATUS.PENDING;
        state.error = undefined;
        state.promise = thrown;
        emit();
        thrown
          .then(() => {
            if (state.promise === thrown) evaluate(true);
          })
          .catch((err) => {
            if (state.promise === thrown) {
              state.status = ASYNC_ATOM_STATUS.ERROR;
              state.error = err;
              emit();
            }
          });
        return;
      }

      setStatus(ASYNC_ATOM_STATUS.ERROR);
      state.error = thrown;
      emit();

      if (!suppressErrors) throw thrown;
    }
  };

  evaluate();

  const proxyAtom = new Proxy(derivedAtom, {
    // 값 읽을 때 상태에 따라 Suspense 또는 에러를 그대로 전달
    get(target, property) {
      if (property === VALUE) {
        if (
          state.status === ASYNC_ATOM_STATUS.PENDING &&
          state.promise !== null
        ) {
          throw state.promise;
        }
        if (state.status === ASYNC_ATOM_STATUS.ERROR) {
          throw state.error;
        }
      }
      return Reflect.get(target, property);
    },
    // 값 설정 시 중복 갱신을 막고 상태를 성공으로 초기화
    set(target, property, value) {
      if (property === VALUE) {
        if (Object.is(target[VALUE], value)) {
          return true;
        }
        target[VALUE] = value as T;
        setStatus(ASYNC_ATOM_STATUS.SUCCESS);
        return true;
      }

      return Reflect.set(target, property, value);
    },
  });

  return proxyAtom as Atom<T>;
};

//
// 같은 Promise에 대해 같은 Proxy atom 반환 atom 캐시, WeakMap을 사용하여 Promise가 더 이상 참조되지 않으면 자동으로 GC 처리
const asyncAtomCache = new WeakMap<Promise<any>, Atom<any>>();

/**
 * @description promise를 받아 비동기 아톰을 생성합니다
 * @param promise promise 객체
 * @returns {Atom<T>} 비동기 아톰 객체
 */
export const createAsyncAtom = <T>(promise: Promise<T>): Atom<T> => {
  // 이미 캐시된 Proxy atom이 있으면 반환
  if (asyncAtomCache.has(promise)) {
    return asyncAtomCache.get(promise) as Atom<T>;
  }

  // atom 생성 (초기값은 undefined이지만, get 호출 시 Promise throw)
  const atom: InternalAtom<T> = {
    [VALUE]: undefined as any, // 타입 체크를 위한 임시 값
    [LISTENERS]: null,
  };

  // 초기 상태: Promise가 아직 완료되지 않음
  const state: {
    status: ASYNC_ATOM_STATUS;
    data: T | undefined;
    error: unknown;
  } = {
    status: ASYNC_ATOM_STATUS.PENDING,
    data: undefined,
    error: undefined,
  };

  // Promise 처리
  promise.then(
    (value) => {
      // atom 값 업데이트 후   // 구독자들에게 알림
      state.status = ASYNC_ATOM_STATUS.SUCCESS;
      state.data = value;
      set(atom, value);
    },
    (error) => {
      state.status = ASYNC_ATOM_STATUS.ERROR;
      state.error = error;
    }
  );

  // Proxy를 사용해서 get 호출 시 Suspense 대응
  const proxyAtom = new Proxy(atom, {
    get(target, property) {
      if (property === VALUE) {
        // Promise가 아직 완료되지 않았으면 throw
        if (state.status === ASYNC_ATOM_STATUS.PENDING) throw promise;
        // 에러가 발생했으면 throw
        if (state.status === ASYNC_ATOM_STATUS.ERROR) throw state.error;
        // 성공했으면 값 반환
        return state.data;
      }
      return Reflect.get(target, property);
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
        state.status = ASYNC_ATOM_STATUS.SUCCESS;
        state.data = value;
        return true;
      }
      // 다른 속성 (LISTENERS 등)은 그대로 설정
      target[property as keyof typeof target] = value;
      return Reflect.set(target, property, value);
    },
  });

  // Proxy atom을 캐시에 저장
  asyncAtomCache.set(promise, proxyAtom);

  return proxyAtom;
};

/**
 * @description atom의 현재 상태 값을 반환합니다
 * @param {Atom<T>} atom atom 객체
 * @returns {T} atom의 현재 상태 값
 */
export const get = <T>(atom: Atom<T>): T => atom[VALUE];

/**
 * @description (추가기능) 모든 비동기 의존성이 해결될 때까지 기다린 후 비동기 atom의 값을 반환합니다.
 * @param {Atom<T>} atom atom 객체
 * @returns {T} atom의 현재 상태 값을 담은 Promise 객체
 */
export const getAsync = async <T>(atom: Atom<T>) => {
  // 모든 Suspense 의존성이 해결될 때까지 반복합니다.
  while (true) {
    try {
      // get(atom)이 성공하면 최종 값을 반환
      return get(atom);
    } catch (thrown) {
      // 던져진 것이 Promise(Suspense)이면,
      if (thrown instanceof Promise) {
        // 해당 Promise가 완료될 때까지 대기 Promise가 완료되면, while 루프의 처음으로 돌아가 atom의 새로운 값으로 get(atom)을 재시도합니다 (재평가 로직 발동).
        await thrown;
      } else {
        // Promise가 아닌 다른 에러가 던져지면, 에러를 다시 던집니다.
        throw thrown;
      }
    }
  }
};

/**
 * @description atom의 값을 `newValue`로 업데이트합니다
 * @param {Atom<T>} atom atom 객체
 * @param {T} newValue 새로운 값
 */
export const set = <T>(atom: Atom<T>, newValue: T) => {
  if (Object.is(atom[VALUE], newValue)) return;
  (atom as InternalAtom<T>)[VALUE] = newValue;
  atom[LISTENERS]?.forEach((listener) => listener(newValue));
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
