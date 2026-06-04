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
        placeholder="Search tracks, artists, or albums..."
        @keyup.enter="executeSearch"
      />
      <button @click="executeSearch" class="spotify-btn">Search</button>
    </div>

    <main class="results-area">
      <!-- CONDITION A: No search yet msg -->
      <div v-if="!hasSearched" class="status-message">
        <p>
          Your Spotify Token is active. Type above to start your music
          discovery!
        </p>
      </div>

      <!-- CONDITION B: If return empty, show No Results msg -->
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

      <!-- CONDITION C: Results Shown in Columns  -->
      <div v-else class="dashboard-columns">
        <!-- COLUMN 1: Tracks -->
        <section
          class="column-panel"
          v-if="results.tracks && results.tracks.length"
        >
          <h2>Tracks</h2>
          <div class="column-stack">
            <div v-for="track in results.tracks" :key="track.id" class="card">
              <a :href="track.spotifyUrl" target="_blank" rel="noopener">
                <img :src="track.image || 'fallback.jpg'" alt="Album Art" />
              </a>
              <div class="info">
                <h3>{{ track.name }}</h3>
                <p>{{ track.artist }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- COLUMN 2: Albums -->
        <section
          class="column-panel"
          v-if="results.albums && results.albums.length"
        >
          <h2>Albums</h2>
          <div class="column-stack">
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
        </section>

        <!-- COLUMN 3: Artists  -->
        <section
          class="column-panel"
          v-if="results.artists && results.artists.length"
        >
          <h2>Artists</h2>
          <div class="column-stack">
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
