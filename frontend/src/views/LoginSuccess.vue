<script setup>
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

onMounted(() => {
  const token = route.query.token;
  if (token) {
    // Store for API requests
    localStorage.setItem("user_token", token);
    // Redirect the user to Vue dashboard / results view
    router.push("/results");
  } else {
    router.push("/");
  }
});
</script>

<template>
  <p>Authenticating with MusicMimic...</p>
</template>
