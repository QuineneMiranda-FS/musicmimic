<template>
  <div class="track-list">
    <div
      v-for="track in tracks"
      :key="track.id"
      class="track-item"
      @click="$emit('track-click', track)"
    >
      <img
        :src="track.albumArt || 'https://via.placeholder.com/50'"
        alt="Album Art"
        class="track-art"
      />
      <div class="track-info">
        <span class="track-name">{{ track.name }}</span>
        <span class="track-artist">{{ track.artist }}</span>
      </div>
      <div
        v-if="track.mood"
        class="track-mood-badge"
        :class="track.mood.toLowerCase()"
      >
        {{ track.mood }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  tracks: {
    type: Array,
    required: true,
  },
});

defineEmits(["track-click"]);
</script>
