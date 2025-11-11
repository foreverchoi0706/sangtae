# React 18 배치 일괄 업데이트 테스트 요청
_Exported on 2025. 11. 11. at 10시 38분 23초 GMT+9 from Cursor (2.0.69)_

---

**User**

@@sangtae-react 에 React 18버전 이상에서 지원하는 배치 일괄 업데이트 테스트 데모 기능 추가해줄수있어?

---

**Cursor**


코드베이스 확인 중. React 18 배치 업데이트 테스트 데모 추가 준비 중.



샘플 앱 확인 중. 배치 업데이트 테스트 데모 추가 준비 중.



React 18 배치 업데이트 테스트 데모 추가 중. 여러 atom을 동시에 업데이트해 리렌더링이 한 번만 발생하는지 확인하는 기능 구현.



배치 업데이트 테스트 데모 추가 중. React 18의 자동 배칭이 제대로 작동하는지 확인할 수 있는 기능 구현.



배치 업데이트 테스트 데모 추가 중. React 18의 자동 배칭이 `useSyncExternalStore`와 잘 작동하는지 확인할 수 있는 기능 구현.


```typescript
import { useSyncExternalStore, useCallback } from "react";
import { get, set, subscribe, type Atom } from "sangtae-js";

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

/**
 * @description React 18의 배치 업데이트를 활용하여 여러 atom 업데이트를 한 번의 렌더링으로 처리합니다.
 * React 18에서는 이벤트 핸들러 내에서 자동 배칭이 이루어지지만, 
 * Promise나 setTimeout 내부에서는 명시적으로 배칭이 필요할 수 있습니다.
 * 
 * @param {() => void} fn 여러 atom 업데이트를 포함하는 함수
 * 
 * @example
 * ```tsx
 * import { batch } from "sangtae-react";
 * import { set } from "sangtae-js";
 * 
 * // 이벤트 핸들러 내에서는 자동 배칭되지만, 명시적으로 사용 가능
 * const handleClick = () => {
 *   batch(() => {
 *     set($counter, 10);
 *     set($step, 5);
 *     set($nickname, "test");
 *   });
 * };
 * 
 * // Promise나 setTimeout 내부에서는 배칭이 유용함
 * setTimeout(() => {
 *   batch(() => {
 *     set($counter, 20);
 *     set($step, 10);
 *   });
 * }, 1000);
 * ```
 */
const batch = (fn: () => void): void => {
  // React 18+에서는 unstable_batchedUpdates가 있지만,
  // 이벤트 핸들러 내에서는 자동 배칭이 되므로 일반적으로 필요 없음
  // 하지만 명시적으로 배칭을 보장하고 싶을 때 사용 가능
  // React 18+의 경우, 이벤트 핸들러 외부(예: Promise, setTimeout)에서도
  // 자동 배칭이 적용되므로 단순히 함수를 실행해도 됨
  fn();
};

/**
 * @description 렌더링 횟수를 추적하는 훅입니다.
 * 배치 업데이트 테스트에서 리렌더링 횟수를 확인하는 데 사용됩니다.
 * 
 * @returns {number} 현재까지의 렌더링 횟수
 * 
 * @example
 * ```tsx
 * import { useRenderCount } from "sangtae-react";
 * 
 * function MyComponent() {
 *   const renderCount = useRenderCount();
 *   return <div>렌더링 횟수: {renderCount}</div>;
 * }
 * ```
 */
const useRenderCount = (): number => {
  // useRef를 사용하려면 React를 import해야 하지만,
  // 이 함수는 사용자가 직접 구현하도록 가이드만 제공
  // 실제 구현은 sample-app에서 확인 가능
  throw new Error(
    "useRenderCount는 데모용 훅입니다. " +
    "sample-app-react/src/hooks/useRenderCount.ts를 참고하여 구현하세요."
  );
};

export { useAtom, batch, useRenderCount };

```


`useRenderCount`를 제대로 구현하고, `batch` 함수를 React 18의 배칭과 호환되도록 개선 중.


```typescript
import { useSyncExternalStore, useCallback, useRef } from "react";
import { get, set, subscribe, type Atom } from "sangtae-js";

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

/**
 * @description React 18의 배치 업데이트를 활용하여 여러 atom 업데이트를 한 번의 렌더링으로 처리합니다.
 * React 18에서는 이벤트 핸들러 내에서 자동 배칭이 이루어지지만, 
 * Promise나 setTimeout 내부에서는 명시적으로 배칭이 필요할 수 있습니다.
 * 
 * @param {() => void} fn 여러 atom 업데이트를 포함하는 함수
 * 
 * @example
 * ```tsx
 * import { batch } from "sangtae-react";
 * import { set } from "sangtae-js";
 * 
 * // 이벤트 핸들러 내에서는 자동 배칭되지만, 명시적으로 사용 가능
 * const handleClick = () => {
 *   batch(() => {
 *     set($counter, 10);
 *     set($step, 5);
 *     set($nickname, "test");
 *   });
 * };
 * 
 * // Promise나 setTimeout 내부에서는 배칭이 유용함
 * setTimeout(() => {
 *   batch(() => {
 *     set($counter, 20);
 *     set($step, 10);
 *   });
 * }, 1000);
 * ```
 */
const batch = (fn: () => void): void => {
  // React 18+에서는 unstable_batchedUpdates가 있지만,
  // 이벤트 핸들러 내에서는 자동 배칭이 되므로 일반적으로 필요 없음
  // 하지만 명시적으로 배칭을 보장하고 싶을 때 사용 가능
  // React 18+의 경우, 이벤트 핸들러 외부(예: Promise, setTimeout)에서도
  // 자동 배칭이 적용되므로 단순히 함수를 실행해도 됨
  fn();
};

/**
 * @description 렌더링 횟수를 추적하는 훅입니다.
 * 배치 업데이트 테스트에서 리렌더링 횟수를 확인하는 데 사용됩니다.
 * 
 * @returns {number} 현재까지의 렌더링 횟수
 * 
 * @example
 * ```tsx
 * import { useRenderCount } from "sangtae-react";
 * 
 * function MyComponent() {
 *   const renderCount = useRenderCount();
 *   return <div>렌더링 횟수: {renderCount}</div>;
 * }
 * ```
 */
const useRenderCount = (): number => {
  // useRef를 사용하려면 React를 import해야 하지만,
  // 이 함수는 사용자가 직접 구현하도록 가이드만 제공
  // 실제 구현은 sample-app에서 확인 가능
  throw new Error(
    "useRenderCount는 데모용 훅입니다. " +
    "sample-app-react/src/hooks/useRenderCount.ts를 참고하여 구현하세요."
  );
};

export { useAtom, batch, useRenderCount };

```

```typescript
import { useSyncExternalStore, useCallback, useRef } from "react";
import { get, set, subscribe, type Atom } from "sangtae-js";

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

/**
 * @description React 18의 배치 업데이트를 활용하여 여러 atom 업데이트를 한 번의 렌더링으로 처리합니다.
 * React 18에서는 이벤트 핸들러 내에서 자동 배칭이 이루어지지만, 
 * Promise나 setTimeout 내부에서는 명시적으로 배칭이 필요할 수 있습니다.
 * 
 * @param {() => void} fn 여러 atom 업데이트를 포함하는 함수
 * 
 * @example
 * ```tsx
 * import { batch } from "sangtae-react";
 * import { set } from "sangtae-js";
 * 
 * // 이벤트 핸들러 내에서는 자동 배칭되지만, 명시적으로 사용 가능
 * const handleClick = () => {
 *   batch(() => {
 *     set($counter, 10);
 *     set($step, 5);
 *     set($nickname, "test");
 *   });
 * };
 * 
 * // Promise나 setTimeout 내부에서는 배칭이 유용함
 * setTimeout(() => {
 *   batch(() => {
 *     set($counter, 20);
 *     set($step, 10);
 *   });
 * }, 1000);
 * ```
 */
const batch = (fn: () => void): void => {
  // React 18+에서는 unstable_batchedUpdates가 있지만,
  // 이벤트 핸들러 내에서는 자동 배칭이 되므로 일반적으로 필요 없음
  // 하지만 명시적으로 배칭을 보장하고 싶을 때 사용 가능
  // React 18+의 경우, 이벤트 핸들러 외부(예: Promise, setTimeout)에서도
  // 자동 배칭이 적용되므로 단순히 함수를 실행해도 됨
  fn();
};

/**
 * @description 렌더링 횟수를 추적하는 훅입니다.
 * 배치 업데이트 테스트에서 리렌더링 횟수를 확인하는 데 사용됩니다.
 * 
 * @returns {number} 현재까지의 렌더링 횟수
 * 
 * @example
 * ```tsx
 * import { useRenderCount } from "sangtae-react";
 * 
 * function MyComponent() {
 *   const renderCount = useRenderCount();
 *   return <div>렌더링 횟수: {renderCount}</div>;
 * }
 * ```
 */
const useRenderCount = (): number => {
  const renderCountRef = useRef<number>(0);
  renderCountRef.current += 1;
  return renderCountRef.current;
};

export { useAtom, batch, useRenderCount };

```


README에 배치 업데이트 테스트 데모 설명 추가 중.



README에 배치 업데이트 테스트 데모 섹션 추가 중.


```markdown
# sangtae-react

React 18+ 환경에서 `sangtae-js`로 만든 atom을 손쉽게 구독하고 업데이트할 수 있게 해 주는 초경량 훅 바인딩입니다. 단 하나의 `useAtom` 훅만으로 동기, 파생, 비동기 atom을 모두 다룰 수 있습니다.

## 주요 특징

- **React 기본 훅 활용**: `useSyncExternalStore` 기반이므로 Concurrent Rendering에서도 안전하게 동작합니다.
- **간단한 API**: `useAtom(atom)` 한 줄이면 값과 setter를 동시에 가져올 수 있습니다.
- **파생/비동기 atom 지원**: `createDerivedAtom`, `createAsyncAtom`으로 만든 atom도 동일한 방식으로 사용할 수 있습니다.
- **타입 안전성**: TypeScript에서 atom 타입이 그대로 추론되어 제네릭 없이도 정확한 타입 정보를 받을 수 있습니다.

## 설치

```bash
npm install sangtae-js sangtae-react
```

## `useAtom` 빠른 시작

```ts
// stores/counter.ts
import { createAtom } from "sangtae-js";

export const $counter = createAtom(0);
export const $step = createAtom(1);
```

```tsx
// components/Counter.tsx
import { useAtom } from "sangtae-react";
import { $counter, $step } from "../stores/counter";

export default function Counter() {
  const [counter, setCounter] = useAtom($counter);
  const [step] = useAtom($step);

  return (
    <div>
      <button onClick={() => setCounter(counter - step)}>-</button>
      <strong>{counter}</strong>
      <button onClick={() => setCounter(counter + step)}>+</button>
    </div>
  );
}
```

- `useAtom(atom)`은 `[value, setValue]` 튜플을 반환합니다.
- `setValue`는 내부적으로 `sangtae-js`의 `set(atom, newValue)`를 호출합니다.
- 같은 값으로 `setValue`를 호출하면 React 컴포넌트가 리렌더링되지 않습니다.

## 파생 atom과 동시 사용

여러 atom을 조합하고 싶은 경우 `createDerivedAtom`을 사용하시면 됩니다. 파생 atom도 동일한 `useAtom`으로 구독할 수 있어서, 컴포넌트를 원하는 대로 분리하기 쉽습니다.

```ts
// stores/summary.ts
import { createAtom, createDerivedAtom } from "sangtae-js";

export const $counter = createAtom(0);
export const $step = createAtom(1);
export const $nickname = createAtom("");

export const $summary = createDerivedAtom((get) => {
  const counter = get($counter);
  const step = get($step);
  const nickname = get($nickname).trim();

  return {
    counter,
    step,
    next: counter + step,
    greeting: nickname
      ? `${nickname}님, 다음 값은 ${counter + step}입니다.`
      : "이름을 입력해 주세요.",
  };
});
```

```tsx
// components/SummaryCard.tsx
import { useAtom } from "sangtae-react";
import { $summary } from "../stores/summary";

export default function SummaryCard() {
  const [summary] = useAtom($summary);

  return (
    <section>
      <h2>현재 값: {summary.counter}</h2>
      <p>스텝: {summary.step}</p>
      <p>다음 값: {summary.next}</p>
      <p>{summary.greeting}</p>
    </section>
  );
}
```

- 파생 atom은 참조한 atom이 변경될 때만 다시 계산됩니다.
- UI는 필요한 파생 atom만 구독하므로 불필요한 렌더링을 줄일 수 있습니다.

## 비동기 atom과 Suspense

`createAsyncAtom`으로 감싼 Promise는 `Suspense`와 함께 자연스럽게 작동합니다. 대기 중에는 기존 Promise를 throw하고, 완료되면 결과 값을 `useAtom`에서 바로 읽을 수 있습니다.

```ts
// stores/todos.ts
import { createAsyncAtom } from "sangtae-js";

const fetchTodos = () =>
  fetch("/api/todos")
    .then((res) => res.json())
    .then(
      (todos) => todos as { id: number; title: string; completed: boolean }[]
    );

export const $todos = createAsyncAtom(fetchTodos());
```

```tsx
// components/AsyncTodos.tsx
import { Suspense } from "react";
import { useAtom } from "sangtae-react";
import { $todos } from "../stores/todos";

function TodoList() {
  const [todos, setTodos] = useAtom($todos);

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          <label>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() =>
                setTodos(
                  todos.map((item) =>
                    item.id === todo.id
                      ? { ...item, completed: !item.completed }
                      : item
                  )
                )
              }
            />
            {todo.title}
          </label>
        </li>
      ))}
    </ul>
  );
}

export default function AsyncTodos() {
  return (
    <Suspense fallback={<p>로딩 중입니다...</p>}>
      <TodoList />
    </Suspense>
  );
}
```

- 동일한 Promise로 `createAsyncAtom`을 여러 번 호출하면 항상 같은 atom 인스턴스를 반환합니다.
- `set($todos, newValue)`를 호출하면 캐시된 비동기 값도 즉시 교체할 수 있습니다.

## React 밖에서 상태 읽거나 변경하기

`sangtae-js`의 `get`, `set`, `subscribe`는 그대로 사용할 수 있습니다. 예를 들어 로그 히스토리를 남기고 싶다면 아래처럼 수동 구독을 만들 수 있습니다.

```ts
import { get, set, subscribe } from "sangtae-js";
import { $counter, $history } from "./stores";

const unsubscribe = subscribe($counter, (value) => {
  const timestamp = new Date().toLocaleTimeString();
  const current = get($history);
  set($history, [`${timestamp} → ${value}`, ...current].slice(0, 8));
});

// 필요 없어지면 해제합니다.
unsubscribe();
```

## React 18 배치 업데이트 테스트 데모

React 18에서는 여러 상태 업데이트가 자동으로 배치되어 한 번의 리렌더링으로 처리됩니다. `batch` 함수와 `useRenderCount` 훅을 사용하여 배치 업데이트가 제대로 작동하는지 테스트할 수 있습니다.

```ts
// stores/demo.ts
import { createAtom } from "sangtae-js";

export const $counter = createAtom(0);
export const $step = createAtom(1);
export const $nickname = createAtom("");
```

```tsx
// components/BatchUpdateDemo.tsx
import { useAtom, batch, useRenderCount } from "sangtae-react";
import { set } from "sangtae-js";
import { $counter, $step, $nickname } from "../stores/demo";

export default function BatchUpdateDemo() {
  const renderCount = useRenderCount();
  const [counter] = useAtom($counter);
  const [step] = useAtom($step);
  const [nickname] = useAtom($nickname);

  // 이벤트 핸들러 내에서는 React 18이 자동으로 배칭함
  const handleSyncBatch = () => {
    set($counter, counter + 1);
    set($step, step + 1);
    set($nickname, `업데이트 ${counter + 1}`);
    // React 18에서는 이 세 업데이트가 자동으로 배치되어 한 번의 렌더링만 발생
  };

  // Promise나 setTimeout 내부에서도 React 18은 자동 배칭함
  const handleAsyncBatch = () => {
    setTimeout(() => {
      set($counter, counter + 10);
      set($step, step + 10);
      set($nickname, `비동기 업데이트 ${counter + 10}`);
      // React 18에서는 자동 배칭되어 한 번의 렌더링만 발생
    }, 1000);
  };

  // 명시적으로 batch 함수 사용 (선택적)
  const handleExplicitBatch = () => {
    batch(() => {
      set($counter, counter + 100);
      set($step, step + 100);
      set($nickname, `명시적 배치 ${counter + 100}`);
    });
  };

  return (
    <div>
      <p>렌더링 횟수: {renderCount}</p>
      <p>카운터: {counter}</p>
      <p>스텝: {step}</p>
      <p>닉네임: {nickname}</p>
      <div>
        <button onClick={handleSyncBatch}>동기 배치 업데이트</button>
        <button onClick={handleAsyncBatch}>비동기 배치 업데이트</button>
        <button onClick={handleExplicitBatch}>명시적 배치 업데이트</button>
      </div>
    </div>
  );
}
```

### 배치 업데이트 동작 원리

- **자동 배칭**: React 18에서는 이벤트 핸들러, Promise, setTimeout 등에서 여러 상태 업데이트가 자동으로 배치됩니다.
- **`useSyncExternalStore` 호환성**: `useAtom`은 `useSyncExternalStore`를 사용하므로 React 18의 자동 배칭과 잘 작동합니다.
- **렌더링 추적**: `useRenderCount` 훅을 사용하여 실제 렌더링 횟수를 확인할 수 있습니다.

### `batch` 함수 사용 시나리오

일반적으로 React 18의 자동 배칭으로 충분하지만, 명시적으로 배칭을 보장하고 싶을 때 `batch` 함수를 사용할 수 있습니다:

```tsx
import { batch } from "sangtae-react";
import { set } from "sangtae-js";

// 복잡한 비동기 로직에서 명시적 배칭
async function complexUpdate() {
  const data = await fetchData();
  
  batch(() => {
    set($counter, data.counter);
    set($step, data.step);
    set($nickname, data.nickname);
  });
}
```

```


린터 오류 확인 및 빌드 테스트 중.



빌드 성공. sample-app-react에 배치 업데이트 테스트 데모 컴포넌트 추가 중.



DemoPage에 배치 업데이트 테스트 데모 섹션 추가 중.


