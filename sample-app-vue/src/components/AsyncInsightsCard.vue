<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { type Atom } from "sangtae-js";
import { useAtom } from "sangtae-vue";
import RenderBadge from "@/components/RenderBadge.vue";
import { type RemoteAsyncInsights, type RemoteTeamMember } from "@/stores/demo";

const props = defineProps<{
  insightsAtom: Atom<RemoteAsyncInsights>;
  teamAtom: Atom<RemoteTeamMember[]>;
  version: number;
}>();

const emit = defineEmits<{
  (event: "refresh"): void;
}>();

const [insights] = useAtom(props.insightsAtom);
const [team, setTeam] = useAtom(props.teamAtom);

const renderTrigger = ref(0);

watch(
  () => [insights.value, team.value],
  () => {
    renderTrigger.value += 1;
  },
  { immediate: true, deep: true }
);

const insightsReady = computed(() => Boolean(insights.value));

const CAPACITY_PRESETS = [
  { label: "여유", capacity: 3 },
  { label: "주의", capacity: 1 },
  { label: "포화", capacity: 0 },
] as const;
const MAX_CAPACITY = 6;

const statusClass = (status: "여유" | "주의" | "포화") => {
  if (status === "여유") return "team-list__status--positive";
  if (status === "주의") return "team-list__status--warning";
  return "team-list__status--danger";
};

const resolveStatusLabel = (capacity: number) => {
  if (capacity >= 3) return "여유";
  if (capacity >= 1) return "주의";
  return "포화";
};

const onAdjustCapacity = (id: number, delta: number) => {
  setTeam(
    team.value.map((member) =>
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
    team.value.map((member) =>
      member.id === id ? { ...member, capacity } : member
    )
  );
};
</script>

<template>
  <article
    v-if="insightsReady"
    class="atom-card atom-card--wide async-card async-card--insights"
  >
    <header class="atom-card__header">
      <h3>파생 Async Atom</h3>
      <RenderBadge :trigger="renderTrigger" />
    </header>
    <p class="atom-card__hint">
      두 개의 `createAsyncAtom` 데이터를 `createDerivedAtom`으로 합성해 팀
      추천을 계산합니다.
    </p>
    <div class="async-card__stats">
      <span>데이터 버전: v{{ props.version + 1 }}</span>
      <span>팀원 {{ team.length }}명</span>
      <span>
        미완료 {{ insights.pendingCount }} / 완료
        {{ insights.completedCount }}
      </span>
    </div>
    <div v-if="insights.suggestion" class="async-card__summary">
      <strong>{{ insights.suggestion.assignee.name }}</strong>
      <span>{{ insights.suggestion.message }}</span>
      <p>
        <em>{{ insights.suggestion.todo.title }}</em> 작업을 맡으면 좋겠어요.
      </p>
    </div>
    <div v-else class="async-card__summary async-card__summary--success">
      모든 작업이 완료되었습니다! 팀이 잠시 숨을 돌려도 좋겠어요.
    </div>
    <ul class="team-list">
      <li
        v-for="member in insights.teamLoad"
        :key="member.id"
        class="team-list__item"
      >
        <div class="team-list__meta">
          <strong>{{ member.name }}</strong>
          <span>{{ member.role }}</span>
          <small>{{ member.focus }}</small>
        </div>
        <div :class="['team-list__status', statusClass(member.status)]">
          {{ member.status }} · 여유 {{ member.capacity }}
        </div>
        <div class="team-list__controls">
          <div class="team-list__control-row">
            <button
              class="team-list__btn"
              @click="onAdjustCapacity(member.id, 1)"
            >
              + 여유도
            </button>
            <button
              class="team-list__btn"
              @click="onAdjustCapacity(member.id, -1)"
            >
              - 여유도
            </button>
          </div>
          <div class="team-list__control-row">
            <button
              v-for="preset in CAPACITY_PRESETS"
              :key="preset.label"
              :class="[
                'team-list__preset',
                {
                  'team-list__preset--active': member.status === preset.label,
                },
              ]"
              @click="onSetPreset(member.id, preset.capacity)"
            >
              {{ preset.label }}로 설정
            </button>
          </div>
          <div class="team-list__hint">
            현재 상태: {{ resolveStatusLabel(member.capacity) }} / 여유도
            {{ member.capacity }}
          </div>
        </div>
      </li>
    </ul>
    <div class="atom-card__actions async-card__actions">
      <button @click="emit('refresh')">데이터 새로고침</button>
    </div>
  </article>
  <article
    v-else
    class="atom-card atom-card--wide async-card async-card--loading"
  >
    <header class="atom-card__header">
      <h3>파생 Async Atom</h3>
    </header>
    <p class="atom-card__hint">
      파생 데이터를 계산하기 위한 정보를 불러오는 중입니다...
    </p>
  </article>
</template>
