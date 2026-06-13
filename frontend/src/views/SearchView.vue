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
      <div class="dashboard-columns-revamped">
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
                  <div class="img-container">
                    <img
                      :src="album.image || 'fallback.jpg'"
                      alt="Album Cover"
                    />
                  </div>
                  <div class="info">
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
            </div>
          </div>

          <div class="mood-legend-box text-left-adjusted">
            <h4>Mood Key</h4>
            <div class="legend-grid row-layout-adjusted">
              <div
                v-for="item in activeLegendMoods"
                :key="item.id"
                class="legend-item animate-pop"
              >
                <span :class="`text-color-${item.legendGroup}`">
                  {{ item.emoticon }}
                </span>
                {{ item.name }}
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
                    <span class="mood-ring-emoji-avatar">
                      {{ currentSelectedMood.emoticon }}
                    </span>
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
              <div class="img-container">
                <img :src="track.image || 'fallback.jpg'" alt="Album Art" />
              </div>
              <div class="info">
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
import { ref, computed, nextTick, onMounted } from "vue";
import { useSearchLogic } from "../js/search.js";

const activeTab = ref("tracks");
const activeRingTab = ref("daily");
const selectedMoodFilter = ref(null);
const clickedMoodsHistory = ref([]);
const isSpyingStopped = ref(false);
const isRingSearching = ref(false);

// Moods
const moodMatrixConfig = {
  energetic: { label: "Energetic", emoticon: "⚡" },
  angry: { label: "Angry", emoticon: "🔥" },
  happy: { label: "Happy", emoticon: "☀️" },
  upbeat: { label: "Upbeat", emoticon: "🕺" },
  chill: { label: "Chill", emoticon: "🌊" },
  melancholic: { label: "Melancholic", emoticon: "🌧️" },
  romantic: { label: "Romantic", emoticon: "💖" },
  mysterious: { label: "Mysterious", emoticon: "🔮" },
  ethereal: { label: "Ethereal", emoticon: "✨" },
  grounded: { label: "Grounded", emoticon: "🪵" },
};

// Hold new Moods
const permanentCustomMoods = ref([]);

onMounted(() => {
  // History
  const savedHistory = localStorage.getItem("mimic_daily_mood_clicks");
  if (savedHistory) {
    try {
      clickedMoodsHistory.value = JSON.parse(savedHistory);
    } catch (e) {
      console.error("Failed to parse mood history", e);
    }
  }

  // Spying
  if (localStorage.getItem("mimic_privacy_shield") === "true") {
    isSpyingStopped.value = true;
  }

  // Load Moods fm Local
  const savedCustomMoods = localStorage.getItem("mimic_permanent_ai_moods");
  if (savedCustomMoods) {
    try {
      permanentCustomMoods.value = JSON.parse(savedCustomMoods);
    } catch (e) {
      console.error("Failed to parse custom moods", e);
    }
  }
});

// Helper to Sv New Moods
const saveNewAImoodPermanently = (normalizedName, emoticon, legendGroup) => {
  const lowerName = normalizedName.toLowerCase();

  // Check if already exists
  if (moodMatrixConfig[lowerName]) return;

  // Check if already saved
  const alreadySaved = permanentCustomMoods.value.some(
    (item) => item.id === lowerName,
  );

  if (!alreadySaved) {
    const newMoodObj = {
      id: lowerName,
      name: normalizedName,
      emoticon: emoticon || "🎵",
      legendGroup: legendGroup ? legendGroup.toLowerCase() : "chill",
    };

    // Add & Sv
    permanentCustomMoods.value.push(newMoodObj);
    localStorage.setItem(
      "mimic_permanent_ai_moods",
      JSON.stringify(permanentCustomMoods.value),
    );
  }
};

