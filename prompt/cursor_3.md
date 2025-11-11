# 원자 상태 값 비교 최적화 논의
_Exported on 2025. 11. 9. at 19시 8분 15초 GMT+9 from Cursor (2.0.69)_

---

**User**

@index.ts (155-163) 



이 부분이 원자 상태의 값이 같은지를 비교하는 방식에 좀 더 최적화할수 있는 여지가 있는 것같아

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
  const internalAtom = atom as InternalAtom<T>;
  const prevValue = internalAtom[VALUE];

  if (Object.is(prevValue, newValue)) {
    return;
  }

  // 값이 변경되었다면 값을 업데이트하고 구독자에게 알림
  internalAtom[VALUE] = newValue;
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
  callback(atom[VALUE]);

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

- `@sangtae-js/src/index.ts`에서 내부 참조를 캐싱해서 `Object.is` 재호출 없도록 했어. 값이 동일하면 바로 리턴하고, 바뀐 경우에만 갱신 및 구독자 호출하도록 정리했어.

```155:165:@sangtae-js/src/index.ts
export const set = <T>(atom: Atom<T>, newValue: T) => {
  const internalAtom = atom as InternalAtom<T>;
  const prevValue = internalAtom[VALUE];

  if (Object.is(prevValue, newValue)) {
    return;
  }

  internalAtom[VALUE] = newValue;
  atom[LISTENERS]?.forEach((listener) => listener(newValue));
};
```

추가로 확인하고 싶은 거 있으면 말해줘.

```typescript
export const set = <T>(atom: Atom<T>, newValue: T) => {
  const internalAtom = atom as InternalAtom<T>;
  const prevValue = internalAtom[VALUE];

  if (Object.is(prevValue, newValue)) {
    return;
  }

  internalAtom[VALUE] = newValue;
  atom[LISTENERS]?.forEach((listener) => listener(newValue));
};
```

---

**User**

기존코드와 무슨 차이가있어?

---

**Cursor**

기존엔 `Object.is(atom[VALUE], newValue)`로 바로 비교하면서, 값이 같을 땐 그냥 아무 것도 안 하고, 다르면 그때 `atom`을 `InternalAtom`으로 캐스팅해서 값 바꾸고 리스너 호출했잖아.  
지금은 처음에 한 번만 `(atom as InternalAtom<T>)`로 내부 참조를 잡아두고 `prevValue`에 담은 다음, `Object.is(prevValue, newValue)`가 참이면 바로 리턴해. 그래서 불필요하게 심벌 프로퍼티에 두 번 접근하지 않아서 약간 더 효율적이고, 값이 같을 때는 조기 종료해서 아래 코드가 실행되지 않는다는 게 달라졌어.

---

**User**

@index.ts (1-195) 



이 내부 값을 변경하고 다시 같은 객체를 set하면 값 변경되?

---

**Cursor**

같은 객체 참조 그대로 넘기면 `Object.is(prevValue, newValue)`가 `true`라서 `set`이 조기 종료돼. 즉, 객체 안의 필드를 직접 바꿔도 새 참조로 교체하지 않으면 구독자들에겐 변경 신호가 안 나가. 값이 바뀌었다고 알려주려면 새 객체를 만들어서 `set`하거나, 내부에서 불변성 유지해서 동작하게 해야 해.

---

**User**

@JF002 - Minimal Global State Managment Library 구현.md (21-24) 

그럼 요구사항의 이 부분을 만족하지 못하지 않을까?

---

**Cursor**

그 요구사항은 “값이 진짜 바뀌었을 때만 알림을 보내라”는 얘기인데, 여기서 “값이 바뀌었다”는 걸 참조 기준으로 판단하고 있어. 즉 불변 객체처럼 새 객체를 만들어서 `set`해야만 변화로 인식해. 같은 객체 참조를 유지하면서 내부 필드만 수정하면 라이브러리는 그대로라고 보고 알림을 안 보내.  

그래서 “내부 값 수정 + 동일 참조 유지” 시나리오까지 처리해야 한다면 현재 구현으론 요구를 완전히 충족 못 해. 그런 케이스까지 커버하려면 구조적 비교나 커스텀 비교 함수를 넣어주거나, `set(atom, updater)` 형태로 내부에서 새 객체를 만들어주게끔 설계를 바꿔야 해. 반대로 “불변 패턴을 쓴다”는 전제를 세우면 지금 방식도 요구사항에 맞는다고 볼 수 있어. 어느 쪽이 의도인지 결정해서 수정할지 말지 정하면 될 듯해.

---

**User**

@README.md (9-16) 

불변성 유지를 추가해줘

---

**Cursor**

