# Test error in index.test.ts

_Exported on 2025. 11. 10. at 21시 45분 35초 GMT+9 from Cursor (2.0.69)_

---

**User**

@index.test.ts (425-448) 해당 테스트에 에러가 발생하고 있어. 아마 구독 리스너가 한번 더호출되는것같아

---

**Cursor**

```typescript
// 내부 저장소 키
const VALUE = Symbol("ATOM_VALUE");
const LISTENERS = Symbol("ATOM_LISTENERS");
const HANDLES_SET = Symbol("ATOM_HANDLES_SET");

/** 내부 아톰 타입 */
type InternalAtom<T> = {
  [VALUE]: T;
  [LISTENERS]: Set<Listener<T>> | null;
  [HANDLES_SET]?: boolean;
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
 * @param {(get: <U>(atom: Atom<U>) => U) => T} callback 아톰의 값이 변경될 때 호출되는 콜백함수
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

// 비동기 atom 캐시 (같은 Promise에 대해 같은 Proxy atom 반환)
// WeakMap을 사용하여 Promise가 더 이상 참조되지 않으면 자동으로 GC 처리
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

  // 초기 상태: Promise가 아직 완료되지 않음
  let status: "pending" | "success" | "error" = "pending";
  let data: T | undefined;
  let error: any;

  // atom 생성 (초기값은 undefined이지만, get 호출 시 Promise throw)
  const atom: InternalAtom<T> = {
    [VALUE]: undefined as any, // 타입 체크를 위한 임시 값
    [LISTENERS]: null,
  };
  atom[HANDLES_SET] = true;

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
 * @description (추가기능) 비동기 atom의 값을 반환합니다
 * @param {Atom<T>} atom atom 객체
 * @returns {Promise<T>} atom의 현재 상태 값을 담은 Promise 객체
 */
export const getAsync = async <T>(atom: Atom<T>) => {
  try {
    return get(atom);
  } catch (thrown) {
    if (thrown instanceof Promise) {
      return (await thrown) as Promise<T>;
    }
    throw thrown;
  }
};

/**
 * @description atom의 값을 `newValue`로 업데이트합니다
 * @param {Atom<T>} atom atom 객체
 * @param {T} newValue 새로운 값
 */
export const set = <T>(atom: Atom<T>, newValue: T) => {
  const internalAtom = atom as InternalAtom<T>;

  let currentValue: T | undefined;
  let hasCurrentValue = true;

  try {
    currentValue = internalAtom[VALUE];
  } catch {
    hasCurrentValue = false;
  }

  if (hasCurrentValue && Object.is(currentValue, newValue)) {
    return;
  }

  const handlesSet = internalAtom[HANDLES_SET] === true;

  internalAtom[VALUE] = newValue;

  if (!handlesSet) {
    internalAtom[LISTENERS]?.forEach((listener) => listener(newValue));
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
```

## 해결 내용

- 원인은 비동기 atom이 Proxy로 감싸져 있을 때 `set` 함수가 동일한 리스너를 두 번 호출해서 테스트가 예상보다 한 번 더 호출된 거였어.
- Proxy가 자체적으로 알림을 처리한다는 플래그(`HANDLES_SET`)를 추가하고, `set`에서 현재 값 비교를 안전하게 한 뒤 플래그가 없을 때만 직접 리스너를 호출하도록 바꿨어.

  ```1:11:@sangtae-js/src/index.ts
  const VALUE = Symbol("ATOM_VALUE");
  const LISTENERS = Symbol("ATOM_LISTENERS");
  const HANDLES_SET = Symbol("ATOM_HANDLES_SET");
  // ... existing code ...
  type InternalAtom<T> = {
    [VALUE]: T;
    [LISTENERS]: Set<Listener<T>> | null;
    [HANDLES_SET]?: boolean;
  };
  ```

  ```84:135:@sangtae-js/src/index.ts
  const atom: InternalAtom<T> = {
    [VALUE]: undefined as any,
    [LISTENERS]: null,
  };
  atom[HANDLES_SET] = true;
  // ... existing code ...
  ```

  ```173:195:@sangtae-js/src/index.ts
  export const set = <T>(atom: Atom<T>, newValue: T) => {
    const internalAtom = atom as InternalAtom<T>;

    let currentValue: T | undefined;
    let hasCurrentValue = true;

    try {
      currentValue = internalAtom[VALUE];
    } catch {
      hasCurrentValue = false;
    }

    if (hasCurrentValue && Object.is(currentValue, newValue)) {
      return;
    }

    const handlesSet = internalAtom[HANDLES_SET] === true;

    internalAtom[VALUE] = newValue;

    if (!handlesSet) {
      internalAtom[LISTENERS]?.forEach((listener) => listener(newValue));
    }
  };
  ```

