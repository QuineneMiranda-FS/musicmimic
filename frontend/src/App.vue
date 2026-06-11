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