```typescriptreact
import { Suspense, useEffect, useState } from "react";
import { useAtom, batch, useRenderCount } from "sangtae-react";
import useRenderCount as useLocalRenderCount from "@/hooks/useRenderCount";
import {
  $counter,
  $counterHistory,
  $doubleCounter,
  $nickname,
  $step,
  $summary,
  createRemoteTodosAtom,
  createRemoteTeamAtom,
  createRemoteInsightsAtom,
  type RemoteAsyncInsights,
  type RemoteTeamMember,
  type RemoteTodo,
} from "@/stores/demo";
import { get, set, subscribe, type Atom } from "sangtae-js";

/**
 * @description 렌더링 횟수를 표시하는 컴포넌트
 */
const RenderBadge = () => {
  const renders = useRenderCount();
  return <span className="render-badge">렌더링 {renders}회</span>;
};

const CounterValueCard = () => {
  const [counter] = useAtom($counter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 값</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{counter}</p>
      <p className="atom-card__hint">
        `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
      </p>
    </article>
  );
};

/**
 * @description 카운터 업데이트 컴포넌트
 */
const CounterControlsCard = () => {
  const [counter, setCounter] = useAtom($counter);
  const [step] = useAtom($step);

  const onIncrease = () => setCounter(counter + step);
  const onDecrease = () => setCounter(counter - step);
  const onReset = () => set($counter, 0);
  const onSetSameValue = () => {
    const current = get($counter);
    set($counter, current);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 업데이트</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value atom-card__value--small">
        현재 값: <strong>{counter}</strong> / 스텝: <strong>{step}</strong>
      </p>
      <div className="atom-card__actions">
        <button onClick={onDecrease}>- 스텝</button>
        <button onClick={onIncrease}>+ 스텝</button>
        <button onClick={onReset}>0으로 초기화</button>
        <button onClick={onSetSameValue}>같은 값으로 set</button>
      </div>
      <p className="atom-card__hint">
        `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시 렌더링되지
        않습니다.
      </p>
    </article>
  );
};

/**
 * @description 스텝 선택 컴포넌트
 */
const StepSelectorCard = () => {
  const [step, setStep] = useAtom($step);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>스텝 Atom</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__options">
        {[1, 5, 10].map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="step"
              value={option}
              checked={step === option}
              onChange={() => setStep(option)}
            />
            {option}
          </label>
        ))}
      </div>
      <p className="atom-card__hint">
        별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인 컴포넌트만
        렌더링됩니다.
      </p>
    </article>
  );
};

/**
 * @description 닉네임 입력 컴포넌트
 */
const NicknameCard = () => {
  const [nickname, setNickname] = useAtom($nickname);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>입력 Atom</h3>
        <RenderBadge />
      </header>
      <input
        className="atom-card__input"
        value={nickname}
        placeholder="닉네임을 입력하세요"
        onChange={({ target }) => setNickname(target.value)}
      />
      <p className="atom-card__hint">
        하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생 상태가
        연결됩니다.
      </p>
    </article>
  );
};

/**
 * @description 파생 카운터 컴포넌트
 */
const DerivedCounterCard = () => {
  const [doubleCount] = useAtom($doubleCounter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>파생 Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{doubleCount}</p>
      <p className="atom-card__hint">
        `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
      </p>
    </article>
  );
};

/**
 * @description 요약 카운터 컴포넌트
 */
const SummaryCard = () => {
  const [summary] = useAtom($summary);

  const onLogSnapshot = () => {
    const snapshot = get($summary);
    console.table(snapshot);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 요약</h3>
        <RenderBadge />
      </header>
      <dl className="atom-card__list">
        <div>
          <dt>현재 값</dt>
          <dd>{summary.counter}</dd>
        </div>
        <div>
          <dt>스텝</dt>
          <dd>{summary.step}</dd>
        </div>
        <div>
          <dt>다음 값</dt>
          <dd>{summary.next}</dd>
        </div>
        <div>
          <dt>메시지</dt>
          <dd>{summary.greeting}</dd>
        </div>
      </dl>
      <button onClick={onLogSnapshot} className="atom-card__log-btn">
        현재 상태 콘솔로 확인
      </button>
      <p className="atom-card__hint">
        `get`을 호출하면 React 컴포넌트 밖에서도 atom 스냅샷을 읽을 수 있습니다.
      </p>
    </article>
  );
};

/**
 * @description 비동기 투두 카드 컴포넌트
 */
const AsyncTodosCardContent = ({
  atom,
  version,
  onRefresh,
}: {
  atom: Atom<RemoteTodo[]>;
  version: number;
  onRefresh: () => void;
}) => {
  const [todos, setTodos] = useAtom(atom);

  const completedCount = todos.filter((todo) => todo.completed).length;

  const onToggleComplete = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const onCompleteAll = () => {
    const isAllCompleted = todos.every(({ completed }) => completed);

    setTodos(
      isAllCompleted
        ? todos
        : todos.map((todo) => ({ ...todo, completed: true }))
    );
  };

  return (
    <article className="atom-card atom-card--wide async-card">
      <header className="atom-card__header">
        <h3>createAsyncAtom 데모</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__hint">
        Promise를 받아 최초 구독 시 `Suspense`를 통해 로딩 상태를 노출합니다.
        이후에는 `set`을 사용해 비동기 데이터도 즉시 수정할 수 있습니다.
      </p>
      <div className="async-card__stats">
        <span>데이터 버전: v{version + 1}</span>
        <span>
          완료 {completedCount}/{todos.length}
        </span>
      </div>
      <ul className="async-card__list">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`async-card__item${
              todo.completed ? " async-card__item--completed" : ""
            }`}
          >
            <div className="async-card__item-main">
              <strong>{todo.title}</strong>
              <p>{todo.description}</p>
            </div>
            <button onClick={() => onToggleComplete(todo.id)}>
              {todo.completed ? "되돌리기" : "완료"}
            </button>
          </li>
        ))}
      </ul>
      <div className="atom-card__actions async-card__actions">
        <button onClick={onRefresh}>데이터 새로고침</button>
        <button onClick={onCompleteAll}>모두 완료 처리</button>
      </div>
    </article>
  );
};

/**
 * @description 비동기 투두 카드 컨테이너
 */
const AsyncTodosCard = ({
  atom,
  version,
  onRefresh,
}: {
  atom: Atom<RemoteTodo[]>;
  version: number;
  onRefresh: () => void;
}) => {
  return (
    <Suspense
      fallback={
        <article className="atom-card atom-card--wide async-card async-card--loading">
          <header className="atom-card__header">
            <h3>createAsyncAtom 데모</h3>
          </header>
          <p className="atom-card__hint">
            비동기 데이터를 불러오는 중입니다...
          </p>
        </article>
      }
    >
      <AsyncTodosCardContent
        atom={atom}
        version={version}
        onRefresh={onRefresh}
      />
    </Suspense>
  );
};

/**
 * @description createAsyncAtom 파생 아톰 카드
 */
const AsyncInsightsCardContent = ({
  insightsAtom,
  teamAtom,
  version,
  onRefresh,
}: {
  insightsAtom: Atom<RemoteAsyncInsights>;
  teamAtom: Atom<RemoteTeamMember[]>;
  version: number;
  onRefresh: () => void;
}) => {
  const [insights] = useAtom(insightsAtom);
  const [team, setTeam] = useAtom(teamAtom);

  const CAPACITY_PRESETS = [
    { label: "여유", capacity: 3 },
    { label: "주의", capacity: 1 },
    { label: "포화", capacity: 0 },
  ] as const;
  const MAX_CAPACITY = 6;

  const resolveStatusLabel = (capacity: number) => {
    if (capacity >= 3) return "여유";
    if (capacity >= 1) return "주의";
    return "포화";
  };

  const onAdjustCapacity = (id: number, delta: number) => {
    setTeam(
      team.map((member) =>
        member.id === id
          ? {
              ...member,
              capacity: Math.max(
                0,
                Math.min(MAX_CAPACITY, member.capacity + delta)
              ),
            }
          : member
      )
    );
  };

  const onSetPreset = (id: number, capacity: number) => {
    setTeam(
      team.map((member) =>
        member.id === id ? { ...member, capacity } : member
      )
    );
  };

  return (
    <article className="atom-card atom-card--wide async-card">
      <header className="atom-card__header">
        <h3>파생 Async Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__hint">
        두 개의 `createAsyncAtom`에서 불러온 데이터를 `createDerivedAtom`으로
        합성해 추천 정보를 계산합니다.
      </p>
      <div className="async-card__stats">
        <span>데이터 버전: v{version + 1}</span>
        <span>팀원 {team.length}명</span>
        <span>
          미완료 {insights.pendingCount} / 완료 {insights.completedCount}
        </span>
      </div>
      {insights.suggestion ? (
        <div className="async-card__summary">
          <strong>{insights.suggestion.assignee.name}</strong>
          <span>{insights.suggestion.message}</span>
          <p>
            <em>{insights.suggestion.todo.title}</em> 작업을 맡으면 좋겠어요.
          </p>
        </div>
      ) : (
        <div className="async-card__summary async-card__summary--success">
          모든 작업이 완료되었습니다! 팀이 휴식을 취해도 좋겠어요.
        </div>
      )}
      <ul className="team-list">
        {insights.teamLoad.map((member) => {
          const statusClass =
            member.status === "여유"
              ? "team-list__status--positive"
              : member.status === "주의"
              ? "team-list__status--warning"
              : "team-list__status--danger";

          return (
            <li key={member.id} className="team-list__item">
              <div className="team-list__meta">
                <strong>{member.name}</strong>
                <span>{member.role}</span>
                <small>{member.focus}</small>
              </div>
              <div className={`team-list__status ${statusClass}`}>
                {member.status} · 여유 {member.capacity}
              </div>
              <div className="team-list__controls">
                <div className="team-list__control-row">
                  <button
                    className="team-list__btn"
                    onClick={() => onAdjustCapacity(member.id, 1)}
                  >
                    + 여유도
                  </button>
                  <button
                    className="team-list__btn"
                    onClick={() => onAdjustCapacity(member.id, -1)}
                  >
                    - 여유도
                  </button>
                </div>
                <div className="team-list__control-row">
                  {CAPACITY_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      className={`team-list__preset${
                        member.status === preset.label
                          ? " team-list__preset--active"
                          : ""
                      }`}
                      onClick={() => onSetPreset(member.id, preset.capacity)}
                    >
                      {preset.label}로 설정
                    </button>
                  ))}
                </div>
                <div className="team-list__hint">
                  현재 상태: {resolveStatusLabel(member.capacity)} / 여유도{" "}
                  {member.capacity}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="atom-card__actions async-card__actions">
        <button onClick={onRefresh}>데이터 새로고침</button>
      </div>
    </article>
  );
};

const AsyncInsightsCard = (props: {
  insightsAtom: Atom<RemoteAsyncInsights>;
  teamAtom: Atom<RemoteTeamMember[]>;
  version: number;
  onRefresh: () => void;
}) => {
  return (
    <Suspense
      fallback={
        <article className="atom-card atom-card--wide async-card async-card--loading">
          <header className="atom-card__header">
            <h3>파생 Async Atom</h3>
          </header>
          <p className="atom-card__hint">
            파생 상태를 계산하기 위한 데이터를 불러오는 중입니다...
          </p>
        </article>
      }
    >
      <AsyncInsightsCardContent {...props} />
    </Suspense>
  );
};

/**
 * @description 비동기 아톰 데모 섹션
 */
const AsyncAtomsSection = () => {
  const [{ version, todosAtom, teamAtom, insightsAtom }, setAsyncState] =
    useState(() => {
      const initialVersion = 0;
      const initialTodosAtom = createRemoteTodosAtom(initialVersion);
      const initialTeamAtom = createRemoteTeamAtom(initialVersion);

      return {
        version: initialVersion,
        todosAtom: initialTodosAtom,
        teamAtom: initialTeamAtom,
        insightsAtom: createRemoteInsightsAtom(
          initialTodosAtom,
          initialTeamAtom
        ),
      };
    });

  const onRefresh = () =>
    setAsyncState((prev) => {
      const nextVersion = prev.version + 1;
      const nextTodosAtom = createRemoteTodosAtom(nextVersion);
      const nextTeamAtom = createRemoteTeamAtom(nextVersion);

      return {
        version: nextVersion,
        todosAtom: nextTodosAtom,
        teamAtom: nextTeamAtom,
        insightsAtom: createRemoteInsightsAtom(nextTodosAtom, nextTeamAtom),
      };
    });

  return (
    <section className="demo-section">
      <header className="demo-section__header">
        <h2>비동기 Atom</h2>
        <p>
          `createAsyncAtom`을 `Suspense`와 함께 사용하는 기본 예제와, 여러
          비동기 Atom을 파생 Atom으로 묶어 추가 정보를 계산하는 예제를 함께
          확인할 수 있습니다.
        </p>
      </header>
      <div className="demo-grid">
        <AsyncTodosCard
          atom={todosAtom}
          version={version}
          onRefresh={onRefresh}
        />
        <AsyncInsightsCard
          insightsAtom={insightsAtom}
          teamAtom={teamAtom}
          version={version}
          onRefresh={onRefresh}
        />
      </div>
    </section>
  );
};

/**
 * @description 카운터 변경 이력 카드 컴포넌트
 */
const CounterHistoryCard = () => {
  const [history] = useAtom($counterHistory);
  const [isSubscribed, setIsSubscribed] = useState(true);

  useEffect(() => {
    if (!isSubscribed) {
      return;
    }

    const unsubscribe = subscribe($counter, (value) => {
      const summary = get($summary);
      const timestamp = new Date().toLocaleTimeString();
      const entry = `${timestamp} → ${value} (다음: ${summary.next})`;
      const current = get($counterHistory);
      const nextHistory = [entry, ...current].slice(0, 8);
      set($counterHistory, nextHistory);
    });

    return () => unsubscribe();
  }, [isSubscribed]);

  const onToggleSubscribe = () => {
    if (isSubscribed) {
      set($counterHistory, []);
    }
    setIsSubscribed((prev) => !prev);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>수동 구독자</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__actions">
        <button onClick={onToggleSubscribe}>
          {isSubscribed ? "구독 해제" : "다시 구독"}
        </button>
      </div>
      <p className="atom-card__hint">
        `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면
        내부 listener Set이 비워집니다.
      </p>
      {isSubscribed ? (
        <ul className="history-list">
          {history.length === 0 && (
            <li className="history-list__empty">아직 변경 이력이 없습니다.</li>
          )}
          {history.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ul>
      ) : (
        <div className="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      )}
    </article>
  );
};

/**
 * @description 데모 페이지 컴포넌트
 */
const DemoPage = () => {
  return (
    <div className="demo-page">
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>Minimal Global State 데모</h2>
          <p>
            Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
            페이지에서 확인할 수 있습니다.
          </p>
        </header>
        <div className="demo-grid">
          <CounterValueCard />
          <CounterControlsCard />
          <StepSelectorCard />
          <NicknameCard />
          <DerivedCounterCard />
          <SummaryCard />
        </div>
      </section>
      <AsyncAtomsSection />
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>구독자 동작 확인</h2>
          <p>
            동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을
            직접 관리하여 GC-friendly하게 동작합니다.
          </p>
        </header>
        <CounterHistoryCard />
      </section>
    </div>
  );
};

export default DemoPage;

```

```typescriptreact
import { Suspense, useEffect, useState } from "react";
import { useAtom, batch, useRenderCount } from "sangtae-react";
import useRenderCount as useLocalRenderCount from "@/hooks/useRenderCount";
import {
  $counter,
  $counterHistory,
  $doubleCounter,
  $nickname,
  $step,
  $summary,
  createRemoteTodosAtom,
  createRemoteTeamAtom,
  createRemoteInsightsAtom,
  type RemoteAsyncInsights,
  type RemoteTeamMember,
  type RemoteTodo,
} from "@/stores/demo";
import { get, set, subscribe, type Atom } from "sangtae-js";

/**
 * @description 렌더링 횟수를 표시하는 컴포넌트
 */
const RenderBadge = () => {
  const renders = useLocalRenderCount();
  return <span className="render-badge">렌더링 {renders}회</span>;
};

const CounterValueCard = () => {
  const [counter] = useAtom($counter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 값</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{counter}</p>
      <p className="atom-card__hint">
        `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
      </p>
    </article>
  );
};

/**
 * @description 카운터 업데이트 컴포넌트
 */
const CounterControlsCard = () => {
  const [counter, setCounter] = useAtom($counter);
  const [step] = useAtom($step);

  const onIncrease = () => setCounter(counter + step);
  const onDecrease = () => setCounter(counter - step);
  const onReset = () => set($counter, 0);
  const onSetSameValue = () => {
    const current = get($counter);
    set($counter, current);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 업데이트</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value atom-card__value--small">
        현재 값: <strong>{counter}</strong> / 스텝: <strong>{step}</strong>
      </p>
      <div className="atom-card__actions">
        <button onClick={onDecrease}>- 스텝</button>
        <button onClick={onIncrease}>+ 스텝</button>
        <button onClick={onReset}>0으로 초기화</button>
        <button onClick={onSetSameValue}>같은 값으로 set</button>
      </div>
      <p className="atom-card__hint">
        `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시 렌더링되지
        않습니다.
      </p>
    </article>
  );
};

/**
 * @description 스텝 선택 컴포넌트
 */
const StepSelectorCard = () => {
  const [step, setStep] = useAtom($step);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>스텝 Atom</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__options">
        {[1, 5, 10].map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="step"
              value={option}
              checked={step === option}
              onChange={() => setStep(option)}
            />
            {option}
          </label>
        ))}
      </div>
      <p className="atom-card__hint">
        별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인 컴포넌트만
        렌더링됩니다.
      </p>
    </article>
  );
};

/**
 * @description 닉네임 입력 컴포넌트
 */
const NicknameCard = () => {
  const [nickname, setNickname] = useAtom($nickname);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>입력 Atom</h3>
        <RenderBadge />
      </header>
      <input
        className="atom-card__input"
        value={nickname}
        placeholder="닉네임을 입력하세요"
        onChange={({ target }) => setNickname(target.value)}
      />
      <p className="atom-card__hint">
        하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생 상태가
        연결됩니다.
      </p>
    </article>
  );
};

/**
 * @description 파생 카운터 컴포넌트
 */
const DerivedCounterCard = () => {
  const [doubleCount] = useAtom($doubleCounter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>파생 Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{doubleCount}</p>
      <p className="atom-card__hint">
        `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
      </p>
    </article>
  );
};

/**
 * @description 요약 카운터 컴포넌트
 */
const SummaryCard = () => {
  const [summary] = useAtom($summary);

  const onLogSnapshot = () => {
    const snapshot = get($summary);
    console.table(snapshot);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 요약</h3>
        <RenderBadge />
      </header>
      <dl className="atom-card__list">
        <div>
          <dt>현재 값</dt>
          <dd>{summary.counter}</dd>
        </div>
        <div>
          <dt>스텝</dt>
          <dd>{summary.step}</dd>
        </div>
        <div>
          <dt>다음 값</dt>
          <dd>{summary.next}</dd>
        </div>
        <div>
          <dt>메시지</dt>
          <dd>{summary.greeting}</dd>
        </div>
      </dl>
      <button onClick={onLogSnapshot} className="atom-card__log-btn">
        현재 상태 콘솔로 확인
      </button>
      <p className="atom-card__hint">
        `get`을 호출하면 React 컴포넌트 밖에서도 atom 스냅샷을 읽을 수 있습니다.
      </p>
    </article>
  );
};

/**
 * @description 비동기 투두 카드 컴포넌트
 */
const AsyncTodosCardContent = ({
  atom,
  version,
  onRefresh,
}: {
  atom: Atom<RemoteTodo[]>;
  version: number;
  onRefresh: () => void;
}) => {
  const [todos, setTodos] = useAtom(atom);

  const completedCount = todos.filter((todo) => todo.completed).length;

  const onToggleComplete = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const onCompleteAll = () => {
    const isAllCompleted = todos.every(({ completed }) => completed);

    setTodos(
      isAllCompleted
        ? todos
        : todos.map((todo) => ({ ...todo, completed: true }))
    );
  };

  return (
    <article className="atom-card atom-card--wide async-card">
      <header className="atom-card__header">
        <h3>createAsyncAtom 데모</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__hint">
        Promise를 받아 최초 구독 시 `Suspense`를 통해 로딩 상태를 노출합니다.
        이후에는 `set`을 사용해 비동기 데이터도 즉시 수정할 수 있습니다.
      </p>
      <div className="async-card__stats">
        <span>데이터 버전: v{version + 1}</span>
        <span>
          완료 {completedCount}/{todos.length}
        </span>
      </div>
      <ul className="async-card__list">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`async-card__item${
              todo.completed ? " async-card__item--completed" : ""
            }`}
          >
            <div className="async-card__item-main">
              <strong>{todo.title}</strong>
              <p>{todo.description}</p>
            </div>
            <button onClick={() => onToggleComplete(todo.id)}>
              {todo.completed ? "되돌리기" : "완료"}
            </button>
          </li>
        ))}
      </ul>
      <div className="atom-card__actions async-card__actions">
        <button onClick={onRefresh}>데이터 새로고침</button>
        <button onClick={onCompleteAll}>모두 완료 처리</button>
      </div>
    </article>
  );
};