- `npm run test:run`으로 테스트 돌렸는데 전부 통과했고, 마지막에 `vitest`가 워커 종료하면서 `EPERM` 경고만 잠깐 떴어(동작에는 영향 없어 보임). 추가로 확인하고 싶은 거 있으면 말해줘.

```typescript
const VALUE = Symbol("ATOM_VALUE");
const LISTENERS = Symbol("ATOM_LISTENERS");
const HANDLES_SET = Symbol("ATOM_HANDLES_SET");
// ... existing code ...
type InternalAtom<T> = {
  [VALUE]: T;
  [LISTENERS]: Set<Listener<T>> | null;
  [HANDLES_SET]?: boolean;
};
```

```typescript
const atom: InternalAtom<T> = {
  [VALUE]: undefined as any,
  [LISTENERS]: null,
};
atom[HANDLES_SET] = true;
// ... existing code ...
```

```typescript
export const set = <T>(atom: Atom<T>, newValue: T) => {
  const internalAtom = atom as InternalAtom<T>;

  let currentValue: T | undefined;
  let hasCurrentValue = true;

  try {
    currentValue = internalAtom[VALUE];
  } catch {
    hasCurrentValue = false;
  }

  if (hasCurrentValue && Object.is(currentValue, newValue)) {
    return;
  }

  const handlesSet = internalAtom[HANDLES_SET] === true;

  internalAtom[VALUE] = newValue;

  if (!handlesSet) {
    internalAtom[LISTENERS]?.forEach((listener) => listener(newValue));
  }
};
```

---

**User**

아니 코어 set은 수정하지말고 atom 프록시 생성시 set을 개선하면 될 것 같아.

---

**Cursor**

```typescript
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
 * @param {(get: <U>(atom: Atom<U>) => U) => T} callback 아톰의 값이 변경될 때 호출되는 콜백함수
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

// 비동기 atom 캐시 (같은 Promise에 대해 같은 Proxy atom 반환)
// WeakMap을 사용하여 Promise가 더 이상 참조되지 않으면 자동으로 GC 처리
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

/**
 * @description atom의 현재 상태 값을 반환합니다
 * @param {Atom<T>} atom atom 객체
 * @returns {T} atom의 현재 상태 값
 */
export const get = <T>(atom: Atom<T>): T => atom[VALUE];

/**
 * @description (추가기능) 비동기 atom의 값을 반환합니다
 * @param {Atom<T>} atom atom 객체
 * @returns {Promise<T>} atom의 현재 상태 값을 담은 Promise 객체
 */
export const getAsync = async <T>(atom: Atom<T>) => {
  try {
    return get(atom);
  } catch (thrown) {
    if (thrown instanceof Promise) {
      return (await thrown) as Promise<T>;
    }
    throw thrown;
  }
};

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
```

set은 원래대로 돌려놨어. 대신 비동기 atom Proxy의 `set` 트랩에서 리스너를 직접 호출하지 않도록 바꿨거든. 이제 `set(asyncAtom, ...)` 호출 시 중복 알림 없이 한 번만 콜백이 불리고, Promise가 직접 완료될 때는 기존대로 `promise.then` 쪽에서 알림을 보내도록 유지했어.

```108:135:@sangtae-js/src/index.ts
const proxyAtom = new Proxy(atom, {
  // ... 기존 코드 ...
  set(target, property, value) {
    if (property === VALUE) {
      if (Object.is(target[VALUE], value)) {
        return true;
      }
      target[VALUE] = value;
      status = "success";
      data = value;
      return true;
    }
    target[property as keyof typeof target] = value;
    return true;
  },
});
```

테스트(`npm run test:run`) 다시 돌렸는데 전부 통과했어. 마지막에 뜨는 `EPERM` 경고는 이전이랑 똑같이 워커 종료 이슈고 동작에는 영향 없어 보여.

```typescript
const proxyAtom = new Proxy(atom, {
  // ... 기존 코드 ...
  set(target, property, value) {
    if (property === VALUE) {
      if (Object.is(target[VALUE], value)) {
        return true;
      }
      target[VALUE] = value;
      status = "success";
      data = value;
      return true;
    }
    target[property as keyof typeof target] = value;
    return true;
  },
});
```

