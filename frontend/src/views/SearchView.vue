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
              :class="[
                track.mood ? `mood-${track.mood.trim().toLowerCase()}` : '',
                { 'is-analyzing-pulse': track.isAnalyzing },
              ]"
              @click="goToSongDetailsPage(track)"
            >
              <div class="img-container">
                <img :src="track.image || 'fallback.jpg'" alt="Album Art" />
              </div>
              <div class="info">
                <div class="track-header">
                  <h3>{{ track.name }}</h3>

                  <div v-if="track.emoticon" class="mood-display-block">
                    <span class="mood-emoticon animate-pop">
                      {{ track.emoticon }}
                    </span>
                    <span class="mood-label-subtext">{{ track.mood }}</span>
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
  executeSearch,
  analyzeMoodInline,
  goToSongDetailsPage,
  logout,
} = useSearchLogic();

// Auto analyze moods (sequential)
const handleSearchSubmit = async () => {
  await executeSearch();

  if (results.value?.tracks?.length) {
    // **Don't chg to/use .forEach loop it will cause bottleneck and crash Ollama
    for (const track of results.value.tracks) {
      // If already analyzed, don't fetch again
      if (track.mood) continue;

      // Loading
      track.isAnalyzing = true;

      try {
        // Ollama breathing room
        await analyzeMoodInline(track);
      } catch (err) {
        console.error("Failed to fetch mood for:", track.name, err);
      } finally {
        track.isAnalyzing = false;
      }
    }
  }
};
</script>

<style scoped>
@import "../styles/main.css";

/* Component Specific Styles - do not move! */
.track-header h3 {
  flex: 1;
  min-width: 0;
}

.animate-pop {
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.analyzing-text-spinner {
  font-size: 0.85rem;
  color: #b3b3b3;
  font-weight: 500;
}

/* Pulse */
.is-analyzing-pulse {
  animation: backgroundPulse 1.8s infinite ease-in-out;
  pointer-events: none;
}

@keyframes backgroundPulse {
  0% {
    background-color: rgba(255, 255, 255, 0.03);
  }
  50% {
    background-color: rgba(255, 255, 255, 0.09);
  }
  100% {
    background-color: rgba(255, 255, 255, 0.03);
  }
}

/* --- Animations --- */

/* ENERGETIC / UPBEAT (Crimson/Orange) */
.mood-energetic,
.mood-upbeat,
.mood-angry {
  animation: flashEnergetic 0.8s ease-out forwards;
}

/* HAPPY / JOYFUL / CHEERFUL (Amber/Yellow) */
.mood-happy,
.mood-joyful,
.mood-cheerful,
.mood-excited {
  animation: flashHappy 0.8s ease-out forwards;
}

/* CHILL / MELLOW / CALM (Emerald/Green) */
.mood-chill,
.mood-mellow,
.mood-calm,
.mood-relaxed {
  animation: flashChill 0.8s ease-out forwards;
}

/* SAD / GLOOMY / MELANCHOLY (Blue) */
.mood-sad,
.mood-gloomy,
.mood-melancholic,
.mood-somber {
  animation: flashSad 0.8s ease-out forwards;
}

/* --- Keyframes for color bg --- */

@keyframes flashEnergetic {
  0% {
    background-color: rgba(239, 68, 68, 0.7);
  }
  100% {
    background-color: rgba(239, 68, 68, 0.18);
  } /* Solid dark red tint */
}

@keyframes flashHappy {
  0% {
    background-color: rgba(251, 191, 36, 0.7);
  }
  100% {
    background-color: rgba(251, 191, 36, 0.15);
  } /* Solid dark gold tint */
}

@keyframes flashChill {
  0% {
    background-color: rgba(16, 185, 129, 0.7);
  }
  100% {
    background-color: rgba(16, 185, 129, 0.15);
  } /* Solid dark green tint */
}

@keyframes flashSad {
  0% {
    background-color: rgba(59, 130, 246, 0.7);
  }
  100% {
    background-color: rgba(59, 130, 246, 0.18);
  } /* Solid dark blue tint */
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
