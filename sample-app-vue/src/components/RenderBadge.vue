<script setup lang="ts">
import { onMounted, onUpdated, ref, watch } from "vue";

const props = defineProps<{
  trigger?: number;
}>();

const badgeRef = ref<HTMLSpanElement | null>(null);
let renderCount = 0;

const updateBadge = () => {
  renderCount += 1;
  if (badgeRef.value) {
    badgeRef.value.textContent = `렌더링 ${renderCount}회`;
  }
};

onMounted(updateBadge);

if (props.trigger === undefined) {
  onUpdated(updateBadge);
} else {
  watch(
    () => props.trigger,
    (_, oldVal) => {
      if (oldVal !== undefined) {
        updateBadge();
      }
    }
  );
}
</script>

<template>
  <span class="render-badge" ref="badgeRef"></span>
</template>

