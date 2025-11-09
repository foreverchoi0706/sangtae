<script setup lang="ts">
import DemoPage from "@/pages/DemoPage.vue";
import logo from "./assets/vue.svg";
</script>

<template>
  <main>
    <header class="header">
      <div class="header-link">
        <img :src="logo" alt="logo" class="logo" />
        <h1>SAMPLE APP VUE</h1>
      </div>
    </header>
    <DemoPage />
  </main>
</template>