/**
 * @description 비동기 투두 카드 컨테이너
 */
const AsyncTodosCard = ({
  atom,
  version,
  onRefresh,
}: {
  atom: Atom<RemoteTodo[]>;
  version: number;
  onRefresh: () => void;
}) => {
  return (
    <Suspense
      fallback={
        <article className="atom-card atom-card--wide async-card async-card--loading">
          <header className="atom-card__header">
            <h3>createAsyncAtom 데모</h3>
          </header>
          <p className="atom-card__hint">
            비동기 데이터를 불러오는 중입니다...
          </p>
        </article>
      }
    >
      <AsyncTodosCardContent
        atom={atom}
        version={version}
        onRefresh={onRefresh}
      />
    </Suspense>
  );
};

/**
 * @description createAsyncAtom 파생 아톰 카드
 */
const AsyncInsightsCardContent = ({
  insightsAtom,
  teamAtom,
  version,
  onRefresh,
}: {
  insightsAtom: Atom<RemoteAsyncInsights>;
  teamAtom: Atom<RemoteTeamMember[]>;
  version: number;
  onRefresh: () => void;
}) => {
  const [insights] = useAtom(insightsAtom);
  const [team, setTeam] = useAtom(teamAtom);

  const CAPACITY_PRESETS = [
    { label: "여유", capacity: 3 },
    { label: "주의", capacity: 1 },
    { label: "포화", capacity: 0 },
  ] as const;
  const MAX_CAPACITY = 6;

  const resolveStatusLabel = (capacity: number) => {
    if (capacity >= 3) return "여유";
    if (capacity >= 1) return "주의";
    return "포화";
  };

  const onAdjustCapacity = (id: number, delta: number) => {
    setTeam(
      team.map((member) =>
        member.id === id
          ? {
              ...member,
              capacity: Math.max(
                0,
                Math.min(MAX_CAPACITY, member.capacity + delta)
              ),
            }
          : member
      )
    );
  };

  const onSetPreset = (id: number, capacity: number) => {
    setTeam(
      team.map((member) =>
        member.id === id ? { ...member, capacity } : member
      )
    );
  };

  return (
    <article className="atom-card atom-card--wide async-card">
      <header className="atom-card__header">
        <h3>파생 Async Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__hint">
        두 개의 `createAsyncAtom`에서 불러온 데이터를 `createDerivedAtom`으로
        합성해 추천 정보를 계산합니다.
      </p>
      <div className="async-card__stats">
        <span>데이터 버전: v{version + 1}</span>
        <span>팀원 {team.length}명</span>
        <span>
          미완료 {insights.pendingCount} / 완료 {insights.completedCount}
        </span>
      </div>
      {insights.suggestion ? (
        <div className="async-card__summary">
          <strong>{insights.suggestion.assignee.name}</strong>
          <span>{insights.suggestion.message}</span>
          <p>
            <em>{insights.suggestion.todo.title}</em> 작업을 맡으면 좋겠어요.
          </p>
        </div>
      ) : (
        <div className="async-card__summary async-card__summary--success">
          모든 작업이 완료되었습니다! 팀이 휴식을 취해도 좋겠어요.
        </div>
      )}
      <ul className="team-list">
        {insights.teamLoad.map((member) => {
          const statusClass =
            member.status === "여유"
              ? "team-list__status--positive"
              : member.status === "주의"
              ? "team-list__status--warning"
              : "team-list__status--danger";

          return (
            <li key={member.id} className="team-list__item">
              <div className="team-list__meta">
                <strong>{member.name}</strong>
                <span>{member.role}</span>
                <small>{member.focus}</small>
              </div>
              <div className={`team-list__status ${statusClass}`}>
                {member.status} · 여유 {member.capacity}
              </div>
              <div className="team-list__controls">
                <div className="team-list__control-row">
                  <button
                    className="team-list__btn"
                    onClick={() => onAdjustCapacity(member.id, 1)}
                  >
                    + 여유도
                  </button>
                  <button
                    className="team-list__btn"
                    onClick={() => onAdjustCapacity(member.id, -1)}
                  >
                    - 여유도
                  </button>
                </div>
                <div className="team-list__control-row">
                  {CAPACITY_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      className={`team-list__preset${
                        member.status === preset.label
                          ? " team-list__preset--active"
                          : ""
                      }`}
                      onClick={() => onSetPreset(member.id, preset.capacity)}
                    >
                      {preset.label}로 설정
                    </button>
                  ))}
                </div>
                <div className="team-list__hint">
                  현재 상태: {resolveStatusLabel(member.capacity)} / 여유도{" "}
                  {member.capacity}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="atom-card__actions async-card__actions">
        <button onClick={onRefresh}>데이터 새로고침</button>
      </div>
    </article>
  );
};

const AsyncInsightsCard = (props: {
  insightsAtom: Atom<RemoteAsyncInsights>;
  teamAtom: Atom<RemoteTeamMember[]>;
  version: number;
  onRefresh: () => void;
}) => {
  return (
    <Suspense
      fallback={
        <article className="atom-card atom-card--wide async-card async-card--loading">
          <header className="atom-card__header">
            <h3>파생 Async Atom</h3>
          </header>
          <p className="atom-card__hint">
            파생 상태를 계산하기 위한 데이터를 불러오는 중입니다...
          </p>
        </article>
      }
    >
      <AsyncInsightsCardContent {...props} />
    </Suspense>
  );
};

/**
 * @description 비동기 아톰 데모 섹션
 */
const AsyncAtomsSection = () => {
  const [{ version, todosAtom, teamAtom, insightsAtom }, setAsyncState] =
    useState(() => {
      const initialVersion = 0;
      const initialTodosAtom = createRemoteTodosAtom(initialVersion);
      const initialTeamAtom = createRemoteTeamAtom(initialVersion);

      return {
        version: initialVersion,
        todosAtom: initialTodosAtom,
        teamAtom: initialTeamAtom,
        insightsAtom: createRemoteInsightsAtom(
          initialTodosAtom,
          initialTeamAtom
        ),
      };
    });

  const onRefresh = () =>
    setAsyncState((prev) => {
      const nextVersion = prev.version + 1;
      const nextTodosAtom = createRemoteTodosAtom(nextVersion);
      const nextTeamAtom = createRemoteTeamAtom(nextVersion);

      return {
        version: nextVersion,
        todosAtom: nextTodosAtom,
        teamAtom: nextTeamAtom,
        insightsAtom: createRemoteInsightsAtom(nextTodosAtom, nextTeamAtom),
      };
    });

  return (
    <section className="demo-section">
      <header className="demo-section__header">
        <h2>비동기 Atom</h2>
        <p>
          `createAsyncAtom`을 `Suspense`와 함께 사용하는 기본 예제와, 여러
          비동기 Atom을 파생 Atom으로 묶어 추가 정보를 계산하는 예제를 함께
          확인할 수 있습니다.
        </p>
      </header>
      <div className="demo-grid">
        <AsyncTodosCard
          atom={todosAtom}
          version={version}
          onRefresh={onRefresh}
        />
        <AsyncInsightsCard
          insightsAtom={insightsAtom}
          teamAtom={teamAtom}
          version={version}
          onRefresh={onRefresh}
        />
      </div>
    </section>
  );
};

/**
 * @description 카운터 변경 이력 카드 컴포넌트
 */
const CounterHistoryCard = () => {
  const [history] = useAtom($counterHistory);
  const [isSubscribed, setIsSubscribed] = useState(true);

  useEffect(() => {
    if (!isSubscribed) {
      return;
    }

    const unsubscribe = subscribe($counter, (value) => {
      const summary = get($summary);
      const timestamp = new Date().toLocaleTimeString();
      const entry = `${timestamp} → ${value} (다음: ${summary.next})`;
      const current = get($counterHistory);
      const nextHistory = [entry, ...current].slice(0, 8);
      set($counterHistory, nextHistory);
    });

    return () => unsubscribe();
  }, [isSubscribed]);

  const onToggleSubscribe = () => {
    if (isSubscribed) {
      set($counterHistory, []);
    }
    setIsSubscribed((prev) => !prev);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>수동 구독자</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__actions">
        <button onClick={onToggleSubscribe}>
          {isSubscribed ? "구독 해제" : "다시 구독"}
        </button>
      </div>
      <p className="atom-card__hint">
        `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면
        내부 listener Set이 비워집니다.
      </p>
      {isSubscribed ? (
        <ul className="history-list">
          {history.length === 0 && (
            <li className="history-list__empty">아직 변경 이력이 없습니다.</li>
          )}
          {history.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ul>
      ) : (
        <div className="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      )}
    </article>
  );
};

/**
 * @description 데모 페이지 컴포넌트
 */
const DemoPage = () => {
  return (
    <div className="demo-page">
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>Minimal Global State 데모</h2>
          <p>
            Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
            페이지에서 확인할 수 있습니다.
          </p>
        </header>
        <div className="demo-grid">
          <CounterValueCard />
          <CounterControlsCard />
          <StepSelectorCard />
          <NicknameCard />
          <DerivedCounterCard />
          <SummaryCard />
        </div>
      </section>
      <AsyncAtomsSection />
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>구독자 동작 확인</h2>
          <p>
            동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을
            직접 관리하여 GC-friendly하게 동작합니다.
          </p>
        </header>
        <CounterHistoryCard />
      </section>
    </div>
  );
};

export default DemoPage;

```

```typescriptreact
/**
 * @description 배치 업데이트 테스트 데모 컴포넌트
 */
const BatchUpdateDemoCard = () => {
  const renderCount = useRenderCount();
  const [counter] = useAtom($counter);
  const [step] = useAtom($step);
  const [nickname] = useAtom($nickname);

  // 이벤트 핸들러 내에서는 React 18이 자동으로 배칭함
  const handleSyncBatch = () => {
    set($counter, counter + 1);
    set($step, step + 1);
    set($nickname, `업데이트 ${counter + 1}`);
    // React 18에서는 이 세 업데이트가 자동으로 배치되어 한 번의 렌더링만 발생
  };

  // Promise나 setTimeout 내부에서도 React 18은 자동 배칭함
  const handleAsyncBatch = () => {
    setTimeout(() => {
      set($counter, counter + 10);
      set($step, step + 10);
      set($nickname, `비동기 업데이트 ${counter + 10}`);
      // React 18에서는 자동 배칭되어 한 번의 렌더링만 발생
    }, 100);
  };

  // 명시적으로 batch 함수 사용 (선택적)
  const handleExplicitBatch = () => {
    batch(() => {
      set($counter, counter + 100);
      set($step, step + 100);
      set($nickname, `명시적 배치 ${counter + 100}`);
    });
  };

  // 배치 없이 개별 업데이트 (비교용)
  const handleIndividualUpdates = () => {
    // 각 업데이트가 개별적으로 처리되지만, React 18의 자동 배칭으로 인해
    // 여전히 한 번의 렌더링만 발생할 수 있음
    set($counter, counter + 1);
    setTimeout(() => set($step, step + 1), 0);
    setTimeout(() => set($nickname, `개별 업데이트 ${counter + 1}`), 0);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>React 18 배치 업데이트 테스트</h3>
        <span className="render-badge">렌더링 {renderCount}회</span>
      </header>
      <div className="atom-card__value atom-card__value--small">
        <p>
          카운터: <strong>{counter}</strong>
        </p>
        <p>
          스텝: <strong>{step}</strong>
        </p>
        <p>
          닉네임: <strong>{nickname || "(없음)"}</strong>
        </p>
      </div>
      <div className="atom-card__actions">
        <button onClick={handleSyncBatch}>동기 배치 업데이트</button>
        <button onClick={handleAsyncBatch}>비동기 배치 업데이트</button>
        <button onClick={handleExplicitBatch}>명시적 배치 업데이트</button>
        <button onClick={handleIndividualUpdates}>개별 업데이트 (비교용)</button>
      </div>
      <p className="atom-card__hint">
        React 18에서는 이벤트 핸들러, Promise, setTimeout 등에서 여러 상태
        업데이트가 자동으로 배치되어 한 번의 렌더링만 발생합니다. 렌더링 횟수를
        확인하여 배치 업데이트가 제대로 작동하는지 테스트할 수 있습니다.
      </p>
    </article>
  );
};

/**
 * @description 데모 페이지 컴포넌트
 */
const DemoPage = () => {
  return (
    <div className="demo-page">
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>Minimal Global State 데모</h2>
          <p>
            Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
            페이지에서 확인할 수 있습니다.
          </p>
        </header>
        <div className="demo-grid">
          <CounterValueCard />
          <CounterControlsCard />
          <StepSelectorCard />
          <NicknameCard />
          <DerivedCounterCard />
          <SummaryCard />
        </div>
      </section>
      <AsyncAtomsSection />
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>React 18 배치 업데이트 테스트</h2>
          <p>
            React 18의 자동 배칭 기능이 `useSyncExternalStore` 기반의 `useAtom`과
            잘 작동하는지 확인할 수 있습니다. 여러 atom을 동시에 업데이트해도 한
            번의 렌더링만 발생합니다.
          </p>
        </header>
        <BatchUpdateDemoCard />
      </section>
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>구독자 동작 확인</h2>
          <p>
            동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을
            직접 관리하여 GC-friendly하게 동작합니다.
          </p>
        </header>
        <CounterHistoryCard />
      </section>
    </div>
  );
};
```


올바른 경로로 다시 시도 중.



배치 업데이트 데모 컴포넌트 추가 중.


```typescriptreact
import { Suspense, useEffect, useState } from "react";
import { useAtom, batch, useRenderCount } from "sangtae-react";
import useRenderCount as useLocalRenderCount from "@/hooks/useRenderCount";
import {
  $counter,
  $counterHistory,
  $doubleCounter,
  $nickname,
  $step,
  $summary,
  createRemoteTodosAtom,
  createRemoteTeamAtom,
  createRemoteInsightsAtom,
  type RemoteAsyncInsights,
  type RemoteTeamMember,
  type RemoteTodo,
} from "@/stores/demo";
import { get, set, subscribe, type Atom } from "sangtae-js";

/**
 * @description 렌더링 횟수를 표시하는 컴포넌트
 */
const RenderBadge = () => {
  const renders = useLocalRenderCount();
  return <span className="render-badge">렌더링 {renders}회</span>;
};

const CounterValueCard = () => {
  const [counter] = useAtom($counter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 값</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{counter}</p>
      <p className="atom-card__hint">
        `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
      </p>
    </article>
  );
};

/**
 * @description 카운터 업데이트 컴포넌트
 */
const CounterControlsCard = () => {
  const [counter, setCounter] = useAtom($counter);
  const [step] = useAtom($step);

  const onIncrease = () => setCounter(counter + step);
  const onDecrease = () => setCounter(counter - step);
  const onReset = () => set($counter, 0);
  const onSetSameValue = () => {
    const current = get($counter);
    set($counter, current);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 업데이트</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value atom-card__value--small">
        현재 값: <strong>{counter}</strong> / 스텝: <strong>{step}</strong>
      </p>
      <div className="atom-card__actions">
        <button onClick={onDecrease}>- 스텝</button>
        <button onClick={onIncrease}>+ 스텝</button>
        <button onClick={onReset}>0으로 초기화</button>
        <button onClick={onSetSameValue}>같은 값으로 set</button>
      </div>
      <p className="atom-card__hint">
        `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시 렌더링되지
        않습니다.
      </p>
    </article>
  );
};

/**
 * @description 스텝 선택 컴포넌트
 */
const StepSelectorCard = () => {
  const [step, setStep] = useAtom($step);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>스텝 Atom</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__options">
        {[1, 5, 10].map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="step"
              value={option}
              checked={step === option}
              onChange={() => setStep(option)}
            />
            {option}
          </label>
        ))}
      </div>
      <p className="atom-card__hint">
        별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인 컴포넌트만
        렌더링됩니다.
      </p>
    </article>
  );
};

/**
 * @description 닉네임 입력 컴포넌트
 */
const NicknameCard = () => {
  const [nickname, setNickname] = useAtom($nickname);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>입력 Atom</h3>
        <RenderBadge />
      </header>
      <input
        className="atom-card__input"
        value={nickname}
        placeholder="닉네임을 입력하세요"
        onChange={({ target }) => setNickname(target.value)}
      />
      <p className="atom-card__hint">
        하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생 상태가
        연결됩니다.
      </p>
    </article>
  );
};

/**
 * @description 파생 카운터 컴포넌트
 */
const DerivedCounterCard = () => {
  const [doubleCount] = useAtom($doubleCounter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>파생 Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{doubleCount}</p>
      <p className="atom-card__hint">
        `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
      </p>
    </article>
  );
};

/**
 * @description 요약 카운터 컴포넌트
 */
const SummaryCard = () => {
  const [summary] = useAtom($summary);

  const onLogSnapshot = () => {
    const snapshot = get($summary);
    console.table(snapshot);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 요약</h3>
        <RenderBadge />
      </header>
      <dl className="atom-card__list">
        <div>
          <dt>현재 값</dt>
          <dd>{summary.counter}</dd>
        </div>
        <div>
          <dt>스텝</dt>
          <dd>{summary.step}</dd>
        </div>
        <div>
          <dt>다음 값</dt>
          <dd>{summary.next}</dd>
        </div>
        <div>
          <dt>메시지</dt>
          <dd>{summary.greeting}</dd>
        </div>
      </dl>
      <button onClick={onLogSnapshot} className="atom-card__log-btn">
        현재 상태 콘솔로 확인
      </button>
      <p className="atom-card__hint">
        `get`을 호출하면 React 컴포넌트 밖에서도 atom 스냅샷을 읽을 수 있습니다.
      </p>
    </article>
  );
};

/**
 * @description 비동기 투두 카드 컴포넌트
 */
const AsyncTodosCardContent = ({
  atom,
  version,
  onRefresh,
}: {
  atom: Atom<RemoteTodo[]>;
  version: number;
  onRefresh: () => void;
}) => {
  const [todos, setTodos] = useAtom(atom);

  const completedCount = todos.filter((todo) => todo.completed).length;

  const onToggleComplete = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const onCompleteAll = () => {
    const isAllCompleted = todos.every(({ completed }) => completed);

    setTodos(
      isAllCompleted
        ? todos
        : todos.map((todo) => ({ ...todo, completed: true }))
    );
  };

  return (
    <article className="atom-card atom-card--wide async-card">
      <header className="atom-card__header">
        <h3>createAsyncAtom 데모</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__hint">
        Promise를 받아 최초 구독 시 `Suspense`를 통해 로딩 상태를 노출합니다.
        이후에는 `set`을 사용해 비동기 데이터도 즉시 수정할 수 있습니다.
      </p>
      <div className="async-card__stats">
        <span>데이터 버전: v{version + 1}</span>
        <span>
          완료 {completedCount}/{todos.length}
        </span>
      </div>
      <ul className="async-card__list">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`async-card__item${
              todo.completed ? " async-card__item--completed" : ""
            }`}
          >
            <div className="async-card__item-main">
              <strong>{todo.title}</strong>
              <p>{todo.description}</p>
            </div>
            <button onClick={() => onToggleComplete(todo.id)}>
              {todo.completed ? "되돌리기" : "완료"}
            </button>
          </li>
        ))}
      </ul>
      <div className="atom-card__actions async-card__actions">
        <button onClick={onRefresh}>데이터 새로고침</button>
        <button onClick={onCompleteAll}>모두 완료 처리</button>
      </div>
    </article>
  );
};

