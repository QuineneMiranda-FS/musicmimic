<template>
  <div id="app-container">
    <!-- Fix: Add Nav and Header Here -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterView } from "vue-router";
</script>

<style>
/* Global styles ...move to css/ */
body {
  margin: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: #121212;
  color: #ffffff;
}
#app-container {
  min-height: 100vh;
}
</style>