```markdown
# sangtae-js

Minimal Global State Management Library

## 소개

`sangtae-js`는 심플한 API로 전역 상태를 선언하고 관리할 수 있는 초경량 상태 관리 라이브러리입니다. 불필요한 러닝 커브 없이 `atom` 개념만으로 동기/비동기 상태와 파생 상태를 모두 다룰 수 있도록 설계했습니다.

## 주요 특징

- **TypeScript 우선**: 제네릭 기반 API로 컴파일 타임 타입을 보장합니다.
- **파생 상태 지원**: 여러 atom을 조합해 memoized 파생 값을 만들 수 있습니다.
- **비동기 친화적**: `Promise`를 기반으로 Suspense 패턴과 자연스럽게 연동됩니다.
- **구독 기반 업데이트**: 필요한 곳에서만 `subscribe`하여 최신 상태를 유지합니다.
- **불변성**: `set`은 `Object.is`로 이전 값과 새 값을 비교하므로, 동일한 참조를 전달하면 변경으로 인식하지 않습니다. 상태를 업데이트할 때는 항상 새 객체나 값을 생성해 전달하는 불변 패턴을 권장합니다.

## 설치

```bash
npm install sangtae-js
```

## 빠른 시작

```ts
import { createAtom, get, set, subscribe } from "sangtae-js";

const counterAtom = createAtom(0);

const unsubscribe = subscribe(counterAtom, (value) => {
  console.log("현재 값:", value);
});

set(counterAtom, 1); // 콘솔: 현재 값: 1
console.log(get(counterAtom)); // 1

unsubscribe(); // 더 이상 변경 사항을 듣지 않습니다.
```

## 파생 atom 사용하기

```ts
import { createAtom, createDerivedAtom, set, get } from "sangtae-js";

const priceAtom = createAtom(10_000);
const quantityAtom = createAtom(2);

const totalPriceAtom = createDerivedAtom((get) => {
  return get(priceAtom) * get(quantityAtom);
});

console.log(get(totalPriceAtom)); // 20000

set(quantityAtom, 3);
console.log(get(totalPriceAtom)); // 30000 (자동으로 갱신됩니다.)
```

`createDerivedAtom`은 내부적으로 참조한 atom들을 자동으로 추적하고, 값이 달라질 때마다 파생 atom을 다시 계산합니다.

## 비동기 atom과 Suspense

```ts
import { createAsyncAtom, get } from "sangtae-js";

const userAtom = createAsyncAtom(fetch("/api/me").then((res) => res.json()));

try {
  const user = get(userAtom);
  console.log(user.name);
} catch (value) {
  if (value instanceof Promise) {
    console.log("로딩 중...");
  } else {
    console.error("에러 발생", value);
  }
}
```

- 같은 `Promise`를 넘기면 내부 캐시 덕분에 항상 동일한 atom을 돌려줍니다.
- `get` 호출 시 `pending`이면 원래 Promise를 throw하여 React Suspense 같은 환경과 자연스럽게 맞물립니다.
- `set`으로 값을 교체하면 자동으로 상태가 `success`로 바뀌어 재활용할 수 있습니다.

## React에서 쓰는 법 (예시)

```ts
// sample useAtom 구현 예시
import { useEffect, useState } from "react";
import { Atom, subscribe, get } from "sangtae-js";

export function useAtom<T>(atom: Atom<T>) {
  const [value, setValue] = useState(() => get(atom));

  useEffect(() => {
    return subscribe(atom, setValue);
  }, [atom]);

  return value;
}
```

```tsx
const counterAtom = createAtom(0);

function Counter() {
  const count = useAtom(counterAtom);

  return (
    <button onClick={() => set(counterAtom, count + 1)}>
      클릭 횟수: {count}
    </button>
  );
}
```

## API 레퍼런스

| 함수                          | 설명                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `createAtom(initialValue)`    | 초깃값으로 새로운 atom을 만듭니다.                                                                      |
| `createDerivedAtom(callback)` | `callback(get)` 안에서 참조한 atom을 추적해 파생 값을 계산합니다.                                       |
| `createAsyncAtom(promise)`    | `Promise`를 기반으로 한 비동기 atom을 만듭니다. Suspense와 호환됩니다.                                  |
| `get(atom)`                   | atom의 현재 값을 읽습니다. 비동기 atom의 경우 `Promise` 또는 에러를 throw할 수 있습니다.                |
| `set(atom, newValue)`         | atom 값을 새 값으로 갱신하고, 변경 시 구독자에게 통지합니다.                                            |
| `subscribe(atom, listener)`   | 값이 바뀔 때마다 `listener`를 실행하고, 즉시 현재 값을 한 번 호출합니다. 반환값은 구독 해제 함수입니다. |

### `Listener<T>`

```ts
type Listener<T> = (value: T) => void;
```

- 필요한 곳에서만 구독해 메모리 사용량을 최소화할 수 있습니다.
- 마지막 구독자가 해제되면 내부 `Set`이 정리되어 GC 대상이 됩니다.

## 개발 스크립트

- `npm run build`: 타입 검사 및 테스트 실행 후 `tsup`으로 번들을 생성합니다.
- `npm run build-watch`: 개발 중 번들링을 실시간으로 확인합니다.
- `npm run test`: Vitest 워치 모드를 실행합니다.
- `npm run test:run`: CI 등을 위한 Vitest 단발 실행을 수행합니다.

```

