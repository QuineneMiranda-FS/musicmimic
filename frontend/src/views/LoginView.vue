<template>
  <div class="login-page-wrapper">
    <div class="login-container">
      <h2>Hello Friend</h2>
      <p>Connect your account to search tracks, artists, and albums.</p>

      <a
        href="http://127.0.0.1:3000/api/auth/login/spotify"
        class="spotify-btn"
      >
        Log In With Spotify
      </a>
    </div>
  </div>
</template>

<script setup>
import { useLoginLogic } from "../js/login.js";

useLoginLogic();
</script>
