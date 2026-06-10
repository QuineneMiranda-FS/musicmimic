<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";

const route = useRoute();
const trackId = ref(route.query.id);
const title = ref(route.query.title);
const artist = ref(route.query.artist);
const mood = ref(route.query.mood);
const emoticon = ref(route.query.emoticon);
const albumImage = ref(route.query.image);
const lyrics = ref("Getting Genius Live Data...");
const recommendations = ref([]);
const isLoadingRecs = ref(false);

const loadPageData = async () => {
  if (!trackId.value) return;
  isLoadingRecs.value = true;

  // Fetch Lyrics and Mood from Backend
  try {
    const analyzeRes = await axios.post(
      "http://localhost:3000/api/tracks/analyze",
      {
        spotifyId: trackId.value,
        title: title.value,
        artist: artist.value,
      },
    );
    lyrics.value = analyzeRes.data.lyricsText;

    // Update frontend
    if (analyzeRes.data.mood) mood.value = analyzeRes.data.mood;
    if (analyzeRes.data.emoticon) emoticon.value = analyzeRes.data.emoticon;
  } catch (err) {
    console.error("Genius Scraping Error:", err);
    lyrics.value = "Failed to sync song profile elements.";
  }

  // Fetch Spotify Recs from Backend
  try {
    const token = localStorage.getItem("app_jwt");
    const recsRes = await axios.get(
      "http://localhost:3000/api/tracks/recommendations",
      {
        params: {
          mood: mood.value,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    recommendations.value = recsRes.data;
  } catch (err) {
    console.error("Spotify Recommendations Subpage Error:", err);
    recommendations.value = [];
  } finally {
    isLoadingRecs.value = false;
  }
};

watch(
  () => route.query.id,
  (newId) => {
    if (!newId) return;
    trackId.value = route.query.id;
    title.value = route.query.title;
    artist.value = route.query.artist;
    mood.value = route.query.mood;
    emoticon.value = route.query.emoticon;
    albumImage.value = route.query.image;
    loadPageData();
  },
);

onMounted(loadPageData);
</script>

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
      </aside>

      <main class="details-content-panel">
        <header class="song-meta-header">
          <h1 :title="title">{{ title }}</h1>
          <p class="meta-artist">{{ artist }}</p>
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
        <div
          v-for="rec in recommendations"
          :key="rec.spotifyId"
          class="rec-mini-card"
        >
          <img :src="rec.image || 'fallback.jpg'" alt="Album Mini Art" />
          <div class="rec-card-info">
            <h3 :title="rec.title">{{ rec.title }}</h3>
            <p>{{ rec.artist }}</p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@import "../styles/main.css";
</style>