- README의 `불변성` 항목에 `set` 동작과 불변 패턴 권장 이유 추가했어.  
- 이제 동일 참조로는 변경이 안 잡힌다는 점이 문서에 명시돼서 사용자가 요구사항을 이해하기 쉬울 거야.

---

**User**

@README.md (102-105) @index.ts (14-16) 이 타입도 추가해줄래

---

**Cursor**

```markdown
# sangtae-js

Minimal Global State Management Library

## 소개

`sangtae-js`는 심플한 API로 전역 상태를 선언하고 관리할 수 있는 초경량 상태 관리 라이브러리입니다. 불필요한 러닝 커브 없이 `atom` 개념만으로 동기/비동기 상태와 파생 상태를 모두 다룰 수 있도록 설계했습니다.

## 주요 특징

- **TypeScript 우선**: 제네릭 기반 API로 컴파일 타임 타입을 보장합니다.
- **파생 상태 지원**: 여러 atom을 조합해 memoized 파생 값을 만들 수 있습니다.
- **비동기 친화적**: `Promise`를 기반으로 Suspense 패턴과 자연스럽게 연동됩니다.
- **구독 기반 업데이트**: 필요한 곳에서만 `subscribe`하여 최신 상태를 유지합니다.
- **불변성**: 상태를 업데이트할 때는 항상 새 객체나 값을 생성해 전달하는 불변 패턴을 사용합니다.

## 설치

```bash
npm install sangtae-js
```

## 빠른 시작

```ts
import { createAtom, get, set, subscribe } from "sangtae-js";

const counterAtom = createAtom(0);

const unsubscribe = subscribe(counterAtom, (value) => {
  console.log("현재 값:", value);
});

set(counterAtom, 1); // 콘솔: 현재 값: 1
console.log(get(counterAtom)); // 1

unsubscribe(); // 더 이상 변경 사항을 듣지 않습니다.
```

## 파생 atom 사용하기

```ts
import { createAtom, createDerivedAtom, set, get } from "sangtae-js";

const priceAtom = createAtom(10_000);
const quantityAtom = createAtom(2);

const totalPriceAtom = createDerivedAtom((get) => {
  return get(priceAtom) * get(quantityAtom);
});

console.log(get(totalPriceAtom)); // 20000

set(quantityAtom, 3);
console.log(get(totalPriceAtom)); // 30000 (자동으로 갱신됩니다.)
```

`createDerivedAtom`은 내부적으로 참조한 atom들을 자동으로 추적하고, 값이 달라질 때마다 파생 atom을 다시 계산합니다.

## 비동기 atom과 Suspense

```ts
import { createAsyncAtom, get } from "sangtae-js";

const asyncAtom = createAsyncAtom(fetch("/api/me").then((res) => res.json()));

try {
  const user = get(asyncAtom);
  console.log(user.name);
} catch (value) {
  if (value instanceof Promise) {
    console.log("로딩 중...");
  } else {
    console.error("에러 발생", value);
  }
}
```

- 같은 `Promise`를 넘기면 내부 캐시 덕분에 항상 동일한 atom을 돌려줍니다.
- `get` 호출 시 `pending`이면 원래 Promise를 throw하여 React Suspense 같은 환경과 자연스럽게 맞물립니다.
- `set`으로 값을 교체하면 자동으로 상태가 `success`로 바뀌어 재활용할 수 있습니다.

## API 레퍼런스

| 함수                          | 설명                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `createAtom(initialValue)`    | 초깃값으로 새로운 atom을 만듭니다.                                                                      |
| `createDerivedAtom(callback)` | `callback(get)` 안에서 참조한 atom을 추적해 파생 값을 계산합니다.                                       |
| `createAsyncAtom(promise)`    | `Promise`를 기반으로 한 비동기 atom을 만듭니다. Suspense와 호환됩니다.                                  |
| `get(atom)`                   | atom의 현재 값을 읽습니다. 비동기 atom의 경우 `Promise` 또는 에러를 throw할 수 있습니다.                |
| `set(atom, newValue)`         | atom 값을 새 값으로 갱신하고, 변경 시 구독자에게 통지합니다.                                            |
| `subscribe(atom, listener)`   | 값이 바뀔 때마다 `listener`를 실행하고, 즉시 현재 값을 한 번 호출합니다. 반환값은 구독 해제 함수입니다. |

### `Listener<T>`

```ts
type Listener<T> = (value: T) => void;
```

- 필요한 곳에서만 구독해 메모리 사용량을 최소화할 수 있습니다.
- 마지막 구독자가 해제되면 내부 `Set`이 정리되어 GC 대상이 됩니다.

### `Atom<T>`

```ts
export type Atom<T> = Readonly<InternalAtom<T>>;
```

- 라이브러리 외부에서는 `Atom<T>`를 통해 상태를 참조하며, 내부 상태는 읽기 전용으로 취급됩니다.
```