const activeLegendMoods = computed(() => {
  // Start with Base Moods
  const baseLegend = [
    { id: "chill", name: "Chill", emoticon: "🌊", legendGroup: "chill" },
    {
      id: "energetic",
      name: "Energetic",
      emoticon: "⚡",
      legendGroup: "energetic",
    },
    { id: "angry", name: "Angry", emoticon: "🔥", legendGroup: "angry" },
    { id: "happy", name: "Happy", emoticon: "☀️", legendGroup: "happy" },
    {
      id: "melancholic",
      name: "Melancholic",
      emoticon: "🌧️",
      legendGroup: "melancholic",
    },
    {
      id: "romantic",
      name: "Romantic",
      emoticon: "💖",
      legendGroup: "romantic",
    },
    {
      id: "mysterious",
      name: "Mysterious",
      emoticon: "🔮",
      legendGroup: "mysterious",
    },
    {
      id: "ethereal",
      name: "Ethereal",
      emoticon: "✨",
      legendGroup: "ethereal",
    },
    { id: "upbeat", name: "Upbeat", emoticon: "🕺", legendGroup: "upbeat" },
    {
      id: "grounded",
      name: "Grounded",
      emoticon: "🪵",
      legendGroup: "grounded",
    },
  ];

  // Sv to Display Permanently
  permanentCustomMoods.value.forEach((customMood) => {
    const exists = baseLegend.some((item) => item.id === customMood.id);
    if (!exists) {
      baseLegend.push(customMood);
    }
  });

  const currentTracks = results.value?.tracks || [];
  const historyTracks = clickedMoodsHistory.value || [];
  const allAvailableSongs = [...currentTracks, ...historyTracks];

  allAvailableSongs.forEach((track) => {
    if (track.mood) {
      const normalizedName = track.mood.trim();
      const lowerName = normalizedName.toLowerCase();

      // Sv to Local
      saveNewAImoodPermanently(
        normalizedName,
        track.emoticon,
        track.legendGroup,
      );

      const alreadyInLegend = baseLegend.some((item) => item.id === lowerName);

      if (!alreadyInLegend) {
        baseLegend.push({
          id: lowerName,
          name: normalizedName,
          emoticon: track.emoticon || "🎵",
          legendGroup: track.legendGroup
            ? track.legendGroup.toLowerCase()
            : "chill",
        });
      }
    }
  });

  return baseLegend;
});

const {
  searchQuery,
  hasSearched,
  results,
  executeSearch,
  analyzeMoodInline,
  goToSongDetailsPage,
  logout,
} = useSearchLogic();

const handleTrackClick = (track) => {
  if (!isSpyingStopped.value) {
    clickedMoodsHistory.value.push({
      id: track.id || Date.now().toString(),
      name: track.name || "Unknown Title",
      artist: track.artist || "Unknown Artist",
      image: track.image || "fallback.jpg",
      mood: track.mood || null,
      emoticon: track.emoticon || "🎵",
      timestamp: Date.now(),
    });

    localStorage.setItem(
      "mimic_daily_mood_clicks",
      JSON.stringify(clickedMoodsHistory.value),
    );
  }
  goToSongDetailsPage(track);
};

const reversedHistory = computed(() => {
  return [...clickedMoodsHistory.value].reverse();
});

const clearOnlyVisualHistory = () => {
  clickedMoodsHistory.value = [];
  localStorage.removeItem("mimic_daily_mood_clicks");
};

const purgeClickHistory = () => {
  clickedMoodsHistory.value = [];
  localStorage.removeItem("mimic_daily_mood_clicks");
  isSpyingStopped.value = true;
  localStorage.setItem("mimic_privacy_shield", "true");
};

const restoreMoodRingFeature = () => {
  isSpyingStopped.value = false;
  localStorage.setItem("mimic_privacy_shield", "false");
};

const getAggregateMood = (sourceArray) => {
  if (!sourceArray || !sourceArray.length) return null;

  const counts = {};
  sourceArray.forEach((item) => {
    if (item.mood) {
      const normalizedMood = item.mood.trim().toLowerCase();
      counts[normalizedMood] = (counts[normalizedMood] || 0) + 1;
    }
  });

  const topMoodKey = Object.keys(counts).reduce(
    (a, b) => (counts[a] > counts[b] ? a : b),
    "",
  );

  if (!topMoodKey) return null;

  // Chk Base Moods
  let moodConfig = moodMatrixConfig[topMoodKey];

  // Lookup if Not found
  if (!moodConfig) {
    const foundCustom = permanentCustomMoods.value.find(
      (item) => item.id === topMoodKey,
    );
    if (foundCustom) {
      moodConfig = {
        label: foundCustom.name,
        emoticon: foundCustom.emoticon,
      };
    }
  }

  return {
    id: topMoodKey,
    label: moodConfig ? moodConfig.label : "Alternative",
    emoticon: moodConfig ? moodConfig.emoticon : "🎵",
  };
};

const dominantMood = computed(() => {
  // Keep eye on Moods
  const history = clickedMoodsHistory.value || [];
  if (!history.length) return null;

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const dailyTracks = history.filter(
    (item) => !item.timestamp || item.timestamp >= oneDayAgo,
  );
  return getAggregateMood(dailyTracks);
});