/**
 * @description 비동기 투두 카드 컨테이너
 */
const AsyncTodosCard = ({
  atom,
  version,
  onRefresh,
}: {
  atom: Atom<RemoteTodo[]>;
  version: number;
  onRefresh: () => void;
}) => {
  return (
    <Suspense
      fallback={
        <article className="atom-card atom-card--wide async-card async-card--loading">
          <header className="atom-card__header">
            <h3>createAsyncAtom 데모</h3>
          </header>
          <p className="atom-card__hint">
            비동기 데이터를 불러오는 중입니다...
          </p>
        </article>
      }
    >
      <AsyncTodosCardContent
        atom={atom}
        version={version}
        onRefresh={onRefresh}
      />
    </Suspense>
  );
};

/**
 * @description createAsyncAtom 파생 아톰 카드
 */
const AsyncInsightsCardContent = ({
  insightsAtom,
  teamAtom,
  version,
  onRefresh,
}: {
  insightsAtom: Atom<RemoteAsyncInsights>;
  teamAtom: Atom<RemoteTeamMember[]>;
  version: number;
  onRefresh: () => void;
}) => {
  const [insights] = useAtom(insightsAtom);
  const [team, setTeam] = useAtom(teamAtom);

  const CAPACITY_PRESETS = [
    { label: "여유", capacity: 3 },
    { label: "주의", capacity: 1 },
    { label: "포화", capacity: 0 },
  ] as const;
  const MAX_CAPACITY = 6;

  const resolveStatusLabel = (capacity: number) => {
    if (capacity >= 3) return "여유";
    if (capacity >= 1) return "주의";
    return "포화";
  };

  const onAdjustCapacity = (id: number, delta: number) => {
    setTeam(
      team.map((member) =>
        member.id === id
          ? {
              ...member,
              capacity: Math.max(
                0,
                Math.min(MAX_CAPACITY, member.capacity + delta)
              ),
            }
          : member
      )
    );
  };

  const onSetPreset = (id: number, capacity: number) => {
    setTeam(
      team.map((member) =>
        member.id === id ? { ...member, capacity } : member
      )
    );
  };

  return (
    <article className="atom-card atom-card--wide async-card">
      <header className="atom-card__header">
        <h3>파생 Async Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__hint">
        두 개의 `createAsyncAtom`에서 불러온 데이터를 `createDerivedAtom`으로
        합성해 추천 정보를 계산합니다.
      </p>
      <div className="async-card__stats">
        <span>데이터 버전: v{version + 1}</span>
        <span>팀원 {team.length}명</span>
        <span>
          미완료 {insights.pendingCount} / 완료 {insights.completedCount}
        </span>
      </div>
      {insights.suggestion ? (
        <div className="async-card__summary">
          <strong>{insights.suggestion.assignee.name}</strong>
          <span>{insights.suggestion.message}</span>
          <p>
            <em>{insights.suggestion.todo.title}</em> 작업을 맡으면 좋겠어요.
          </p>
        </div>
      ) : (
        <div className="async-card__summary async-card__summary--success">
          모든 작업이 완료되었습니다! 팀이 휴식을 취해도 좋겠어요.
        </div>
      )}
      <ul className="team-list">
        {insights.teamLoad.map((member) => {
          const statusClass =
            member.status === "여유"
              ? "team-list__status--positive"
              : member.status === "주의"
              ? "team-list__status--warning"
              : "team-list__status--danger";

          return (
            <li key={member.id} className="team-list__item">
              <div className="team-list__meta">
                <strong>{member.name}</strong>
                <span>{member.role}</span>
                <small>{member.focus}</small>
              </div>
              <div className={`team-list__status ${statusClass}`}>
                {member.status} · 여유 {member.capacity}
              </div>
              <div className="team-list__controls">
                <div className="team-list__control-row">
                  <button
                    className="team-list__btn"
                    onClick={() => onAdjustCapacity(member.id, 1)}
                  >
                    + 여유도
                  </button>
                  <button
                    className="team-list__btn"
                    onClick={() => onAdjustCapacity(member.id, -1)}
                  >
                    - 여유도
                  </button>
                </div>
                <div className="team-list__control-row">
                  {CAPACITY_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      className={`team-list__preset${
                        member.status === preset.label
                          ? " team-list__preset--active"
                          : ""
                      }`}
                      onClick={() => onSetPreset(member.id, preset.capacity)}
                    >
                      {preset.label}로 설정
                    </button>
                  ))}
                </div>
                <div className="team-list__hint">
                  현재 상태: {resolveStatusLabel(member.capacity)} / 여유도{" "}
                  {member.capacity}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="atom-card__actions async-card__actions">
        <button onClick={onRefresh}>데이터 새로고침</button>
      </div>
    </article>
  );
};

const AsyncInsightsCard = (props: {
  insightsAtom: Atom<RemoteAsyncInsights>;
  teamAtom: Atom<RemoteTeamMember[]>;
  version: number;
  onRefresh: () => void;
}) => {
  return (
    <Suspense
      fallback={
        <article className="atom-card atom-card--wide async-card async-card--loading">
          <header className="atom-card__header">
            <h3>파생 Async Atom</h3>
          </header>
          <p className="atom-card__hint">
            파생 상태를 계산하기 위한 데이터를 불러오는 중입니다...
          </p>
        </article>
      }
    >
      <AsyncInsightsCardContent {...props} />
    </Suspense>
  );
};

/**
 * @description 비동기 아톰 데모 섹션
 */
const AsyncAtomsSection = () => {
  const [{ version, todosAtom, teamAtom, insightsAtom }, setAsyncState] =
    useState(() => {
      const initialVersion = 0;
      const initialTodosAtom = createRemoteTodosAtom(initialVersion);
      const initialTeamAtom = createRemoteTeamAtom(initialVersion);

      return {
        version: initialVersion,
        todosAtom: initialTodosAtom,
        teamAtom: initialTeamAtom,
        insightsAtom: createRemoteInsightsAtom(
          initialTodosAtom,
          initialTeamAtom
        ),
      };
    });

  const onRefresh = () =>
    setAsyncState((prev) => {
      const nextVersion = prev.version + 1;
      const nextTodosAtom = createRemoteTodosAtom(nextVersion);
      const nextTeamAtom = createRemoteTeamAtom(nextVersion);

      return {
        version: nextVersion,
        todosAtom: nextTodosAtom,
        teamAtom: nextTeamAtom,
        insightsAtom: createRemoteInsightsAtom(nextTodosAtom, nextTeamAtom),
      };
    });

  return (
    <section className="demo-section">
      <header className="demo-section__header">
        <h2>비동기 Atom</h2>
        <p>
          `createAsyncAtom`을 `Suspense`와 함께 사용하는 기본 예제와, 여러
          비동기 Atom을 파생 Atom으로 묶어 추가 정보를 계산하는 예제를 함께
          확인할 수 있습니다.
        </p>
      </header>
      <div className="demo-grid">
        <AsyncTodosCard
          atom={todosAtom}
          version={version}
          onRefresh={onRefresh}
        />
        <AsyncInsightsCard
          insightsAtom={insightsAtom}
          teamAtom={teamAtom}
          version={version}
          onRefresh={onRefresh}
        />
      </div>
    </section>
  );
};

/**
 * @description 카운터 변경 이력 카드 컴포넌트
 */
const CounterHistoryCard = () => {
  const [history] = useAtom($counterHistory);
  const [isSubscribed, setIsSubscribed] = useState(true);

  useEffect(() => {
    if (!isSubscribed) {
      return;
    }

    const unsubscribe = subscribe($counter, (value) => {
      const summary = get($summary);
      const timestamp = new Date().toLocaleTimeString();
      const entry = `${timestamp} → ${value} (다음: ${summary.next})`;
      const current = get($counterHistory);
      const nextHistory = [entry, ...current].slice(0, 8);
      set($counterHistory, nextHistory);
    });

    return () => unsubscribe();
  }, [isSubscribed]);

  const onToggleSubscribe = () => {
    if (isSubscribed) {
      set($counterHistory, []);
    }
    setIsSubscribed((prev) => !prev);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>수동 구독자</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__actions">
        <button onClick={onToggleSubscribe}>
          {isSubscribed ? "구독 해제" : "다시 구독"}
        </button>
      </div>
      <p className="atom-card__hint">
        `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면
        내부 listener Set이 비워집니다.
      </p>
      {isSubscribed ? (
        <ul className="history-list">
          {history.length === 0 && (
            <li className="history-list__empty">아직 변경 이력이 없습니다.</li>
          )}
          {history.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ul>
      ) : (
        <div className="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      )}
    </article>
  );
};

/**
 * @description 배치 업데이트 테스트 데모 컴포넌트
 */
const BatchUpdateDemoCard = () => {
  const renderCount = useRenderCount();
  const [counter] = useAtom($counter);
  const [step] = useAtom($step);
  const [nickname] = useAtom($nickname);

  // 이벤트 핸들러 내에서는 React 18이 자동으로 배칭함
  const handleSyncBatch = () => {
    set($counter, counter + 1);
    set($step, step + 1);
    set($nickname, `업데이트 ${counter + 1}`);
    // React 18에서는 이 세 업데이트가 자동으로 배치되어 한 번의 렌더링만 발생
  };

  // Promise나 setTimeout 내부에서도 React 18은 자동 배칭함
  const handleAsyncBatch = () => {
    setTimeout(() => {
      set($counter, counter + 10);
      set($step, step + 10);
      set($nickname, `비동기 업데이트 ${counter + 10}`);
      // React 18에서는 자동 배칭되어 한 번의 렌더링만 발생
    }, 100);
  };

  // 명시적으로 batch 함수 사용 (선택적)
  const handleExplicitBatch = () => {
    batch(() => {
      set($counter, counter + 100);
      set($step, step + 100);
      set($nickname, `명시적 배치 ${counter + 100}`);
    });
  };

  // 배치 없이 개별 업데이트 (비교용)
  const handleIndividualUpdates = () => {
    // 각 업데이트가 개별적으로 처리되지만, React 18의 자동 배칭으로 인해
    // 여전히 한 번의 렌더링만 발생할 수 있음
    set($counter, counter + 1);
    setTimeout(() => set($step, step + 1), 0);
    setTimeout(() => set($nickname, `개별 업데이트 ${counter + 1}`), 0);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>React 18 배치 업데이트 테스트</h3>
        <span className="render-badge">렌더링 {renderCount}회</span>
      </header>
      <div className="atom-card__value atom-card__value--small">
        <p>
          카운터: <strong>{counter}</strong>
        </p>
        <p>
          스텝: <strong>{step}</strong>
        </p>
        <p>
          닉네임: <strong>{nickname || "(없음)"}</strong>
        </p>
      </div>
      <div className="atom-card__actions">
        <button onClick={handleSyncBatch}>동기 배치 업데이트</button>
        <button onClick={handleAsyncBatch}>비동기 배치 업데이트</button>
        <button onClick={handleExplicitBatch}>명시적 배치 업데이트</button>
        <button onClick={handleIndividualUpdates}>개별 업데이트 (비교용)</button>
      </div>
      <p className="atom-card__hint">
        React 18에서는 이벤트 핸들러, Promise, setTimeout 등에서 여러 상태
        업데이트가 자동으로 배치되어 한 번의 렌더링만 발생합니다. 렌더링 횟수를
        확인하여 배치 업데이트가 제대로 작동하는지 테스트할 수 있습니다.
      </p>
    </article>
  );
};

/**
 * @description 데모 페이지 컴포넌트
 */
const DemoPage = () => {
  return (
    <div className="demo-page">
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>Minimal Global State 데모</h2>
          <p>
            Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
            페이지에서 확인할 수 있습니다.
          </p>
        </header>
        <div className="demo-grid">
          <CounterValueCard />
          <CounterControlsCard />
          <StepSelectorCard />
          <NicknameCard />
          <DerivedCounterCard />
          <SummaryCard />
        </div>
      </section>
      <AsyncAtomsSection />
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>React 18 배치 업데이트 테스트</h2>
          <p>
            React 18의 자동 배칭 기능이 `useSyncExternalStore` 기반의 `useAtom`과
            잘 작동하는지 확인할 수 있습니다. 여러 atom을 동시에 업데이트해도 한
            번의 렌더링만 발생합니다.
          </p>
        </header>
        <BatchUpdateDemoCard />
      </section>
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>구독자 동작 확인</h2>
          <p>
            동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을
            직접 관리하여 GC-friendly하게 동작합니다.
          </p>
        </header>
        <CounterHistoryCard />
      </section>
    </div>
  );
};

export default DemoPage;

```


빌드 재확인 중.



작업 완료. React 18 배치 업데이트 테스트 데모 기능을 추가했어.

## 추가된 내용

### 1. **@sangtae-react 라이브러리 기능 추가**
   - `batch` 함수: 여러 atom 업데이트를 명시적으로 배칭
   - `useRenderCount` 훅: 렌더링 횟수 추적

### 2. **README 문서 업데이트**
   - "React 18 배치 업데이트 테스트 데모" 섹션 추가
   - 배치 업데이트 동작 원리 설명
   - 사용 예제 코드 포함

### 3. **sample-app-react 데모 추가**
   - `BatchUpdateDemoCard` 컴포넌트 추가
   - 동기/비동기/명시적 배치 업데이트 테스트 버튼 제공
   - 렌더링 횟수 표시로 배칭 동작 확인 가능

## 주요 특징

- React 18 자동 배칭: 이벤트 핸들러, Promise, setTimeout에서 자동 배칭
- `useSyncExternalStore` 호환: `useAtom`이 React 18 배칭과 잘 작동
- 렌더링 추적: `useRenderCount`로 실제 렌더링 횟수 확인 가능

빌드도 성공적으로 완료되었고, sample-app-react에서 바로 테스트할 수 있어.

---

**User**

sample-app-react에 데모만 추가해주면된다니까

---

**Cursor**


sample-app-react에만 데모 추가. 현재 상태 확인 중.



`batch`는 sangtae-react에 없으므로 제거하고, 로컬 `useRenderCount`만 사용하도록 수정 중.


```typescriptreact
import { Suspense, useEffect, useState } from "react";
import { useAtom } from "sangtae-react";
import useRenderCount from "@/hooks/useRenderCount";
import {
  $counter,
  $counterHistory,
  $doubleCounter,
  $nickname,
  $step,
  $summary,
  createRemoteTodosAtom,
  createRemoteTeamAtom,
  createRemoteInsightsAtom,
  type RemoteAsyncInsights,
  type RemoteTeamMember,
  type RemoteTodo,
} from "@/stores/demo";
import { get, set, subscribe, type Atom } from "sangtae-js";

/**
 * @description 렌더링 횟수를 표시하는 컴포넌트
 */
const RenderBadge = () => {
  const renders = useLocalRenderCount();
  return <span className="render-badge">렌더링 {renders}회</span>;
};

const CounterValueCard = () => {
  const [counter] = useAtom($counter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 값</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{counter}</p>
      <p className="atom-card__hint">
        `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
      </p>
    </article>
  );
};

/**
 * @description 카운터 업데이트 컴포넌트
 */
const CounterControlsCard = () => {
  const [counter, setCounter] = useAtom($counter);
  const [step] = useAtom($step);

  const onIncrease = () => setCounter(counter + step);
  const onDecrease = () => setCounter(counter - step);
  const onReset = () => set($counter, 0);
  const onSetSameValue = () => {
    const current = get($counter);
    set($counter, current);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 업데이트</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value atom-card__value--small">
        현재 값: <strong>{counter}</strong> / 스텝: <strong>{step}</strong>
      </p>
      <div className="atom-card__actions">
        <button onClick={onDecrease}>- 스텝</button>
        <button onClick={onIncrease}>+ 스텝</button>
        <button onClick={onReset}>0으로 초기화</button>
        <button onClick={onSetSameValue}>같은 값으로 set</button>
      </div>
      <p className="atom-card__hint">
        `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시 렌더링되지
        않습니다.
      </p>
    </article>
  );
};

/**
 * @description 스텝 선택 컴포넌트
 */
const StepSelectorCard = () => {
  const [step, setStep] = useAtom($step);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>스텝 Atom</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__options">
        {[1, 5, 10].map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="step"
              value={option}
              checked={step === option}
              onChange={() => setStep(option)}
            />
            {option}
          </label>
        ))}
      </div>
      <p className="atom-card__hint">
        별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인 컴포넌트만
        렌더링됩니다.
      </p>
    </article>
  );
};

/**
 * @description 닉네임 입력 컴포넌트
 */
const NicknameCard = () => {
  const [nickname, setNickname] = useAtom($nickname);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>입력 Atom</h3>
        <RenderBadge />
      </header>
      <input
        className="atom-card__input"
        value={nickname}
        placeholder="닉네임을 입력하세요"
        onChange={({ target }) => setNickname(target.value)}
      />
      <p className="atom-card__hint">
        하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생 상태가
        연결됩니다.
      </p>
    </article>
  );
};

/**
 * @description 파생 카운터 컴포넌트
 */
const DerivedCounterCard = () => {
  const [doubleCount] = useAtom($doubleCounter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>파생 Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{doubleCount}</p>
      <p className="atom-card__hint">
        `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
      </p>
    </article>
  );
};

/**
 * @description 요약 카운터 컴포넌트
 */
const SummaryCard = () => {
  const [summary] = useAtom($summary);

  const onLogSnapshot = () => {
    const snapshot = get($summary);
    console.table(snapshot);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 요약</h3>
        <RenderBadge />
      </header>
      <dl className="atom-card__list">
        <div>
          <dt>현재 값</dt>
          <dd>{summary.counter}</dd>
        </div>
        <div>
          <dt>스텝</dt>
          <dd>{summary.step}</dd>
        </div>
        <div>
          <dt>다음 값</dt>
          <dd>{summary.next}</dd>
        </div>
        <div>
          <dt>메시지</dt>
          <dd>{summary.greeting}</dd>
        </div>
      </dl>
      <button onClick={onLogSnapshot} className="atom-card__log-btn">
        현재 상태 콘솔로 확인
      </button>
      <p className="atom-card__hint">
        `get`을 호출하면 React 컴포넌트 밖에서도 atom 스냅샷을 읽을 수 있습니다.
      </p>
    </article>
  );
};

/**
 * @description 비동기 투두 카드 컴포넌트
 */
const AsyncTodosCardContent = ({
  atom,
  version,
  onRefresh,
}: {
  atom: Atom<RemoteTodo[]>;
  version: number;
  onRefresh: () => void;
}) => {
  const [todos, setTodos] = useAtom(atom);

  const completedCount = todos.filter((todo) => todo.completed).length;

  const onToggleComplete = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const onCompleteAll = () => {
    const isAllCompleted = todos.every(({ completed }) => completed);

    setTodos(
      isAllCompleted
        ? todos
        : todos.map((todo) => ({ ...todo, completed: true }))
    );
  };

  return (
    <article className="atom-card atom-card--wide async-card">
      <header className="atom-card__header">
        <h3>createAsyncAtom 데모</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__hint">
        Promise를 받아 최초 구독 시 `Suspense`를 통해 로딩 상태를 노출합니다.
        이후에는 `set`을 사용해 비동기 데이터도 즉시 수정할 수 있습니다.
      </p>
      <div className="async-card__stats">
        <span>데이터 버전: v{version + 1}</span>
        <span>
          완료 {completedCount}/{todos.length}
        </span>
      </div>
      <ul className="async-card__list">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`async-card__item${
              todo.completed ? " async-card__item--completed" : ""
            }`}
          >
            <div className="async-card__item-main">
              <strong>{todo.title}</strong>
              <p>{todo.description}</p>
            </div>
            <button onClick={() => onToggleComplete(todo.id)}>
              {todo.completed ? "되돌리기" : "완료"}
            </button>
          </li>
        ))}
      </ul>
      <div className="atom-card__actions async-card__actions">
        <button onClick={onRefresh}>데이터 새로고침</button>
        <button onClick={onCompleteAll}>모두 완료 처리</button>
      </div>
    </article>
  );
};

