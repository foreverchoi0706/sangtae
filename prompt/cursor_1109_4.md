# 작성할 README.md 내용 정리
_Exported on 2025. 11. 9. at 22시 19분 31초 GMT+9 from Cursor (2.0.69)_

---

**User**

@README.md (1) 

프로젝트 파악해서 README.md의 내용을 실제 예제를 제공하여 직관적이고 알기쉽게 작성해줘


---

**Cursor**

```markdown
# sangtae-react

React 18+ 환경에서 [`sangtae-js`](https://www.npmjs.com/package/sangtae-js)로 만든 atom을 손쉽게 구독하고 업데이트할 수 있게 해 주는 초경량 훅 바인딩이야. 단 하나의 `useAtom` 훅만으로 동기, 파생, 비동기 atom을 모두 다룰 수 있어.

## 주요 특징

- **React 기본 훅 활용**: `useSyncExternalStore` 기반이라 Concurrent Rendering에서도 안전하게 동작해.
- **간단한 API**: `useAtom(atom)` 한 줄이면 값과 setter를 동시에 가져올 수 있어.
- **파생/비동기 atom 지원**: `createDerivedAtom`, `createAsyncAtom`으로 만든 atom도 동일한 방식으로 사용할 수 있어.
- **타입 안전성**: TypeScript에서 atom 타입이 그대로 추론돼서 제네릭 없이도 정확한 타입 정보를 받을 수 있어.

## 설치

```bash
npm install sangtae-js sangtae-react
# 또는
yarn add sangtae-js sangtae-react
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

- `useAtom(atom)`은 `[value, setValue]` 튜플을 돌려줘.
- `setValue`는 내부적으로 `sangtae-js`의 `set(atom, newValue)`를 호출해.
- 같은 값으로 `setValue`를 호출하면 React 컴포넌트가 리렌더링되지 않아.

## 파생 atom과 동시 사용

여러 atom을 조합하고 싶은 경우 `createDerivedAtom`을 쓰면 돼. 파생 atom도 동일한 `useAtom`으로 구독할 수 있어서, 컴포넌트를 원하는 대로 쪼개기 쉬워.

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
      ? `${nickname}님, 다음 값은 ${counter + step}`
      : "이름을 입력해보세요.",
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

- 파생 atom은 참조한 atom이 변경될 때만 다시 계산돼.
- UI는 필요한 파생 atom만 구독하니까 불필요한 렌더링을 줄일 수 있어.

## 비동기 atom과 Suspense

`createAsyncAtom`으로 감싼 Promise는 `Suspense`와 함께 자연스럽게 작동해. 대기 중에는 기존 Promise를 throw하고, 완료되면 결과 값을 `useAtom`에서 바로 읽을 수 있어.

```ts
// stores/todos.ts
import { createAsyncAtom } from "sangtae-js";

const fetchTodos = () =>
  fetch("/api/todos")
    .then((res) => res.json())
    .then((todos) => todos as { id: number; title: string; completed: boolean }[]);

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
    <Suspense fallback={<p>로딩 중...</p>}>
      <TodoList />
    </Suspense>
  );
}
```

- 동일한 Promise로 `createAsyncAtom`을 여러 번 호출하면 항상 같은 atom 인스턴스를 돌려줘.
- `set($todos, newValue)`를 호출하면 캐시된 비동기 값도 즉시 교체할 수 있어.

## React 밖에서 상태 읽거나 변경하기

`sangtae-js`의 `get`, `set`, `subscribe`는 그대로 쓸 수 있어. 예를 들어 로그 히스토리를 남기고 싶으면 아래처럼 수동 구독을 만들면 돼.

```ts
import { get, set, subscribe } from "sangtae-js";
import { $counter, $history } from "./stores";

const unsubscribe = subscribe($counter, (value) => {
  const timestamp = new Date().toLocaleTimeString();
  const current = get($history);
  set($history, [`${timestamp} → ${value}`, ...current].slice(0, 8));
});

// 필요 없어지면 해제
unsubscribe();
```

- 마지막 구독자가 해제되면 내부 listener Set이 비워져서 GC 대상이 돼.
- 수동 구독과 React 컴포넌트를 함께 사용해도 충돌이 없고, 모두 같은 atom 상태를 바라봐.

