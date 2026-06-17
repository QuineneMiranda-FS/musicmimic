import { ref, computed, onMounted } from "vue";
import axios from "axios";

const activeRingTab = ref("daily");
const clickedMoodsHistory = ref([]);
const isSpyingStopped = ref(false);
const isSpyingStoppedOnce = ref(false);

const dynamicCategories = ref([]);
const activeLegendMoodsState = ref([]);
const permanentCustomMoods = ref([]);

export function useMoodLogic() {
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
    sad: { label: "Sad", emoticon: "😥" },
    nostalgic: { label: "Nostalgic", emoticon: "📼" },
    objectifying: { label: "Objectifying", emoticon: "🔍" },
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem("app_jwt");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Get fm DB
  onMounted(async () => {
    try {
      const response = await axios.get("/api/users/profile/mood-settings", {
        headers: getAuthHeader(),
      });
      const data = response.data;

      isSpyingStopped.value = data.privacyShield ?? false;
      isSpyingStoppedOnce.value = data.privacyShieldOnce ?? false;
      permanentCustomMoods.value = data.permanentCustomMoods || [];
      dynamicCategories.value = data.customCategories || [];
      activeLegendMoodsState.value = data.activeLegendMoodsState || [];

      // Fallback defaults
      if (!dynamicCategories.value.length) {
        dynamicCategories.value = [
          {
            id: "cat-hype",
            name: "✨ Hype & High Energy",
            targets: ["energetic", "upbeat"],
          },
          {
            id: "cat-happy",
            name: "☀️ Happy & Positivity",
            targets: ["happy", "joyful"],
          },
          {
            id: "cat-chill",
            name: "🌊 Chill & Relaxation",
            targets: ["chill", "relaxed"],
          },
          {
            id: "cat-melancholy",
            name: "🌧️ Melancholy & Deep",
            targets: ["melancholic", "sad"],
          },
          {
            id: "cat-aggressive",
            name: "🔥 Aggressive & Fierce",
            targets: ["angry", "aggressive"],
          },
          {
            id: "cat-mystical",
            name: "🔮 Mystical & Cosmic",
            targets: ["mysterious", "ethereal"],
          },
          {
            id: "cat-relation",
            name: "💖 Romance & Relationships",
            targets: ["romantic"],
          },
        ];
      }

      if (!activeLegendMoodsState.value.length) {
        activeLegendMoodsState.value = Object.entries(moodMatrixConfig).map(
          ([id, cfg]) => ({
            id,
            name: cfg.label,
            emoticon: cfg.emoticon,
            categoryId: null,
          }),
        );
      }
    } catch (e) {
      console.error("Failed to recover user mood preferences from backend.", e);
    }
  });

  // Helper Update DB
  const syncSettingsToBackend = async () => {
    try {
      await axios.put(
        "/api/users/profile/mood-settings",
        {
          privacyShield: isSpyingStopped.value,
          privacyShieldOnce: isSpyingStoppedOnce.value,
          permanentCustomMoods: permanentCustomMoods.value,
          customCategories: dynamicCategories.value,
          activeLegendMoodsState: activeLegendMoodsState.value,
        },
        {
          headers: getAuthHeader(),
        },
      );
    } catch (err) {
      console.error(
        "Failed to commit updated mood parameters to backend:",
        err,
      );
    }
  };

  // CRUD
  const addNewCategory = async (name) => {
    const newCat = {
      id: `cat-${Date.now()}`,
      name: name || "New Vibe Cluster",
      targets: [],
    };
    dynamicCategories.value.push(newCat);
    await syncSettingsToBackend();
  };

  const updateCategoryDetails = async (categoryId, updatedName) => {
    const category = dynamicCategories.value.find(
      (cat) => cat && cat.id === categoryId,
    );
    if (category && updatedName) {
      category.name = updatedName;
      await syncSettingsToBackend();
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!categoryId) return;
    dynamicCategories.value = dynamicCategories.value.filter(
      (cat) => cat && cat.id !== categoryId,
    );
    activeLegendMoodsState.value.forEach((moodItem) => {
      if (moodItem && moodItem.categoryId === categoryId) {
        moodItem.categoryId = null;
      }
    });
    await syncSettingsToBackend();
  };

  const moveMoodToCategory = async (moodId, targetCategoryId) => {
    if (!moodId) return;
    const lowerId = moodId.toLowerCase().trim();
    let mood = activeLegendMoodsState.value.find((m) => m && m.id === lowerId);

    if (mood) {
      mood.categoryId =
        targetCategoryId === "cat-misc" ? null : targetCategoryId;
    } else {
      const aiMatch = permanentCustomMoods.value?.find(
        (m) => m && m.id === lowerId,
      );
      activeLegendMoodsState.value.push({
        id: lowerId,
        name: aiMatch ? aiMatch.name : moodId,
        emoticon: aiMatch ? aiMatch.emoticon : "🎵",
        categoryId: targetCategoryId === "cat-misc" ? null : targetCategoryId,
      });
    }
    await syncSettingsToBackend();
  };

  const updateMoodDetails = async (moodId, updatedName, updatedEmoticon) => {
    if (!moodId) return;
    const lowerId = moodId.toLowerCase().trim();
    const mood = activeLegendMoodsState.value.find(
      (m) => m && m.id === lowerId,
    );

    if (mood) {
      if (updatedName) mood.name = updatedName;
      if (updatedEmoticon) mood.emoticon = updatedEmoticon;
    } else {
      activeLegendMoodsState.value.push({
        id: lowerId,
        name: updatedName || moodId,
        emoticon: updatedEmoticon || "🎵",
        categoryId: null,
      });
    }

    if (permanentCustomMoods.value) {
      const aiMatch = permanentCustomMoods.value.find(
        (m) => m && m.id === lowerId,
      );
      if (aiMatch) {
        if (updatedName) aiMatch.name = updatedName;
        if (updatedEmoticon) aiMatch.emoticon = updatedEmoticon;
      }
    }
    await syncSettingsToBackend();
  };

  const deleteMoodFromState = async (moodId) => {
    if (!moodId) return;
    const lowerId = moodId.toLowerCase().trim();

    activeLegendMoodsState.value = activeLegendMoodsState.value.filter(
      (m) => m && m.id !== lowerId,
    );
    if (permanentCustomMoods.value) {
      permanentCustomMoods.value = permanentCustomMoods.value.filter(
        (m) => m && m.id !== lowerId,
      );
    }
    await syncSettingsToBackend();
  };

  // Mood Prediction via Counts
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

    const moodConfig =
      activeLegendMoodsState.value.find((m) => m && m.id === topMoodKey) ||
      moodMatrixConfig[topMoodKey];
    return {
      id: topMoodKey,
      label: moodConfig ? moodConfig.name || moodConfig.label : "Alternative",
      emoticon: moodConfig ? moodConfig.emoticon : "🎵",
    };
  };

  const dominantMood = computed(() => {
    const history = clickedMoodsHistory.value || [];
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return getAggregateMood(
      history.filter(
        (item) =>
          item &&
          item.isDailyEligible !== false &&
          item.isDailyEligible !== 0 &&
          (!item.timestamp || Number(item.timestamp) >= oneDayAgo),
      ),
    );
  });

  const weeklyMood = computed(() => {
    const history = clickedMoodsHistory.value || [];
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return getAggregateMood(
      history.filter(
        (item) =>
          item &&
          item.isWeeklyEligible !== false &&
          item.isWeeklyEligible !== 0 &&
          (!item.timestamp || Number(item.timestamp) >= oneWeekAgo),
      ),
    );
  });

  const monthlyMood = computed(() => {
    const history = clickedMoodsHistory.value || [];
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return getAggregateMood(
      history.filter(
        (item) =>
          item &&
          item.isMonthlyEligible !== false &&
          item.isMonthlyEligible !== 0 &&
          (!item.timestamp || Number(item.timestamp) >= oneMonthAgo),
      ),
    );
  });

  const currentSelectedMood = computed(() => {
    if (activeRingTab.value === "weekly") return weeklyMood.value;
    if (activeRingTab.value === "monthly") return monthlyMood.value;
    return dominantMood.value;
  });

  // Privacy controls
  const purgeClickHistory = async () => {
    isSpyingStopped.value = true;
    isSpyingStoppedOnce.value = true;

    // Clear
    clickedMoodsHistory.value = (clickedMoodsHistory.value || []).map(
      (item) => ({
        ...item,
        isDailyEligible: false,
      }),
    );

    // Delete/Update DB
    try {
      await axios.post(
        "/api/history/purge-privacy",
        {},
        { headers: getAuthHeader() },
      );
      await syncSettingsToBackend();
    } catch (e) {
      console.error("Failed to complete privacy purge on server:", e);
    }
  };

  const restoreMoodRingFeature = async () => {
    isSpyingStopped.value = false;
    await syncSettingsToBackend();
  };

  const moodOppositesMap = {
    // --- Energy & Intensity ---
    chill: {
      label: "Energetic",
      query: "fast high-energy party electronic dance hyperpop",
    },
    energetic: {
      label: "Chill",
      query: "lofi relaxation calm ambient slow-tempo minimalist",
    },

    // --- Core Emotions ---
    happy: {
      label: "Sad",
      query: "sad melancholic cinematic slow weeping acoustic-ballad",
    },
    sad: {
      label: "Happy",
      query: "happy cheerful uplifting bright joyful feel-good",
    },

    // --- Aggression vs. Peace ---
    angry: {
      label: "Peaceful",
      query: "peaceful serene meditative gentle acoustic soft-piano",
    },
    peaceful: {
      label: "Angry",
      query: "angry aggressive metal hardcore heavy-distortion intense",
    },

    // --- Vibe & Texture ---
    mysterious: {
      label: "Clear & Direct",
      query: "pop straightforward acoustic singer-songwriter classic-rock",
    },
    clear_direct: {
      // CamelCase or snake_case recommended for object keys
      label: "Mysterious",
      query:
        "mysterious eerie dark-ambient suspenseful experimental industrial",
    },

    ethereal: {
      label: "Grounded",
      query: "grounded roots folk blues standard classic-rock raw-acoustic",
    },
    grounded: {
      label: "Ethereal",
      query: "ethereal dreamy shoegaze ambient atmospheric celestial dream-pop",
    },

    // --- Social & Relational ---
    romantic: {
      label: "Bitter & Cynical",
      query: "bitter resentful heartbreak angst aggressive-breakup dark",
    },
    bitter_cynical: {
      label: "Romantic",
      query: "romantic love-song sensual passionate sweet intimate r&b",
    },

    // --- Tempo & Motion ---
    upbeat: {
      label: "Melancholic",
      query: "melancholic downtempo somber moody dark-pop",
    },
    melancholic: {
      label: "Upbeat",
      query: "upbeat dance pop disco joyful celebratory synthpop",
    },
  };

  return {
    activeRingTab,
    clickedMoodsHistory,
    isSpyingStopped,
    isSpyingStoppedOnce,
    currentSelectedMood,
    dominantMood,
    weeklyMood,
    monthlyMood,
    dynamicCategories,
    activeLegendMoodsState,
    permanentCustomMoods,
    moodOppositesMap,
    addNewCategory,
    deleteCategory,
    updateCategoryDetails,
    moveMoodToCategory,
    updateMoodDetails,
    deleteMoodFromState,
    purgeClickHistory,
    restoreMoodRingFeature,
  };
}