---

**User**

수정사항을 좀 더 자세히 설명해줘

---

**Cursor**

## Proxy set 트랩 수정 설명

- **핵심 아이디어**: 비동기 atom(`createAsyncAtom`)은 Proxy로 감싸져 있는데, Proxy의 `set` 트랩과 바깥 `set` 함수가 둘 다 리스너에게 알림을 보내서 콜백이 두 번 실행됐어. 그래서 Proxy 쪽에서만 값 업데이트와 상태 조정을 맡고, 리스너 알림은 기존 `set` 함수만 담당하게 분리했어.

- **변경 사항 요약**

  - Proxy `set` 트랩이 같은 값을 다시 넣을 때는 아무 것도 하지 않고 바로 반환해.
  - 새 값이라면 내부 값과 상태(`status`, `data`)만 갱신하고, 더 이상 여기서 리스너를 돌리지 않아.
  - `set` 함수는 원래 로직을 그대로 유지해서, Proxy가 아닌 일반 atom에 대해서는 여전히 값이 바뀌면 리스너를 호출해.

- **코드 스니펫**

```121:133:@sangtae-js/src/index.ts
    set(target, property, value) {
      if (property === VALUE) {
        if (Object.is(target[VALUE], value)) {
          return true;
        }
        target[VALUE] = value;
        status = "success";
        data = value;
        return true;
      }
      target[property as keyof typeof target] = value;
      return true;
    },
```

```171:195:@sangtae-js/src/index.ts
export const set = <T>(atom: Atom<T>, newValue: T) => {
  if (!Object.is(atom[VALUE], newValue)) {
    (atom as InternalAtom<T>)[VALUE] = newValue;
    atom[LISTENERS]?.forEach((listener) => listener(newValue));
  }
};
```

- **동작 흐름**
  1. `set(asyncAtom, 100)` 호출 → `set` 함수에서 Proxy로 값 저장.
  2. Proxy `set` 트랩이 먼저 실행되어 `status`/`data` 동기화.
  3. `set` 함수가 Proxy 내부 값을 직접 업데이트하고 리스너에게 한 번만 알림.
  4. 기존 테스트(`npm run test:run`) 전부 통과했어. Proxy가 Promise 완료를 감지할 때는 여전히 `promise.then` 안에서 리스너 호출해.

궁금한 부분 더 있으면 말해줘!

```typescript
    set(target, property, value) {
      if (property === VALUE) {
        if (Object.is(target[VALUE], value)) {
          return true;
        }
        target[VALUE] = value;
        status = "success";
        data = value;
        return true;
      }
      target[property as keyof typeof target] = value;
      return true;
    },
```

```typescript
export const set = <T>(atom: Atom<T>, newValue: T) => {
  if (!Object.is(atom[VALUE], newValue)) {
    (atom as InternalAtom<T>)[VALUE] = newValue;
    atom[LISTENERS]?.forEach((listener) => listener(newValue));
  }
};
```

---

**User**

@index.ts (1-209) @index.test.ts (1-577) @JF002 - Minimal Global State Managment Library 구현.md (1-97)

코어 파일과 테스트파일을 요구사항 마크다운 파일과 비교해서 기능, 설계상 문제가 있는지 알려줘

---

**Cursor**

```typescript
// promise.then error 분기에서 listeners 호출 없음 → 상태 변경 알려주지 않아 UI 갱신 안 됨
promise.catch((err) => {
  target[STATUS] = "error";
  target[ERROR] = err;
  // listeners 미호출
});
```

```typescript
// createDerivedAtom는 최초 의존성만 구독, 동적 의존성 변경 무시 → 업데이트 누락 위험
const atoms = new Set(atomsInitial);
for (const atom of atoms) {
  subscribe(writer, atom, () => {
    const newValue = callback(get); // get 은 재추적 못함
    ...
  });
}
```

```typescript
// React useAtom 관련 함수 없음 → 요구사항 대비 누락, 별도 패키지 예상이나 확인 필요
// 테스트에도 React 후킹 없음
```

```typescript
// set 함수 내 atom[VALUE] 호출 시 pending 상태면 get trap이 promise 던짐 → set 실패
// 직접 값 덮어쓰기 불가능 위험 존재
if (status === "pending") throw promise;
```

## 주요 이슈

