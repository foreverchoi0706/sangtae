<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { get, set as setAtom, subscribe } from "sangtae-js";
import { useAtom } from "sangtae-vue";
import AsyncTodosCard from "@/components/AsyncTodosCard.vue";
import { $counter, $counterHistory, $doubleCounter, $nickname, $step, $summary } from "@/stores/demo";

const STEP_OPTIONS = [1, 5, 10] as const;

const [counter, setCounter] = useAtom($counter);
const [step, setStep] = useAtom($step);
const [nickname, setNickname] = useAtom($nickname);
const [doubleCounter] = useAtom($doubleCounter);
const [summary] = useAtom($summary);
const [history] = useAtom($counterHistory);

const counterRenderCount = ref(0);
const controlRenderCount = ref(0);
const stepRenderCount = ref(0);
const nicknameRenderCount = ref(0);
const doubleRenderCount = ref(0);
const summaryRenderCount = ref(0);
const historyRenderCount = ref(0);

watch(
  () => counter.value,
  () => {
    counterRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  () => [counter.value, step.value],
  () => {
    controlRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  () => step.value,
  () => {
    stepRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  () => nickname.value,
  () => {
    nicknameRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  doubleCounter,
  () => {
    doubleRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  summary,
  () => {
    summaryRenderCount.value += 1;
  },
  { immediate: true, deep: true }
);

watch(
  history,
  () => {
    historyRenderCount.value += 1;
  },
  { immediate: true, deep: true }
);

const onIncrease = () => setCounter(counter.value + step.value);
const onDecrease = () => setCounter(counter.value - step.value);
const onReset = () => setAtom($counter, 0);
const onSetSameValue = () => setAtom($counter, get($counter));

const inputNickname = computed({
  get: () => nickname.value,
  set: (val: string) => setNickname(val),
});

const onLogSnapshot = () => {
  const snapshot = get($summary);
  console.table(snapshot);
};

const isSubscribed = ref(true);
let unsubscribe: (() => void) | undefined;

const subscribeHistory = () => {
  unsubscribe?.();
  unsubscribe = subscribe($counter, (value) => {
    const snapshot = get($summary);
    const timestamp = new Date().toLocaleTimeString();
    const entry = `${timestamp} → ${value} (다음: ${snapshot.next})`;
    const current = get($counterHistory);
    const nextHistory = [entry, ...current].slice(0, 8);
    setAtom($counterHistory, nextHistory);
  });
};

onMounted(() => {
  if (isSubscribed.value) {
    subscribeHistory();
  }
});

onBeforeUnmount(() => {
  unsubscribe?.();
});

const onToggleSubscribe = () => {
  if (isSubscribed.value) {
    unsubscribe?.();
    setAtom($counterHistory, []);
  } else {
    subscribeHistory();
  }
  isSubscribed.value = !isSubscribed.value;
};

const asyncVersion = ref(0);
const refreshAsync = () => {
  asyncVersion.value += 1;
};
</script>

<template>
  <div class="demo-page">
    <section class="demo-section">
      <header class="demo-section__header">
        <h2>Minimal Global State 데모</h2>
        <p>
          Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한 페이지에서
          확인할 수 있습니다.
        </p>
      </header>
      <div class="demo-grid">
        <article class="atom-card">
          <header class="atom-card__header">
            <h3>Atom 값</h3>
            <span class="render-badge">렌더링 {{ counterRenderCount }}회</span>
          </header>
          <p class="atom-card__value">{{ counter }}</p>
          <p class="atom-card__hint">
            `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>Atom 업데이트</h3>
            <span class="render-badge">렌더링 {{ controlRenderCount }}회</span>
          </header>
          <p class="atom-card__value atom-card__value--small">
            현재 값: <strong>{{ counter }}</strong> / 스텝:
            <strong>{{ step }}</strong>
          </p>
          <div class="atom-card__actions">
            <button @click="onDecrease">- 스텝</button>
            <button @click="onIncrease">+ 스텝</button>
            <button @click="onReset">0으로 초기화</button>
            <button @click="onSetSameValue">같은 값으로 set</button>
          </div>
          <p class="atom-card__hint">
            `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시 렌더링되지
            않습니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>스텝 Atom</h3>
            <span class="render-badge">렌더링 {{ stepRenderCount }}회</span>
          </header>
          <div class="atom-card__options">
            <label v-for="option in STEP_OPTIONS" :key="option">
              <input
                type="radio"
                name="step"
                :value="option"
                :checked="step === option"
                @change="setStep(option)"
              />
              {{ option }}
            </label>
          </div>
          <p class="atom-card__hint">
            별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인 컴포넌트만
            렌더링됩니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>입력 Atom</h3>
            <span class="render-badge">렌더링 {{ nicknameRenderCount }}회</span>
          </header>
          <input
            class="atom-card__input"
            v-model="inputNickname"
            placeholder="닉네임을 입력하세요"
          />
          <p class="atom-card__hint">
            하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생 상태가
            연결됩니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>파생 Atom</h3>
            <span class="render-badge">렌더링 {{ doubleRenderCount }}회</span>
          </header>
          <p class="atom-card__value">{{ doubleCounter }}</p>
          <p class="atom-card__hint">
            `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>Atom 요약</h3>
            <span class="render-badge">렌더링 {{ summaryRenderCount }}회</span>
          </header>
          <dl class="atom-card__list">
            <div>
              <dt>현재 값</dt>
              <dd>{{ summary.counter }}</dd>
            </div>
            <div>
              <dt>스텝</dt>
              <dd>{{ summary.step }}</dd>
            </div>
            <div>
              <dt>다음 값</dt>
              <dd>{{ summary.next }}</dd>
            </div>
            <div>
              <dt>메시지</dt>
              <dd>{{ summary.greeting }}</dd>
            </div>
          </dl>
          <button @click="onLogSnapshot" class="atom-card__log-btn">
            현재 상태 콘솔로 확인
          </button>
          <p class="atom-card__hint">
            `get`을 호출하면 Vue 컴포넌트 밖에서도 atom 스냅샷을 읽을 수 있습니다.
          </p>
        </article>
      </div>
    </section>

    <section class="demo-section">
      <header class="demo-section__header">
        <h2>비동기 Atom</h2>
        <p>
          `createAsyncAtom`은 Promise를 전달받아 데이터를 캐싱하고, 자연스러운 비동기
          UX를 제공합니다.
        </p>
      </header>
      <AsyncTodosCard
        :key="asyncVersion"
        :version="asyncVersion"
        @refresh="refreshAsync"
      />
    </section>

    <section class="demo-section">
      <header class="demo-section__header">
        <h2>구독자 동작 확인</h2>
        <p>
          동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을 직접
          관리하여 메모리를 절약할 수 있습니다.
        </p>
      </header>
      <article class="atom-card atom-card--wide">
        <header class="atom-card__header">
          <h3>수동 구독자</h3>
          <span class="render-badge">렌더링 {{ historyRenderCount }}회</span>
        </header>
        <div class="atom-card__actions">
          <button @click="onToggleSubscribe">
            {{ isSubscribed ? "구독 해제" : "다시 구독" }}
          </button>
        </div>
        <p class="atom-card__hint">
          `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면 내부
          listener Set이 비워집니다.
        </p>
        <ul v-if="isSubscribed" class="history-list">
          <li v-if="history.length === 0" class="history-list__empty">
            아직 변경 이력이 없습니다.
          </li>
          <li v-for="(entry, index) in history" :key="`${entry}-${index}`">
            {{ entry }}
          </li>
        </ul>
        <div v-else class="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      </article>
    </section>
  </div>
</template>

