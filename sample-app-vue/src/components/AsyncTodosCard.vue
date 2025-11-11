<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { type Atom } from "sangtae-js";
import { useAtom } from "sangtae-vue";
import RenderBadge from "@/components/RenderBadge.vue";

interface RemoteTodo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

const props = defineProps<{
  atom: Atom<RemoteTodo[]>;
  version: number;
}>();

const emit = defineEmits<{
  (event: "refresh"): void;
}>();

const [todos, setTodos] = useAtom(props.atom);

const isLoading = computed(() => !Array.isArray(todos.value));

const completedCount = computed(() => {
  if (!Array.isArray(todos.value)) return 0;
  return todos.value.filter((todo) => todo.completed).length;
});

const totalCount = computed(() =>
  Array.isArray(todos.value) ? todos.value.length : 0
);

const renderTrigger = ref(0);

watch(
  () => [isLoading.value, todos.value],
  () => {
    renderTrigger.value += 1;
  },
  { immediate: true, deep: true }
);

const onToggleComplete = (id: number) => {
  if (!Array.isArray(todos.value)) return;
  setTodos(
    todos.value.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  );
};

const onCompleteAll = () => {
  if (!Array.isArray(todos.value)) return;
  const isAllCompleted = todos.value.every(({ completed }) => completed);

  setTodos(
    isAllCompleted
      ? todos.value
      : todos.value.map((todo) => ({ ...todo, completed: true }))
  );
};
</script>

<template>
  <article v-if="!isLoading" class="atom-card atom-card--wide async-card">
    <header class="atom-card__header">
      <h3>createAsyncAtom 데모</h3>
      <RenderBadge :trigger="renderTrigger" />
    </header>
    <p class="atom-card__hint">
      Promise를 받아 최초 구독 시 로딩 상태를 노출합니다. 이후에는 `set`을 통해
      비동기 데이터도 즉시 수정할 수 있습니다.
    </p>
    <div class="async-card__stats">
      <span>데이터 버전: v{{ props.version + 1 }}</span>
      <span>완료 {{ completedCount }}/{{ totalCount }}</span>
    </div>
    <ul class="async-card__list">
      <li
        v-for="todo in todos"
        :key="todo.id"
        class="async-card__item"
        :class="{ 'async-card__item--completed': todo.completed }"
      >
        <div class="async-card__item-main">
          <strong>{{ todo.title }}</strong>
          <p>{{ todo.description }}</p>
        </div>
        <button @click="onToggleComplete(todo.id)">
          {{ todo.completed ? "되돌리기" : "완료" }}
        </button>
      </li>
    </ul>
    <div class="atom-card__actions async-card__actions">
      <button @click="emit('refresh')">데이터 새로고침</button>
      <button @click="onCompleteAll">모두 완료 처리</button>
    </div>
  </article>
  <article
    v-else
    class="atom-card atom-card--wide async-card async-card--loading"
  >
    <header class="atom-card__header">
      <h3>createAsyncAtom 데모</h3>
    </header>
    <p class="atom-card__hint">비동기 데이터를 불러오는 중입니다...</p>
  </article>
</template>
