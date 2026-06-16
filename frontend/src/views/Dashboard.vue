<template>
  <div class="search-page">
    <div class="search-bar-container">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search tracks, artists, or albums by keyword..."
        @keyup.enter="handleSearchSubmit"
      />
      <button @click="handleSearchSubmit" class="spotify-btn">Search</button>
    </div>

    <main class="results-area">
      <div class="dashboard-columns">
        <section class="column-panel main-tabbed-panel">
          <div class="tabs-header-row">
            <button
              class="tab-nav-btn"
              :class="{ 'is-active': activeTab === 'tracks' }"
              @click="activeTab = 'tracks'"
            >
              Songs
            </button>
            <button
              class="tab-nav-btn"
              :class="{ 'is-active': activeTab === 'albums' }"
              @click="activeTab = 'albums'"
            >
              Albums
            </button>
            <button
              class="tab-nav-btn"
              :class="{ 'is-active': activeTab === 'artists' }"
              @click="activeTab = 'artists'"
            >
              Artists
            </button>
          </div>

          <div class="tab-content-window">
            <div v-if="activeTab === 'tracks'">
              <div v-if="!hasSearched" class="status-message">
                <p>Your Spotify is connected! Type above to search music.</p>
              </div>

              <div
                v-else-if="isRingSearching"
                class="column-status-loader animate-fade-in"
              >
                <span class="analyzing-text-spinner large-spinner">⚡</span>
                <p>Flipping the mood... Consulting AI for alternatives...</p>
              </div>

              <div
                v-else-if="results.tracks.length === 0"
                class="status-message"
              >
                <p>
                  No results found matching "{{ searchQuery }}". Try another
                  query!
                </p>
              </div>

              <div v-else class="column-grid">
                <div
                  v-for="track in filteredTracks"
                  :key="track.id"
                  class="card track-card search-result-card"
                  :class="[
                    track.mood ? `mood-${track.mood.trim().toLowerCase()}` : '',
                    { 'is-analyzing-pulse': track.isAnalyzing },
                  ]"
                  @click="handleTrackClick(track)"
                >
                  <div class="card-media-wrapper">
                    <img :src="track.image || 'fallback.jpg'" alt="Album Art" />
                  </div>
                  <div class="card-text-block">
                    <div class="track-header">
                      <h3>{{ track.name }}</h3>
                      <div v-if="track.emoticon" class="mood-display-block">
                        <span class="mood-emoticon animate-pop">{{
                          track.emoticon
                        }}</span>
                      </div>
                      <span
                        v-else-if="track.isAnalyzing"
                        class="analyzing-text-spinner"
                      >
                        ⚡ Analyzing...
                      </span>
                    </div>
                    <p>{{ track.artist }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="activeTab === 'albums'">
              <div v-if="!hasSearched" class="status-message">
                <p>Your Spotify is connected! Type above to search albums.</p>
              </div>
              <div
                v-else-if="results.albums.length === 0"
                class="status-message"
              >
                <p>No albums found matching "{{ searchQuery }}".</p>
              </div>
              <div v-else class="column-grid">
                <a
                  v-for="album in results.albums"
                  :key="album.id"
                  :href="album.spotifyUrl"
                  target="_blank"
                  rel="noopener"
                  class="card card-link search-result-card"
                >
                  <div class="card-media-wrapper">
                    <img
                      :src="album.image || 'fallback.jpg'"
                      alt="Album Cover"
                    />
                  </div>
                  <div class="card-text-block">
                    <h3>{{ album.name }}</h3>
                    <p>{{ album.artist }}</p>
                  </div>
                </a>
              </div>
            </div>

            <div v-if="activeTab === 'artists'">
              <div v-if="!hasSearched" class="status-message">
                <p>Your Spotify is connected! Type above to search artists.</p>
              </div>
              <div
                v-else-if="results.artists.length === 0"
                class="status-message"
              >
                <p>No artists found matching "{{ searchQuery }}".</p>
              </div>
              <div v-else class="column-grid">
                <a
                  v-for="artist in results.artists"
                  :key="artist.id"
                  :href="artist.spotifyUrl"
                  target="_blank"
                  rel="noopener"
                  class="card card-link search-result-card"
                >
                  <div class="card-media-wrapper">
                    <img
                      :src="artist.image || 'fallback.jpg'"
                      alt="Artist Avatar"
                      class="artist-img"
                    />
                  </div>
                  <div class="card-text-block">
                    <h3>{{ artist.name }}</h3>
                    <p v-if="artist.genres && artist.genres.length">
                      {{ artist.genres[0] }}
                    </p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>

        <MoodDisplay
          v-model:activeRingTab="activeRingTab"
          v-model:selectedMoodFilter="selectedMoodFilter"
          :current-selected-mood="currentSelectedMood"
          :opposite-mood-button-text="oppositeMoodButtonText"
          :is-spying-stopped="isSpyingStopped"
          :categories="dynamicCategories"
          :active-legend-moods="activeLegendMoods"
          @add-category="addNewCategory"
          @move-mood="moveMoodToCategory"
          @update-mood="updateMoodDetails"
          @delete-category="deleteCustomCategory"
          @restore-spying="restoreMoodRingFeature"
          @stop-spying="purgeClickHistory"
          @trigger-alternative="triggerAlternativeSearch"
          @question-click="handleQuestionMarkClick"
        />

        <section
          v-if="clickedMoodsHistory.length"
          class="column-panel history-full-row-panel animate-fade-in"
        >
          <div class="history-section-header">
            <h2>I Saw You Looking At These Songs:</h2>
            <button
              @click="clearOnlyVisualHistory"
              class="clear-history-action-btn"
            >
              Clear List
            </button>
          </div>
          <div class="history-grid-row">
            <div
              v-for="(track, index) in reversedHistory"
              :key="track.id + '-' + index"
              class="card track-card history-mini-card"
              :class="
                track.mood ? `mood-${track.mood.trim().toLowerCase()}` : ''
              "
              @click="goToSongDetailsPage(track)"
            >
              <button
                class="delete-history-item-btn"
                @click.stop="deleteSongFromHistory(track.id)"
                title="Remove song from history & mood calculations"
              >
                &times;
              </button>

              <div class="history-period-badges">
                <span v-if="track.isDailyEligible" class="badge badge-day"
                  >D</span
                >
                <span v-if="track.isWeeklyEligible" class="badge badge-week"
                  >W</span
                >
                <span v-if="track.isMonthlyEligible" class="badge badge-month"
                  >M</span
                >
              </div>

              <div class="card-media-wrapper">
                <img :src="track.image || 'fallback.jpg'" alt="Album Art" />
              </div>

              <div class="card-text-block">
                <div class="track-header">
                  <h3>{{ track.name }}</h3>
                  <div class="mood-display-block">
                    <span class="mood-emoticon">{{ track.emoticon }}</span>
                  </div>
                </div>
                <p>{{ track.artist }}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useSearchViewLogic } from "../js/searchViewLogic.js";
import MoodDisplay from "../components/MoodDisplay.vue";

const {
  activeTab,
  activeRingTab,
  selectedMoodFilter,
  clickedMoodsHistory,
  isSpyingStopped,
  isRingSearching,
  activeLegendMoods,
  searchQuery,
  hasSearched,
  results,
  filteredTracks,
  reversedHistory,
  currentSelectedMood,
  oppositeMoodButtonText,
  handleSearchSubmit,
  handleTrackClick,
  clearOnlyVisualHistory,
  purgeClickHistory,
  restoreMoodRingFeature,
  triggerAlternativeSearch,
  goToSongDetailsPage,
  handleQuestionMarkClick,
  deleteSongFromHistory,
  dynamicCategories,
  addNewCategory,
  moveMoodToCategory,
  updateMoodDetails,
  deleteCustomCategory,
} = useSearchViewLogic();
</script>

<style scoped>
@import "../styles/searchView.css";
</style>
