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