/**
 * @description 비동기 투두 카드 컨테이너
 */
const AsyncTodosCard = ({
  atom,
  version,
  onRefresh,
}: {
  atom: Atom<RemoteTodo[]>;
  version: number;
  onRefresh: () => void;
}) => {
  return (
    <Suspense
      fallback={
        <article className="atom-card atom-card--wide async-card async-card--loading">
          <header className="atom-card__header">
            <h3>createAsyncAtom 데모</h3>
          </header>
          <p className="atom-card__hint">
            비동기 데이터를 불러오는 중입니다...
          </p>
        </article>
      }
    >
      <AsyncTodosCardContent
        atom={atom}
        version={version}
        onRefresh={onRefresh}
      />
    </Suspense>
  );
};

/**
 * @description createAsyncAtom 파생 아톰 카드
 */
const AsyncInsightsCardContent = ({
  insightsAtom,
  teamAtom,
  version,
  onRefresh,
}: {
  insightsAtom: Atom<RemoteAsyncInsights>;
  teamAtom: Atom<RemoteTeamMember[]>;
  version: number;
  onRefresh: () => void;
}) => {
  const [insights] = useAtom(insightsAtom);
  const [team, setTeam] = useAtom(teamAtom);

  const CAPACITY_PRESETS = [
    { label: "여유", capacity: 3 },
    { label: "주의", capacity: 1 },
    { label: "포화", capacity: 0 },
  ] as const;
  const MAX_CAPACITY = 6;

  const resolveStatusLabel = (capacity: number) => {
    if (capacity >= 3) return "여유";
    if (capacity >= 1) return "주의";
    return "포화";
  };

  const onAdjustCapacity = (id: number, delta: number) => {
    setTeam(
      team.map((member) =>
        member.id === id
          ? {
              ...member,
              capacity: Math.max(
                0,
                Math.min(MAX_CAPACITY, member.capacity + delta)
              ),
            }
          : member
      )
    );
  };

  const onSetPreset = (id: number, capacity: number) => {
    setTeam(
      team.map((member) =>
        member.id === id ? { ...member, capacity } : member
      )
    );
  };

  return (
    <article className="atom-card atom-card--wide async-card">
      <header className="atom-card__header">
        <h3>파생 Async Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__hint">
        두 개의 `createAsyncAtom`에서 불러온 데이터를 `createDerivedAtom`으로
        합성해 추천 정보를 계산합니다.
      </p>
      <div className="async-card__stats">
        <span>데이터 버전: v{version + 1}</span>
        <span>팀원 {team.length}명</span>
        <span>
          미완료 {insights.pendingCount} / 완료 {insights.completedCount}
        </span>
      </div>
      {insights.suggestion ? (
        <div className="async-card__summary">
          <strong>{insights.suggestion.assignee.name}</strong>
          <span>{insights.suggestion.message}</span>
          <p>
            <em>{insights.suggestion.todo.title}</em> 작업을 맡으면 좋겠어요.
          </p>
        </div>
      ) : (
        <div className="async-card__summary async-card__summary--success">
          모든 작업이 완료되었습니다! 팀이 휴식을 취해도 좋겠어요.
        </div>
      )}
      <ul className="team-list">
        {insights.teamLoad.map((member) => {
          const statusClass =
            member.status === "여유"
              ? "team-list__status--positive"
              : member.status === "주의"
              ? "team-list__status--warning"
              : "team-list__status--danger";

          return (
            <li key={member.id} className="team-list__item">
              <div className="team-list__meta">
                <strong>{member.name}</strong>
                <span>{member.role}</span>
                <small>{member.focus}</small>
              </div>
              <div className={`team-list__status ${statusClass}`}>
                {member.status} · 여유 {member.capacity}
              </div>
              <div className="team-list__controls">
                <div className="team-list__control-row">
                  <button
                    className="team-list__btn"
                    onClick={() => onAdjustCapacity(member.id, 1)}
                  >
                    + 여유도
                  </button>
                  <button
                    className="team-list__btn"
                    onClick={() => onAdjustCapacity(member.id, -1)}
                  >
                    - 여유도
                  </button>
                </div>
                <div className="team-list__control-row">
                  {CAPACITY_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      className={`team-list__preset${
                        member.status === preset.label
                          ? " team-list__preset--active"
                          : ""
                      }`}
                      onClick={() => onSetPreset(member.id, preset.capacity)}
                    >
                      {preset.label}로 설정
                    </button>
                  ))}
                </div>
                <div className="team-list__hint">
                  현재 상태: {resolveStatusLabel(member.capacity)} / 여유도{" "}
                  {member.capacity}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="atom-card__actions async-card__actions">
        <button onClick={onRefresh}>데이터 새로고침</button>
      </div>
    </article>
  );
};

const AsyncInsightsCard = (props: {
  insightsAtom: Atom<RemoteAsyncInsights>;
  teamAtom: Atom<RemoteTeamMember[]>;
  version: number;
  onRefresh: () => void;
}) => {
  return (
    <Suspense
      fallback={
        <article className="atom-card atom-card--wide async-card async-card--loading">
          <header className="atom-card__header">
            <h3>파생 Async Atom</h3>
          </header>
          <p className="atom-card__hint">
            파생 상태를 계산하기 위한 데이터를 불러오는 중입니다...
          </p>
        </article>
      }
    >
      <AsyncInsightsCardContent {...props} />
    </Suspense>
  );
};

/**
 * @description 비동기 아톰 데모 섹션
 */
const AsyncAtomsSection = () => {
  const [{ version, todosAtom, teamAtom, insightsAtom }, setAsyncState] =
    useState(() => {
      const initialVersion = 0;
      const initialTodosAtom = createRemoteTodosAtom(initialVersion);
      const initialTeamAtom = createRemoteTeamAtom(initialVersion);

      return {
        version: initialVersion,
        todosAtom: initialTodosAtom,
        teamAtom: initialTeamAtom,
        insightsAtom: createRemoteInsightsAtom(
          initialTodosAtom,
          initialTeamAtom
        ),
      };
    });

  const onRefresh = () =>
    setAsyncState((prev) => {
      const nextVersion = prev.version + 1;
      const nextTodosAtom = createRemoteTodosAtom(nextVersion);
      const nextTeamAtom = createRemoteTeamAtom(nextVersion);

      return {
        version: nextVersion,
        todosAtom: nextTodosAtom,
        teamAtom: nextTeamAtom,
        insightsAtom: createRemoteInsightsAtom(nextTodosAtom, nextTeamAtom),
      };
    });

  return (
    <section className="demo-section">
      <header className="demo-section__header">
        <h2>비동기 Atom</h2>
        <p>
          `createAsyncAtom`을 `Suspense`와 함께 사용하는 기본 예제와, 여러
          비동기 Atom을 파생 Atom으로 묶어 추가 정보를 계산하는 예제를 함께
          확인할 수 있습니다.
        </p>
      </header>
      <div className="demo-grid">
        <AsyncTodosCard
          atom={todosAtom}
          version={version}
          onRefresh={onRefresh}
        />
        <AsyncInsightsCard
          insightsAtom={insightsAtom}
          teamAtom={teamAtom}
          version={version}
          onRefresh={onRefresh}
        />
      </div>
    </section>
  );
};

/**
 * @description 카운터 변경 이력 카드 컴포넌트
 */
const CounterHistoryCard = () => {
  const [history] = useAtom($counterHistory);
  const [isSubscribed, setIsSubscribed] = useState(true);

  useEffect(() => {
    if (!isSubscribed) {
      return;
    }

    const unsubscribe = subscribe($counter, (value) => {
      const summary = get($summary);
      const timestamp = new Date().toLocaleTimeString();
      const entry = `${timestamp} → ${value} (다음: ${summary.next})`;
      const current = get($counterHistory);
      const nextHistory = [entry, ...current].slice(0, 8);
      set($counterHistory, nextHistory);
    });

    return () => unsubscribe();
  }, [isSubscribed]);

  const onToggleSubscribe = () => {
    if (isSubscribed) {
      set($counterHistory, []);
    }
    setIsSubscribed((prev) => !prev);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>수동 구독자</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__actions">
        <button onClick={onToggleSubscribe}>
          {isSubscribed ? "구독 해제" : "다시 구독"}
        </button>
      </div>
      <p className="atom-card__hint">
        `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면
        내부 listener Set이 비워집니다.
      </p>
      {isSubscribed ? (
        <ul className="history-list">
          {history.length === 0 && (
            <li className="history-list__empty">아직 변경 이력이 없습니다.</li>
          )}
          {history.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ul>
      ) : (
        <div className="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      )}
    </article>
  );
};

/**
 * @description 배치 업데이트 테스트 데모 컴포넌트
 */
const BatchUpdateDemoCard = () => {
  const renderCount = useRenderCount();
  const [counter] = useAtom($counter);
  const [step] = useAtom($step);
  const [nickname] = useAtom($nickname);

  // 이벤트 핸들러 내에서는 React 18이 자동으로 배칭함
  const handleSyncBatch = () => {
    set($counter, counter + 1);
    set($step, step + 1);
    set($nickname, `업데이트 ${counter + 1}`);
    // React 18에서는 이 세 업데이트가 자동으로 배치되어 한 번의 렌더링만 발생
  };

  // Promise나 setTimeout 내부에서도 React 18은 자동 배칭함
  const handleAsyncBatch = () => {
    setTimeout(() => {
      set($counter, counter + 10);
      set($step, step + 10);
      set($nickname, `비동기 업데이트 ${counter + 10}`);
      // React 18에서는 자동 배칭되어 한 번의 렌더링만 발생
    }, 100);
  };

  // 명시적으로 batch 함수 사용 (선택적)
  const handleExplicitBatch = () => {
    batch(() => {
      set($counter, counter + 100);
      set($step, step + 100);
      set($nickname, `명시적 배치 ${counter + 100}`);
    });
  };

  // 배치 없이 개별 업데이트 (비교용)
  const handleIndividualUpdates = () => {
    // 각 업데이트가 개별적으로 처리되지만, React 18의 자동 배칭으로 인해
    // 여전히 한 번의 렌더링만 발생할 수 있음
    set($counter, counter + 1);
    setTimeout(() => set($step, step + 1), 0);
    setTimeout(() => set($nickname, `개별 업데이트 ${counter + 1}`), 0);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>React 18 배치 업데이트 테스트</h3>
        <span className="render-badge">렌더링 {renderCount}회</span>
      </header>
      <div className="atom-card__value atom-card__value--small">
        <p>
          카운터: <strong>{counter}</strong>
        </p>
        <p>
          스텝: <strong>{step}</strong>
        </p>
        <p>
          닉네임: <strong>{nickname || "(없음)"}</strong>
        </p>
      </div>
      <div className="atom-card__actions">
        <button onClick={handleSyncBatch}>동기 배치 업데이트</button>
        <button onClick={handleAsyncBatch}>비동기 배치 업데이트</button>
        <button onClick={handleExplicitBatch}>명시적 배치 업데이트</button>
        <button onClick={handleIndividualUpdates}>개별 업데이트 (비교용)</button>
      </div>
      <p className="atom-card__hint">
        React 18에서는 이벤트 핸들러, Promise, setTimeout 등에서 여러 상태
        업데이트가 자동으로 배치되어 한 번의 렌더링만 발생합니다. 렌더링 횟수를
        확인하여 배치 업데이트가 제대로 작동하는지 테스트할 수 있습니다.
      </p>
    </article>
  );
};

/**
 * @description 데모 페이지 컴포넌트
 */
const DemoPage = () => {
  return (
    <div className="demo-page">
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>Minimal Global State 데모</h2>
          <p>
            Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
            페이지에서 확인할 수 있습니다.
          </p>
        </header>
        <div className="demo-grid">
          <CounterValueCard />
          <CounterControlsCard />
          <StepSelectorCard />
          <NicknameCard />
          <DerivedCounterCard />
          <SummaryCard />
        </div>
      </section>
      <AsyncAtomsSection />
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>React 18 배치 업데이트 테스트</h2>
          <p>
            React 18의 자동 배칭 기능이 `useSyncExternalStore` 기반의 `useAtom`과
            잘 작동하는지 확인할 수 있습니다. 여러 atom을 동시에 업데이트해도 한
            번의 렌더링만 발생합니다.
          </p>
        </header>
        <BatchUpdateDemoCard />
      </section>
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>구독자 동작 확인</h2>
          <p>
            동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을
            직접 관리하여 GC-friendly하게 동작합니다.
          </p>
        </header>
        <CounterHistoryCard />
      </section>
    </div>
  );
};

export default DemoPage;

```

```typescriptreact
import { Suspense, useEffect, useState } from "react";
import { useAtom } from "sangtae-react";
import useRenderCount from "@/hooks/useRenderCount";
import {
  $counter,
  $counterHistory,
  $doubleCounter,
  $nickname,
  $step,
  $summary,
  createRemoteTodosAtom,
  createRemoteTeamAtom,
  createRemoteInsightsAtom,
  type RemoteAsyncInsights,
  type RemoteTeamMember,
  type RemoteTodo,
} from "@/stores/demo";
import { get, set, subscribe, type Atom } from "sangtae-js";

/**
 * @description 렌더링 횟수를 표시하는 컴포넌트
 */
const RenderBadge = () => {
  const renders = useRenderCount();
  return <span className="render-badge">렌더링 {renders}회</span>;
};

const CounterValueCard = () => {
  const [counter] = useAtom($counter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 값</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{counter}</p>
      <p className="atom-card__hint">
        `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
      </p>
    </article>
  );
};

/**
 * @description 카운터 업데이트 컴포넌트
 */
const CounterControlsCard = () => {
  const [counter, setCounter] = useAtom($counter);
  const [step] = useAtom($step);

  const onIncrease = () => setCounter(counter + step);
  const onDecrease = () => setCounter(counter - step);
  const onReset = () => set($counter, 0);
  const onSetSameValue = () => {
    const current = get($counter);
    set($counter, current);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 업데이트</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value atom-card__value--small">
        현재 값: <strong>{counter}</strong> / 스텝: <strong>{step}</strong>
      </p>
      <div className="atom-card__actions">
        <button onClick={onDecrease}>- 스텝</button>
        <button onClick={onIncrease}>+ 스텝</button>
        <button onClick={onReset}>0으로 초기화</button>
        <button onClick={onSetSameValue}>같은 값으로 set</button>
      </div>
      <p className="atom-card__hint">
        `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시 렌더링되지
        않습니다.
      </p>
    </article>
  );
};

/**
 * @description 스텝 선택 컴포넌트
 */
const StepSelectorCard = () => {
  const [step, setStep] = useAtom($step);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>스텝 Atom</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__options">
        {[1, 5, 10].map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="step"
              value={option}
              checked={step === option}
              onChange={() => setStep(option)}
            />
            {option}
          </label>
        ))}
      </div>
      <p className="atom-card__hint">
        별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인 컴포넌트만
        렌더링됩니다.
      </p>
    </article>
  );
};

/**
 * @description 닉네임 입력 컴포넌트
 */
const NicknameCard = () => {
  const [nickname, setNickname] = useAtom($nickname);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>입력 Atom</h3>
        <RenderBadge />
      </header>
      <input
        className="atom-card__input"
        value={nickname}
        placeholder="닉네임을 입력하세요"
        onChange={({ target }) => setNickname(target.value)}
      />
      <p className="atom-card__hint">
        하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생 상태가
        연결됩니다.
      </p>
    </article>
  );
};

/**
 * @description 파생 카운터 컴포넌트
 */
const DerivedCounterCard = () => {
  const [doubleCount] = useAtom($doubleCounter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>파생 Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{doubleCount}</p>
      <p className="atom-card__hint">
        `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
      </p>
    </article>
  );
};

/**
 * @description 요약 카운터 컴포넌트
 */
const SummaryCard = () => {
  const [summary] = useAtom($summary);

  const onLogSnapshot = () => {
    const snapshot = get($summary);
    console.table(snapshot);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 요약</h3>
        <RenderBadge />
      </header>
      <dl className="atom-card__list">
        <div>
          <dt>현재 값</dt>
          <dd>{summary.counter}</dd>
        </div>
        <div>
          <dt>스텝</dt>
          <dd>{summary.step}</dd>
        </div>
        <div>
          <dt>다음 값</dt>
          <dd>{summary.next}</dd>
        </div>
        <div>
          <dt>메시지</dt>
          <dd>{summary.greeting}</dd>
        </div>
      </dl>
      <button onClick={onLogSnapshot} className="atom-card__log-btn">
        현재 상태 콘솔로 확인
      </button>
      <p className="atom-card__hint">
        `get`을 호출하면 React 컴포넌트 밖에서도 atom 스냅샷을 읽을 수 있습니다.
      </p>
    </article>
  );
};

/**
 * @description 비동기 투두 카드 컴포넌트
 */
const AsyncTodosCardContent = ({
  atom,
  version,
  onRefresh,
}: {
  atom: Atom<RemoteTodo[]>;
  version: number;
  onRefresh: () => void;
}) => {
  const [todos, setTodos] = useAtom(atom);

  const completedCount = todos.filter((todo) => todo.completed).length;

  const onToggleComplete = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const onCompleteAll = () => {
    const isAllCompleted = todos.every(({ completed }) => completed);

    setTodos(
      isAllCompleted
        ? todos
        : todos.map((todo) => ({ ...todo, completed: true }))
    );
  };

  return (
    <article className="atom-card atom-card--wide async-card">
      <header className="atom-card__header">
        <h3>createAsyncAtom 데모</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__hint">
        Promise를 받아 최초 구독 시 `Suspense`를 통해 로딩 상태를 노출합니다.
        이후에는 `set`을 사용해 비동기 데이터도 즉시 수정할 수 있습니다.
      </p>
      <div className="async-card__stats">
        <span>데이터 버전: v{version + 1}</span>
        <span>
          완료 {completedCount}/{todos.length}
        </span>
      </div>
      <ul className="async-card__list">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`async-card__item${
              todo.completed ? " async-card__item--completed" : ""
            }`}
          >
            <div className="async-card__item-main">
              <strong>{todo.title}</strong>
              <p>{todo.description}</p>
            </div>
            <button onClick={() => onToggleComplete(todo.id)}>
              {todo.completed ? "되돌리기" : "완료"}
            </button>
          </li>
        ))}
      </ul>
      <div className="atom-card__actions async-card__actions">
        <button onClick={onRefresh}>데이터 새로고침</button>
        <button onClick={onCompleteAll}>모두 완료 처리</button>
      </div>
    </article>
  );
};