- **Critical · `@sangtae-js/src/index.ts`**  
  비동기 atom이 reject될 때 구독자에게 알림이 가지 않아. 에러만 저장하고 있어서 React 컴포넌트가 다시 렌더되지 않으니 `get`을 다시 호출할 기회가 없어. 상태가 바뀌었음을 알려주거나 최소한 재시도 트리거가 필요해.
  ```88:135:@sangtae-js/src/index.ts
  promise.then(
    (value) => {
      // ... existing code ...
      atom[LISTENERS]?.forEach((listener) => listener(value));
    },
    (err) => {
      status = "error";
      error = err;
    }
  );
  ```
- **Major · `@sangtae-js/src/index.ts`**  
  파생 atom은 최초 평가 시점에만 의존 atom을 수집하고 나중에 의존성이 바뀌어도 다시 추적하지 않아. 분기 로직이 있는 계산에서 새로운 atom으로 갈아타면 구독이 누락돼서 값이 안 갱신될 수 있어.
  ```34:59:@sangtae-js/src/index.ts
  const atoms = new Set<Atom<unknown>>();
  const initialValue = callback((atom) => {
    atoms.add(atom as Atom<unknown>);
    return atom[VALUE];
  });
  atoms.forEach((atom) => {
    subscribe(atom, () => {
      const newValue = callback(get);
      if (!Object.is(derivedAtom[VALUE], newValue)) {
        derivedAtom[VALUE] = newValue;
        derivedAtom[LISTENERS]?.forEach((listener) => listener(newValue));
      }
    });
  });
  ```
- **Major · 요구사항 대비**  
  필수 요구사항에서 `useAtom` React 훅을 명시했는데, 제공된 코어/테스트 파일만 보면 구현 흔적이 없어. 혹시 다른 패키지에 있다면 문서나 테스트에서 연동을 입증해야 하고, 없다면 필수 기능 미충족이야.

- **Minor · `@sangtae-js/src/index.ts`**  
  비동기 atom을 기다리는 중(`pending`)에 `set(asyncAtom, newValue)`를 호출하면 Proxy의 `get`이 Promise를 던져서 `set` 자체가 실패해. 명세상 “직접 값을 설정”하는 시나리오에 제약이 생기니, pending 상태에서도 덮어쓰기가 되도록 보호 로직이 필요해.
  ```171:177:@sangtae-js/src/index.ts
  if (!Object.is(atom[VALUE], newValue)) {
    (atom as InternalAtom<T>)[VALUE] = newValue;
    atom[LISTENERS]?.forEach((listener) => listener(newValue));
  }
  ```

## 테스트 커버리지 공백

- 비동기 atom이 실패했을 때 구독자가 재알림을 받는지 검증하는 테스트가 없어.
- 파생 atom이 동적으로 의존성을 바꿀 때도 정상 동작하는지 확인하는 케이스가 부족해.
- React 연동(useAtom) 관련 테스트가 전혀 없어서 요구사항 충족 여부를 판단하기 어렵고, 문서에도 근거가 필요해.

## 정리

핵심 로직과 테스트는 기본 happy path 위주로 잘 맞는데, 요구사항 대비하면 error 알림·동적 의존성·React 훅 구현/검증이 빠져 있어. 우선 비동기 에러 구독 알림을 보강하고, 파생 atom 의존성 갱신 전략과 pending 상태 set 처리, 그리고 React 연동 스펙을 문서/테스트로 확실히 보여주는 게 좋겠어.

```typescript
promise.then(
  (value) => {
    // ... existing code ...
    atom[LISTENERS]?.forEach((listener) => listener(value));
  },
  (err) => {
    status = "error";
    error = err;
  }
);
```

```typescript
const atoms = new Set<Atom<unknown>>();
const initialValue = callback((atom) => {
  atoms.add(atom as Atom<unknown>);
  return atom[VALUE];
});
atoms.forEach((atom) => {
  subscribe(atom, () => {
    const newValue = callback(get);
    if (!Object.is(derivedAtom[VALUE], newValue)) {
      derivedAtom[VALUE] = newValue;
      derivedAtom[LISTENERS]?.forEach((listener) => listener(newValue));
    }
  });
});
```

```typescript
if (!Object.is(atom[VALUE], newValue)) {
  (atom as InternalAtom<T>)[VALUE] = newValue;
  atom[LISTENERS]?.forEach((listener) => listener(newValue));
}
```

---

**User**

