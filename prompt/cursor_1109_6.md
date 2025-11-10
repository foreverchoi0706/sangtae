# 작성할 README.md 파일 요청
_Exported on 2025. 11. 9. at 19시 18분 53초 GMT+9 from Cursor (2.0.69)_

---

**User**

@@sangtae-js 안의 @README.md 파일을 작성해줘.

Github-flavored Markdown Format 으로 작성해주고

실제 실용 레벨의 라이브러리에서 작성된 것처럼 이해하기 쉽고 직관적이여야해

---

**Cursor**

```markdown
# sangtae-js

Minimal Global State Management Library

## 소개

`sangtae-js`는 심플한 API로 전역 상태를 선언하고 관리할 수 있는 초경량 상태 관리 라이브러리야. 불필요한 러닝 커브 없이 `atom` 개념만으로 동기/비동기 상태, 파생 상태를 모두 다룰 수 있게 설계했어.

## 주요 특징

- **TypeScript 우선**: 제네릭 기반 API로 컴파일 타임 타입 보장.
- **파생 상태 지원**: 여러 atom을 조합해서 memoized 파생 값을 만들 수 있어.
- **비동기 친화적**: `Promise`를 기반으로 Suspense 패턴과 자연스럽게 연동돼.
- **구독 기반 업데이트**: 필요한 곳에서만 `subscribe`하여 최소한의 리렌더로 최신 상태 유지.

## 설치

```bash
npm install sangtae-js
# 또는
yarn add sangtae-js
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

unsubscribe(); // 더 이상 변경 사항을 듣지 않아
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
console.log(get(totalPriceAtom)); // 30000 (자동으로 갱신돼)
```

`createDerivedAtom`은 내부적으로 참조한 atom들을 자동으로 추적하고, 값이 달라질 때마다 파생 atom을 다시 계산해.

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

- 같은 `Promise`를 넘기면 내부 캐시 덕분에 항상 동일한 atom을 돌려줘.
- `get` 호출 시 `pending`이면 원래 Promise를 throw해서 React Suspense 같은 환경과 자연스럽게 맞물려.
- `set`으로 값을 교체하면 자동으로 상태가 `success`로 바뀌어 재활용 가능해.

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

| 함수 | 설명 |
| --- | --- |
| `createAtom(initialValue)` | 초깃값으로 새로운 atom을 만든다. |
| `createDerivedAtom(callback)` | `callback(get)` 안에서 참조한 atom을 추적해 파생 값을 계산한다. |
| `createAsyncAtom(promise)` | `Promise`를 기반으로 한 비동기 atom을 만든다. Suspense와 호환된다. |
| `get(atom)` | atom의 현재 값을 읽는다. 비동기 atom의 경우 `Promise` 또는 에러를 throw할 수 있다. |
| `set(atom, newValue)` | atom 값을 새 값으로 갱신하고, 변경 시 구독자에게 통지한다. |
| `subscribe(atom, listener)` | 값이 바뀔 때마다 `listener`를 실행하고, 즉시 현재 값을 한 번 호출한다. 반환값은 구독 해제 함수다. |

### `Listener<T>`

```ts
type Listener<T> = (value: T) => void;
```

- 필요한 곳에서만 구독해 메모리 사용량을 최소화할 수 있어.
- 마지막 구독자가 해제되면 내부 `Set`이 정리되어 GC 대상이 돼.

## 개발 스크립트

- `npm run build`: 타입 검사 및 테스트 실행 후 `tsup`으로 번들 생성.
- `npm run build-watch`: 개발 중 번들링을 실시간으로 확인.
- `npm run test`: Vitest 워치 모드 실행.
- `npm run test:run`: CI 등을 위한 Vitest 단발 실행.

## 라이선스

ISC 라이선스를 따르고 있어. 자유롭게 사용하고 개선 아이디어가 있다면 Issue나 PR로 공유해줘!
```

- `@sangtae-js/README.md`에 라이브러리 개요, 특징, 설치/빠른 시작, 파생·비동기 atom 예제, React 연동 패턴, API 표, 스크립트 안내까지 풀로 정리해줬어.  
- 실제 사용 흐름이 바로 보이도록 코드 샘플은 모두 TypeScript/React 기준으로 넣어놨으니 바로 참고하면 돼.

다음으로는 `npm run build`나 `npm run test` 한 번 돌려보면 문서에 적은 스크립트들이 문제 없이 도는지 확인할 수 있어.

