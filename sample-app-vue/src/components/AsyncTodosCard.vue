<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { createAsyncAtom } from "sangtae-js";
import { useAtom } from "sangtae-vue";
import RenderBadge from "@/components/RenderBadge.vue";

interface RemoteTodo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

const props = defineProps<{
  version: number;
}>();

const emit = defineEmits<{
  (event: "refresh"): void;
}>();

const REMOTE_TODO_TEMPLATES: Array<Pick<RemoteTodo, "title" | "description">> =
  [
    {
      title: "API 문서 검토",
      description: "README 요약을 확인하고 팀 공유 준비",
    },
    {
      title: "디자인 동기화",
      description: "UI 컴포넌트 상태와 실제 데이터를 비교",
    },
    {
      title: "렌더 카운트 점검",
      description: "변경된 atom이 컴포넌트에 미치는 영향 확인",
    },
    {
      title: "배포 체크리스트",
      description: "build, lint, 테스트 명령어가 모두 통과하는지 확인",
    },
  ];

const loadRemoteTodos = (version: number): Promise<RemoteTodo[]> =>
  new Promise((resolve) => {
    const delay = 600 + ((version % 3) + 1) * 200;
    const startedAt = Date.now();

    setTimeout(() => {
      const now = new Date();
      const generated = REMOTE_TODO_TEMPLATES.map((template, index) => ({
        id: version * 10 + index + 1,
        title: `${template.title} #${version + 1}`,
        description: `${template.description} - ${now.toLocaleTimeString()}`,
        completed: (version + index) % 2 === 0,
      }));

      const elapsed = Date.now() - startedAt;
      resolve(
        generated.map((todo) => ({
          ...todo,
          description: `${todo.description} (응답 ${elapsed}ms)`,
        }))
      );
    }, delay);
  });

const remoteAtom = createAsyncAtom(loadRemoteTodos(props.version));
const [todos, setTodos] = useAtom(remoteAtom);

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