## 더 많은 예제

`sample-app-react/` 디렉터리에 전체 동작을 확인할 수 있는 Vite 기반 샘플 앱을 같이 넣어 놨어. 파생 atom, 비동기 atom, 수동 구독 등 실전에서 바로 가져다 쓸 법한 패턴을 모아 뒀으니까 참고해 줘.

```

## 요약
- `@sangtae-react/README.md`에 `useAtom` 소개, 파생/비동기 atom 예제, 수동 구독 패턴까지 실제 코드 중심으로 정리해놨어.
- 샘플 코드가 `sample-app-react/` 예제랑 바로 이어지도록 구성해서 읽으면 바로 따라 할 수 있어.

## 다음 단계
- 샘플 앱(`sample-app-react`) 실행해서 README 흐름이 잘 맞는지 직접 확인해봐.
- 추가로 다루고 싶은 패턴(예: SSR, DevTools)이 있으면 알려줘, 더 채워줄게.

---

**User**

내용을 존댓말로 바꿔줘

---

**Cursor**

```markdown
*** Begin Patch
*** Update File: @sangtae-react/README.md
@@
-# sangtae-react
-
-React 18+ 환경에서 [`sangtae-js`](https://www.npmjs.com/package/sangtae-js)로 만든 atom을 손쉽게 구독하고 업데이트할 수 있게 해 주는 초경량 훅 바인딩이야. 단 하나의 `useAtom` 훅만으로 동기, 파생, 비동기 atom을 모두 다룰 수 있어.
-
-## 주요 특징
-
-- **React 기본 훅 활용**: `useSyncExternalStore` 기반이라 Concurrent Rendering에서도 안전하게 동작해.
-- **간단한 API**: `useAtom(atom)` 한 줄이면 값과 setter를 동시에 가져올 수 있어.
-- **파생/비동기 atom 지원**: `createDerivedAtom`, `createAsyncAtom`으로 만든 atom도 동일한 방식으로 사용할 수 있어.
-- **타입 안전성**: TypeScript에서 atom 타입이 그대로 추론돼서 제네릭 없이도 정확한 타입 정보를 받을 수 있어.
-
-## 설치
-
-```bash
-npm install sangtae-js sangtae-react
-# 또는
-yarn add sangtae-js sangtae-react
-```
-
-## `useAtom` 빠른 시작
-
-```ts
-// stores/counter.ts
-import { createAtom } from "sangtae-js";
-
-export const $counter = createAtom(0);
-export const $step = createAtom(1);
-```
-
-```tsx
-// components/Counter.tsx
-import { useAtom } from "sangtae-react";
-import { $counter, $step } from "../stores/counter";
-
-export default function Counter() {
-  const [counter, setCounter] = useAtom($counter);
-  const [step] = useAtom($step);
-
-  return (
-    <div>
-      <button onClick={() => setCounter(counter - step)}>-</button>
-      <strong>{counter}</strong>
-      <button onClick={() => setCounter(counter + step)}>+</button>
-    </div>
-  );
-}
-```
-
-- `useAtom(atom)`은 `[value, setValue]` 튜플을 돌려줘.
-- `setValue`는 내부적으로 `sangtae-js`의 `set(atom, newValue)`를 호출해.
-- 같은 값으로 `setValue`를 호출하면 React 컴포넌트가 리렌더링되지 않아.
-
-## 파생 atom과 동시 사용
-
-여러 atom을 조합하고 싶은 경우 `createDerivedAtom`을 쓰면 돼. 파생 atom도 동일한 `useAtom`으로 구독할 수 있어서, 컴포넌트를 원하는 대로 쪼개기 쉬워.
-
-```ts
-// stores/summary.ts
-import { createAtom, createDerivedAtom } from "sangtae-js";
-
-export const $counter = createAtom(0);
-export const $step = createAtom(1);
-export const $nickname = createAtom("");
-
-export const $summary = createDerivedAtom((read) => {
-  const counter = read($counter);
-  const step = read($step);
-  const nickname = read($nickname).trim();
-
-  return {
-    counter,
-    step,
-    next: counter + step,
-    greeting: nickname
-      ? `${nickname}님, 다음 값은 ${counter + step}`
-      : "이름을 입력해보세요.",
-  };
-});
-```
-
-```tsx
-// components/SummaryCard.tsx
-import { useAtom } from "sangtae-react";
-import { $summary } from "../stores/summary";
-
-export default function SummaryCard() {
-  const [summary] = useAtom($summary);
-
-  return (
-    <section>
-      <h2>현재 값: {summary.counter}</h2>
-      <p>스텝: {summary.step}</p>
-      <p>다음 값: {summary.next}</p>
-      <p>{summary.greeting}</p>
-    </section>
-  );
-}
-```
-
-- 파생 atom은 참조한 atom이 변경될 때만 다시 계산돼.
-- UI는 필요한 파생 atom만 구독하니까 불필요한 렌더링을 줄일 수 있어.
-
-## 비동기 atom과 Suspense
-
-`createAsyncAtom`으로 감싼 Promise는 `Suspense`와 함께 자연스럽게 작동해. 대기 중에는 기존 Promise를 throw하고, 완료되면 결과 값을 `useAtom`에서 바로 읽을 수 있어.
-
-```ts
-// stores/todos.ts
-import { createAsyncAtom } from "sangtae-js";
-
-const fetchTodos = () =>
-  fetch("/api/todos")
-    .then((res) => res.json())
-    .then((todos) => todos as { id: number; title: string; completed: boolean }[]);
-
-export const $todos = createAsyncAtom(fetchTodos());
-```
-
-```tsx
-// components/AsyncTodos.tsx
-import { Suspense } from "react";
-import { useAtom } from "sangtae-react";
-import { $todos } from "../stores/todos";
-
-function TodoList() {
-  const [todos, setTodos] = useAtom($todos);
-
-  return (
-    <ul>
-      {todos.map((todo) => (
-        <li key={todo.id}>
-          <label>
-            <input
-              type="checkbox"
-              checked={todo.completed}
-              onChange={() =>
-                setTodos(
-                  todos.map((item) =>
-                    item.id === todo.id
-                      ? { ...item, completed: !item.completed }
-                      : item
-                  )
-                )
-              }
-            />
-            {todo.title}
-          </label>
-        </li>
-      ))}
-    </ul>
-  );
-}
-
-export default function AsyncTodos() {
-  return (
-    <Suspense fallback={<p>로딩 중...</p>}>
-      <TodoList />
-    </Suspense>
-  );
-}
-```
-
-- 동일한 Promise로 `createAsyncAtom`을 여러 번 호출하면 항상 같은 atom 인스턴스를 돌려줘.
-- `set($todos, newValue)`를 호출하면 캐시된 비동기 값도 즉시 교체할 수 있어.
-
-## React 밖에서 상태 읽거나 변경하기
-
-`sangtae-js`의 `get`, `set`, `subscribe`는 그대로 쓸 수 있어. 예를 들어 로그 히스토리를 남기고 싶으면 아래처럼 수동 구독을 만들면 돼.
-
-```ts
-import { get, set, subscribe } from "sangtae-js";
-import { $counter, $history } from "./stores";
-
-const unsubscribe = subscribe($counter, (value) => {
-  const timestamp = new Date().toLocaleTimeString();
-  const current = get($history);
-  set($history, [`${timestamp} → ${value}`, ...current].slice(0, 8));
-});
-
-// 필요 없어지면 해제
-unsubscribe();
-```
-
-- 마지막 구독자가 해제되면 내부 listener Set이 비워져서 GC 대상이 돼.
-- 수동 구독과 React 컴포넌트를 함께 사용해도 충돌이 없고, 모두 같은 atom 상태를 바라봐.
-
-## 더 많은 예제
-
-`sample-app-react/` 디렉터리에 전체 동작을 확인할 수 있는 Vite 기반 샘플 앱을 같이 넣어 놨어. 파생 atom, 비동기 atom, 수동 구독 등 실전에서 바로 가져다 쓸 법한 패턴을 모아 뒀으니까 참고해 줘.
+# sangtae-react
+
+React 18+ 환경에서 [`sangtae-js`](https://www.npmjs.com/package/sangtae-js)로 만든 atom을 손쉽게 구독하고 업데이트할 수 있게 해 주는 초경량 훅 바인딩입니다. 단 하나의 `useAtom` 훅만으로 동기, 파생, 비동기 atom을 모두 다룰 수 있습니다.
+
+## 주요 특징
+
+- **React 기본 훅 활용**: `useSyncExternalStore` 기반이므로 Concurrent Rendering에서도 안전하게 동작합니다.
+- **간단한 API**: `useAtom(atom)` 한 줄이면 값과 setter를 동시에 받을 수 있습니다.
+- **파생/비동기 atom 지원**: `createDerivedAtom`, `createAsyncAtom`으로 만든 atom도 동일한 방식으로 사용할 수 있습니다.
+- **타입 안전성**: TypeScript에서 atom 타입이 그대로 추론되어 제네릭 없이도 정확한 타입 정보를 확인할 수 있습니다.
+
+## 설치
+
+```bash
+npm install sangtae-js sangtae-react
+# 또는
+yarn add sangtae-js sangtae-react
+```
+
+## `useAtom` 빠른 시작
+
+```ts
+// stores/counter.ts
+import { createAtom } from "sangtae-js";
+
+export const $counter = createAtom(0);
+export const $step = createAtom(1);
+```
+
+```tsx
+// components/Counter.tsx
+import { useAtom } from "sangtae-react";
+import { $counter, $step } from "../stores/counter";
+
+export default function Counter() {
+  const [counter, setCounter] = useAtom($counter);
+  const [step] = useAtom($step);
+
+  return (
+    <div>
+      <button onClick={() => setCounter(counter - step)}>-</button>
+      <strong>{counter}</strong>
+      <button onClick={() => setCounter(counter + step)}>+</button>
+    </div>
+  );
+}
+```
+
+- `useAtom(atom)`은 `[value, setValue]` 튜플을 반환합니다.
+- `setValue`는 내부적으로 `sangtae-js`의 `set(atom, newValue)`를 호출합니다.
+- 같은 값으로 `setValue`를 호출하면 React 컴포넌트가 리렌더링되지 않습니다.
+
+## 파생 atom과 동시 사용
+
+여러 atom을 조합하고 싶은 경우 `createDerivedAtom`을 사용하시면 됩니다. 파생 atom도 동일한 `useAtom`으로 구독할 수 있어 컴포넌트를 원하는 대로 분리하기 쉽습니다.
+
+```ts
+// stores/summary.ts
+import { createAtom, createDerivedAtom } from "sangtae-js";
+
+export const $counter = createAtom(0);
+export const $step = createAtom(1);
+export const $nickname = createAtom("");
+
+export const $summary = createDerivedAtom((read) => {
+  const counter = read($counter);
+  const step = read($step);
+  const nickname = read($nickname).trim();
+
+  return {
+    counter,
+    step,
+    next: counter + step,
+    greeting: nickname
+      ? `${nickname}님, 다음 값은 ${counter + step}입니다.`
+      : "이름을 입력해 주세요.",
+  };
+});
+```
+
+```tsx
+// components/SummaryCard.tsx
+import { useAtom } from "sangtae-react";
+import { $summary } from "../stores/summary";
+
+export default function SummaryCard() {
+  const [summary] = useAtom($summary);
+
+  return (
+    <section>
+      <h2>현재 값: {summary.counter}</h2>
+      <p>스텝: {summary.step}</p>
+      <p>다음 값: {summary.next}</p>
+      <p>{summary.greeting}</p>
+    </section>
+  );
+}
+```
+
+- 파생 atom은 참조한 atom이 변경될 때만 다시 계산됩니다.
+- UI는 필요한 파생 atom만 구독하므로 불필요한 렌더링을 줄일 수 있습니다.
+
+## 비동기 atom과 Suspense
+
+`createAsyncAtom`으로 감싼 Promise는 `Suspense`와 함께 자연스럽게 작동합니다. 대기 중에는 기존 Promise를 throw하고, 완료되면 결과 값을 `useAtom`에서 바로 읽을 수 있습니다.
+
+```ts
+// stores/todos.ts
+import { createAsyncAtom } from "sangtae-js";
+
+const fetchTodos = () =>
+  fetch("/api/todos")
+    .then((res) => res.json())
+    .then((todos) => todos as { id: number; title: string; completed: boolean }[]);
+
+export const $todos = createAsyncAtom(fetchTodos());
+```
+
+```tsx
+// components/AsyncTodos.tsx
+import { Suspense } from "react";
+import { useAtom } from "sangtae-react";
+import { $todos } from "../stores/todos";
+
+function TodoList() {
+  const [todos, setTodos] = useAtom($todos);
+
+  return (
+    <ul>
+      {todos.map((todo) => (
+        <li key={todo.id}>
+          <label>
+            <input
+              type="checkbox"
+              checked={todo.completed}
+              onChange={() =>
+                setTodos(
+                  todos.map((item) =>
+                    item.id === todo.id
+                      ? { ...item, completed: !item.completed }
+                      : item
+                  )
+                )
+              }
+            />
+            {todo.title}
+          </label>
+        </li>
+      ))}
+    </ul>
+  );
+}
+
+export default function AsyncTodos() {
+  return (
+    <Suspense fallback={<p>로딩 중입니다...</p>}>
+      <TodoList />
+    </Suspense>
+  );
+}
+```
+
+- 동일한 Promise로 `createAsyncAtom`을 여러 번 호출하면 항상 같은 atom 인스턴스를 반환합니다.
+- `set($todos, newValue)`를 호출하면 캐시된 비동기 값도 즉시 교체할 수 있습니다.
+
+## React 밖에서 상태 읽거나 변경하기
+
+`sangtae-js`의 `get`, `set`, `subscribe`는 그대로 사용할 수 있습니다. 예를 들어 로그 히스토리를 남기고 싶다면 아래처럼 수동 구독을 만들 수 있습니다.
+
+```ts
+import { get, set, subscribe } from "sangtae-js";
+import { $counter, $history } from "./stores";
+
+const unsubscribe = subscribe($counter, (value) => {
+  const timestamp = new Date().toLocaleTimeString();
+  const current = get($history);
+  set($history, [`${timestamp} → ${value}`, ...current].slice(0, 8));
+});
+
+// 필요 없어지면 해제합니다.
+unsubscribe();
+```
+
+- 마지막 구독자가 해제되면 내부 listener Set이 비워져 GC 대상이 됩니다.
+- 수동 구독과 React 컴포넌트를 함께 사용해도 충돌이 없으며, 모두 같은 atom 상태를 바라봅니다.
+
+## 더 많은 예제
+
+`sample-app-react/` 디렉터리에 전체 동작을 확인할 수 있는 Vite 기반 샘플 앱을 함께 제공하고 있습니다. 파생 atom, 비동기 atom, 수동 구독 등 실전에서 바로 적용할 수 있는 패턴을 모아 두었으니 참고해 주세요.
*** End Patch
```

```markdown
# sangtae-react

React 18+ 환경에서 [`sangtae-js`](https://www.npmjs.com/package/sangtae-js)로 만든 atom을 손쉽게 구독하고 업데이트할 수 있게 해 주는 초경량 훅 바인딩입니다. 단 하나의 `useAtom` 훅만으로 동기, 파생, 비동기 atom을 모두 다룰 수 있습니다.

## 주요 특징

- **React 기본 훅 활용**: `useSyncExternalStore` 기반이라 Concurrent Rendering에서도 안전하게 동작합니다.
- **간단한 API**: `useAtom(atom)` 한 줄이면 값과 setter를 동시에 가져올 수 있습니다.
- **파생/비동기 atom 지원**: `createDerivedAtom`, `createAsyncAtom`으로 만든 atom도 동일한 방식으로 사용할 수 있습니다.
- **타입 안전성**: TypeScript에서 atom 타입이 그대로 추론돼서 제네릭 없이도 정확한 타입 정보를 받을 수 있습니다.

## 설치

```bash
npm install sangtae-js sangtae-react
# 또는
yarn add sangtae-js sangtae-react
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

- 마지막 구독자가 해제되면 내부 listener Set이 비워져서 GC 대상이 됩니다.
- 수동 구독과 React 컴포넌트를 함께 사용해도 충돌이 없으며, 모두 같은 atom 상태를 바라봅니다.

## 더 많은 예제

`sample-app-react/` 디렉터리에 전체 동작을 확인할 수 있는 Vite 기반 샘플 앱을 같이 넣어 두었습니다. 파생 atom, 비동기 atom, 수동 구독 등 실전에서 바로 적용할 수 있는 패턴을 모아 두었으니 참고해 주세요.

```

```markdown
# sangtae-react

React 18+ 환경에서 [`sangtae-js`](https://www.npmjs.com/package/sangtae-js)로 만든 atom을 손쉽게 구독하고 업데이트할 수 있게 해 주는 초경량 훅 바인딩입니다. 단 하나의 `useAtom` 훅만으로 동기, 파생, 비동기 atom을 모두 다룰 수 있습니다.

## 주요 특징

- **React 기본 훅 활용**: `useSyncExternalStore` 기반이므로 Concurrent Rendering에서도 안전하게 동작합니다.
- **간단한 API**: `useAtom(atom)` 한 줄이면 값과 setter를 동시에 가져올 수 있습니다.
- **파생/비동기 atom 지원**: `createDerivedAtom`, `createAsyncAtom`으로 만든 atom도 동일한 방식으로 사용할 수 있습니다.
- **타입 안전성**: TypeScript에서 atom 타입이 그대로 추론되어 제네릭 없이도 정확한 타입 정보를 받을 수 있습니다.

## 설치

```bash
npm install sangtae-js sangtae-react
# 또는
yarn add sangtae-js sangtae-react
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

- 마지막 구독자가 해제되면 내부 listener Set이 비워져서 GC 대상이 됩니다.
- 수동 구독과 React 컴포넌트를 함께 사용해도 충돌이 없으며, 모두 같은 atom 상태를 바라봅니다.

## 더 많은 예제

`sample-app-react/` 디렉터리에 전체 동작을 확인할 수 있는 Vite 기반 샘플 앱을 같이 넣어 두었습니다. 파생 atom, 비동기 atom, 수동 구독 등 실전에서 바로 적용할 수 있는 패턴을 모아 두었으니 참고해 주세요.

```

요청한 대로 `@sangtae-react/README.md` 전체 문장을 존댓말로 고쳤어. 설명, 불릿, 주석 문구 전부 존댓말 톤으로 맞춰서 통일했으니 확인해봐.

---

**User**

좋아 마찬가지로 @@sangtae-vue 내 @README.md 도작성해줘 

---

**Cursor**

```markdown
# sangtae-vue

Vue 3 Composition API 환경에서 [`sangtae-js`](https://www.npmjs.com/package/sangtae-js)로 만든 atom을 자연스럽게 구독하고 업데이트할 수 있도록 돕는 초경량 훅 바인딩입니다. 하나의 `useAtom` 훅만으로 동기, 파생, 비동기 atom을 모두 다룰 수 있습니다.

## 주요 특징

- **Ref 기반 인터페이스**: `useAtom(atom)`은 Vue `ref`와 setter를 한 번에 제공합니다.
- **파생/비동기 atom 지원**: `createDerivedAtom`, `createAsyncAtom`으로 만든 atom도 추가 설정 없이 사용할 수 있습니다.
- **자동 구독 관리**: 컴포넌트 언마운트 시 `subscribe`가 자동으로 정리되어 누수 없이 작동합니다.
- **Suspense 대응**: 비동기 atom의 Promise throw를 감지해 Vue `<Suspense>` 흐름과 연동합니다.

## 설치

```bash
npm install sangtae-js sangtae-vue
```

## `useAtom` 빠른 시작

```ts
// stores/counter.ts
import { createAtom } from "sangtae-js";

export const $counter = createAtom(0);
export const $step = createAtom(1);
```

```vue
<!-- components/CounterCard.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { useAtom } from "sangtae-vue";
import { $counter, $step } from "@/stores/counter";

const [counter, setCounter] = useAtom($counter);
const [step] = useAtom($step);

const decrease = () => setCounter(counter.value - step.value);
const increase = () => setCounter(counter.value + step.value);
const label = computed(() => `${counter.value} (step ${step.value})`);
</script>

<template>
  <section>
    <p>{{ label }}</p>
    <button @click="decrease">-</button>
    <button @click="increase">+</button>
  </section>
</template>
```

- 첫 번째 요소는 `Ref<T>`라서 템플릿에서 자동으로 언래핑됩니다.
- 두 번째 요소는 내부적으로 `set(atom, newValue)`를 호출하는 setter입니다.
- 동일한 값으로 `setCounter`를 호출하면 관련 컴포넌트가 다시 렌더링되지 않습니다.

## 파생 atom 함께 쓰기

여러 atom을 조합해야 한다면 `createDerivedAtom`을 사용하면 됩니다. 파생 atom도 그대로 `useAtom`으로 구독할 수 있습니다.

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

```vue
<!-- components/SummaryCard.vue -->
<script setup lang="ts">
import { useAtom } from "sangtae-vue";
import { $summary } from "@/stores/summary";

const [summary] = useAtom($summary);
</script>

<template>
  <section>
    <h2>현재 값: {{ summary.counter }}</h2>
    <p>스텝: {{ summary.step }}</p>
    <p>다음 값: {{ summary.next }}</p>
    <p>{{ summary.greeting }}</p>
  </section>
</template>
```

- 파생 atom은 의존한 atom이 바뀔 때만 다시 계산되어 불필요한 렌더링을 줄여 줍니다.
- 동일한 파생 atom을 여러 컴포넌트에서 구독해도 캐시는 공유됩니다.

## 비동기 atom과 `<Suspense>`

`createAsyncAtom`으로 Promise를 감싸면 Suspense 친화적인 비동기 상태를 만들 수 있습니다. 대기 중에는 기존 Promise를 throw하고, 완료되면 `useAtom`이 최신 데이터를 전달합니다.

```ts
// stores/todos.ts
import { createAsyncAtom } from "sangtae-js";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

const fetchTodos = () =>
  fetch("/api/todos")
    .then((res) => res.json())
    .then((todos) => todos as Todo[]);

export const $todos = createAsyncAtom(fetchTodos());
```

```vue
<!-- components/AsyncTodos.vue -->
<script setup lang="ts">
import { useAtom } from "sangtae-vue";
import { $todos } from "@/stores/todos";

const [todos, setTodos] = useAtom($todos);

const toggle = (id: number) => {
  setTodos(
    todos.value.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  );
};
</script>

<template>
  <Suspense>
    <template #default>
      <ul>
        <li v-for="todo in todos" :key="todo.id">
          <label>
            <input
              type="checkbox"
              :checked="todo.completed"
              @change="toggle(todo.id)"
            />
            {{ todo.title }}
          </label>
        </li>
      </ul>
    </template>
    <template #fallback>
      <p>할 일을 불러오는 중입니다...</p>
    </template>
  </Suspense>
</template>
```

- 동일한 Promise를 다시 넘기면 내부 캐시 덕분에 항상 같은 atom 인스턴스를 공유합니다.
- `setTodos`로 값을 갱신하면 로컬에서 즉시 UI를 반영하면서도 비동기 상태가 `success`로 전환됩니다.

## Vue 컴포넌트 밖에서 상태 다루기

Vue 컴포넌트 외부에서도 `sangtae-js`의 저수준 API를 그대로 사용할 수 있습니다. 예를 들어 수동 구독을 생성해 로그 히스토리를 남길 수 있습니다.

```ts
import { get, set, subscribe } from "sangtae-js";
import { $counter, $history } from "@/stores/history";

const unsubscribe = subscribe($counter, (value) => {
  const timestamp = new Date().toLocaleTimeString();
  const current = get($history);
  set($history, [`${timestamp} → ${value}`, ...current].slice(0, 8));
});

// 필요 없어지면 해제합니다.
unsubscribe();
```

- 마지막 구독자가 해제되면 내부 listener Set이 비워져 GC 대상이 됩니다.
- Composition API와 수동 구독을 함께 사용해도 한 곳의 atom 상태를 일관되게 공유합니다.

```

`sangtae-vue/README.md` 채워서 Vue용 `useAtom` 소개, 파생/비동기 예제, 수동 구독 활용법까지 정리해 놨어. 샘플 코드가 실제 `sample-app-vue` 구조랑 맞게 작성돼 있으니 필요하면 바로 붙여서 써봐.

