# Creating an AI prompt for code completion

_Exported on 2025. 11. 8. at 16시 12분 5초 GMT+9 from Cursor (2.0.69)_

---

**User**

@index.ts (1-60)

라이브러리 뼈대부터 짜보자. VALUE/LISTENERS 심벌 정의하고 atom 기본 구조 만들어줘.

---

**Cursor**

어 알았어. InternalAtom이랑 createAtom 먼저 생성할게. 잠깐만

```typescript
// 내부 저장소 키
const VALUE = Symbol("ATOM_VALUE");
const LISTENERS = Symbol("ATOM_LISTENERS");

type InternalAtom<T> = {
  [VALUE]: T;
  [LISTENERS]: Set<(value: T) => void>;
};

export type Atom<T> = Readonly<InternalAtom<T>>;

export const createAtom = <T>(initialValue: T): Atom<T> => ({
  [VALUE]: initialValue,
  [LISTENERS]: new Set(),
});
```

---

**User**

LISTENERS 기본값 null로 바꿔줘

---

**Cursor**

아 맞다. Set 바로 만들면 구독자가 없어도 생성되지

```typescript
/** 구독 리스너 */
export type Listener<T> = (value: T) => void;

type InternalAtom<T> = {
  [VALUE]: T;
  [LISTENERS]: Set<Listener<T>> | null;
};

export const createAtom = <T>(initialValue: T): Atom<T> => ({
  [VALUE]: initialValue,
  [LISTENERS]: null,
});
```

---

**User**

좋아. 이제 파생 atom 만들자. callback(get) 안에서 참조한 atom이 바뀌면 재계산되게.

---

**Cursor**

오케이. 일단 감으로 써볼게.

```typescript
export const createDerivedAtom = <T>(
  callback: (get: <U>(atom: Atom<U>) => U) => T
): Atom<T> => {
  const derivedAtom: InternalAtom<T> = {
    [VALUE]: callback(get),
    [LISTENERS]: null,
  };

  return derivedAtom;
};
```

이러면 의존 atom 추적이 전혀 안 되네 잠깐만 다시 생각해볼게.

---

**User**

그러니까… callback 실행할 때 get이 호출되는 atom 다 모아둬야지.

---

**Cursor**

atoms Set 만들어서 callback 안에서 수집하고, 나중에 subscribe 걸어볼게. 근데 get 함수 아직 없어서 위에다가 임시 get 정의해두고 써야겠다.

```typescript
export const get = <T>(atom: Atom<T>): T => atom[VALUE];

export const createDerivedAtom = <T>(
  callback: (get: <U>(atom: Atom<U>) => U) => T
): Atom<T> => {
  const atoms = new Set<Atom<any>>();
  const runner = <U>(atom: Atom<U>) => {
    atoms.add(atom);
    return get(atom);
  };

  const derivedAtom: InternalAtom<T> = {
    [VALUE]: callback(runner),
    [LISTENERS]: null,
  };

  atoms.forEach((atom) => {
    subscribe(atom, () => {
      derivedAtom[VALUE] = callback(runner);
      derivedAtom[LISTENERS]?.forEach((listener) =>
        listener(derivedAtom[VALUE])
      );
    });
  });

  return derivedAtom;
};
```

---

**User**

derivedAtom 값 바뀔 때 Object.is 비교 없어서 같아도 계속 알림 보내잖아.

---

**Cursor**

헉 그렇네. 비교 넣을게. 그리고 subscribe 아래에서 runner 쓰면 atoms가 계속 누적돼서 중복 구독할 듯. 근데 어차피 Set이라 중복 괜찮긴 한데, callback 다시 돌릴 때마다 atoms 재수집이 안 되네. 파생 atom이 다른 atom 참조를 새로 추가하면 못 잡지 않을까? 지금은 초기 실행때만 수집하니까 그걸로 충분하다고 가정할게.

```typescript
atoms.forEach((atom) => {
  subscribe(atom, () => {
    const newValue = callback(runner);
    if (!Object.is(derivedAtom[VALUE], newValue)) {
      derivedAtom[VALUE] = newValue;
      derivedAtom[LISTENERS]?.forEach((listener) => listener(newValue));
    }
  });
});
```

이렇게 수정했어.

---

**User**

생성자에서 runner 쓰는데 subscribe 내부에서도 같은 runner라 atoms Set에 derivedAtom 자기 자신이 안 들어가나? 괜찮겠지. 다음은 비동기 atom 가자.

---

**Cursor**

비동기 atom… 예전에 InternalAtom 자체를 WeakMap에 저장해서 Proxy랑 안 맞았었지. 이번엔 Proxy를 저장해보자.

