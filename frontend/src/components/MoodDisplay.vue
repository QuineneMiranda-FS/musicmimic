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
              >{{ currentSelectedMood.label }}</span
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
      <div class="mood-legend-panel">
        <h3 @click="isLegendOpen = !isLegendOpen" class="collapsible-header">
          Mood Manager & Key
          <span class="toggle-arrow">{{ isLegendOpen ? "▼" : "►" }}</span>
        </h3>

        <div v-show="isLegendOpen" class="legend-grid-container">
          <div class="category-creation-row">
            <input
              v-model="newCategoryName"
              type="text"
              placeholder="Create new mood category..."
              @keyup.enter="handleCreateCategory"
              class="category-input"
            />
            <button @click="handleCreateCategory" class="add-category-btn">
              ➕
            </button>
          </div>

          <div
            v-for="group in dynamicCategorizedGroups"
            :key="group.id"
            class="mood-synonym-section drop-zone"
            @dragover.prevent
            @drop="handleDrop($event, group.id)"
          >
            <div class="category-header-wrapper">
              <span class="section-title-label">{{ group.name }}</span>
              <button
                v-if="group.id !== 'cat-misc'"
                class="edit-category-trigger-btn"
                @click.stop="openEditCategoryModal(group)"
                title="Edit Category"
              >
                ⚙️
              </button>
            </div>

            <div class="legend-grid">
              <div
                v-for="mood in group.moods"
                :key="mood.id"
                class="draggable-mood-wrapper"
                draggable="true"
                @dragstart="handleDragStart($event, mood)"
              >
                <button
                  class="legend-pill-btn"
                  :class="{ active: selectedMoodFilter === mood.id }"
                  @click="$emit('update:selectedMoodFilter', mood.id)"
                >
                  {{ mood.emoticon }} {{ mood.name }}
                </button>
                <span
                  class="edit-pill-indicator"
                  @click.stop="openEditModal(mood)"
                  >✏️</span
                >
              </div>
              <p v-if="!group.moods.length" class="empty-zone-txt">
                Drag moods here
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <div v-if="editingMood" class="mood-edit-modal-overlay">
      <div class="mood-edit-modal shadow-glow">
        <h4>Edit Mood Config</h4>
        <div class="modal-field">
          <label>Mood Label</label>
          <input v-model="editForm.name" type="text" />
        </div>
        <div class="modal-field">
          <label>Emoticon (Emoji)</label>
          <input v-model="editForm.emoticon" type="text" class="emoji-input" />
        </div>
        <div class="modal-actions-spaced">
          <button @click="deleteExistingMood" class="modal-btn delete">
            🗑️ Delete Mood
          </button>
          <div class="right-actions">
            <button @click="saveMoodEdits" class="modal-btn save">Save</button>
            <button @click="editingMood = null" class="modal-btn cancel">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="editingCategory" class="mood-edit-modal-overlay">
      <div class="mood-edit-modal shadow-glow">
        <h4>Edit Category Cluster</h4>
        <div class="modal-field">
          <label>Category Name & Icon Prefix</label>
          <input
            v-model="editCategoryForm.name"
            type="text"
            placeholder="e.g., 🚀 Hyperspace Vibes"
          />
        </div>
        <div class="modal-actions-spaced">
          <button @click="deleteExistingCategory" class="modal-btn delete">
            🗑️ Delete Cluster
          </button>
          <div class="right-actions">
            <button @click="saveCategoryEdits" class="modal-btn save">
              Save
            </button>
            <button @click="editingCategory = null" class="modal-btn cancel">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useMoodDisplayLogic } from "../js/moodDisplayLogic.js";

const props = defineProps({
  activeRingTab: { type: String, default: "daily" },
  currentSelectedMood: { type: Object, default: null },
  oppositeMoodButtonText: {
    type: String,
    default: "I'd rather be Alternative",
  },
  isSpyingStopped: { type: Boolean, default: false },
  selectedMoodFilter: { type: String, default: null },
  categories: { type: Array, default: () => [] },
  activeLegendMoods: { type: Array, default: () => [] },
});

const emit = defineEmits([
  "update:activeRingTab",
  "update:selectedMoodFilter",
  "restore-spying",
  "stop-spying",
  "trigger-alternative",
  "question-click",
  "add-category",
  "delete-category",
  "update-category",
  "move-mood",
  "update-mood",
  "delete-mood",
]);

const {
  isLegendOpen,
  newCategoryName,
  editingMood,
  editForm,
  editingCategory,
  editCategoryForm,
  dynamicCategorizedGroups,
  handleCreateCategory,
  handleDragStart,
  handleDrop,
  openEditModal,
  saveMoodEdits,
  deleteExistingMood,
  openEditCategoryModal,
  saveCategoryEdits,
  deleteExistingCategory,
} = useMoodDisplayLogic(props, emit);
</script>

<style scoped>
@import "../styles/searchView.css";
@import "../styles/moodDisplay.css";
</style>
