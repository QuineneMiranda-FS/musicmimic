<template>
  <div class="search-page">
    <header>
      <h1>Music Mimic Dashboard</h1>
      <button @click="logout">Log Out</button>
    </header>

    <div class="search-bar-container">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search tracks, artists, or albums..."
        @keyup.enter="executeSearch"
      />
      <button @click="executeSearch">Search</button>
    </div>

    <main class="results-area">
      <!-- CONDITION A: no search yet msg -->
      <div v-if="!hasSearched" class="status-message">
        <p>
          Your Spotify Token is active. Type above to start your music
          discovery!
        </p>
      </div>

      <!-- CONDITION B: If return empty, show "No Results" message -->
      <div
        v-else-if="results.tracks.length === 0 && results.artists.length === 0"
        class="status-message"
      >
        <p>No results found matching "{{ searchQuery }}". Try another query!</p>
      </div>

      <!-- CONDITION C: Render card lists and anchor thumbnail links -->
      <div v-else class="results-grid">
        <section v-if="results.tracks.length">
          <h2>Tracks</h2>
          <div v-for="track in results.tracks" :key="track.id" class="card">
            <a :href="track.spotifyUrl" target="_blank" rel="noopener">
              <img :src="track.image || 'fallback.jpg'" alt="Album Art" />
            </a>
            <div class="info">
              <h3>{{ track.name }}</h3>
              <p>{{ track.artist }}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
<script setup>
import { useSearchLogic } from "../js/search.js";

const { username, searchQuery, hasSearched, results, executeSearch, logout } =
  useSearchLogic();
</script>

<style scoped>
@import "../styles/search.css";
</style>