```typescript
const asyncAtomCache = new WeakMap<Promise<any>, Atom<any>>();

export const createAsyncAtom = <T>(promise: Promise<T>): Atom<T> => {
  if (asyncAtomCache.has(promise)) {
    return asyncAtomCache.get(promise) as Atom<T>;
  }

  let status: "pending" | "success" | "error" = "pending";
  let data: T | undefined;
  let error: any;

  const atom: InternalAtom<T> = {
    [VALUE]: undefined as any,
    [LISTENERS]: null,
  };

  promise.then(
    (value) => {
      status = "success";
      data = value;
      atom[VALUE] = value;
      atom[LISTENERS]?.forEach((listener) => listener(value));
    },
    (err) => {
      status = "error";
      error = err;
    }
  );

  asyncAtomCache.set(promise, atom);

  return new Proxy(atom, {
    get(target, property) {
      if (property === VALUE) {
        if (status === "pending") throw promise;
        if (status === "error") throw error;
        return data;
      }
      return target[property as keyof typeof target];
    },
    set(target, property, value) {
      target[property as keyof typeof target] = value;
      return true;
    },
  });
};
```

---

**User**

이거 또 망했다ㅋㅋ 캐시에 atom 넣어버렸잖아. Proxy 반환하면서 WeakMap에는 atom이 들어가 있으니까 두 번째 호출에서 Proxy 못 돌려받아.

---

**Cursor**

아 맞다… Proxy 만든 다음에 그걸 캐시에 넣어야지. 그리고 set 트랩에서 VALUE 갱신되는 경우 status랑 data도 업데이트해야 하고. 다시 고칠게.

```typescript
const proxyAtom = new Proxy(atom, {
  get(target, property) {
    if (property === VALUE) {
      if (status === "pending") throw promise;
      if (status === "error") throw error;
      return data;
    }
    return target[property as keyof typeof target];
  },
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

asyncAtomCache.set(promise, proxyAtom);

return proxyAtom;
```

이거면 됐지?

---

**User**

응. 근데 set 트랩에서 listeners 알림 안 보내는데 괜찮을까? 외부에서 set(proxyAtom, value) 하는 케이스는 일반 set 함수가 처리할 테니 괜찮을 것 같긴 해. 이제 getAsync 만들어줘. thrown Promise 처리해야 해.

---

**Cursor**

ㅇㅋ.

```typescript
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
```

혹시 리턴 타입 Promise<T>로 맞춰야 해서 as Promise<T> 붙였어.

---

**User**

set 함수에서 아직 atom[LISTENERS]?.forEach 쓰고 있는데, internalAtom[LISTENERS] 캐싱해서 null 체크하자고 했잖아. 그리고 subscribe 기본 호출은 빼고

---

**Cursor**

헉 이미 뺀 줄 알았는데 주석으로만 막아놨네. 완전히 제거할게. set도 정리함.

```typescript
export const set = <T>(atom: Atom<T>, newValue: T) => {
  const internalAtom = atom as InternalAtom<T>;
  const prevValue = internalAtom[VALUE];

  if (Object.is(prevValue, newValue)) {
    return;
  }

  internalAtom[VALUE] = newValue;

  const listeners = internalAtom[LISTENERS];
  if (listeners !== null) {
    listeners.forEach((listener) => listener(newValue));
  }
};
```

subscribe는 아래처럼 수정.

```typescript
export const subscribe = <T>(atom: Atom<T>, callback: Listener<T>) => {
  let listeners = atom[LISTENERS];

  if (listeners === null) {
    listeners = new Set<Listener<T>>();
    (atom as InternalAtom<T>)[LISTENERS] = listeners;
  }

  listeners.add(callback);

  return () => {
    const currentListeners = atom[LISTENERS];
    if (currentListeners !== null) {
      currentListeners.delete(callback);
      if (currentListeners.size === 0) {
        (atom as InternalAtom<T>)[LISTENERS] = null;
      }
    }
  };
};
```

---

**User**

createDerivedAtom에서 atoms.forEach로 subscribe 걸면 unsubscribe 함수 버려지는 거 알지? 메모리 누수 아니야? 그래도 지금은 간단하니까 패스. 최종 코드 다시 한 번 전체 보여줘. 틀린 부분 없나 확인해볼게.

---

**Cursor**

전체 정리해서 붙여놨어.

```0:209:@sangtae-js/src/index.ts
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
 * @returns {T} atom의 상태 값
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
  const prevValue = internalAtom[VALUE];

  if (Object.is(prevValue, newValue)) {
    return;
  }

  // 값이 변경되었다면 값을 업데이트하고 구독자에게 알림
  internalAtom[VALUE] = newValue;

  const listeners = internalAtom[LISTENERS];
  if (listeners !== null) {
    listeners.forEach((listener) => listener(newValue));
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

---

```typescript
// 내부 저장소 키
const VALUE = Symbol("ATOM_VALUE");
const LISTENERS = Symbol("ATOM_LISTENERS");

type InternalAtom<T> = {
  [VALUE]: T;
  [LISTENERS]: Set<(value: T) => void>;
};

export type Atom<T> = Readonly<InternalAtom<T>>;