/**
 * @description 비동기 투두 카드 컨테이너
 */
const AsyncTodosCard = ({
  atom,
  version,
  onRefresh,
}: {
  atom: Atom<RemoteTodo[]>;
  version: number;
  onRefresh: () => void;
}) => {
  return (
    <Suspense
      fallback={
        <article className="atom-card atom-card--wide async-card async-card--loading">
          <header className="atom-card__header">
            <h3>createAsyncAtom 데모</h3>
          </header>
          <p className="atom-card__hint">
            비동기 데이터를 불러오는 중입니다...
          </p>
        </article>
      }
    >
      <AsyncTodosCardContent
        atom={atom}
        version={version}
        onRefresh={onRefresh}
      />
    </Suspense>
  );
};

/**
 * @description createAsyncAtom 파생 아톰 카드
 */
const AsyncInsightsCardContent = ({
  insightsAtom,
  teamAtom,
  version,
  onRefresh,
}: {
  insightsAtom: Atom<RemoteAsyncInsights>;
  teamAtom: Atom<RemoteTeamMember[]>;
  version: number;
  onRefresh: () => void;
}) => {
  const [insights] = useAtom(insightsAtom);
  const [team, setTeam] = useAtom(teamAtom);

  const CAPACITY_PRESETS = [
    { label: "여유", capacity: 3 },
    { label: "주의", capacity: 1 },
    { label: "포화", capacity: 0 },
  ] as const;
  const MAX_CAPACITY = 6;

  const resolveStatusLabel = (capacity: number) => {
    if (capacity >= 3) return "여유";
    if (capacity >= 1) return "주의";
    return "포화";
  };

  const onAdjustCapacity = (id: number, delta: number) => {
    setTeam(
      team.map((member) =>
        member.id === id
          ? {
              ...member,
              capacity: Math.max(
                0,
                Math.min(MAX_CAPACITY, member.capacity + delta)
              ),
            }
          : member
      )
    );
  };

  const onSetPreset = (id: number, capacity: number) => {
    setTeam(
      team.map((member) =>
        member.id === id ? { ...member, capacity } : member
      )
    );
  };

  return (
    <article className="atom-card atom-card--wide async-card">
      <header className="atom-card__header">
        <h3>파생 Async Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__hint">
        두 개의 `createAsyncAtom`에서 불러온 데이터를 `createDerivedAtom`으로
        합성해 추천 정보를 계산합니다.
      </p>
      <div className="async-card__stats">
        <span>데이터 버전: v{version + 1}</span>
        <span>팀원 {team.length}명</span>
        <span>
          미완료 {insights.pendingCount} / 완료 {insights.completedCount}
        </span>
      </div>
      {insights.suggestion ? (
        <div className="async-card__summary">
          <strong>{insights.suggestion.assignee.name}</strong>
          <span>{insights.suggestion.message}</span>
          <p>
            <em>{insights.suggestion.todo.title}</em> 작업을 맡으면 좋겠어요.
          </p>
        </div>
      ) : (
        <div className="async-card__summary async-card__summary--success">
          모든 작업이 완료되었습니다! 팀이 휴식을 취해도 좋겠어요.
        </div>
      )}
      <ul className="team-list">
        {insights.teamLoad.map((member) => {
          const statusClass =
            member.status === "여유"
              ? "team-list__status--positive"
              : member.status === "주의"
              ? "team-list__status--warning"
              : "team-list__status--danger";

          return (
            <li key={member.id} className="team-list__item">
              <div className="team-list__meta">
                <strong>{member.name}</strong>
                <span>{member.role}</span>
                <small>{member.focus}</small>
              </div>
              <div className={`team-list__status ${statusClass}`}>
                {member.status} · 여유 {member.capacity}
              </div>
              <div className="team-list__controls">
                <div className="team-list__control-row">
                  <button
                    className="team-list__btn"
                    onClick={() => onAdjustCapacity(member.id, 1)}
                  >
                    + 여유도
                  </button>
                  <button
                    className="team-list__btn"
                    onClick={() => onAdjustCapacity(member.id, -1)}
                  >
                    - 여유도
                  </button>
                </div>
                <div className="team-list__control-row">
                  {CAPACITY_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      className={`team-list__preset${
                        member.status === preset.label
                          ? " team-list__preset--active"
                          : ""
                      }`}
                      onClick={() => onSetPreset(member.id, preset.capacity)}
                    >
                      {preset.label}로 설정
                    </button>
                  ))}
                </div>
                <div className="team-list__hint">
                  현재 상태: {resolveStatusLabel(member.capacity)} / 여유도{" "}
                  {member.capacity}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="atom-card__actions async-card__actions">
        <button onClick={onRefresh}>데이터 새로고침</button>
      </div>
    </article>
  );
};

const AsyncInsightsCard = (props: {
  insightsAtom: Atom<RemoteAsyncInsights>;
  teamAtom: Atom<RemoteTeamMember[]>;
  version: number;
  onRefresh: () => void;
}) => {
  return (
    <Suspense
      fallback={
        <article className="atom-card atom-card--wide async-card async-card--loading">
          <header className="atom-card__header">
            <h3>파생 Async Atom</h3>
          </header>
          <p className="atom-card__hint">
            파생 상태를 계산하기 위한 데이터를 불러오는 중입니다...
          </p>
        </article>
      }
    >
      <AsyncInsightsCardContent {...props} />
    </Suspense>
  );
};

/**
 * @description 비동기 아톰 데모 섹션
 */
const AsyncAtomsSection = () => {
  const [{ version, todosAtom, teamAtom, insightsAtom }, setAsyncState] =
    useState(() => {
      const initialVersion = 0;
      const initialTodosAtom = createRemoteTodosAtom(initialVersion);
      const initialTeamAtom = createRemoteTeamAtom(initialVersion);

      return {
        version: initialVersion,
        todosAtom: initialTodosAtom,
        teamAtom: initialTeamAtom,
        insightsAtom: createRemoteInsightsAtom(
          initialTodosAtom,
          initialTeamAtom
        ),
      };
    });

  const onRefresh = () =>
    setAsyncState((prev) => {
      const nextVersion = prev.version + 1;
      const nextTodosAtom = createRemoteTodosAtom(nextVersion);
      const nextTeamAtom = createRemoteTeamAtom(nextVersion);

      return {
        version: nextVersion,
        todosAtom: nextTodosAtom,
        teamAtom: nextTeamAtom,
        insightsAtom: createRemoteInsightsAtom(nextTodosAtom, nextTeamAtom),
      };
    });

  return (
    <section className="demo-section">
      <header className="demo-section__header">
        <h2>비동기 Atom</h2>
        <p>
          `createAsyncAtom`을 `Suspense`와 함께 사용하는 기본 예제와, 여러
          비동기 Atom을 파생 Atom으로 묶어 추가 정보를 계산하는 예제를 함께
          확인할 수 있습니다.
        </p>
      </header>
      <div className="demo-grid">
        <AsyncTodosCard
          atom={todosAtom}
          version={version}
          onRefresh={onRefresh}
        />
        <AsyncInsightsCard
          insightsAtom={insightsAtom}
          teamAtom={teamAtom}
          version={version}
          onRefresh={onRefresh}
        />
      </div>
    </section>
  );
};

/**
 * @description 카운터 변경 이력 카드 컴포넌트
 */
const CounterHistoryCard = () => {
  const [history] = useAtom($counterHistory);
  const [isSubscribed, setIsSubscribed] = useState(true);

  useEffect(() => {
    if (!isSubscribed) {
      return;
    }

    const unsubscribe = subscribe($counter, (value) => {
      const summary = get($summary);
      const timestamp = new Date().toLocaleTimeString();
      const entry = `${timestamp} → ${value} (다음: ${summary.next})`;
      const current = get($counterHistory);
      const nextHistory = [entry, ...current].slice(0, 8);
      set($counterHistory, nextHistory);
    });

    return () => unsubscribe();
  }, [isSubscribed]);

  const onToggleSubscribe = () => {
    if (isSubscribed) {
      set($counterHistory, []);
    }
    setIsSubscribed((prev) => !prev);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>수동 구독자</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__actions">
        <button onClick={onToggleSubscribe}>
          {isSubscribed ? "구독 해제" : "다시 구독"}
        </button>
      </div>
      <p className="atom-card__hint">
        `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면
        내부 listener Set이 비워집니다.
      </p>
      {isSubscribed ? (
        <ul className="history-list">
          {history.length === 0 && (
            <li className="history-list__empty">아직 변경 이력이 없습니다.</li>
          )}
          {history.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ul>
      ) : (
        <div className="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      )}
    </article>
  );
};

/**
 * @description 배치 업데이트 테스트 데모 컴포넌트
 */
const BatchUpdateDemoCard = () => {
  const renderCount = useRenderCount();
  const [counter] = useAtom($counter);
  const [step] = useAtom($step);
  const [nickname] = useAtom($nickname);

  // 이벤트 핸들러 내에서는 React 18이 자동으로 배칭함
  const handleSyncBatch = () => {
    set($counter, counter + 1);
    set($step, step + 1);
    set($nickname, `업데이트 ${counter + 1}`);
    // React 18에서는 이 세 업데이트가 자동으로 배치되어 한 번의 렌더링만 발생
  };

  // Promise나 setTimeout 내부에서도 React 18은 자동 배칭함
  const handleAsyncBatch = () => {
    setTimeout(() => {
      set($counter, counter + 10);
      set($step, step + 10);
      set($nickname, `비동기 업데이트 ${counter + 10}`);
      // React 18에서는 자동 배칭되어 한 번의 렌더링만 발생
    }, 100);
  };

  // 명시적으로 batch 함수 사용 (선택적)
  const handleExplicitBatch = () => {
    batch(() => {
      set($counter, counter + 100);
      set($step, step + 100);
      set($nickname, `명시적 배치 ${counter + 100}`);
    });
  };

  // 배치 없이 개별 업데이트 (비교용)
  const handleIndividualUpdates = () => {
    // 각 업데이트가 개별적으로 처리되지만, React 18의 자동 배칭으로 인해
    // 여전히 한 번의 렌더링만 발생할 수 있음
    set($counter, counter + 1);
    setTimeout(() => set($step, step + 1), 0);
    setTimeout(() => set($nickname, `개별 업데이트 ${counter + 1}`), 0);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>React 18 배치 업데이트 테스트</h3>
        <span className="render-badge">렌더링 {renderCount}회</span>
      </header>
      <div className="atom-card__value atom-card__value--small">
        <p>
          카운터: <strong>{counter}</strong>
        </p>
        <p>
          스텝: <strong>{step}</strong>
        </p>
        <p>
          닉네임: <strong>{nickname || "(없음)"}</strong>
        </p>
      </div>
      <div className="atom-card__actions">
        <button onClick={handleSyncBatch}>동기 배치 업데이트</button>
        <button onClick={handleAsyncBatch}>비동기 배치 업데이트</button>
        <button onClick={handleExplicitBatch}>명시적 배치 업데이트</button>
        <button onClick={handleIndividualUpdates}>개별 업데이트 (비교용)</button>
      </div>
      <p className="atom-card__hint">
        React 18에서는 이벤트 핸들러, Promise, setTimeout 등에서 여러 상태
        업데이트가 자동으로 배치되어 한 번의 렌더링만 발생합니다. 렌더링 횟수를
        확인하여 배치 업데이트가 제대로 작동하는지 테스트할 수 있습니다.
      </p>
    </article>
  );
};

/**
 * @description 데모 페이지 컴포넌트
 */
const DemoPage = () => {
  return (
    <div className="demo-page">
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>Minimal Global State 데모</h2>
          <p>
            Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
            페이지에서 확인할 수 있습니다.
          </p>
        </header>
        <div className="demo-grid">
          <CounterValueCard />
          <CounterControlsCard />
          <StepSelectorCard />
          <NicknameCard />
          <DerivedCounterCard />
          <SummaryCard />
        </div>
      </section>
      <AsyncAtomsSection />
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>React 18 배치 업데이트 테스트</h2>
          <p>
            React 18의 자동 배칭 기능이 `useSyncExternalStore` 기반의 `useAtom`과
            잘 작동하는지 확인할 수 있습니다. 여러 atom을 동시에 업데이트해도 한
            번의 렌더링만 발생합니다.
          </p>
        </header>
        <BatchUpdateDemoCard />
      </section>
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>구독자 동작 확인</h2>
          <p>
            동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을
            직접 관리하여 GC-friendly하게 동작합니다.
          </p>
        </header>
        <CounterHistoryCard />
      </section>
    </div>
  );
};

export default DemoPage;

```

```typescriptreact
import { Suspense, useEffect, useState } from "react";
import { useAtom } from "sangtae-react";
import useRenderCount from "@/hooks/useRenderCount";
import {
  $counter,
  $counterHistory,
  $doubleCounter,
  $nickname,
  $step,
  $summary,
  createRemoteTodosAtom,
  createRemoteTeamAtom,
  createRemoteInsightsAtom,
  type RemoteAsyncInsights,
  type RemoteTeamMember,
  type RemoteTodo,
} from "@/stores/demo";
import { get, set, subscribe, type Atom } from "sangtae-js";

/**
 * @description 렌더링 횟수를 표시하는 컴포넌트
 */
const RenderBadge = () => {
  const renders = useRenderCount();
  return <span className="render-badge">렌더링 {renders}회</span>;
};

const CounterValueCard = () => {
  const [counter] = useAtom($counter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 값</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{counter}</p>
      <p className="atom-card__hint">
        `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
      </p>
    </article>
  );
};

/**
 * @description 카운터 업데이트 컴포넌트
 */
const CounterControlsCard = () => {
  const [counter, setCounter] = useAtom($counter);
  const [step] = useAtom($step);

  const onIncrease = () => setCounter(counter + step);
  const onDecrease = () => setCounter(counter - step);
  const onReset = () => set($counter, 0);
  const onSetSameValue = () => {
    const current = get($counter);
    set($counter, current);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 업데이트</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value atom-card__value--small">
        현재 값: <strong>{counter}</strong> / 스텝: <strong>{step}</strong>
      </p>
      <div className="atom-card__actions">
        <button onClick={onDecrease}>- 스텝</button>
        <button onClick={onIncrease}>+ 스텝</button>
        <button onClick={onReset}>0으로 초기화</button>
        <button onClick={onSetSameValue}>같은 값으로 set</button>
      </div>
      <p className="atom-card__hint">
        `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시 렌더링되지
        않습니다.
      </p>
    </article>
  );
};

/**
 * @description 스텝 선택 컴포넌트
 */
const StepSelectorCard = () => {
  const [step, setStep] = useAtom($step);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>스텝 Atom</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__options">
        {[1, 5, 10].map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="step"
              value={option}
              checked={step === option}
              onChange={() => setStep(option)}
            />
            {option}
          </label>
        ))}
      </div>
      <p className="atom-card__hint">
        별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인 컴포넌트만
        렌더링됩니다.
      </p>
    </article>
  );
};

/**
 * @description 닉네임 입력 컴포넌트
 */
const NicknameCard = () => {
  const [nickname, setNickname] = useAtom($nickname);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>입력 Atom</h3>
        <RenderBadge />
      </header>
      <input
        className="atom-card__input"
        value={nickname}
        placeholder="닉네임을 입력하세요"
        onChange={({ target }) => setNickname(target.value)}
      />
      <p className="atom-card__hint">
        하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생 상태가
        연결됩니다.
      </p>
    </article>
  );
};

/**
 * @description 파생 카운터 컴포넌트
 */
const DerivedCounterCard = () => {
  const [doubleCount] = useAtom($doubleCounter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>파생 Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{doubleCount}</p>
      <p className="atom-card__hint">
        `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
      </p>
    </article>
  );
};

/**
 * @description 요약 카운터 컴포넌트
 */
const SummaryCard = () => {
  const [summary] = useAtom($summary);

  const onLogSnapshot = () => {
    const snapshot = get($summary);
    console.table(snapshot);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 요약</h3>
        <RenderBadge />
      </header>
      <dl className="atom-card__list">
        <div>
          <dt>현재 값</dt>
          <dd>{summary.counter}</dd>
        </div>
        <div>
          <dt>스텝</dt>
          <dd>{summary.step}</dd>
        </div>
        <div>
          <dt>다음 값</dt>
          <dd>{summary.next}</dd>
        </div>
        <div>
          <dt>메시지</dt>
          <dd>{summary.greeting}</dd>
        </div>
      </dl>
      <button onClick={onLogSnapshot} className="atom-card__log-btn">
        현재 상태 콘솔로 확인
      </button>
      <p className="atom-card__hint">
        `get`을 호출하면 React 컴포넌트 밖에서도 atom 스냅샷을 읽을 수 있습니다.
      </p>
    </article>
  );
};

/**
 * @description 비동기 투두 카드 컴포넌트
 */
const AsyncTodosCardContent = ({
  atom,
  version,
  onRefresh,
}: {
  atom: Atom<RemoteTodo[]>;
  version: number;
  onRefresh: () => void;
}) => {
  const [todos, setTodos] = useAtom(atom);

  const completedCount = todos.filter((todo) => todo.completed).length;

  const onToggleComplete = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const onCompleteAll = () => {
    const isAllCompleted = todos.every(({ completed }) => completed);

    setTodos(
      isAllCompleted
        ? todos
        : todos.map((todo) => ({ ...todo, completed: true }))
    );
  };

  return (
    <article className="atom-card atom-card--wide async-card">
      <header className="atom-card__header">
        <h3>createAsyncAtom 데모</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__hint">
        Promise를 받아 최초 구독 시 `Suspense`를 통해 로딩 상태를 노출합니다.
        이후에는 `set`을 사용해 비동기 데이터도 즉시 수정할 수 있습니다.
      </p>
      <div className="async-card__stats">
        <span>데이터 버전: v{version + 1}</span>
        <span>
          완료 {completedCount}/{todos.length}
        </span>
      </div>
      <ul className="async-card__list">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`async-card__item${
              todo.completed ? " async-card__item--completed" : ""
            }`}
          >
            <div className="async-card__item-main">
              <strong>{todo.title}</strong>
              <p>{todo.description}</p>
            </div>
            <button onClick={() => onToggleComplete(todo.id)}>
              {todo.completed ? "되돌리기" : "완료"}
            </button>
          </li>
        ))}
      </ul>
      <div className="atom-card__actions async-card__actions">
        <button onClick={onRefresh}>데이터 새로고침</button>
        <button onClick={onCompleteAll}>모두 완료 처리</button>
      </div>
    </article>
  );
};

