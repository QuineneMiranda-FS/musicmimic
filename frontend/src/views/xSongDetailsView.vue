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

const lyrics = ref("Scraping Genius Live Data...");
const recommendations = ref([]);
const isLoadingRecs = ref(false);

const loadPageData = async () => {
  if (!trackId.value) return;
  isLoadingRecs.value = true;

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

    // Pull recommendations from Spotify
    const token = localStorage.getItem("app_jwt");
    const recsRes = await axios.get(
      "http://localhost:3000/api/tracks/recommendations",
      {
        params: { excludeId: trackId.value },
        headers: { Authorization: `Bearer ${token}` }, // Send JWT to chk user
      },
    );
    recommendations.value = recsRes.data;
  } catch (err) {
    console.error("Subpage load error:", err);
    lyrics.value = "Failed to sync song profile elements.";
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
    loadPageData();
  },
);

onMounted(loadPageData);
</script>

<template>
  <div class="min-h-screen bg-neutral-950 text-white p-6 md:p-12 font-sans">
    <div class="max-w-5xl mx-auto mb-8">
      <router-link
        to="/search"
        class="text-zinc-400 hover:text-green-400 font-medium text-sm inline-flex items-center gap-1.5"
      >
        ← Back to Search
      </router-link>
    </div>

    <div
      class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start"
    >
      <div
        class="bg-zinc-900 p-6 rounded-xl border border-zinc-800 text-center shadow-xl flex flex-col items-center"
      >
        <img
          v-if="albumImage"
          :src="albumImage"
          alt="Cover"
          class="w-44 h-44 rounded-lg object-cover shadow-md mb-4 border border-zinc-800"
        />
        <div v-else class="text-7xl my-4">{{ emoticon }}</div>

        <h1 class="text-xl font-black mb-1 truncate w-full px-2" :title="title">
          {{ title }}
        </h1>
        <p class="text-zinc-400 text-sm mb-4 truncate w-full px-2">
          {{ artist }}
        </p>
        <div
          class="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-zinc-800 text-green-400 border border-zinc-700 tracking-wider"
        >
          Vibe Profile: {{ mood }} {{ emoticon }}
        </div>
      </div>

      <div
        class="md:col-span-2 bg-zinc-900/50 border border-zinc-800/60 p-6 rounded-xl min-h-[300px]"
      >
        <h2
          class="text-sm font-bold uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2 text-zinc-400"
        >
          Genius Lyrics:
        </h2>
        <p
          class="text-zinc-300 text-sm leading-relaxed whitespace-pre-line font-serif italic max-h-[400px] overflow-y-auto pr-2"
        >
          {{ lyrics }}
        </p>
      </div>
    </div>

    <div class="max-w-5xl mx-auto mt-12 border-t border-zinc-900 pt-8">
      <h2 class="text-md font-bold uppercase tracking-wider mb-6 text-zinc-300">
        ✨ Recommended Songs via Spotify Mix
      </h2>

      <div v-if="isLoadingRecs" class="text-zinc-500 text-sm animate-pulse">
        Connecting to Spotify Web API server matrix...
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div
          v-for="rec in recommendations"
          :key="rec.spotifyId"
          class="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center gap-3"
        >
          <img
            :src="rec.image"
            alt="Art"
            class="w-10 h-10 rounded object-cover flex-shrink-0"
          />
          <div class="truncate">
            <p
              class="font-bold text-xs truncate text-zinc-200"
              :title="rec.title"
            >
              {{ rec.title }}
            </p>
            <p class="text-[11px] text-zinc-400 truncate">{{ rec.artist }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
