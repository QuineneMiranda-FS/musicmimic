<template>
  <div class="mood-container">
    <h3>Search Results & Moods</h3>

    <ul class="track-list">
      <li v-for="track in tracks" :key="track.id" class="track-item">
        <img :src="track.album.images[2]?.url" alt="Cover" class="cover-art" />

        <div class="track-info">
          <span class="title">{{ track.name }}</span>
          <span class="artist">{{ track.artists[0].name }}</span>
        </div>

        <!-- Displays emoji -->
        <div class="mood-badge" v-if="trackMoods[track.id]">
          <span class="emoji" :title="trackMoods[track.id].moodLabel">
            {{ trackMoods[track.id].emoji }}
          </span>
          <button @click="generateMix(track.id)" class="mix-btn">
            Mix Similar
          </button>
        </div>
        <div v-else class="spinner">Analyzing...</div>
      </li>
    </ul>

    <!-- Recommended -->
    <div v-if="recommendedMix.length" class="recommendations-section">
      <h4>✨ Your Custom Mood Mix</h4>
      <div
        v-for="mixTrack in recommendedMix"
        :key="mixTrack.id"
        class="mix-item"
      >
        {{ mixTrack.name }} - {{ mixTrack.artists[0].name }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import axios from "axios";

// Props passed down
const props = defineProps({
  tracks: { type: Array, required: true },
  spotifyToken: { type: String, required: true },
});

const trackMoods = ref({});
const recommendedMix = ref([]);

// Watch the incoming track list, fetch moods
watch(
  () => props.tracks,
  (newTracks) => {
    trackMoods.value = {}; // Reset
    newTracks.forEach((track) => {
      fetchMoodForTrack(track.id);
    });
  },
  { deep: true },
);

async function fetchMoodForTrack(trackId) {
  try {
    const res = await axios.get(`http://localhost:3000/api/mood/${trackId}`, {
      headers: { Authorization: `Bearer ${props.spotifyToken}` },
    });
    trackMoods.value[trackId] = res.data;
  } catch (err) {
    console.error("Error fetching mood details", err);
  }
}

async function generateMix(trackId) {
  try {
    const res = await axios.get(
      `http://localhost:3000/api/mood/recommendations/${trackId}`,
      {
        headers: { Authorization: `Bearer ${props.spotifyToken}` },
      },
    );
    recommendedMix.value = res.data;
  } catch (err) {
    console.error("Error generating mix", err);
  }
}
</script>
<!-- MOVE to CSS-->
<style scoped>
.track-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 15px;
}
.cover-art {
  width: 50px;
  height: 50px;
  border-radius: 4px;
}
.track-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.emoji {
  font-size: 1.5rem;
  cursor: pointer;
  margin-right: 8px;
}
.mix-btn {
  background: #1db954;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 0.8rem;
  cursor: pointer;
}
</style>
