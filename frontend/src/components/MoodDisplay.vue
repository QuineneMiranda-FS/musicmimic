<template>
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
          Don't mind me... <br />I'm going to watch my Lava Lamp.<br />I won't
          even look at your song choices.
        </p>
        <div class="mood-ring-cta-block">
          <button
            @click="$emit('restore-spying')"
            class="ring-mood-btn action-restore-btn animate-pulse-glow"
          >
            🔓 Admit you miss me and I'll let you have your mood ring back.
          </button>
        </div>
      </div>
    </div>

    <div v-else class="mood-ring-box-wrapper animate-fade-in">
      <div class="tabs-header-row sidebar-tabs-header">
        <button
          class="tab-nav-btn sidebar-tab-btn"
          :class="{ 'is-active': activeRingTab === 'daily' }"
          @click="$emit('update:activeRingTab', 'daily')"
        >
          Daily
        </button>
        <button
          class="tab-nav-btn sidebar-tab-btn"
          :class="{ 'is-active': activeRingTab === 'weekly' }"
          @click="$emit('update:activeRingTab', 'weekly')"
        >
          Weekly
        </button>
        <button
          class="tab-nav-btn sidebar-tab-btn"
          :class="{ 'is-active': activeRingTab === 'monthly' }"
          @click="$emit('update:activeRingTab', 'monthly')"
        >
          Monthly
        </button>
      </div>

      <template v-if="!currentSelectedMood">
        <div class="mood-ring-orb-container">
          <div class="mood-ring-outer-halo ring-halo-empty">
            <div
              class="mood-ring-inner-core"
              @click="$emit('question-click')"
              style="cursor: pointer"
            >
              <span class="mood-ring-emoji-avatar">?</span>
            </div>
          </div>
        </div>
        <div class="mood-ring-interactive-dialogue">
          <p class="mood-statement-text">
            Pick some songs and I'll figure out your {{ activeRingTab }} mood!
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
            <span class="timeframe-label">{{ activeRingTab }}</span> mood is
            rather
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
                @click="$emit('trigger-alternative', 'same')"
                class="ring-mood-btn action-match-btn"
              >
                More {{ currentSelectedMood.label }} Songs
              </button>
              <button
                @click="$emit('trigger-alternative', 'opposite')"
                class="ring-mood-btn action-flip-btn"
              >
                {{ oppositeMoodButtonText }}
              </button>
            </div>
          </div>

          <div class="mood-ring-privacy-footer">
            <button
              @click="$emit('stop-spying')"
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
        <h3 @click="isLegendOpen = !isLegendOpen" class="collapsible-header">
          Mood Key
          <span class="toggle-arrow">{{ isLegendOpen ? "▼" : "►" }}</span>
        </h3>

        <div v-show="isLegendOpen" class="legend-grid-container">
          <button
            class="legend-pill-btn master-all-btn"
            :class="{ active: selectedMoodFilter === null }"
            @click="$emit('update:selectedMoodFilter', null)"
          >
            🌈 All Tracks
          </button>

          <div
            v-for="group in categorizedMoodGroups"
            :key="group.name"
            class="mood-synonym-section"
          >
            <span class="section-title-label">{{ group.name }}</span>
            <div class="legend-grid">
              <button
                v-for="mood in group.moods"
                :key="mood.id"
                class="legend-pill-btn"
                :class="{ active: selectedMoodFilter === mood.id }"
                @click="$emit('update:selectedMoodFilter', mood.id)"
              >
                {{ mood.emoticon }} {{ mood.name }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  </section>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  activeRingTab: { type: String, default: "daily" },
  currentSelectedMood: { type: Object, default: null },
  oppositeMoodButtonText: {
    type: String,
    default: "I'd rather be Alternative",
  },
  isSpyingStopped: { type: Boolean, default: false },
  selectedMoodFilter: { type: String, default: null },
  activeLegendMoods: { type: Array, default: () => [] },
});

defineEmits([
  "update:activeRingTab",
  "update:selectedMoodFilter",
  "restore-spying",
  "stop-spying",
  "trigger-alternative",
  "question-click",
]);

// Internal Toggles
const isLegendOpen = ref(false);

const SYNONYM_GROUPS_MAP = [
  {
    name: "✨ Hype & High Energy",
    targets: ["energetic", "upbeat", "hype", "pumped", "party"],
  },
  {
    name: "☀️ Happy & Positivity",
    targets: ["happy", "joyful", "cheerful", "bright"],
  },
  {
    name: "🌊 Chill & Relaxation",
    targets: ["chill", "relaxed", "calm", "mellow", "lofi"],
  },
  {
    name: "🌧️ Melancholy & Deep",
    targets: ["melancholic", "sad", "gloomy", "somber", "nostalgic"],
  },
  {
    name: "🔥 Aggressive & Fierce",
    targets: ["angry", "aggressive", "dark", "heavy"],
  },
  {
    name: "🔮 Mystical & Cosmic",
    targets: ["mysterious", "ethereal", "romantic", "grounded"],
  },
];

const categorizedMoodGroups = computed(() => {
  if (!props.activeLegendMoods) return [];

  const structuralBuckets = SYNONYM_GROUPS_MAP.map((cluster) => ({
    name: cluster.name,
    targets: cluster.targets,
    moods: [],
  }));

  const misfitsBucket = { name: "📦 Miscellaneous Vibes", moods: [] };

  props.activeLegendMoods.forEach((mood) => {
    const checkValue = (mood.name || mood.id || "").toLowerCase().trim();
    const matchedCluster = structuralBuckets.find((bucket) =>
      bucket.targets.some((keyword) => checkValue.includes(keyword)),
    );

    if (matchedCluster) {
      matchedCluster.moods.push(mood);
    } else {
      misfitsBucket.moods.push(mood);
    }
  });

  const activeClusters = structuralBuckets.filter((b) => b.moods.length > 0);
  if (misfitsBucket.moods.length > 0) {
    activeClusters.push(misfitsBucket);
  }

  activeClusters.forEach((cluster) => {
    cluster.moods.sort((a, b) => a.name.localeCompare(b.name));
  });

  return activeClusters;
});
</script>

<style scoped>
@import "../styles/searchView.css";
</style>