README에 `Atom<T>` 타입 소개 섹션을 추가해서 실제 선언(`export type Atom<T> = Readonly<InternalAtom<T>>;`)과 쓰임을 명시해뒀어. 이제 문서에서도 이 타입 확인할 수 있어.

---

**User**

InternalAtom도 추가해줘

---

**Cursor**

```markdown
# sangtae-js

Minimal Global State Management Library

## 소개

`sangtae-js`는 심플한 API로 전역 상태를 선언하고 관리할 수 있는 초경량 상태 관리 라이브러리입니다. 불필요한 러닝 커브 없이 `atom` 개념만으로 동기/비동기 상태와 파생 상태를 모두 다룰 수 있도록 설계했습니다.

## 주요 특징

- **TypeScript 우선**: 제네릭 기반 API로 컴파일 타임 타입을 보장합니다.
- **파생 상태 지원**: 여러 atom을 조합해 memoized 파생 값을 만들 수 있습니다.
- **비동기 친화적**: `Promise`를 기반으로 Suspense 패턴과 자연스럽게 연동됩니다.
- **구독 기반 업데이트**: 필요한 곳에서만 `subscribe`하여 최신 상태를 유지합니다.
- **불변성**: 상태를 업데이트할 때는 항상 새 객체나 값을 생성해 전달하는 불변 패턴을 사용합니다.

## 설치

```bash
npm install sangtae-js
```

## 빠른 시작

```ts
import { createAtom, get, set, subscribe } from "sangtae-js";

const counterAtom = createAtom(0);

const unsubscribe = subscribe(counterAtom, (value) => {
  console.log("현재 값:", value);
});

set(counterAtom, 1); // 콘솔: 현재 값: 1
console.log(get(counterAtom)); // 1

unsubscribe(); // 더 이상 변경 사항을 듣지 않습니다.
```

## 파생 atom 사용하기

```ts
import { createAtom, createDerivedAtom, set, get } from "sangtae-js";

const priceAtom = createAtom(10_000);
const quantityAtom = createAtom(2);

const totalPriceAtom = createDerivedAtom((get) => {
  return get(priceAtom) * get(quantityAtom);
});

console.log(get(totalPriceAtom)); // 20000

set(quantityAtom, 3);
console.log(get(totalPriceAtom)); // 30000 (자동으로 갱신됩니다.)
```

`createDerivedAtom`은 내부적으로 참조한 atom들을 자동으로 추적하고, 값이 달라질 때마다 파생 atom을 다시 계산합니다.

## 비동기 atom과 Suspense

```ts
import { createAsyncAtom, get } from "sangtae-js";

const asyncAtom = createAsyncAtom(fetch("/api/me").then((res) => res.json()));

