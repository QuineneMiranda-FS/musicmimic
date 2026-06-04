<template>
  <!--Protected Spotify profile view-->
  <div class="dashboard">
    <h1>Welcome, {{ username }}</h1>
    <p>Your Spotify Token is active.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const username = ref("");

onMounted(async () => {
  const token = localStorage.getItem("app_jwt");
  const res = await fetch("http://localhost:3000/api/dashboard", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  username.value = data.username;
});
</script>
