<template>
  <div class="details-page">
    <nav class="details-nav">
      <router-link to="/search" class="back-link">
        ← Back to Search
      </router-link>
    </nav>

    <div class="details-split-container">
      <aside class="details-artwork-panel">
        <div class="large-cover-frame">
          <img v-if="albumImage" :src="albumImage" alt="Album Cover" />
          <div v-else class="fallback-emoticon-avatar">{{ emoticon }}</div>
        </div>

        <div class="player-container">
          <div v-if="previewUrl" class="audio-wrapper">
            <span class="player-label">Listen to Snippet:</span>
            <audio controls :src="previewUrl" class="snippet-player">
              Your browser does not support the audio element.
            </audio>
          </div>
          <div v-else class="no-preview-msg">
            <span>Preview snippet unavailable for this track</span>
          </div>

          <a
            v-if="trackId"
            :href="`https://open.spotify.com/track/${trackId}`"
            target="_blank"
            rel="noopener noreferrer"
            class="spotify-link-btn"
          >
            <span class="spotify-icon"></span> Play Full Song on Spotify
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
            {{ lyrics }}
          </p>
        </section>
      </main>
    </div>

    <footer class="details-recommendations-section">
      <h2>✨ Recommended Songs via Spotify Mix</h2>

      <div v-if="isLoadingRecs" class="details-status-msg">
        <span class="loading-spinner"></span>
        <p>Connecting to Spotify Web API ...</p>
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
              preview_url: rec.previewUrl,
              mood: mood,
              emoticon: emoticon,
            },
          }"
          class="rec-mini-card"
        >
          <img :src="rec.image || 'fallback.jpg'" alt="Album Mini Art" />
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
import { useRoute } from "vue-router";
import { useDetailsLogic } from "../js/details.js";

const route = useRoute();

const {
  trackId,
  title,
  artist,
  mood,
  emoticon,
  albumImage,
  previewUrl,
  lyrics,
  recommendations,
  isLoadingRecs,
} = useDetailsLogic(route);
</script>