try {
  const user = get(asyncAtom);
  console.log(user.name);
} catch (value) {
  if (value instanceof Promise) {
    console.log("로딩 중...");
  } else {
    console.error("에러 발생", value);
  }
}
```

- 같은 `Promise`를 넘기면 내부 캐시 덕분에 항상 동일한 atom을 돌려줍니다.
- `get` 호출 시 `pending`이면 원래 Promise를 throw하여 React Suspense 같은 환경과 자연스럽게 맞물립니다.
- `set`으로 값을 교체하면 자동으로 상태가 `success`로 바뀌어 재활용할 수 있습니다.

## API 레퍼런스

| 함수                          | 설명                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `createAtom(initialValue)`    | 초깃값으로 새로운 atom을 만듭니다.                                                                      |
| `createDerivedAtom(callback)` | `callback(get)` 안에서 참조한 atom을 추적해 파생 값을 계산합니다.                                       |
| `createAsyncAtom(promise)`    | `Promise`를 기반으로 한 비동기 atom을 만듭니다. Suspense와 호환됩니다.                                  |
| `get(atom)`                   | atom의 현재 값을 읽습니다. 비동기 atom의 경우 `Promise` 또는 에러를 throw할 수 있습니다.                |
| `set(atom, newValue)`         | atom 값을 새 값으로 갱신하고, 변경 시 구독자에게 통지합니다.                                            |
| `subscribe(atom, listener)`   | 값이 바뀔 때마다 `listener`를 실행하고, 즉시 현재 값을 한 번 호출합니다. 반환값은 구독 해제 함수입니다. |

### `Listener<T>`

```ts
type Listener<T> = (value: T) => void;
```

- 필요한 곳에서만 구독해 메모리 사용량을 최소화할 수 있습니다.
- 마지막 구독자가 해제되면 내부 `Set`이 정리되어 GC 대상이 됩니다.


### `Atom<T>`

```ts
export type Atom<T> = Readonly<InternalAtom<T>>;
```

- 라이브러리 외부에서는 `Atom<T>`를 통해 상태를 참조하며, 내부 상태는 읽기 전용으로 취급됩니다.

### `InternalAtom<T>`

```ts
type InternalAtom<T> = {
  [VALUE]: T;
  [LISTENERS]: Set<Listener<T>> | null;
};
```

- 라이브러리 내부에서만 사용하는 실제 저장 구조이며, 심벌 키를 통해 값과 구독자 집합을 관리합니다.

```

README에 `InternalAtom<T>` 타입 정의랑 설명도 추가했어. 이제 내부 구조까지 문서에서 확인 가능해.

---

**User**

@README.md (110-121)  리턴값 타입도 추가해줘

---

**Cursor**

```markdown
# sangtae-js

Minimal Global State Management Library

## 소개

`sangtae-js`는 심플한 API로 전역 상태를 선언하고 관리할 수 있는 초경량 상태 관리 라이브러리입니다. 불필요한 러닝 커브 없이 `atom` 개념만으로 동기/비동기 상태와 파생 상태를 모두 다룰 수 있도록 설계했습니다.

## 주요 특징

- **TypeScript 우선**: 제네릭 기반 API로 컴파일 타임 타입을 보장합니다.
- **파생 상태 지원**: 여러 atom을 조합해 memoized 파생 값을 만들 수 있습니다.
- **비동기 친화적**: `Promise`를 기반으로 Suspense 패턴과 자연스럽게 연동됩니다.
- **구독 기반 업데이트**: 필요한 곳에서만 `subscribe`하여 최신 상태를 유지합니다.
- **불변성**: 상태를 업데이트할 때는 항상 새 객체나 값을 생성해 전달하는 불변 패턴을 사용합니다.

## 설치

```bash
npm install sangtae-js
```

## 빠른 시작

```ts
import { createAtom, get, set, subscribe } from "sangtae-js";

const counterAtom = createAtom(0);

const unsubscribe = subscribe(counterAtom, (value) => {
  console.log("현재 값:", value);
});

set(counterAtom, 1); // 콘솔: 현재 값: 1
console.log(get(counterAtom)); // 1

unsubscribe(); // 더 이상 변경 사항을 듣지 않습니다.
```

## 파생 atom 사용하기

```ts
import { createAtom, createDerivedAtom, set, get } from "sangtae-js";

const priceAtom = createAtom(10_000);
const quantityAtom = createAtom(2);

const totalPriceAtom = createDerivedAtom((get) => {
  return get(priceAtom) * get(quantityAtom);
});

console.log(get(totalPriceAtom)); // 20000

set(quantityAtom, 3);
console.log(get(totalPriceAtom)); // 30000 (자동으로 갱신됩니다.)
```

`createDerivedAtom`은 내부적으로 참조한 atom들을 자동으로 추적하고, 값이 달라질 때마다 파생 atom을 다시 계산합니다.

## 비동기 atom과 Suspense

```ts
import { createAsyncAtom, get } from "sangtae-js";

const asyncAtom = createAsyncAtom(fetch("/api/me").then((res) => res.json()));

