<template>
  <header class="app-header">
    <div class="header-brand">
      <span class="brand-logo">🟢</span>
      <h1 class="brand-title">Music Mimic</h1>
    </div>
    <nav class="header-nav">
      <template v-if="isLoggedIn">
        <RouterLink to="/dashboard" class="nav-link" active-class="active-link"
          >Home</RouterLink
        >
        <!-- <RouterLink to="/search" class="nav-link" active-class="active-link"
          >Search</RouterLink
        >
        <RouterLink to="/mood" class="nav-link" active-class="active-link"
          >Mood Ring</RouterLink
        >
        <RouterLink to="/history" class="nav-link" active-class="active-link"
          >History</RouterLink
        > -->
        <button @click="handleLogout" class="logout-btn">Log Out</button>
      </template>
      <template v-else>
        <RouterLink to="/" class="nav-link" active-class="active-link"
          >Welcome</RouterLink
        >
      </template>
    </nav>
  </header>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { RouterLink, useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();
const isLoggedIn = ref(false);

// Check authentication status
const checkAuth = () => {
  isLoggedIn.value = !!localStorage.getItem("app_jwt");
};

// Handle clearing storage and returning home
const handleLogout = () => {
  localStorage.removeItem("app_jwt");
  isLoggedIn.value = false;
  router.push("/");
};

// Evaluate auth whenever the route changes
watch(
  () => route.path,
  () => {
    checkAuth();
  },
);

onMounted(() => {
  checkAuth();
});
</script>
