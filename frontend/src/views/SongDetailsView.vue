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
const previewUrl = ref(route.query.preview_url || null);

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
    if (analyzeRes.data.previewUrl)
      previewUrl.value = analyzeRes.data.previewUrl;
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
    previewUrl.value = route.query.preview_url || null;
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

/* MOVE STYLING TO CSS FILE */
.player-container {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  width: 100%;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}

.audio-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.player-label {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #b3b3b3;
  font-weight: bold;
}

.snippet-player {
  width: 100%;
  height: 40px;
  border-radius: 8px;
}

.no-preview-msg {
  font-size: 0.85rem;
  color: #888;
  font-style: italic;
  text-align: center;
  padding: 0.5rem;
  border: 1px dashed #444;
  border-radius: 6px;
}

.spotify-link-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: #1db954;
  color: #ffffff;
  padding: 0.75rem 1rem;
  border-radius: 25px;
  font-weight: bold;
  text-decoration: none;
  font-size: 0.9rem;
  transition:
    background-color 0.2s ease,
    transform 0.1s ease;
  box-shadow: 0 4px 12px rgba(29, 185, 84, 0.2);
}

.spotify-link-btn:hover {
  background-color: #1ed760;
  transform: scale(1.02);
}

.spotify-icon {
  font-size: 1.1rem;
}
</style>