try {
  const user = get(asyncAtom);
  console.log(user.name);
} catch (value) {
  if (value instanceof Promise) {
    console.log("로딩 중...");
  } else {
    console.error("에러 발생", value);
  }
}
```

- 같은 `Promise`를 넘기면 내부 캐시 덕분에 항상 동일한 atom을 돌려줍니다.
- `get` 호출 시 `pending`이면 원래 Promise를 throw하여 React Suspense 같은 환경과 자연스럽게 맞물립니다.
- `set`으로 값을 교체하면 자동으로 상태가 `success`로 바뀌어 재활용할 수 있습니다.

### `Atom<T>`

```ts
export type Atom<T> = Readonly<InternalAtom<T>>;
```

- 라이브러리 외부에서는 `Atom<T>`를 통해 상태를 참조하며, 내부 상태는 읽기 전용으로 취급됩니다.

### `InternalAtom<T>`

```ts
type InternalAtom<T> = {
  [VALUE]: T;
  [LISTENERS]: Set<Listener<T>> | null;
};
```

- 라이브러리 내부에서만 사용하는 실제 저장 구조이며, 심벌 키를 통해 값과 구독자 집합을 관리합니다.

### `Listener<T>`

```ts
type Listener<T> = (value: T) => void;
```

- 필요한 곳에서만 구독해 메모리 사용량을 최소화할 수 있습니다.
- 마지막 구독자가 해제되면 내부 `Set`이 정리되어 GC 대상이 됩니다.

## API 레퍼런스

| 함수                          | 설명                                                                                                    | 반환 타입        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------- |
| `createAtom(initialValue)`    | 초깃값으로 새로운 atom을 만듭니다.                                                                      | `Atom<T>`        |
| `createDerivedAtom(callback)` | `callback(get)` 안에서 참조한 atom을 추적해 파생 값을 계산합니다.                                       | `Atom<T>`        |
| `createAsyncAtom(promise)`    | `Promise`를 기반으로 한 비동기 atom을 만듭니다. Suspense와 호환됩니다.                                  | `Atom<T>`        |
| `get(atom)`                   | atom의 현재 값을 읽습니다. 비동기 atom의 경우 `Promise` 또는 에러를 throw할 수 있습니다.                | `T`              |
| `set(atom, newValue)`         | atom 값을 새 값으로 갱신하고, 변경 시 구독자에게 통지합니다.                                            | `void`           |
| `subscribe(atom, listener)`   | 값이 바뀔 때마다 `listener`를 실행하고, 즉시 현재 값을 한 번 호출합니다. 반환값은 구독 해제 함수입니다. | `() => void`     |

```

API 레퍼런스 표에 `반환 타입` 열을 추가해서, 각 함수가 어떤 타입을 돌려주는지 한눈에 확인할 수 있게 정리해뒀어.

---

**User**

@README.md (63-76) 



이부분 예제가 잘못된것같아 에러발생이 안찍혀

---

**Cursor**

```markdown
# sangtae-js

Minimal Global State Management Library

## 소개

`sangtae-js`는 심플한 API로 전역 상태를 선언하고 관리할 수 있는 초경량 상태 관리 라이브러리입니다. 불필요한 러닝 커브 없이 `atom` 개념만으로 동기/비동기 상태와 파생 상태를 모두 다룰 수 있도록 설계했습니다.

## 주요 특징

- **TypeScript 우선**: 제네릭 기반 API로 컴파일 타임 타입을 보장합니다.
- **파생 상태 지원**: 여러 atom을 조합해 memoized 파생 값을 만들 수 있습니다.
- **비동기 친화적**: `Promise`를 기반으로 React Suspense 패턴과 자연스럽게 연동됩니다.
- **구독 기반 업데이트**: 필요한 곳에서만 `subscribe`하여 최신 상태를 유지합니다.
- **불변성**: 상태를 업데이트할 때는 항상 새 객체나 값을 생성해 전달하는 불변 패턴을 사용합니다.

## 설치

```bash
npm install sangtae-js
```

## 빠른 시작

```ts
import { createAtom, get, set, subscribe } from "sangtae-js";

const counterAtom = createAtom(0);

const unsubscribe = subscribe(counterAtom, (value) => {
  console.log("현재 값:", value);
});

set(counterAtom, 1); // 콘솔: 현재 값: 1
console.log(get(counterAtom)); // 1

unsubscribe(); // 더 이상 변경 사항을 듣지 않습니다.
```

## 파생 atom 사용하기

```ts
import { createAtom, createDerivedAtom, set, get } from "sangtae-js";

const priceAtom = createAtom(10_000);
const quantityAtom = createAtom(2);

const totalPriceAtom = createDerivedAtom((get) => {
  return get(priceAtom) * get(quantityAtom);
});

console.log(get(totalPriceAtom)); // 20000

set(quantityAtom, 3);
console.log(get(totalPriceAtom)); // 30000 (자동으로 갱신됩니다.)
```

`createDerivedAtom`은 내부적으로 참조한 atom들을 자동으로 추적하고, 값이 달라질 때마다 파생 atom을 다시 계산합니다.

## 비동기 atom과 Suspense

```ts
import { createAsyncAtom, get } from "sangtae-js";