export const createAtom = <T>(initialValue: T): Atom<T> => ({
  [VALUE]: initialValue,
  [LISTENERS]: new Set(),
});
```

```typescript
/** 구독 리스너 */
export type Listener<T> = (value: T) => void;

type InternalAtom<T> = {
  [VALUE]: T;
  [LISTENERS]: Set<Listener<T>> | null;
};

export const createAtom = <T>(initialValue: T): Atom<T> => ({
  [VALUE]: initialValue,
  [LISTENERS]: null,
});
```

```typescript
export const createDerivedAtom = <T>(
  callback: (get: <U>(atom: Atom<U>) => U) => T
): Atom<T> => {
  const derivedAtom: InternalAtom<T> = {
    [VALUE]: callback(get),
    [LISTENERS]: null,
  };

  return derivedAtom;
};
```

```typescript
export const get = <T>(atom: Atom<T>): T => atom[VALUE];

export const createDerivedAtom = <T>(
  callback: (get: <U>(atom: Atom<U>) => U) => T
): Atom<T> => {
  const atoms = new Set<Atom<any>>();
  const runner = <U>(atom: Atom<U>) => {
    atoms.add(atom);
    return get(atom);
  };

  const derivedAtom: InternalAtom<T> = {
    [VALUE]: callback(runner),
    [LISTENERS]: null,
  };

  atoms.forEach((atom) => {
    subscribe(atom, () => {
      derivedAtom[VALUE] = callback(runner);
      derivedAtom[LISTENERS]?.forEach((listener) =>
        listener(derivedAtom[VALUE])
      );
    });
  });

  return derivedAtom;
};
```

```typescript
atoms.forEach((atom) => {
  subscribe(atom, () => {
    const newValue = callback(runner);
    if (!Object.is(derivedAtom[VALUE], newValue)) {
      derivedAtom[VALUE] = newValue;
      derivedAtom[LISTENERS]?.forEach((listener) => listener(newValue));
    }
  });
});
```

```typescript
const asyncAtomCache = new WeakMap<Promise<any>, Atom<any>>();

export const createAsyncAtom = <T>(promise: Promise<T>): Atom<T> => {
  if (asyncAtomCache.has(promise)) {
    return asyncAtomCache.get(promise) as Atom<T>;
  }

  let status: "pending" | "success" | "error" = "pending";
  let data: T | undefined;
  let error: any;

  const atom: InternalAtom<T> = {
    [VALUE]: undefined as any,
    [LISTENERS]: null,
  };

  promise.then(
    (value) => {
      status = "success";
      data = value;
      atom[VALUE] = value;
      atom[LISTENERS]?.forEach((listener) => listener(value));
    },
    (err) => {
      status = "error";
      error = err;
    }
  );

  asyncAtomCache.set(promise, atom);

  return new Proxy(atom, {
    get(target, property) {
      if (property === VALUE) {
        if (status === "pending") throw promise;
        if (status === "error") throw error;
        return data;
      }
      return target[property as keyof typeof target];
    },
    set(target, property, value) {
      target[property as keyof typeof target] = value;
      return true;
    },
  });
};
```

```typescript
const proxyAtom = new Proxy(atom, {
  get(target, property) {
    if (property === VALUE) {
      if (status === "pending") throw promise;
      if (status === "error") throw error;
      return data;
    }
    return target[property as keyof typeof target];
  },
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

asyncAtomCache.set(promise, proxyAtom);

return proxyAtom;
```

```typescript
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
```

```typescript
export const set = <T>(atom: Atom<T>, newValue: T) => {
  const internalAtom = atom as InternalAtom<T>;
  const prevValue = internalAtom[VALUE];

  if (Object.is(prevValue, newValue)) {
    return;
  }

  internalAtom[VALUE] = newValue;

  const listeners = internalAtom[LISTENERS];
  if (listeners !== null) {
    listeners.forEach((listener) => listener(newValue));
  }
};
```

```typescript
export const subscribe = <T>(atom: Atom<T>, callback: Listener<T>) => {
  let listeners = atom[LISTENERS];

  if (listeners === null) {
    listeners = new Set<Listener<T>>();
    (atom as InternalAtom<T>)[LISTENERS] = listeners;
  }

  listeners.add(callback);

  return () => {
    const currentListeners = atom[LISTENERS];
    if (currentListeners !== null) {
      currentListeners.delete(callback);
      if (currentListeners.size === 0) {
        (atom as InternalAtom<T>)[LISTENERS] = null;
      }
    }
  };
};
```

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
 * @returns {T} atom의 वर्तमान 상태 값
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
  const prevValue = internalAtom[VALUE];

  if (Object.is(prevValue, newValue)) {
    return;
  }

  // 값이 변경되었다면 값을 업데이트하고 구독자에게 알림
  internalAtom[VALUE] = newValue;

  const listeners = internalAtom[LISTENERS];
  if (listeners !== null) {
    listeners.forEach((listener) => listener(newValue));
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