/**
 * @description 비동기 투두 카드 컨테이너
 */
const AsyncTodosCard = ({
  atom,
  version,
  onRefresh,
}: {
  atom: Atom<RemoteTodo[]>;
  version: number;
  onRefresh: () => void;
}) => {
  return (
    <Suspense
      fallback={
        <article className="atom-card atom-card--wide async-card async-card--loading">
          <header className="atom-card__header">
            <h3>createAsyncAtom 데모</h3>
          </header>
          <p className="atom-card__hint">
            비동기 데이터를 불러오는 중입니다...
          </p>
        </article>
      }
    >
      <AsyncTodosCardContent
        atom={atom}
        version={version}
        onRefresh={onRefresh}
      />
    </Suspense>
  );
};

/**
 * @description createAsyncAtom 파생 아톰 카드
 */
const AsyncInsightsCardContent = ({
  insightsAtom,
  teamAtom,
  version,
  onRefresh,
}: {
  insightsAtom: Atom<RemoteAsyncInsights>;
  teamAtom: Atom<RemoteTeamMember[]>;
  version: number;
  onRefresh: () => void;
}) => {
  const [insights] = useAtom(insightsAtom);
  const [team, setTeam] = useAtom(teamAtom);

  const CAPACITY_PRESETS = [
    { label: "여유", capacity: 3 },
    { label: "주의", capacity: 1 },
    { label: "포화", capacity: 0 },
  ] as const;
  const MAX_CAPACITY = 6;

  const resolveStatusLabel = (capacity: number) => {
    if (capacity >= 3) return "여유";
    if (capacity >= 1) return "주의";
    return "포화";
  };

  const onAdjustCapacity = (id: number, delta: number) => {
    setTeam(
      team.map((member) =>
        member.id === id
          ? {
              ...member,
              capacity: Math.max(
                0,
                Math.min(MAX_CAPACITY, member.capacity + delta)
              ),
            }
          : member
      )
    );
  };

  const onSetPreset = (id: number, capacity: number) => {
    setTeam(
      team.map((member) =>
        member.id === id ? { ...member, capacity } : member
      )
    );
  };

  return (
    <article className="atom-card atom-card--wide async-card">
      <header className="atom-card__header">
        <h3>파생 Async Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__hint">
        두 개의 `createAsyncAtom`에서 불러온 데이터를 `createDerivedAtom`으로
        합성해 추천 정보를 계산합니다.
      </p>
      <div className="async-card__stats">
        <span>데이터 버전: v{version + 1}</span>
        <span>팀원 {team.length}명</span>
        <span>
          미완료 {insights.pendingCount} / 완료 {insights.completedCount}
        </span>
      </div>
      {insights.suggestion ? (
        <div className="async-card__summary">
          <strong>{insights.suggestion.assignee.name}</strong>
          <span>{insights.suggestion.message}</span>
          <p>
            <em>{insights.suggestion.todo.title}</em> 작업을 맡으면 좋겠어요.
          </p>
        </div>
      ) : (
        <div className="async-card__summary async-card__summary--success">
          모든 작업이 완료되었습니다! 팀이 휴식을 취해도 좋겠어요.
        </div>
      )}
      <ul className="team-list">
        {insights.teamLoad.map((member) => {
          const statusClass =
            member.status === "여유"
              ? "team-list__status--positive"
              : member.status === "주의"
              ? "team-list__status--warning"
              : "team-list__status--danger";

          return (
            <li key={member.id} className="team-list__item">
              <div className="team-list__meta">
                <strong>{member.name}</strong>
                <span>{member.role}</span>
                <small>{member.focus}</small>
              </div>
              <div className={`team-list__status ${statusClass}`}>
                {member.status} · 여유 {member.capacity}
              </div>
              <div className="team-list__controls">
                <div className="team-list__control-row">
                  <button
                    className="team-list__btn"
                    onClick={() => onAdjustCapacity(member.id, 1)}
                  >
                    + 여유도
                  </button>
                  <button
                    className="team-list__btn"
                    onClick={() => onAdjustCapacity(member.id, -1)}
                  >
                    - 여유도
                  </button>
                </div>
                <div className="team-list__control-row">
                  {CAPACITY_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      className={`team-list__preset${
                        member.status === preset.label
                          ? " team-list__preset--active"
                          : ""
                      }`}
                      onClick={() => onSetPreset(member.id, preset.capacity)}
                    >
                      {preset.label}로 설정
                    </button>
                  ))}
                </div>
                <div className="team-list__hint">
                  현재 상태: {resolveStatusLabel(member.capacity)} / 여유도{" "}
                  {member.capacity}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="atom-card__actions async-card__actions">
        <button onClick={onRefresh}>데이터 새로고침</button>
      </div>
    </article>
  );
};

const AsyncInsightsCard = (props: {
  insightsAtom: Atom<RemoteAsyncInsights>;
  teamAtom: Atom<RemoteTeamMember[]>;
  version: number;
  onRefresh: () => void;
}) => {
  return (
    <Suspense
      fallback={
        <article className="atom-card atom-card--wide async-card async-card--loading">
          <header className="atom-card__header">
            <h3>파생 Async Atom</h3>
          </header>
          <p className="atom-card__hint">
            파생 상태를 계산하기 위한 데이터를 불러오는 중입니다...
          </p>
        </article>
      }
    >
      <AsyncInsightsCardContent {...props} />
    </Suspense>
  );
};

/**
 * @description 비동기 아톰 데모 섹션
 */
const AsyncAtomsSection = () => {
  const [{ version, todosAtom, teamAtom, insightsAtom }, setAsyncState] =
    useState(() => {
      const initialVersion = 0;
      const initialTodosAtom = createRemoteTodosAtom(initialVersion);
      const initialTeamAtom = createRemoteTeamAtom(initialVersion);

      return {
        version: initialVersion,
        todosAtom: initialTodosAtom,
        teamAtom: initialTeamAtom,
        insightsAtom: createRemoteInsightsAtom(
          initialTodosAtom,
          initialTeamAtom
        ),
      };
    });

  const onRefresh = () =>
    setAsyncState((prev) => {
      const nextVersion = prev.version + 1;
      const nextTodosAtom = createRemoteTodosAtom(nextVersion);
      const nextTeamAtom = createRemoteTeamAtom(nextVersion);

      return {
        version: nextVersion,
        todosAtom: nextTodosAtom,
        teamAtom: nextTeamAtom,
        insightsAtom: createRemoteInsightsAtom(nextTodosAtom, nextTeamAtom),
      };
    });

  return (
    <section className="demo-section">
      <header className="demo-section__header">
        <h2>비동기 Atom</h2>
        <p>
          `createAsyncAtom`을 `Suspense`와 함께 사용하는 기본 예제와, 여러
          비동기 Atom을 파생 Atom으로 묶어 추가 정보를 계산하는 예제를 함께
          확인할 수 있습니다.
        </p>
      </header>
      <div className="demo-grid">
        <AsyncTodosCard
          atom={todosAtom}
          version={version}
          onRefresh={onRefresh}
        />
        <AsyncInsightsCard
          insightsAtom={insightsAtom}
          teamAtom={teamAtom}
          version={version}
          onRefresh={onRefresh}
        />
      </div>
    </section>
  );
};

/**
 * @description 카운터 변경 이력 카드 컴포넌트
 */
const CounterHistoryCard = () => {
  const [history] = useAtom($counterHistory);
  const [isSubscribed, setIsSubscribed] = useState(true);

  useEffect(() => {
    if (!isSubscribed) {
      return;
    }

    const unsubscribe = subscribe($counter, (value) => {
      const summary = get($summary);
      const timestamp = new Date().toLocaleTimeString();
      const entry = `${timestamp} → ${value} (다음: ${summary.next})`;
      const current = get($counterHistory);
      const nextHistory = [entry, ...current].slice(0, 8);
      set($counterHistory, nextHistory);
    });

    return () => unsubscribe();
  }, [isSubscribed]);

  const onToggleSubscribe = () => {
    if (isSubscribed) {
      set($counterHistory, []);
    }
    setIsSubscribed((prev) => !prev);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>수동 구독자</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__actions">
        <button onClick={onToggleSubscribe}>
          {isSubscribed ? "구독 해제" : "다시 구독"}
        </button>
      </div>
      <p className="atom-card__hint">
        `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면
        내부 listener Set이 비워집니다.
      </p>
      {isSubscribed ? (
        <ul className="history-list">
          {history.length === 0 && (
            <li className="history-list__empty">아직 변경 이력이 없습니다.</li>
          )}
          {history.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ul>
      ) : (
        <div className="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      )}
    </article>
  );
};

/**
 * @description 배치 업데이트 테스트 데모 컴포넌트
 */
const BatchUpdateDemoCard = () => {
  const renderCount = useRenderCount();
  const [counter] = useAtom($counter);
  const [step] = useAtom($step);
  const [nickname] = useAtom($nickname);

  // 이벤트 핸들러 내에서는 React 18이 자동으로 배칭함
  const handleSyncBatch = () => {
    set($counter, counter + 1);
    set($step, step + 1);
    set($nickname, `업데이트 ${counter + 1}`);
    // React 18에서는 이 세 업데이트가 자동으로 배치되어 한 번의 렌더링만 발생
  };

  // Promise나 setTimeout 내부에서도 React 18은 자동 배칭함
  const handleAsyncBatch = () => {
    setTimeout(() => {
      set($counter, counter + 10);
      set($step, step + 10);
      set($nickname, `비동기 업데이트 ${counter + 10}`);
      // React 18에서는 자동 배칭되어 한 번의 렌더링만 발생
    }, 100);
  };

  // 여러 atom을 동시에 업데이트 (React 18 자동 배칭)
  const handleMultipleUpdates = () => {
    set($counter, counter + 100);
    set($step, step + 100);
    set($nickname, `다중 업데이트 ${counter + 100}`);
    // React 18에서는 자동 배칭되어 한 번의 렌더링만 발생
  };

  // 배치 없이 개별 업데이트 (비교용)
  const handleIndividualUpdates = () => {
    // 각 업데이트가 개별적으로 처리되지만, React 18의 자동 배칭으로 인해
    // 여전히 한 번의 렌더링만 발생할 수 있음
    set($counter, counter + 1);
    setTimeout(() => set($step, step + 1), 0);
    setTimeout(() => set($nickname, `개별 업데이트 ${counter + 1}`), 0);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>React 18 배치 업데이트 테스트</h3>
        <span className="render-badge">렌더링 {renderCount}회</span>
      </header>
      <div className="atom-card__value atom-card__value--small">
        <p>
          카운터: <strong>{counter}</strong>
        </p>
        <p>
          스텝: <strong>{step}</strong>
        </p>
        <p>
          닉네임: <strong>{nickname || "(없음)"}</strong>
        </p>
      </div>
      <div className="atom-card__actions">
        <button onClick={handleSyncBatch}>동기 배치 업데이트</button>
        <button onClick={handleAsyncBatch}>비동기 배치 업데이트</button>
        <button onClick={handleExplicitBatch}>명시적 배치 업데이트</button>
        <button onClick={handleIndividualUpdates}>개별 업데이트 (비교용)</button>
      </div>
      <p className="atom-card__hint">
        React 18에서는 이벤트 핸들러, Promise, setTimeout 등에서 여러 상태
        업데이트가 자동으로 배치되어 한 번의 렌더링만 발생합니다. 렌더링 횟수를
        확인하여 배치 업데이트가 제대로 작동하는지 테스트할 수 있습니다.
      </p>
    </article>
  );
};

/**
 * @description 데모 페이지 컴포넌트
 */
const DemoPage = () => {
  return (
    <div className="demo-page">
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>Minimal Global State 데모</h2>
          <p>
            Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
            페이지에서 확인할 수 있습니다.
          </p>
        </header>
        <div className="demo-grid">
          <CounterValueCard />
          <CounterControlsCard />
          <StepSelectorCard />
          <NicknameCard />
          <DerivedCounterCard />
          <SummaryCard />
        </div>
      </section>
      <AsyncAtomsSection />
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>React 18 배치 업데이트 테스트</h2>
          <p>
            React 18의 자동 배칭 기능이 `useSyncExternalStore` 기반의 `useAtom`과
            잘 작동하는지 확인할 수 있습니다. 여러 atom을 동시에 업데이트해도 한
            번의 렌더링만 발생합니다.
          </p>
        </header>
        <BatchUpdateDemoCard />
      </section>
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>구독자 동작 확인</h2>
          <p>
            동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을
            직접 관리하여 GC-friendly하게 동작합니다.
          </p>
        </header>
        <CounterHistoryCard />
      </section>
    </div>
  );
};

export default DemoPage;

```

```typescriptreact
import { Suspense, useEffect, useState } from "react";
import { useAtom } from "sangtae-react";
import useRenderCount from "@/hooks/useRenderCount";
import {
  $counter,
  $counterHistory,
  $doubleCounter,
  $nickname,
  $step,
  $summary,
  createRemoteTodosAtom,
  createRemoteTeamAtom,
  createRemoteInsightsAtom,
  type RemoteAsyncInsights,
  type RemoteTeamMember,
  type RemoteTodo,
} from "@/stores/demo";
import { get, set, subscribe, type Atom } from "sangtae-js";

/**
 * @description 렌더링 횟수를 표시하는 컴포넌트
 */
const RenderBadge = () => {
  const renders = useRenderCount();
  return <span className="render-badge">렌더링 {renders}회</span>;
};

const CounterValueCard = () => {
  const [counter] = useAtom($counter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 값</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{counter}</p>
      <p className="atom-card__hint">
        `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
      </p>
    </article>
  );
};

/**
 * @description 카운터 업데이트 컴포넌트
 */
const CounterControlsCard = () => {
  const [counter, setCounter] = useAtom($counter);
  const [step] = useAtom($step);

  const onIncrease = () => setCounter(counter + step);
  const onDecrease = () => setCounter(counter - step);
  const onReset = () => set($counter, 0);
  const onSetSameValue = () => {
    const current = get($counter);
    set($counter, current);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 업데이트</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value atom-card__value--small">
        현재 값: <strong>{counter}</strong> / 스텝: <strong>{step}</strong>
      </p>
      <div className="atom-card__actions">
        <button onClick={onDecrease}>- 스텝</button>
        <button onClick={onIncrease}>+ 스텝</button>
        <button onClick={onReset}>0으로 초기화</button>
        <button onClick={onSetSameValue}>같은 값으로 set</button>
      </div>
      <p className="atom-card__hint">
        `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시 렌더링되지
        않습니다.
      </p>
    </article>
  );
};

/**
 * @description 스텝 선택 컴포넌트
 */
const StepSelectorCard = () => {
  const [step, setStep] = useAtom($step);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>스텝 Atom</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__options">
        {[1, 5, 10].map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="step"
              value={option}
              checked={step === option}
              onChange={() => setStep(option)}
            />
            {option}
          </label>
        ))}
      </div>
      <p className="atom-card__hint">
        별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인 컴포넌트만
        렌더링됩니다.
      </p>
    </article>
  );
};

/**
 * @description 닉네임 입력 컴포넌트
 */
const NicknameCard = () => {
  const [nickname, setNickname] = useAtom($nickname);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>입력 Atom</h3>
        <RenderBadge />
      </header>
      <input
        className="atom-card__input"
        value={nickname}
        placeholder="닉네임을 입력하세요"
        onChange={({ target }) => setNickname(target.value)}
      />
      <p className="atom-card__hint">
        하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생 상태가
        연결됩니다.
      </p>
    </article>
  );
};

/**
 * @description 파생 카운터 컴포넌트
 */
const DerivedCounterCard = () => {
  const [doubleCount] = useAtom($doubleCounter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>파생 Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{doubleCount}</p>
      <p className="atom-card__hint">
        `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
      </p>
    </article>
  );
};

/**
 * @description 요약 카운터 컴포넌트
 */
const SummaryCard = () => {
  const [summary] = useAtom($summary);

  const onLogSnapshot = () => {
    const snapshot = get($summary);
    console.table(snapshot);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 요약</h3>
        <RenderBadge />
      </header>
      <dl className="atom-card__list">
        <div>
          <dt>현재 값</dt>
          <dd>{summary.counter}</dd>
        </div>
        <div>
          <dt>스텝</dt>
          <dd>{summary.step}</dd>
        </div>
        <div>
          <dt>다음 값</dt>
          <dd>{summary.next}</dd>
        </div>
        <div>
          <dt>메시지</dt>
          <dd>{summary.greeting}</dd>
        </div>
      </dl>
      <button onClick={onLogSnapshot} className="atom-card__log-btn">
        현재 상태 콘솔로 확인
      </button>
      <p className="atom-card__hint">
        `get`을 호출하면 React 컴포넌트 밖에서도 atom 스냅샷을 읽을 수 있습니다.
      </p>
    </article>
  );
};

/**
 * @description 비동기 투두 카드 컴포넌트
 */
const AsyncTodosCardContent = ({
  atom,
  version,
  onRefresh,
}: {
  atom: Atom<RemoteTodo[]>;
  version: number;
  onRefresh: () => void;
}) => {
  const [todos, setTodos] = useAtom(atom);

  const completedCount = todos.filter((todo) => todo.completed).length;

  const onToggleComplete = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const onCompleteAll = () => {
    const isAllCompleted = todos.every(({ completed }) => completed);

    setTodos(
      isAllCompleted
        ? todos
        : todos.map((todo) => ({ ...todo, completed: true }))
    );
  };

  return (
    <article className="atom-card atom-card--wide async-card">
      <header className="atom-card__header">
        <h3>createAsyncAtom 데모</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__hint">
        Promise를 받아 최초 구독 시 `Suspense`를 통해 로딩 상태를 노출합니다.
        이후에는 `set`을 사용해 비동기 데이터도 즉시 수정할 수 있습니다.
      </p>
      <div className="async-card__stats">
        <span>데이터 버전: v{version + 1}</span>
        <span>
          완료 {completedCount}/{todos.length}
        </span>
      </div>
      <ul className="async-card__list">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`async-card__item${
              todo.completed ? " async-card__item--completed" : ""
            }`}
          >
            <div className="async-card__item-main">
              <strong>{todo.title}</strong>
              <p>{todo.description}</p>
            </div>
            <button onClick={() => onToggleComplete(todo.id)}>
              {todo.completed ? "되돌리기" : "완료"}
            </button>
          </li>
        ))}
      </ul>
      <div className="atom-card__actions async-card__actions">
        <button onClick={onRefresh}>데이터 새로고침</button>
        <button onClick={onCompleteAll}>모두 완료 처리</button>
      </div>
    </article>
  );
};