---

**User**

존댓말로 해줄래?

---

**Cursor**

네, 앞으로 존댓말로 답변드리겠습니다.

---

**User**

@README.md  내용을 존댓말로 바꿔줘

---

**Cursor**

```markdown
# sangtae-js

Minimal Global State Management Library

## 소개

`sangtae-js`는 심플한 API로 전역 상태를 선언하고 관리할 수 있는 초경량 상태 관리 라이브러리야. 불필요한 러닝 커브 없이 `atom` 개념만으로 동기/비동기 상태, 파생 상태를 모두 다룰 수 있게 설계했어.

## 주요 특징

- **TypeScript 우선**: 제네릭 기반 API로 컴파일 타임 타입 보장.
- **파생 상태 지원**: 여러 atom을 조합해서 memoized 파생 값을 만들 수 있어.
- **비동기 친화적**: `Promise`를 기반으로 Suspense 패턴과 자연스럽게 연동돼.
- **구독 기반 업데이트**: 필요한 곳에서만 `subscribe`하여 최소한의 리렌더로 최신 상태 유지.

## 설치

```bash
npm install sangtae-js
# 또는
yarn add sangtae-js
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

unsubscribe(); // 더 이상 변경 사항을 듣지 않아
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
console.log(get(totalPriceAtom)); // 30000 (자동으로 갱신돼)
```

`createDerivedAtom`은 내부적으로 참조한 atom들을 자동으로 추적하고, 값이 달라질 때마다 파생 atom을 다시 계산해.

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

- 같은 `Promise`를 넘기면 내부 캐시 덕분에 항상 동일한 atom을 돌려줘.
- `get` 호출 시 `pending`이면 원래 Promise를 throw해서 React Suspense 같은 환경과 자연스럽게 맞물려.
- `set`으로 값을 교체하면 자동으로 상태가 `success`로 바뀌어 재활용 가능해.

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

| 함수                          | 설명                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `createAtom(initialValue)`    | 초깃값으로 새로운 atom을 만든다.                                                                  |
| `createDerivedAtom(callback)` | `callback(get)` 안에서 참조한 atom을 추적해 파생 값을 계산한다.                                   |
| `createAsyncAtom(promise)`    | `Promise`를 기반으로 한 비동기 atom을 만든다. Suspense와 호환된다.                                |
| `get(atom)`                   | atom의 현재 값을 읽는다. 비동기 atom의 경우 `Promise` 또는 에러를 throw할 수 있다.                |
| `set(atom, newValue)`         | atom 값을 새 값으로 갱신하고, 변경 시 구독자에게 통지한다.                                        |
| `subscribe(atom, listener)`   | 값이 바뀔 때마다 `listener`를 실행하고, 즉시 현재 값을 한 번 호출한다. 반환값은 구독 해제 함수다. |

### `Listener<T>`

```ts
type Listener<T> = (value: T) => void;
```

- 필요한 곳에서만 구독해 메모리 사용량을 최소화할 수 있어.
- 마지막 구독자가 해제되면 내부 `Set`이 정리되어 GC 대상이 돼.

## 개발 스크립트

- `npm run build`: 타입 검사 및 테스트 실행 후 `tsup`으로 번들 생성.
- `npm run build-watch`: 개발 중 번들링을 실시간으로 확인.
- `npm run test`: Vitest 워치 모드 실행.
- `npm run test:run`: CI 등을 위한 Vitest 단발 실행.

## 라이선스

ISC 라이선스를 따르고 있어. 자유롭게 사용하고 개선 아이디어가 있다면 Issue나 PR로 공유해줘!

```

