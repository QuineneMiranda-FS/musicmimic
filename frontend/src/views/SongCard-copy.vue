<!-- Note to self, testing out tailwind because this component isolated-->
<template>
  <div
    class="card bg-zinc-900 text-white w-80 relative shadow-md border border-zinc-800 select-none"
  >
    <div
      @click="goToSongDetailsPage"
      class="info flex items-center gap-3 cursor-pointer hover:text-green-400 transition"
    >
      <img
        :src="track.image || track.album?.images?.[2]?.url"
        alt="Cover"
        class="w-10 h-10 rounded object-cover flex-shrink-0 border border-zinc-800"
      />
      <div>
        <h3>{{ track.name }}</h3>
        <p>{{ track.artist || track.artists?.[0]?.name }}</p>
      </div>
    </div>

    <div
      class="relative text-2xl h-10 w-10 flex items-center justify-center rounded-full hover:bg-zinc-800 transition z-20 flex-shrink-0"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
    >
      <span v-if="isLoading" class="text-xs text-zinc-500 animate-pulse"
        >...</span
      >
      <span v-else-if="aiData" class="cursor-help">{{ aiData.emoticon }}</span>

      <Transition name="fade">
        <div
          v-if="showTooltip && aiData"
          class="absolute bottom-12 right-0 bg-black border border-zinc-700 rounded-lg p-3 w-44 shadow-2xl z-50 text-left"
        >
          <p class="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">
            AI Analysis
          </p>
          <p class="text-sm font-semibold text-green-400">
            Vibe: {{ aiData.mood }}
          </p>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useCardLogic } from "../js/card.js";

const props = defineProps({
  track: { type: Object, required: true },
  spotifyToken: { type: String, required: true },
});

const router = useRouter();

const { aiData, isLoading, showTooltip, goToSongDetailsPage } = useCardLogic(
  props,
  router,
);
</script>
