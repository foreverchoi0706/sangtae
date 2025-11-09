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

export const $summary = createDerivedAtom((read) => {
  const counter = read($counter);
  const step = read($step);
  const nickname = read($nickname).trim();

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
