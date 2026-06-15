<template>
  <div class="details-page">
    <nav class="details-nav">
      <a href="#" @click.prevent="goBack" class="back-link">
        ← Back to Search
      </a>
    </nav>

    <div class="details-split-container">
      <aside class="details-artwork-panel">
        <div class="large-cover-frame">
          <img v-if="albumImage" :src="albumImage" alt="Album Cover" />
          <div v-else class="fallback-emoticon-avatar">{{ emoticon }}</div>
        </div>

        <div class="player-container">
          <div v-if="trackId" class="audio-wrapper">
            <iframe
              class="spotify-embedded-iframe"
              :src="`https://open.spotify.com/embed/track/${trackId}?utm_source=generator`"
              width="100%"
              height="152"
              frameBorder="0"
              allowfullscreen=""
              allow="
                autoplay;
                clipboard-write;
                encrypted-media;
                fullscreen;
                picture-in-picture;
              "
              loading="lazy"
            ></iframe>
          </div>
          <div v-else class="no-preview-msg">
            <span>Player unavailable for this track</span>
          </div>

          <a
            v-if="trackId"
            :href="`https://open.spotify.com/track/${trackId}`"
            target="_blank"
            rel="noopener noreferrer"
            class="spotify-link-btn"
          >
            <span class="spotify-icon"></span> Open Full Song in Spotify App
          </a>
        </div>
      </aside>

      <main class="details-content-panel">
        <header class="song-meta-header">
          <h1 :title="title">{{ title }}</h1>
          <div class="meta-artist">{{ artist }}</div>
          <div class="vibe-badge">
            Mood: <span>{{ mood }} {{ emoticon }}</span>
          </div>
        </header>

        <section class="lyrics-card">
          <h2>Lyrics [From Genius]</h2>
          <p class="lyrics-body-text">
            {{ lyricsText }}
          </p>
        </section>
      </main>
    </div>

    <footer class="details-recommendations-section">
      <h2>
        ✨ Check these out, you can continue being
        <span class="mood-pulse-text">{{ mood }}</span>
      </h2>

      <div v-if="isLoadingRecs" class="details-status-msg">
        <span class="loading-spinner"></span>
        <p>Consulting AI ...</p>
      </div>

      <div v-else class="rec-grid-shelf">
        <router-link
          v-for="rec in recommendations"
          :key="rec.spotifyId"
          :to="{
            path: route.path,
            query: {
              id: rec.spotifyId,
              title: rec.title,
              artist: rec.artist,
              image: rec.image,
              previewUrl: rec.previewUrl,
              mood: rec.mood || mood,
              emoticon: rec.emoticon || emoticon,
            },
          }"
          class="rec-mini-card"
        >
          <div class="rec-image-wrapper">
            <img :src="rec.image || 'fallback.jpg'" alt="Album Mini Art" />
          </div>
          <div class="rec-card-info">
            <h3 :title="rec.title">{{ rec.title }}</h3>
            <p>{{ rec.artist }}</p>
          </div>
        </router-link>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";
import { useDetailsLogic } from "../js/details.js";

const route = useRoute();
const router = useRouter();

const goBack = () => {
  router.push({ name: "Dashboard" });
};

const {
  trackId,
  title,
  artist,
  mood,
  emoticon,
  albumImage,
  previewUrl,
  lyricsText,
  recommendations,
  isLoadingRecs,
} = useDetailsLogic(route);
</script>
<style>
@import "../styles/main.css";
@import "../styles/detailsView.css";
</style>
