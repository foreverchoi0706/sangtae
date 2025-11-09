<script setup lang="ts">
import { onMounted, onUpdated, ref } from "vue";

const badgeRef = ref<HTMLSpanElement | null>(null);
let renderCount = 0;

const updateBadge = () => {
  renderCount += 1;
  if (badgeRef.value) {
    badgeRef.value.textContent = `렌더링 ${renderCount}회`;
  }
};

onMounted(updateBadge);
onUpdated(updateBadge);
</script>

<template>
  <span class="render-badge" ref="badgeRef"></span>
</template>