/**
 * @description 비동기 투두 카드 컨테이너
 */
const AsyncTodosCard = ({
  atom,
  version,
  onRefresh,
}: {
  atom: Atom<RemoteTodo[]>;
  version: number;
  onRefresh: () => void;
}) => {
  return (
    <Suspense
      fallback={
        <article className="atom-card atom-card--wide async-card async-card--loading">
          <header className="atom-card__header">
            <h3>createAsyncAtom 데모</h3>
          </header>
          <p className="atom-card__hint">
            비동기 데이터를 불러오는 중입니다...
          </p>
        </article>
      }
    >
      <AsyncTodosCardContent
        atom={atom}
        version={version}
        onRefresh={onRefresh}
      />
    </Suspense>
  );
};

/**
 * @description createAsyncAtom 파생 아톰 카드
 */
const AsyncInsightsCardContent = ({
  insightsAtom,
  teamAtom,
  version,
  onRefresh,
}: {
  insightsAtom: Atom<RemoteAsyncInsights>;
  teamAtom: Atom<RemoteTeamMember[]>;
  version: number;
  onRefresh: () => void;
}) => {
  const [insights] = useAtom(insightsAtom);
  const [team, setTeam] = useAtom(teamAtom);

  const CAPACITY_PRESETS = [
    { label: "여유", capacity: 3 },
    { label: "주의", capacity: 1 },
    { label: "포화", capacity: 0 },
  ] as const;
  const MAX_CAPACITY = 6;

  const resolveStatusLabel = (capacity: number) => {
    if (capacity >= 3) return "여유";
    if (capacity >= 1) return "주의";
    return "포화";
  };

  const onAdjustCapacity = (id: number, delta: number) => {
    setTeam(
      team.map((member) =>
        member.id === id
          ? {
              ...member,
              capacity: Math.max(
                0,
                Math.min(MAX_CAPACITY, member.capacity + delta)
              ),
            }
          : member
      )
    );
  };

  const onSetPreset = (id: number, capacity: number) => {
    setTeam(
      team.map((member) =>
        member.id === id ? { ...member, capacity } : member
      )
    );
  };

  return (
    <article className="atom-card atom-card--wide async-card">
      <header className="atom-card__header">
        <h3>파생 Async Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__hint">
        두 개의 `createAsyncAtom`에서 불러온 데이터를 `createDerivedAtom`으로
        합성해 추천 정보를 계산합니다.
      </p>
      <div className="async-card__stats">
        <span>데이터 버전: v{version + 1}</span>
        <span>팀원 {team.length}명</span>
        <span>
          미완료 {insights.pendingCount} / 완료 {insights.completedCount}
        </span>
      </div>
      {insights.suggestion ? (
        <div className="async-card__summary">
          <strong>{insights.suggestion.assignee.name}</strong>
          <span>{insights.suggestion.message}</span>
          <p>
            <em>{insights.suggestion.todo.title}</em> 작업을 맡으면 좋겠어요.
          </p>
        </div>
      ) : (
        <div className="async-card__summary async-card__summary--success">
          모든 작업이 완료되었습니다! 팀이 휴식을 취해도 좋겠어요.
        </div>
      )}
      <ul className="team-list">
        {insights.teamLoad.map((member) => {
          const statusClass =
            member.status === "여유"
              ? "team-list__status--positive"
              : member.status === "주의"
              ? "team-list__status--warning"
              : "team-list__status--danger";

          return (
            <li key={member.id} className="team-list__item">
              <div className="team-list__meta">
                <strong>{member.name}</strong>
                <span>{member.role}</span>
                <small>{member.focus}</small>
              </div>
              <div className={`team-list__status ${statusClass}`}>
                {member.status} · 여유 {member.capacity}
              </div>
              <div className="team-list__controls">
                <div className="team-list__control-row">
                  <button
                    className="team-list__btn"
                    onClick={() => onAdjustCapacity(member.id, 1)}
                  >
                    + 여유도
                  </button>
                  <button
                    className="team-list__btn"
                    onClick={() => onAdjustCapacity(member.id, -1)}
                  >
                    - 여유도
                  </button>
                </div>
                <div className="team-list__control-row">
                  {CAPACITY_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      className={`team-list__preset${
                        member.status === preset.label
                          ? " team-list__preset--active"
                          : ""
                      }`}
                      onClick={() => onSetPreset(member.id, preset.capacity)}
                    >
                      {preset.label}로 설정
                    </button>
                  ))}
                </div>
                <div className="team-list__hint">
                  현재 상태: {resolveStatusLabel(member.capacity)} / 여유도{" "}
                  {member.capacity}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="atom-card__actions async-card__actions">
        <button onClick={onRefresh}>데이터 새로고침</button>
      </div>
    </article>
  );
};

const AsyncInsightsCard = (props: {
  insightsAtom: Atom<RemoteAsyncInsights>;
  teamAtom: Atom<RemoteTeamMember[]>;
  version: number;
  onRefresh: () => void;
}) => {
  return (
    <Suspense
      fallback={
        <article className="atom-card atom-card--wide async-card async-card--loading">
          <header className="atom-card__header">
            <h3>파생 Async Atom</h3>
          </header>
          <p className="atom-card__hint">
            파생 상태를 계산하기 위한 데이터를 불러오는 중입니다...
          </p>
        </article>
      }
    >
      <AsyncInsightsCardContent {...props} />
    </Suspense>
  );
};

/**
 * @description 비동기 아톰 데모 섹션
 */
const AsyncAtomsSection = () => {
  const [{ version, todosAtom, teamAtom, insightsAtom }, setAsyncState] =
    useState(() => {
      const initialVersion = 0;
      const initialTodosAtom = createRemoteTodosAtom(initialVersion);
      const initialTeamAtom = createRemoteTeamAtom(initialVersion);

      return {
        version: initialVersion,
        todosAtom: initialTodosAtom,
        teamAtom: initialTeamAtom,
        insightsAtom: createRemoteInsightsAtom(
          initialTodosAtom,
          initialTeamAtom
        ),
      };
    });

  const onRefresh = () =>
    setAsyncState((prev) => {
      const nextVersion = prev.version + 1;
      const nextTodosAtom = createRemoteTodosAtom(nextVersion);
      const nextTeamAtom = createRemoteTeamAtom(nextVersion);

      return {
        version: nextVersion,
        todosAtom: nextTodosAtom,
        teamAtom: nextTeamAtom,
        insightsAtom: createRemoteInsightsAtom(nextTodosAtom, nextTeamAtom),
      };
    });

  return (
    <section className="demo-section">
      <header className="demo-section__header">
        <h2>비동기 Atom</h2>
        <p>
          `createAsyncAtom`을 `Suspense`와 함께 사용하는 기본 예제와, 여러
          비동기 Atom을 파생 Atom으로 묶어 추가 정보를 계산하는 예제를 함께
          확인할 수 있습니다.
        </p>
      </header>
      <div className="demo-grid">
        <AsyncTodosCard
          atom={todosAtom}
          version={version}
          onRefresh={onRefresh}
        />
        <AsyncInsightsCard
          insightsAtom={insightsAtom}
          teamAtom={teamAtom}
          version={version}
          onRefresh={onRefresh}
        />
      </div>
    </section>
  );
};

/**
 * @description 카운터 변경 이력 카드 컴포넌트
 */
const CounterHistoryCard = () => {
  const [history] = useAtom($counterHistory);
  const [isSubscribed, setIsSubscribed] = useState(true);

  useEffect(() => {
    if (!isSubscribed) {
      return;
    }

    const unsubscribe = subscribe($counter, (value) => {
      const summary = get($summary);
      const timestamp = new Date().toLocaleTimeString();
      const entry = `${timestamp} → ${value} (다음: ${summary.next})`;
      const current = get($counterHistory);
      const nextHistory = [entry, ...current].slice(0, 8);
      set($counterHistory, nextHistory);
    });

    return () => unsubscribe();
  }, [isSubscribed]);

  const onToggleSubscribe = () => {
    if (isSubscribed) {
      set($counterHistory, []);
    }
    setIsSubscribed((prev) => !prev);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>수동 구독자</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__actions">
        <button onClick={onToggleSubscribe}>
          {isSubscribed ? "구독 해제" : "다시 구독"}
        </button>
      </div>
      <p className="atom-card__hint">
        `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면
        내부 listener Set이 비워집니다.
      </p>
      {isSubscribed ? (
        <ul className="history-list">
          {history.length === 0 && (
            <li className="history-list__empty">아직 변경 이력이 없습니다.</li>
          )}
          {history.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ul>
      ) : (
        <div className="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      )}
    </article>
  );
};

/**
 * @description 배치 업데이트 테스트 데모 컴포넌트
 */
const BatchUpdateDemoCard = () => {
  const renderCount = useRenderCount();
  const [counter] = useAtom($counter);
  const [step] = useAtom($step);
  const [nickname] = useAtom($nickname);

  // 이벤트 핸들러 내에서는 React 18이 자동으로 배칭함
  const handleSyncBatch = () => {
    set($counter, counter + 1);
    set($step, step + 1);
    set($nickname, `업데이트 ${counter + 1}`);
    // React 18에서는 이 세 업데이트가 자동으로 배치되어 한 번의 렌더링만 발생
  };

  // Promise나 setTimeout 내부에서도 React 18은 자동 배칭함
  const handleAsyncBatch = () => {
    setTimeout(() => {
      set($counter, counter + 10);
      set($step, step + 10);
      set($nickname, `비동기 업데이트 ${counter + 10}`);
      // React 18에서는 자동 배칭되어 한 번의 렌더링만 발생
    }, 100);
  };

  // 여러 atom을 동시에 업데이트 (React 18 자동 배칭)
  const handleMultipleUpdates = () => {
    set($counter, counter + 100);
    set($step, step + 100);
    set($nickname, `다중 업데이트 ${counter + 100}`);
    // React 18에서는 자동 배칭되어 한 번의 렌더링만 발생
  };

  // 배치 없이 개별 업데이트 (비교용)
  const handleIndividualUpdates = () => {
    // 각 업데이트가 개별적으로 처리되지만, React 18의 자동 배칭으로 인해
    // 여전히 한 번의 렌더링만 발생할 수 있음
    set($counter, counter + 1);
    setTimeout(() => set($step, step + 1), 0);
    setTimeout(() => set($nickname, `개별 업데이트 ${counter + 1}`), 0);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>React 18 배치 업데이트 테스트</h3>
        <span className="render-badge">렌더링 {renderCount}회</span>
      </header>
      <div className="atom-card__value atom-card__value--small">
        <p>
          카운터: <strong>{counter}</strong>
        </p>
        <p>
          스텝: <strong>{step}</strong>
        </p>
        <p>
          닉네임: <strong>{nickname || "(없음)"}</strong>
        </p>
      </div>
      <div className="atom-card__actions">
        <button onClick={handleSyncBatch}>동기 배치 업데이트</button>
        <button onClick={handleAsyncBatch}>비동기 배치 업데이트</button>
        <button onClick={handleMultipleUpdates}>다중 업데이트</button>
        <button onClick={handleIndividualUpdates}>개별 업데이트 (비교용)</button>
      </div>
      <p className="atom-card__hint">
        React 18에서는 이벤트 핸들러, Promise, setTimeout 등에서 여러 상태
        업데이트가 자동으로 배치되어 한 번의 렌더링만 발생합니다. 렌더링 횟수를
        확인하여 배치 업데이트가 제대로 작동하는지 테스트할 수 있습니다.
      </p>
    </article>
  );
};

/**
 * @description 데모 페이지 컴포넌트
 */
const DemoPage = () => {
  return (
    <div className="demo-page">
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>Minimal Global State 데모</h2>
          <p>
            Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
            페이지에서 확인할 수 있습니다.
          </p>
        </header>
        <div className="demo-grid">
          <CounterValueCard />
          <CounterControlsCard />
          <StepSelectorCard />
          <NicknameCard />
          <DerivedCounterCard />
          <SummaryCard />
        </div>
      </section>
      <AsyncAtomsSection />
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>React 18 배치 업데이트 테스트</h2>
          <p>
            React 18의 자동 배칭 기능이 `useSyncExternalStore` 기반의 `useAtom`과
            잘 작동하는지 확인할 수 있습니다. 여러 atom을 동시에 업데이트해도 한
            번의 렌더링만 발생합니다.
          </p>
        </header>
        <BatchUpdateDemoCard />
      </section>
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>구독자 동작 확인</h2>
          <p>
            동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을
            직접 관리하여 GC-friendly하게 동작합니다.
          </p>
        </header>
        <CounterHistoryCard />
      </section>
    </div>
  );
};

export default DemoPage;

```


작업 완료. sample-app-react에만 배치 업데이트 테스트 데모를 추가했어.

## 추가된 내용

**sample-app-react/src/pages/DemoPage.tsx**에 `BatchUpdateDemoCard` 컴포넌트 추가:
- 동기 배치 업데이트: 이벤트 핸들러에서 여러 atom 동시 업데이트
- 비동기 배치 업데이트: setTimeout 내부에서 여러 atom 동시 업데이트
- 다중 업데이트: 여러 atom을 한 번에 업데이트
- 개별 업데이트: 비교용으로 개별 업데이트

각 버튼을 클릭하면 렌더링 횟수가 표시되어 React 18의 자동 배칭이 제대로 작동하는지 확인할 수 있어.

라이브러리 코드(`@sangtae-react`)는 변경하지 않았고, 데모 앱에만 기능을 추가했어.