```markdown
*** Begin Patch
*** Update File: @sangtae-js/README.md
@@
-`sangtae-js`는 심플한 API로 전역 상태를 선언하고 관리할 수 있는 초경량 상태 관리 라이브러리야. 불필요한 러닝 커브 없이 `atom` 개념만으로 동기/비동기 상태, 파생 상태를 모두 다룰 수 있게 설계했어.
+`sangtae-js`는 심플한 API로 전역 상태를 선언하고 관리할 수 있는 초경량 상태 관리 라이브러리입니다. 불필요한 러닝 커브 없이 `atom` 개념만으로 동기/비동기 상태와 파생 상태를 모두 다룰 수 있도록 설계했습니다.
@@
-- **TypeScript 우선**: 제네릭 기반 API로 컴파일 타임 타입 보장.
-- **파생 상태 지원**: 여러 atom을 조합해서 memoized 파생 값을 만들 수 있어.
-- **비동기 친화적**: `Promise`를 기반으로 Suspense 패턴과 자연스럽게 연동돼.
-- **구독 기반 업데이트**: 필요한 곳에서만 `subscribe`하여 최소한의 리렌더로 최신 상태 유지.
+- **TypeScript 우선**: 제네릭 기반 API로 컴파일 타임 타입을 보장합니다.
+- **파생 상태 지원**: 여러 atom을 조합해 memoized 파생 값을 만들 수 있습니다.
+- **비동기 친화적**: `Promise`를 기반으로 Suspense 패턴과 자연스럽게 연동됩니다.
+- **구독 기반 업데이트**: 필요한 곳에서만 `subscribe`하여 최소한의 리렌더로 최신 상태를 유지합니다.
@@
-Set(counterAtom, 1); // 콘솔: 현재 값: 1
-Console.log(get(counterAtom)); // 1
-
-Unsubscribe(); // 더 이상 변경 사항을 듣지 않아
+set(counterAtom, 1); // 콘솔: 현재 값: 1
+console.log(get(counterAtom)); // 1
+
+unsubscribe(); // 더 이상 변경 사항을 듣지 않습니다.
@@
-Console.log(get(totalPriceAtom)); // 20000
-
-Set(quantityAtom, 3);
-Console.log(get(totalPriceAtom)); // 30000 (자동으로 갱신돼)
+console.log(get(totalPriceAtom)); // 20000
+
+set(quantityAtom, 3);
+console.log(get(totalPriceAtom)); // 30000 (자동으로 갱신됩니다.)
@@
-`createDerivedAtom`은 내부적으로 참조한 atom들을 자동으로 추적하고, 값이 달라질 때마다 파생 atom을 다시 계산해.
+`createDerivedAtom`은 내부적으로 참조한 atom들을 자동으로 추적하고, 값이 달라질 때마다 파생 atom을 다시 계산합니다.
@@
-- 같은 `Promise`를 넘기면 내부 캐시 덕분에 항상 동일한 atom을 돌려줘.
-- `get` 호출 시 `pending`이면 원래 Promise를 throw해서 React Suspense 같은 환경과 자연스럽게 맞물려.
-- `set`으로 값을 교체하면 자동으로 상태가 `success`로 바뀌어 재활용 가능해.
+- 같은 `Promise`를 넘기면 내부 캐시 덕분에 항상 동일한 atom을 돌려줍니다.
+- `get` 호출 시 `pending`이면 원래 Promise를 throw하여 React Suspense 같은 환경과 자연스럽게 맞물립니다.
+- `set`으로 값을 교체하면 자동으로 상태가 `success`로 바뀌어 재활용할 수 있습니다.
@@
-Function Counter() {
-  const count = useAtom(counterAtom);
-
-  Return (
-    <button onClick={() => set(counterAtom, count + 1)}>
-      클릭 횟수: {count}
-    </button>
-  );
-}
+function Counter() {
+  const count = useAtom(counterAtom);
+
+  return (
+    <button onClick={() => set(counterAtom, count + 1)}>
+      클릭 횟수: {count}
+    </button>
+  );
+}
@@
-- 필요한 곳에서만 구독해 메모리 사용량을 최소화할 수 있어.
-- 마지막 구독자가 해제되면 내부 `Set`이 정리되어 GC 대상이 돼.
+- 필요한 곳에서만 구독해 메모리 사용량을 최소화할 수 있습니다.
+- 마지막 구독자가 해제되면 내부 `Set`이 정리되어 GC 대상이 됩니다.
@@
-- `npm run build`: 타입 검사 및 테스트 실행 후 `tsup`으로 번들 생성.
-- `npm run build-watch`: 개발 중 번들링을 실시간으로 확인.
-- `npm run test`: Vitest 워치 모드 실행.
-- `npm run test:run`: CI 등을 위한 Vitest 단발 실행.
+- `npm run build`: 타입 검사 및 테스트 실행 후 `tsup`으로 번들을 생성합니다.
+- `npm run build-watch`: 개발 중 번들링을 실시간으로 확인합니다.
+- `npm run test`: Vitest 워치 모드를 실행합니다.
+- `npm run test:run`: CI 등을 위한 Vitest 단발 실행을 수행합니다.
@@
-ISC 라이선스를 따르고 있어. 자유롭게 사용하고 개선 아이디어가 있다면 Issue나 PR로 공유해줘!
+ISC 라이선스를 따르고 있습니다. 자유롭게 사용하시고 개선 아이디어가 있다면 Issue나 PR로 공유해 주세요!
*** End Patch
```

