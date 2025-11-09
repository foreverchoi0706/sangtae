# sangtae-vue

Vue 3 Composition API 환경에서 `sangtae-js`로 만든 atom을 자연스럽게 구독하고 업데이트할 수 있도록 돕는 초경량 훅 바인딩입니다. 하나의 `useAtom` 훅만으로 동기, 파생, 비동기 atom을 모두 다룰 수 있습니다.

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