Critical · @sangtae-js/src/index.ts
비동기 atom이 reject될 때 구독자에게 알림이 가지 않아. 에러만 저장하고 있어서 React 컴포넌트가 다시 렌더되지 않으니 get을 다시 호출할 기회가 없어. 상태가 바뀌었음을 알려주거나 최소한 재시도 트리거가 필요해.

Major · @sangtae-js/src/index.ts
파생 atom은 최초 평가 시점에만 의존 atom을 수집하고 나중에 의존성이 바뀌어도 다시 추적하지 않아. 분기 로직이 있는 계산에서 새로운 atom으로 갈아타면 구독이 누락돼서 값이 안 갱신될 수 있어.

Minor · @sangtae-js/src/index.ts
비동기 atom을 기다리는 중(pending)에 set(asyncAtom, newValue)를 호출하면 Proxy의 get이 Promise를 던져서 set 자체가 실패해. 명세상 “직접 값을 설정”하는 시나리오에 제약이 생기니, pending 상태에서도 덮어쓰기가 되도록 보호 로직이 필요해.

이 3부분 보완해줄래?

---

**Cursor**

```typescript
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
 * @param {(get: <U>(atom: Atom<U>) => U) => T} callback 아톰의 값이 변경될 때 호출되는 콜백함수
 * @returns {Atom<T>} 아톰 객체
 */
export const createDerivedAtom = <T>(
  callback: (get: <U>(atom: Atom<U>) => U) => T
): Atom<T> => {
  const derivedAtom: InternalAtom<T> = {
    [VALUE]: undefined as any,
    [LISTENERS]: null,
  };
  const dependencies = new Map<Atom<unknown>, () => void>();
  let isComputing = false;

  const trackedGet = <U>(atom: Atom<U>, collector: Set<Atom<unknown>>) => {
    collector.add(atom as Atom<unknown>);
    return get(atom);
  };

  const updateSubscriptions = (newDependencies: Set<Atom<unknown>>) => {
    dependencies.forEach((unsubscribe, atom) => {
      if (!newDependencies.has(atom)) {
        unsubscribe();
        dependencies.delete(atom);
      }
    });

    newDependencies.forEach((atom) => {
      if (!dependencies.has(atom)) {
        const unsubscribe = subscribe(atom, recompute);
        dependencies.set(atom, unsubscribe);
      }
    });
  };

  const recompute = () => {
    if (isComputing) return;
    isComputing = true;
    const newDependencies = new Set<Atom<unknown>>();
    const nextValue = callback((atom) => trackedGet(atom, newDependencies));

    updateSubscriptions(newDependencies);

    if (!Object.is(derivedAtom[VALUE], nextValue)) {
      derivedAtom[VALUE] = nextValue;
      derivedAtom[LISTENERS]?.forEach((listener) => listener(nextValue));
    }
    isComputing = false;
  };

  const initialDependencies = new Set<Atom<unknown>>();
  const initialValue = callback((atom) =>
    trackedGet(atom, initialDependencies)
  );
  derivedAtom[VALUE] = initialValue;
  updateSubscriptions(initialDependencies);

  return derivedAtom;
};

// 비동기 atom 캐시 (같은 Promise에 대해 같은 Proxy atom 반환)
// WeakMap을 사용하여 Promise가 더 이상 참조되지 않으면 자동으로 GC 처리
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
      // 에러 발생을 구독자에게 전달
      atom[LISTENERS]?.forEach((listener) => listener(err));
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

/**
 * @description atom의 현재 상태 값을 반환합니다
 * @param {Atom<T>} atom atom 객체
 * @returns {T} atom의 현재 상태 값
 */
export const get = <T>(atom: Atom<T>): T => atom[VALUE];

/**
 * @description (추가기능) 비동기 atom의 값을 반환합니다
 * @param {Atom<T>} atom atom 객체
 * @returns {Promise<T>} atom의 현재 상태 값을 담은 Promise 객체
 */
export const getAsync = async <T>(atom: Atom<T>) => {
  try {
    return get(atom);
  } catch (thrown) {
    if (thrown instanceof Promise) {
      return (await thrown) as Promise<T>;
    }
    throw thrown;
  }
};

/**
 * @description atom의 값을 `newValue`로 업데이트합니다
 * @param {Atom<T>} atom atom 객체
 * @param {T} newValue 새로운 값
 */
export const set = <T>(atom: Atom<T>, newValue: T) => {
  let currentValue: T | undefined;
  let hasCurrentValue = true;

  try {
    currentValue = atom[VALUE];
  } catch (thrown) {
    if (thrown instanceof Promise || thrown instanceof Error) {
      hasCurrentValue = false;
    } else {
      throw thrown;
    }
  }

  if (hasCurrentValue && Object.is(currentValue, newValue)) {
    return;
  }

  // 값이 변경되었다면 값을 업데이트하고 구독자에게 알림
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
```