const weeklyMood = computed(() => {
  const history = clickedMoodsHistory.value || [];
  if (!history.length) return null;

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyTracks = history.filter(
    (item) => !item.timestamp || item.timestamp >= oneWeekAgo,
  );
  return getAggregateMood(weeklyTracks);
});

const monthlyMood = computed(() => {
  const history = clickedMoodsHistory.value || [];
  if (!history.length) return null;

  const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const monthlyTracks = history.filter(
    (item) => !item.timestamp || item.timestamp >= oneMonthAgo,
  );
  return getAggregateMood(monthlyTracks);
});

const currentSelectedMood = computed(() => {
  if (activeRingTab.value === "weekly") return weeklyMood.value;
  if (activeRingTab.value === "monthly") return monthlyMood.value;
  return dominantMood.value;
});

const moodOppositesMap = {
  chill: { label: "Energized", query: "Energetic edm rock" },
  energetic: { label: "Chill", query: "Chill ambient lo-fi" },
  upbeat: { label: "Chill", query: "Chill ambient lo-fi" },
  happy: { label: "Sad", query: "Melancholic somber sad blues" },
  joyful: { label: "Melancholic", query: "Melancholic somber sad blues" },
  melancholic: { label: "Happy", query: "Happy cheerful pop disco" },
  sad: { label: "Happy", query: "Happy cheerful pop disco" },
  angry: { label: "Peaceful", query: "Chill peaceful acoustic meditative" },
  romantic: { label: "Mysterious", query: "Dark mysterious gothic" },
  mysterious: { label: "Romantic", query: "Romantic bright pop" },
  ethereal: {
    label: "Grounded",
    query: "Acoustic indie folk structural roots",
  },
  grounded: { label: "Ethereal", query: "Ambient synth dream pop" },
};

const oppositeMoodButtonText = computed(() => {
  if (!currentSelectedMood.value) return "I'd rather be Alternative";
  const currentId = currentSelectedMood.value.id;
  const oppositeData = moodOppositesMap[currentId];
  return oppositeData
    ? `I'd rather be ${oppositeData.label}`
    : "I'd rather be Alternative";
});

const handleSearchSubmit = async () => {
  try {
    selectedMoodFilter.value = null;
    await executeSearch();
    await nextTick();

    if (results.value && results.value.tracks && results.value.tracks.length) {
      for (const track of results.value.tracks) {
        if (track.mood) continue;

        track.isAnalyzing = true;
        try {
          await analyzeMoodInline(track);
        } catch (err) {
          console.error("Failed to fetch mood for:", track.name, err);
        } finally {
          track.isAnalyzing = false;
        }
      }
    }
  } catch (error) {
    console.error("Search submittal context failure:", error);
  }
};

const filteredTracks = computed(() => {
  if (!results.value || !results.value.tracks) return [];
  if (!selectedMoodFilter.value) return results.value.tracks;

  return results.value.tracks.filter(
    (track) => track.mood?.trim().toLowerCase() === selectedMoodFilter.value,
  );
});

const triggerAlternativeSearch = async (type) => {
  if (!currentSelectedMood.value) return;

  if (type === "same") {
    selectedMoodFilter.value = currentSelectedMood.value.id;
  } else {
    selectedMoodFilter.value = null;
    isRingSearching.value = true;

    const currentId = currentSelectedMood.value.id;
    searchQuery.value =
      moodOppositesMap[currentId]?.query || "new alternative music";

    try {
      await handleSearchSubmit();
    } finally {
      isRingSearching.value = false;
    }
  }
};
</script>

<style scoped>
@import "../styles/main.css";

.dashboard-columns-revamped {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 40px;
  align-items: start;
  width: 100%;
}

.column-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  width: 100%;
}
.search-result-card {
  margin: 0;
  width: 100%;
  transition:
    transform 0.2s,
    border-color 0.2s;
}

.search-result-card:hover {
  transform: translateY(-2px);
}

.history-full-row-panel {
  grid-column: 1 / -1;
  width: 100%;
  margin-top: 20px;
}

.history-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border);
  padding-bottom: 12px;
  margin-bottom: 20px;
  width: 100%;
}

.clear-history-action-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-history-action-btn:hover {
  color: #ef4444;
  border-color: #ef4444;
}

.history-grid-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  width: 100%;
}

.history-mini-card {
  margin: 0;
  transition:
    transform 0.2s,
    border-color 0.2s;
}

.history-mini-card:hover {
  transform: translateY(-2px);
}

