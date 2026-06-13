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

        <section class="column-panel mood-ring-sidebar-panel">
          <div
            v-if="isSpyingStopped"
            class="mood-ring-box-wrapper lava-lamp-wrapper animate-fade-in"
          >
            <h2>Lincoln's Lava Lamp</h2>
            <div class="lava-lamp-container">
              <div class="lamp-glass circle-lamp">
                <div class="lava-blob blob-1"></div>
                <div class="lava-blob blob-2"></div>
                <div class="lava-blob blob-3"></div>
                <div class="lava-blob blob-4"></div>
              </div>
            </div>
            <div class="mood-ring-interactive-dialogue">
              <p class="privacy-notice-text">
                Don't mind me... <br />I'm going to watch my Lava Lamp.<br />I
                won't even look at your song choices.
              </p>
              <div class="mood-ring-cta-block">
                <button
                  @click="restoreMoodRingFeature"
                  class="ring-mood-btn action-restore-btn animate-pulse-glow"
                >
                  🔓 Admit you miss me and I'll let you have your mood ring
                  back.
                </button>
              </div>
            </div>
          </div>

          <div v-else class="mood-ring-box-wrapper animate-fade-in">
            <div class="tabs-header-row sidebar-tabs-header">
              <button
                class="tab-nav-btn sidebar-tab-btn"
                :class="{ 'is-active': activeRingTab === 'daily' }"
                @click="activeRingTab = 'daily'"
              >
                Daily
              </button>
              <button
                class="tab-nav-btn sidebar-tab-btn"
                :class="{ 'is-active': activeRingTab === 'weekly' }"
                @click="activeRingTab = 'weekly'"
              >
                Weekly
              </button>
              <button
                class="tab-nav-btn sidebar-tab-btn"
                :class="{ 'is-active': activeRingTab === 'monthly' }"
                @click="activeRingTab = 'monthly'"
              >
                Monthly
              </button>
            </div>

            <template v-if="!currentSelectedMood">
              <div class="mood-ring-orb-container">
                <div class="mood-ring-outer-halo ring-halo-empty">
                  <div class="mood-ring-inner-core">
                    <span class="mood-ring-emoji-avatar">?</span>
                  </div>
                </div>
              </div>
              <div class="mood-ring-interactive-dialogue">
                <p class="mood-statement-text">
                  Pick some songs and I'll figure out your
                  {{ activeRingTab }} mood!
                </p>
              </div>
            </template>

            <template v-else>
              <div class="mood-ring-orb-container">
                <div
                  class="mood-ring-outer-halo"
                  :class="`ring-halo-${currentSelectedMood.id}`"
                >
                  <div class="mood-ring-inner-core">
                    <span class="mood-ring-emoji-avatar">{{
                      currentSelectedMood.emoticon
                    }}</span>
                  </div>
                </div>
              </div>

              <div class="mood-ring-interactive-dialogue">
                <p class="mood-statement-text">
                  Based on recent choices, your
                  <span class="timeframe-label">{{ activeRingTab }}</span> mood
                  is rather
                  <span
                    class="highlighted-mood-span"
                    :class="`text-color-${currentSelectedMood.id}`"
                  >
                    {{ currentSelectedMood.label }} </span
                  >.
                </p>

                <div class="mood-ring-cta-block">
                  <p class="cta-question-prompt">What Do You Want?</p>
                  <div class="cta-actions-button-row">
                    <button
                      @click="triggerAlternativeSearch('same')"
                      class="ring-mood-btn action-match-btn"
                    >
                      More {{ currentSelectedMood.label }} Songs
                    </button>
                    <button
                      @click="triggerAlternativeSearch('opposite')"
                      class="ring-mood-btn action-flip-btn"
                    >
                      {{ oppositeMoodButtonText }}
                    </button>
                  </div>
                </div>

                <div class="mood-ring-privacy-footer">
                  <button
                    @click="purgeClickHistory"
                    class="privacy-stop-spying-btn"
                  >
                    🔒 Click Here to Make Me Stop Spying on Your Choices
                  </button>
                </div>
              </div>
            </template>
          </div>
          <aside class="mood-ring-column">
            <div class="mood-ring-card"></div>

            <div class="mood-legend-panel">
              <h3>Mood Key</h3>
              <div class="legend-grid">
                <button
                  class="legend-pill-btn"
                  :class="{ active: selectedMoodFilter === null }"
                  @click="selectedMoodFilter = null"
                >
                  🌈 All Tracks
                </button>

                <button
                  v-for="mood in activeLegendMoods"
                  :key="mood.id"
                  class="legend-pill-btn"
                  :class="{ active: selectedMoodFilter === mood.id }"
                  @click="selectedMoodFilter = mood.id"
                >
                  {{ mood.emoticon }} {{ mood.name }}
                </button>
              </div>
            </div>
          </aside>
        </section>

        <section
          v-if="!isSpyingStopped && clickedMoodsHistory.length"
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

const {
  activeTab,
  activeRingTab,
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
  logout,
} = useSearchViewLogic();
</script>

<style scoped>
@import "../styles/searchView.css";
</style>
