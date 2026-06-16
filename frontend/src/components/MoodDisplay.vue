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
              placeholder="Create new vibe category..."
              @keyup.enter="handleCreateCategory"
              class="category-input"
            />
            <button @click="handleCreateCategory" class="add-category-btn">
              ➕
            </button>
          </div>

          <button
            class="legend-pill-btn master-all-btn"
            :class="{ active: selectedMoodFilter === null }"
            @click="$emit('update:selectedMoodFilter', null)"
          >
            🌈 All Tracks
          </button>

          <div
            v-for="group in dynamicCategorizedGroups"
            :key="group.id"
            class="mood-synonym-section drop-zone"
            @dragover.prevent
            @drop="handleDrop($event, group.id)"
          >
            <span class="section-title-label">{{ group.name }}</span>

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
        <div class="modal-actions">
          <button @click="saveMoodEdits" class="modal-btn save">Save</button>
          <button @click="editingMood = null" class="modal-btn cancel">
            Cancel
          </button>
        </div>
      </div>
    </div>
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
  "move-mood",
  "update-mood",
]);

const isLegendOpen = ref(false);
const newCategoryName = ref("");

// Edit
const editingMood = ref(null);
const editForm = ref({ name: "", emoticon: "" });

// Sorting
const dynamicCategorizedGroups = computed(() => {
  const structure = props.categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    targets: cat.targets || [],
    moods: [],
  }));

  const misfitsBucket = {
    id: "cat-misc",
    name: "📦 Miscellaneous Vibes",
    moods: [],
  };

  props.activeLegendMoods.forEach((mood) => {
    if (mood.categoryId) {
      const explicitMatch = structure.find((c) => c.id === mood.categoryId);
      if (explicitMatch) {
        explicitMatch.moods.push(mood);
        return;
      }
    }

    // Fallback
    const checkValue = (mood.name || mood.id || "").toLowerCase().trim();
    const matchedCluster = structure.find((bucket) =>
      bucket.targets.some((keyword) => checkValue.includes(keyword)),
    );

    if (matchedCluster) {
      matchedCluster.moods.push(mood);
    } else {
      misfitsBucket.moods.push(mood);
    }
  });

  // Show User Cats
  const renderList = [...structure];
  if (misfitsBucket.moods.length > 0 || props.categories.length === 0) {
    renderList.push(misfitsBucket);
  }
  return renderList;
});

// Category Handler
const handleCreateCategory = () => {
  if (!newCategoryName.value.trim()) return;
  emit("add-category", newCategoryName.value.trim());
  newCategoryName.value = "";
};

// Drag & Drop
const handleDragStart = (event, mood) => {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", mood.id);
};

const handleDrop = (event, targetCategoryId) => {
  const moodId = event.dataTransfer.getData("text/plain");
  if (moodId) {
    emit("move-mood", moodId, targetCategoryId);
  }
};

const openEditModal = (mood) => {
  editingMood.value = mood;
  editForm.value = { name: mood.name, emoticon: mood.emoticon };
};

const saveMoodEdits = () => {
  if (editingMood.value) {
    emit(
      "update-mood",
      editingMood.value.id,
      editForm.value.name,
      editForm.value.emoticon,
    );
    editingMood.value = null;
  }
};
</script>

<style scoped>
@import "../styles/searchView.css";

.category-creation-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.category-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
}
.add-category-btn {
  background: #3b82f6;
  border: none;
  cursor: pointer;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  transition: opacity 0.2s;
}
.add-category-btn:hover {
  opacity: 0.9;
}

.drop-zone {
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  transition:
    background 0.2s,
    border-color 0.2s;
}
.drop-zone:hover {
  background: rgba(59, 130, 246, 0.05);
  border-color: rgba(59, 130, 246, 0.4);
}

.draggable-mood-wrapper {
  position: relative;
  display: inline-block;
  cursor: grab;
}
.draggable-mood-wrapper:active {
  cursor: grabbing;
}

.edit-pill-indicator {
  position: absolute;
  top: -4px;
  right: -2px;
  font-size: 0.65rem;
  cursor: pointer;
  background: #1e293b;
  border-radius: 50%;
  padding: 2px;
  opacity: 0;
  transition: opacity 0.2s;
}
.draggable-mood-wrapper:hover .edit-pill-indicator {
  opacity: 1;
}

.empty-zone-txt {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  margin: 0.25rem 0 0 0;
  font-style: italic;
}

/* Modal Styling */
.mood-edit-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.mood-edit-modal {
  background: #1e1e2e;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 1.5rem;
  border-radius: 12px;
  width: 300px;
}
.mood-edit-modal h4 {
  margin-top: 0;
  color: #fff;
  margin-bottom: 1rem;
}
.modal-field {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.modal-field label {
  font-size: 0.8rem;
  color: #a1a1aa;
}
.modal-field input {
  background: #27273a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 0.5rem;
  border-radius: 6px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
}
.modal-btn {
  padding: 0.4rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}
.modal-btn.save {
  background: #10b981;
  color: #fff;
}
.modal-btn.cancel {
  background: #3f3f46;
  color: #fff;
}
</style>