```markdown
# sangtae-js

Minimal Global State Management Library

## 소개

`sangtae-js`는 심플한 API로 전역 상태를 선언하고 관리할 수 있는 초경량 상태 관리 라이브러리입니다. 불필요한 러닝 커브 없이 `atom` 개념만으로 동기/비동기 상태와 파생 상태를 모두 다룰 수 있도록 설계했습니다.

## 주요 특징

- **TypeScript 우선**: 제네릭 기반 API로 컴파일 타임 타입을 보장합니다.
- **파생 상태 지원**: 여러 atom을 조합해 memoized 파생 값을 만들 수 있습니다.
- **비동기 친화적**: `Promise`를 기반으로 Suspense 패턴과 자연스럽게 연동됩니다.
- **구독 기반 업데이트**: 필요한 곳에서만 `subscribe`하여 최소한의 리렌더로 최신 상태를 유지합니다.

## 설치

```bash
npm install sangtae-js
# 또는
yarn add sangtae-js
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

| 함수                          | 설명                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `createAtom(initialValue)`    | 초깃값으로 새로운 atom을 만든다.                                                                  |
| `createDerivedAtom(callback)` | `callback(get)` 안에서 참조한 atom을 추적해 파생 값을 계산한다.                                   |
| `createAsyncAtom(promise)`    | `Promise`를 기반으로 한 비동기 atom을 만든다. Suspense와 호환된다.                                |
| `get(atom)`                   | atom의 현재 값을 읽는다. 비동기 atom의 경우 `Promise` 또는 에러를 throw할 수 있다.                |
| `set(atom, newValue)`         | atom 값을 새 값으로 갱신하고, 변경 시 구독자에게 통지한다.                                        |
| `subscribe(atom, listener)`   | 값이 바뀔 때마다 `listener`를 실행하고, 즉시 현재 값을 한 번 호출한다. 반환값은 구독 해제 함수다. |

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

## 라이선스

ISC 라이선스를 따르고 있습니다. 자유롭게 사용하시고 개선 아이디어가 있다면 Issue나 PR로 공유해 주세요!

```

```markdown
# sangtae-js

Minimal Global State Management Library

## 소개

`sangtae-js`는 심플한 API로 전역 상태를 선언하고 관리할 수 있는 초경량 상태 관리 라이브러리입니다. 불필요한 러닝 커브 없이 `atom` 개념만으로 동기/비동기 상태와 파생 상태를 모두 다룰 수 있도록 설계했습니다.

## 주요 특징

- **TypeScript 우선**: 제네릭 기반 API로 컴파일 타임 타입을 보장합니다.
- **파생 상태 지원**: 여러 atom을 조합해 memoized 파생 값을 만들 수 있습니다.
- **비동기 친화적**: `Promise`를 기반으로 Suspense 패턴과 자연스럽게 연동됩니다.
- **구독 기반 업데이트**: 필요한 곳에서만 `subscribe`하여 최소한의 리렌더로 최신 상태를 유지합니다.

## 설치

```bash
npm install sangtae-js
# 또는
yarn add sangtae-js
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

| 함수                          | 설명                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `createAtom(initialValue)`    | 초깃값으로 새로운 atom을 만듭니다.                                                                  |
| `createDerivedAtom(callback)` | `callback(get)` 안에서 참조한 atom을 추적해 파생 값을 계산합니다.                                   |
| `createAsyncAtom(promise)`    | `Promise`를 기반으로 한 비동기 atom을 만듭니다. Suspense와 호환됩니다.                                |
| `get(atom)`                   | atom의 현재 값을 읽습니다. 비동기 atom의 경우 `Promise` 또는 에러를 throw할 수 있습니다.                |
| `set(atom, newValue)`         | atom 값을 새 값으로 갱신하고, 변경 시 구독자에게 통지합니다.                                        |
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

## 라이선스

ISC 라이선스를 따르고 있습니다. 자유롭게 사용하시고 개선 아이디어가 있다면 Issue나 PR로 공유해 주세요!

```

README 전체 문장을 존댓말로 다듬어 두었습니다. 다른 곳도 같은 톤으로 바꿔야 하면 말씀만 주세요!

