<template>
  <div class="login-container">
    <h1>Music Mimic</h1>
    <p>
      Welcome! Please connect your account to search tracks, artists, and
      albums.
    </p>

    <a href="http://127.0.0.1:3000/api/auth/login/spotify" class="spotify-btn">
      Log In With Spotify
    </a>
  </div>
</template>

<script setup>
import { useLoginLogic } from "../js/login.js";

useLoginLogic();
</script>

<style scoped>
@import "../styles/login.css";
</style>
