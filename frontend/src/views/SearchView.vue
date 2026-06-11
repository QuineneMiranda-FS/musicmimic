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
            <a
              v-for="album in results.albums"
              :key="album.id"
              :href="album.spotifyUrl"
              target="_blank"
              rel="noopener"
              class="card card-link"
            >
              <div class="img-container">
                <img :src="album.image || 'fallback.jpg'" alt="Album Cover" />
              </div>
              <div class="info">
                <h3>{{ album.name }}</h3>
                <p>{{ album.artist }}</p>
              </div>
            </a>
          </div>
          <p v-else class="empty-column-msg">No album results.</p>
        </section>

        <section class="column-panel">
          <h2>Artists</h2>
          <div
            v-if="results.artists && results.artists.length"
            class="column-stack"
          >
            <a
              v-for="artist in results.artists"
              :key="artist.id"
              :href="artist.spotifyUrl"
              target="_blank"
              rel="noopener"
              class="card card-link"
            >
              <div class="img-container">
                <img
                  :src="artist.image || 'fallback.jpg'"
                  alt="Artist Avatar"
                  class="artist-img"
                />
              </div>
              <div class="info">
                <h3>{{ artist.name }}</h3>
                <p v-if="artist.genres && artist.genres.length">
                  {{ artist.genres[0] }}
                </p>
              </div>
            </a>
          </div>
          <p v-else class="empty-column-msg">No artist results.</p>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useSearchLogic } from "../js/search.js";

const {
  searchQuery,
  hasSearched,
  results,
  loadingTrackId,
  executeSearch,
  analyzeMoodInline,
  goToSongDetailsPage,
  logout,
} = useSearchLogic();
</script>

<style scoped>
@import "../styles/main.css";

/* Component Specific Styles - do not move */
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
