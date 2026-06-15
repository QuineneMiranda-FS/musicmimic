<template>
  <div id="app-container">
    <AppHeader />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterView } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
</script>