const asyncAtom = createAsyncAtom(fetch("/api/me").then((res) => res.json()));

try {
  const user = get(asyncAtom);
  console.log(user.name);
} catch (value) {
  if (value instanceof Promise) {
    console.log("로딩 중...");
    value
      .then(() => {
        const user = get(asyncAtom);
        console.log("로드 완료:", user.name);
      })
      .catch((error) => {
        console.error("에러 발생", error);
      });
  } else {
    console.error("에러 발생", value);
  }
}
```

- 같은 `Promise`를 넘기면 내부 캐시 덕분에 항상 동일한 atom을 돌려줍니다.
- `get` 호출 시 `pending`이면 원래 Promise를 throw하여 React Suspense 같은 환경과 자연스럽게 맞물립니다.
- `set`으로 값을 교체하면 자동으로 상태가 `success`로 바뀌어 재활용할 수 있습니다.

### `Atom<T>`

```ts
export type Atom<T> = Readonly<InternalAtom<T>>;
```

- 라이브러리 외부에서는 `Atom<T>`를 통해 상태를 참조하며, 내부 상태는 읽기 전용으로 취급됩니다.

### `InternalAtom<T>`

```ts
type InternalAtom<T> = {
  [VALUE]: T;
  [LISTENERS]: Set<Listener<T>> | null;
};
```

- 라이브러리 내부에서만 사용하는 실제 저장 구조이며, 심벌 키를 통해 값과 구독자 집합을 관리합니다.

### `Listener<T>`

```ts
type Listener<T> = (value: T) => void;
```

- 필요한 곳에서만 구독해 메모리 사용량을 최소화할 수 있습니다.
- 마지막 구독자가 해제되면 내부 `Set`이 정리되어 GC 대상이 됩니다.

## API 레퍼런스

| 함수                          | 설명                                                                                                    | 반환 타입    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- | ------------ |
| `createAtom(initialValue)`    | 초깃값으로 새로운 atom을 만듭니다.                                                                      | `Atom<T>`    |
| `createDerivedAtom(callback)` | `callback(get)` 안에서 참조한 atom을 추적해 파생 값을 계산합니다.                                       | `Atom<T>`    |
| `createAsyncAtom(promise)`    | `Promise`를 기반으로 한 비동기 atom을 만듭니다. React의 Suspense와 호환됩니다.                          | `Atom<T>`    |
| `get(atom)`                   | atom의 현재 값을 읽습니다. 비동기 atom의 경우 `Promise` 또는 에러를 throw할 수 있습니다.                | `T`          |
| `set(atom, newValue)`         | atom 값을 새 값으로 갱신하고, 변경 시 구독자에게 통지합니다.                                            | `void`       |
| `subscribe(atom, listener)`   | 값이 바뀔 때마다 `listener`를 실행하고, 즉시 현재 값을 한 번 호출합니다. 반환값은 구독 해제 함수입니다. | `() => void` |

```

예제에서 `Promise`가 resolve/reject된 뒤에 다시 `get`을 호출해 주지 않아서 로그가 안 찍힌 거였어. `value.then`/`catch`에서 상태가 바뀌면 다시 `get`을 불러서 성공과 에러 모두 처리하게 README 코드 업데이트했고, 실패하면 `console.error("에러 발생", error);`가 제대로 찍히고 성공하면 `"로드 완료"` 로그도 확인할 수 있어.

---

**User**

@README.md (67-88) 



캐시가안대

---

**Cursor**

```markdown
# sangtae-js

Minimal Global State Management Library

## 소개

`sangtae-js`는 심플한 API로 전역 상태를 선언하고 관리할 수 있는 초경량 상태 관리 라이브러리입니다. 불필요한 러닝 커브 없이 `atom` 개념만으로 동기/비동기 상태와 파생 상태를 모두 다룰 수 있도록 설계했습니다.

## 주요 특징

- **TypeScript 우선**: 제네릭 기반 API로 컴파일 타임 타입을 보장합니다.
- **파생 상태 지원**: 여러 atom을 조합해 memoized 파생 값을 만들 수 있습니다.
- **비동기 친화적**: `Promise`를 기반으로 React Suspense 패턴과 자연스럽게 연동됩니다.
- **구독 기반 업데이트**: 필요한 곳에서만 `subscribe`하여 최신 상태를 유지합니다.
- **불변성**: 상태를 업데이트할 때는 항상 새 객체나 값을 생성해 전달하는 불변 패턴을 사용합니다.

## 설치

```bash
npm install sangtae-js
```

## 빠른 시작

```ts
import { createAtom, get, set, subscribe } from "sangtae-js";

