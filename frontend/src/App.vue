<template>
  <div id="app-container">
    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>
  </div>
</template>

<script setup>
import { RouterView } from "vue-router";
</script>