.tabs-header-row {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 12px;
  margin-bottom: 20px;
  width: 100%;
}

.sidebar-tabs-header {
  margin-bottom: 24px;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.tab-nav-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.1rem;
  font-weight: 700;
  padding: 6px 16px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.sidebar-tab-btn {
  font-size: 0.9rem;
  padding: 4px 12px;
}

.tab-nav-btn:hover {
  color: var(--text-main);
  background-color: var(--bg-card-hover);
}

.tab-nav-btn.is-active {
  color: var(--accent);
  background-color: rgba(29, 185, 84, 0.1);
}

.mood-ring-box-wrapper {
  background-color: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px 20px 32px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: var(--shadow);
}

.mood-ring-orb-container {
  margin-bottom: 24px;
}

.mood-ring-outer-halo {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.05);
  transition: all 0.8s ease-in-out;
}

.mood-ring-inner-core {
  width: 100%;
  height: 100%;
  background-color: var(--bg-base);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mood-ring-emoji-avatar {
  color: yellow;
  font-size: 2.5rem;
}

.mood-statement-text {
  font-size: 1.25rem;
  color: var(--text-main);
  font-weight: 600;
  margin-bottom: 24px;
  line-height: 1.4;
}

.timeframe-label {
  text-transform: lowercase;
  color: var(--text-muted);
}

.privacy-notice-text {
  font-size: 1.1rem;
  color: var(--text-muted);
  font-style: italic;
  margin-bottom: 20px;
}

.highlighted-mood-span {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 800;
}

.mood-ring-cta-block {
  border-top: 1px solid var(--border);
  padding-top: 20px;
  width: 100%;
}

.cta-question-prompt {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.cta-actions-button-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.ring-mood-btn {
  width: 100%;
  padding: 12px 16px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  border: 1px solid var(--border);
  transition: all 0.2s ease;
}

.action-match-btn {
  background-color: #242424;
  color: var(--text-main);
}
.action-match-btn:hover {
  background-color: #323232;
  border-color: #666;
}

.action-flip-btn {
  background-color: transparent;
  color: var(--text-muted);
}
.action-flip-btn:hover {
  color: var(--text-main);
  border-color: #fff;
}

.action-restore-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.4);
  font-size: 0.9rem;
  line-height: 1.4;
}
.action-restore-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: #ef4444;
  transform: scale(1.02);
}

.animate-pulse-glow {
  animation: pulseGlowBorder 2s infinite ease-in-out;
}

@keyframes pulseGlowBorder {
  0%,
  100% {
    box-shadow: 0 0 5px rgba(239, 68, 68, 0.2);
  }
  50% {
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
  }
}

.mood-ring-privacy-footer {
  margin-top: 20px;
  border-top: 1px dotted #333;
  padding-top: 14px;
  width: 100%;
}

.privacy-stop-spying-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 0.75rem;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s ease;
}
.privacy-stop-spying-btn:hover {
  color: #ef4444;
}

/* Lava Lamp Circle  */
.lava-lamp-container {
  width: 140px;
  height: 140px;
  margin: 10px auto 24px auto;
  position: relative;
  filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.05));
}

.lamp-glass.circle-lamp {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(20, 20, 20, 0.9),
    rgba(5, 5, 5, 0.95)
  );
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.1);
  animation: colorMoodShift 12s infinite linear;
}

.lava-blob {
  position: absolute;
  background: #ef4444;
  border-radius: 50%;
  filter: blur(8px);
}

.blob-1 {
  width: 65px;
  height: 60px;
  bottom: -10px;
  left: 20px;
  animation: floatUpSlow 9s infinite ease-in-out;
}

.blob-2 {
  width: 45px;
  height: 45px;
  bottom: 20px;
  left: 45px;
  animation: floatUpFast 6s infinite linear;
  animation-delay: 2s;
}

.blob-3 {
  width: 35px;
  height: 40px;
  top: -5px;
  left: 30px;
  animation: syncSink 10s infinite ease-in-out;
}

.blob-4 {
  width: 50px;
  height: 45px;
  bottom: -15px;
  left: 10px;
  animation: floatUpSlow 14s infinite ease-in-out;
  animation-delay: 3.5s;
}

@keyframes colorMoodShift {
  0% {
    filter: hue-rotate(0deg) saturate(1.4);
  }
  100% {
    filter: hue-rotate(360deg) saturate(1.4);
  }
}