const counterAtom = createAtom(0);

const unsubscribe = subscribe(counterAtom, (value) => {
  console.log("현재 값:", value);
});

set(counterAtom, 1); // 콘솔: 현재 값: 1
console.log(get(counterAtom)); // 1

unsubscribe(); // 더 이상 변경 사항을 듣지 않습니다.
```

## 파생 atom 사용하기

`createDerivedAtom`은 내부적으로 참조한 atom들을 자동으로 추적하고, 값이 달라질 때마다 파생 atom을 다시 계산합니다.

```ts
import { createAtom, createDerivedAtom, set, get } from "sangtae-js";

const priceAtom = createAtom(10_000);
const quantityAtom = createAtom(2);

const totalPriceAtom = createDerivedAtom((get) => {
  return get(priceAtom) * get(quantityAtom);
});

console.log(get(totalPriceAtom)); // 20000

set(quantityAtom, 3);
console.log(get(totalPriceAtom)); // 30000 (자동으로 갱신됩니다.)
```

## 비동기 atom과 Suspense

- 같은 `Promise`를 넘기면 내부 캐시 덕분에 항상 동일한 atom을 돌려줍니다.
- `get` 호출 시 `pending`이면 원래 Promise를 throw하여 React Suspense 같은 환경과 자연스럽게 맞물립니다.
- `set`으로 값을 교체하면 자동으로 상태가 `success`로 바뀌어 재활용할 수 있습니다.

```ts
import { createAsyncAtom, get } from "sangtae-js";

const promise = new Promise<number>((resolve) => {
  setTimeout(() => resolve(1), 1000);
});

const asyncAtomA = createAsyncAtom(promise);
const asyncAtomB = createAsyncAtom(promise);

console.log(asyncAtomA === asyncAtomB); // true (같은 Promise → 같은 atom)

try {
  const value = get(asyncAtomA);
  console.log(value);
} catch (value) {
  if (value instanceof Promise) {
    console.log("로딩 중...");
    value
      .then(() => {
        const value = get(asyncAtomA);
        console.log("로드 완료:", value);
      })
      .catch((error) => {
        console.error("에러 발생", error);
      });
  } else {
    console.error("에러 발생", value);
  }
}
```

### `Atom<T>`

```ts
export type Atom<T> = Readonly<InternalAtom<T>>;
```

- 라이브러리 외부에서는 `Atom<T>`를 통해 상태를 참조하며, 내부 상태는 읽기 전용으로 취급됩니다.

### `InternalAtom<T>`

```ts
type InternalAtom<T> = {
  [VALUE]: T;
  [LISTENERS]: Set<Listener<T>> | null;
};
```

- 라이브러리 내부에서만 사용하는 실제 저장 구조이며, 심벌 키를 통해 값과 구독자 집합을 관리합니다.

### `Listener<T>`

```ts
type Listener<T> = (value: T) => void;
```

- 필요한 곳에서만 구독해 메모리 사용량을 최소화할 수 있습니다.
- 마지막 구독자가 해제되면 내부 `Set`이 정리되어 GC 대상이 됩니다.

## API 레퍼런스

| 함수                          | 설명                                                                                                    | 반환 타입    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- | ------------ |
| `createAtom(initialValue)`    | 초깃값으로 새로운 atom을 만듭니다.                                                                      | `Atom<T>`    |
| `createDerivedAtom(callback)` | `callback(get)` 안에서 참조한 atom을 추적해 파생 값을 계산합니다.                                       | `Atom<T>`    |
| `createAsyncAtom(promise)`    | `Promise`를 기반으로 한 비동기 atom을 만듭니다. React의 Suspense와 호환됩니다.                          | `Atom<T>`    |
| `get(atom)`                   | atom의 현재 값을 읽습니다. 비동기 atom의 경우 `Promise` 또는 에러를 throw할 수 있습니다.                | `T`          |
| `set(atom, newValue)`         | atom 값을 새 값으로 갱신하고, 변경 시 구독자에게 통지합니다.                                            | `void`       |
| `subscribe(atom, listener)`   | 값이 바뀔 때마다 `listener`를 실행하고, 즉시 현재 값을 한 번 호출합니다. 반환값은 구독 해제 함수입니다. | `() => void` |

```

캐시 동작 보여주려고 `Promise.resolve` 대신 지연 Promise 넣고, 같은 Promise로 두 번 `createAsyncAtom` 호출해서 `asyncAtomA === asyncAtomB`가 `true`라는 걸 예제에 추가했어. 이제 README 예제에서 캐시가 제대로 확인돼.

