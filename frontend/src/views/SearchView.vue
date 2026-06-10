<template>
  <div class="search-page">
    <header>
      <h1>Music Mimic Dashboard</h1>
      <button @click="logout" class="spotify-btn logout-btn">Log Out</button>
    </header>

    <div class="search-bar-container">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search tracks, artists, or albums by keyword..."
        @keyup.enter="executeSearch"
      />
      <button @click="executeSearch" class="spotify-btn">Search</button>
    </div>

    <main class="results-area">
      <div v-if="!hasSearched" class="status-message">
        <p>Your Spotify is connected! Type above to search music.</p>
      </div>

      <div
        v-else-if="
          results.tracks.length === 0 &&
          results.artists.length === 0 &&
          results.albums.length === 0
        "
        class="status-message"
      >
        <p>No results found matching "{{ searchQuery }}". Try another query!</p>
      </div>

      <div v-else class="dashboard-columns">
        <section class="column-panel">
          <h2>Tracks</h2>
          <div
            v-if="results.tracks && results.tracks.length"
            class="column-stack"
          >
            <div
              v-for="track in results.tracks"
              :key="track.id"
              class="card track-card"
              :class="{ 'is-analyzing': loadingTrackId === track.id }"
              @click="goToSongDetailsPage(track)"
            >
              <div class="img-container">
                <img :src="track.image || 'fallback.jpg'" alt="Album Art" />
              </div>
              <div class="info">
                <div class="track-header">
                  <h3>{{ track.name }}</h3>

                  <div v-if="track.emoticon" class="mood-display-block">
                    <span
                      class="mood-emoticon animate-pop"
                      :title="'Ollama detected a ' + track.mood + ' vibe!'"
                    >
                      {{ track.emoticon }}
                    </span>
                    <span class="mood-label-subtext">{{ track.mood }}</span>
                  </div>

                  <span
                    v-else-if="loadingTrackId === track.id"
                    class="loading-spinner"
                    >⏳</span
                  >

                  <span
                    v-else
                    class="analyze-badge clickable-badge"
                    @click.stop="analyzeMoodInline(track)"
                  >
                    🔍 Analyze Mood
                  </span>
                </div>
                <p>{{ track.artist }}</p>
              </div>
            </div>
          </div>
          <p v-else class="empty-column-msg">No track results.</p>
        </section>

        <section class="column-panel">
          <h2>Albums</h2>
          <div
            v-if="results.albums && results.albums.length"
            class="column-stack"
          >
            <div v-for="album in results.albums" :key="album.id" class="card">
              <a :href="album.spotifyUrl" target="_blank" rel="noopener">
                <img :src="album.image || 'fallback.jpg'" alt="Album Cover" />
              </a>
              <div class="info">
                <h3>{{ album.name }}</h3>
                <p>{{ album.artist }}</p>
              </div>
            </div>
          </div>
          <p v-else class="empty-column-msg">No album results.</p>
        </section>

        <section class="column-panel">
          <h2>Artists</h2>
          <div
            v-if="results.artists && results.artists.length"
            class="column-stack"
          >
            <div
              v-for="artist in results.artists"
              :key="artist.id"
              class="card"
            >
              <a :href="artist.spotifyUrl" target="_blank" rel="noopener">
                <img
                  :src="artist.image || 'fallback.jpg'"
                  alt="Artist Avatar"
                  class="artist-img"
                />
              </a>
              <div class="info">
                <h3>{{ artist.name }}</h3>
                <p v-if="artist.genres && artist.genres.length">
                  {{ artist.genres[0] }}
                </p>
              </div>
            </div>
          </div>
          <p v-else class="empty-column-msg">No artist results.</p>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useSearchLogic } from "../js/search.js";

const router = useRouter();
const { searchQuery, hasSearched, results, executeSearch, logout } =
  useSearchLogic();

const loadingTrackId = ref(null);

// OPTION A: Click the badge -> Runs Ollama live, adds Emoticon
const analyzeMoodInline = async (track) => {
  if (loadingTrackId.value) return;

  loadingTrackId.value = track.id;

  try {
    const response = await axios.post("/api/tracks/analyze", {
      spotifyId: track.id,
      title: track.name,
      artist: track.artist,
    });

    // Inject the results
    track.mood = response.data.mood;
    track.emoticon = response.data.emoticon;
  } catch (error) {
    console.error("Error running local Ollama inference:", error);
    alert("Could not process this track's mood.");
  } finally {
    loadingTrackId.value = null;
  }
};

// OPTION B: Click anywhere except Analyze -> Sends to song view page
const goToSongDetailsPage = (track) => {
  // If song clicked, but wasn't analyzed, get mood on redirect
  router.push({
    name: "MoodSearch",
    query: {
      id: track.id,
      title: track.name,
      artist: track.artist,
      mood: track.mood || "Analyzing...",
      emoticon: track.emoticon || "🎵",
      image: track.image || "",
    },
  });
};
</script>

<style scoped>
@import "../styles/main.css";

.clickable-badge {
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.1s ease;
}
.clickable-badge:hover {
  background-color: #242424;
  transform: scale(1.03);
}
.animate-pop {
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes popIn {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}
</style>
