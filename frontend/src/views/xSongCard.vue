<template>
  <div class="card track-card-widget">
    <div @click="goToSongDetailsPage" class="info interactive-info-block">
      <img
        :src="track.image || track.album?.images?.[2]?.url"
        alt="Cover"
        class="widget-avatar"
      />
      <div class="text-cluster">
        <h3>{{ track.name }}</h3>
        <p>{{ track.artist || track.artists?.[0]?.name }}</p>
      </div>
    </div>

    <div
      class="tooltip-trigger"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
    >
      <span v-if="isLoading" class="loading-dots">...</span>
      <span v-else-if="aiData" class="cursor-help">{{ aiData.emoticon }}</span>

      <Transition name="fade">
        <div v-if="showTooltip && aiData" class="analysis-tooltip">
          <p class="tooltip-label">AI Analysis</p>
          <p class="tooltip-vibe">Vibe: {{ aiData.mood }}</p>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* Don't move -- Component Specific Styles */
.track-card-widget {
  width: 20rem; /* w-80 */
  position: relative;
  background-color: var(--bg-card);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  user-select: none;
}

.interactive-info-block {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.interactive-info-block:hover {
  color: var(--accent-hover);
}

.widget-avatar {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid var(--border);
}

.text-cluster {
  min-width: 0;
}

.text-cluster h3 {
  max-width: 140px;
}

/* Tooltip/Anchor */
.tooltip-trigger {
  position: relative;
  font-size: 1.5rem;
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.tooltip-trigger:hover {
  background-color: var(--bg-card-hover);
}

.loading-dots {
  font-size: 0.75rem;
  color: var(--text-muted);
  animation: pulse 2s infinite;
}

.analysis-tooltip {
  position: absolute;
  bottom: 48px;
  right: 0;
  background-color: #000;
  border: 1px solid #3e3e3e;
  border-radius: 8px;
  padding: 12px;
  width: 11rem;
  box-shadow: var(--shadow);
  z-index: 50;
  text-align: left;
}

.tooltip-label {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.tooltip-vibe {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--accent);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