@keyframes floatUpSlow {
  0%,
  100% {
    transform: translateY(0) scale(1);
    border-radius: 50%;
  }
  45% {
    border-radius: 40% 60% 45% 55% / 40% 40% 60% 60%;
  }
  50% {
    transform: translateY(-135px) scale(0.85);
  }
}

@keyframes floatUpFast {
  0%,
  100% {
    transform: translateY(0) scale(0.9);
  }
  50% {
    transform: translateY(-155px) scale(1.1);
    border-radius: 30% 70% 50% 50%;
  }
}

@keyframes syncSink {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(140px) scale(1.1);
    border-radius: 60% 40% 70% 30%;
  }
}

.animate-fade-in {
  animation: elementReveal 0.4s ease-out;
}

@keyframes elementReveal {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mood Ring Halos */
.ring-halo-empty {
  background: conic-gradient(#444, #222, #444);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.02);
}
.ring-halo-energetic,
.ring-halo-upbeat {
  background: conic-gradient(#ef4444, #b91c1c, #ef4444);
  box-shadow: 0 0 35px rgba(239, 68, 68, 0.4);
}
.ring-halo-angry {
  background: conic-gradient(#f97316, #ea580c, #f97316);
  box-shadow: 0 0 35px rgba(249, 115, 22, 0.4);
}
.ring-halo-happy,
.ring-halo-joyful {
  background: conic-gradient(#fbbf24, #d97706, #fbbf24);
  box-shadow: 0 0 35px rgba(251, 191, 36, 0.4);
}
.ring-halo-chill,
.ring-halo-mellow {
  background: conic-gradient(#10b981, #047857, #10b981);
  box-shadow: 0 0 35px rgba(16, 185, 129, 0.4);
}
.ring-halo-sad,
.ring-halo-melancholic {
  background: conic-gradient(#3b82f6, #1d4ed8, #3b82f6);
  box-shadow: 0 0 35px rgba(59, 130, 246, 0.4);
}
.ring-halo-romantic {
  background: conic-gradient(#f472b6, #be185d, #f472b6);
  box-shadow: 0 0 35px rgba(244, 114, 182, 0.4);
}
.ring-halo-mysterious {
  background: conic-gradient(#8b5cf6, #6d28d9, #8b5cf6);
  box-shadow: 0 0 35px rgba(139, 92, 246, 0.4);
}
.ring-halo-ethereal {
  background: conic-gradient(#2dd4bf, #0f766e, #2dd4bf);
  box-shadow: 0 0 35px rgba(45, 212, 191, 0.4);
}

.text-color-energetic,
.text-color-upbeat {
  color: #ef4444;
}
.text-color-angry {
  color: #f97316;
}
.text-color-happy,
.text-color-joyful {
  color: #fbbf24;
}
.text-color-chill,
.text-color-mellow {
  color: #10b981;
}
.text-color-sad,
.text-color-melancholic {
  color: #3b82f6;
}
.text-color-romantic {
  color: #f472b6;
}
.text-color-mysterious {
  color: #8b5cf6;
}
.text-color-ethereal {
  color: #2dd4bf;
}

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
.is-analyzing-pulse {
  animation: backgroundPulse 1.8s infinite ease-in-out;
  pointer-events: none;
}
@keyframes backgroundPulse {
  0%,
  100% {
    background-color: rgba(255, 255, 255, 0.03);
  }
  50% {
    background-color: rgba(255, 255, 255, 0.09);
  }
}
@keyframes popIn {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}

@media (max-width: 900px) {
  .dashboard-columns-revamped {
    grid-template-columns: 1fr;
  }
}
.column-status-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--text-muted);
  font-weight: 600;
  gap: 16px;
}

.large-spinner {
  font-size: 2.5rem;
  animation: spinPulse 1.5s infinite linear;
  display: inline-block;
}

@keyframes spinPulse {
  0% {
    transform: scale(1) rotate(0deg);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(360deg);
    opacity: 0.7;
  }
}

/* Mood Legend Box Styles */
.mood-legend-box {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px dashed var(--border);
  width: 100%;
}

.mood-legend-box.text-left-adjusted {
  text-align: left;
  padding-left: 4px;
}

.mood-legend-box h4 {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 12px;
  font-weight: 700;
}

.mood-legend-box.text-left-adjusted h4 {
  text-align: left;
}

.legend-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 12px;
  padding: 0 8px;
}

.legend-grid.row-layout-adjusted {
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  padding: 0;
}

.legend-item {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-item span {
  font-size: 1rem;
  line-height: 1;
}
</style>