## 요약

- 파생 atom이 동적으로 의존 atom을 갱신하도록 리팩터링해서 분기/조건 로직에서도 값이 즉시 따라오게 했어.
  ```34:83:@sangtae-js/src/index.ts
  export const createDerivedAtom = <T>(callback: (get: <U>(atom: Atom<U>) => U) => T): Atom<T> => {
    const derivedAtom: InternalAtom<T> = {
      [VALUE]: undefined as any,
      [LISTENERS]: null,
    };
    const dependencies = new Map<Atom<unknown>, () => void>();
    let isComputing = false;
    // ... existing code ...
    const recompute = () => {
      if (isComputing) return;
      isComputing = true;
      const newDependencies = new Set<Atom<unknown>>();
      const nextValue = callback((atom) => trackedGet(atom, newDependencies));
      updateSubscriptions(newDependencies);
      if (!Object.is(derivedAtom[VALUE], nextValue)) {
        derivedAtom[VALUE] = nextValue;
        derivedAtom[LISTENERS]?.forEach((listener) => listener(nextValue));
      }
      isComputing = false;
    };
    // ... existing code ...
  };
  ```
- 비동기 atom이 reject되면 구독자에게도 에러를 보내서 UI가 재시도/에러 렌더링을 트리거할 수 있어.
  ```114:129:@sangtae-js/src/index.ts
    (err) => {
      status = "error";
      error = err;
      atom[LISTENERS]?.forEach((listener) => listener(err));
    }
  );
  ```
- Promise 대기 중 `set(asyncAtom, 값)`을 호출해도 더 이상 Promise throw에 막히지 않고 값 덮어쓰기가 가능해.
  ```199:220:@sangtae-js/src/index.ts
  export const set = <T>(atom: Atom<T>, newValue: T) => {
    let currentValue: T | undefined;
    let hasCurrentValue = true;
    try {
      currentValue = atom[VALUE];
    } catch (thrown) {
      if (thrown instanceof Promise || thrown instanceof Error) {
        hasCurrentValue = false;
      } else {
        throw thrown;
      }
    }
    if (hasCurrentValue && Object.is(currentValue, newValue)) {
      return;
    }
    (atom as InternalAtom<T>)[VALUE] = newValue;
    atom[LISTENERS]?.forEach((listener) => listener(newValue));
  };
  ```

## 테스트

- `npm run test:run` (pass, 마지막에 vitest 워커 `EPERM` 경고는 기존과 동일한 종료 이슈라 기능에는 영향 없어).

```typescript
export const createDerivedAtom = <T>(
  callback: (get: <U>(atom: Atom<U>) => U) => T
): Atom<T> => {
  const derivedAtom: InternalAtom<T> = {
    [VALUE]: undefined as any,
    [LISTENERS]: null,
  };
  const dependencies = new Map<Atom<unknown>, () => void>();
  let isComputing = false;
  // ... existing code ...
  const recompute = () => {
    if (isComputing) return;
    isComputing = true;
    const newDependencies = new Set<Atom<unknown>>();
    const nextValue = callback((atom) => trackedGet(atom, newDependencies));
    updateSubscriptions(newDependencies);
    if (!Object.is(derivedAtom[VALUE], nextValue)) {
      derivedAtom[VALUE] = nextValue;
      derivedAtom[LISTENERS]?.forEach((listener) => listener(nextValue));
    }
    isComputing = false;
  };
  // ... existing code ...
};
```

```typescript
    (err) => {
      status = "error";
      error = err;
      atom[LISTENERS]?.forEach((listener) => listener(err));
    }
  );
```

```typescript
export const set = <T>(atom: Atom<T>, newValue: T) => {
  let currentValue: T | undefined;
  let hasCurrentValue = true;
  try {
    currentValue = atom[VALUE];
  } catch (thrown) {
    if (thrown instanceof Promise || thrown instanceof Error) {
      hasCurrentValue = false;
    } else {
      throw thrown;
    }
  }
  if (hasCurrentValue && Object.is(currentValue, newValue)) {
    return;
  }
  (atom as InternalAtom<T>)[VALUE] = newValue;
  atom[LISTENERS]?.forEach((listener) => listener(newValue));
};
```
