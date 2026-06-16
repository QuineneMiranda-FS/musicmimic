import { ref, computed, onMounted, watch } from "vue";

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

  const defaultCategories = [
    {
      id: "cat-hype",
      name: "✨ Hype & High Energy",
      targets: ["energetic", "upbeat", "hype", "pumped", "party"],
    },
    {
      id: "cat-happy",
      name: "☀️ Happy & Positivity",
      targets: ["happy", "joyful", "cheerful", "bright"],
    },
    {
      id: "cat-chill",
      name: "🌊 Chill & Relaxation",
      targets: ["chill", "relaxed", "calm", "mellow", "lofi"],
    },
    {
      id: "cat-melancholy",
      name: "🌧️ Melancholy & Deep",
      targets: ["melancholic", "sad", "gloomy", "somber", "nostalgic"],
    },
    {
      id: "cat-aggressive",
      name: "🔥 Aggressive & Fierce",
      targets: ["angry", "aggressive", "dark", "heavy"],
    },
    {
      id: "cat-mystical",
      name: "🔮 Mystical & Cosmic",
      targets: ["mysterious", "ethereal", "romantic", "grounded"],
    },
    {
      id: "cat-relation",
      name: "💖 Romance & Relationships",
      targets: ["romantic", "objectifying", "vulnerable", "cherished"],
    },
  ];

  onMounted(() => {
    // Load History
    const savedHistory = localStorage.getItem("mimic_daily_mood_clicks");
    if (savedHistory) {
      try {
        clickedMoodsHistory.value = JSON.parse(savedHistory) || [];
      } catch (e) {
        console.error("Failed to parse mood history", e);
      }
    }

    // Load Privacy
    if (localStorage.getItem("mimic_privacy_shield") === "true") {
      isSpyingStopped.value = true;
      isSpyingStoppedOnce.value = true;
    }

    // Load AI Moods
    const savedCustomMoods = localStorage.getItem("mimic_permanent_ai_moods");
    if (savedCustomMoods) {
      try {
        permanentCustomMoods.value = JSON.parse(savedCustomMoods) || [];
      } catch (e) {
        console.error("Failed to parse dynamic AI moods", e);
      }
    }

    // LocalStorage
    const savedCategories = localStorage.getItem("mimic_permanent_ai_moods")
      ? localStorage.getItem("mimic_dynamic_categories")
      : localStorage.getItem("mimic_custom_categories");

    if (savedCategories) {
      try {
        dynamicCategories.value = JSON.parse(savedCategories);
      } catch (e) {
        dynamicCategories.value = defaultCategories;
      }
    } else {
      dynamicCategories.value = defaultCategories;
    }

    const savedMoods =
      localStorage.getItem("mimic_active_legend_state") ||
      localStorage.getItem("mimic_active_moods_state");
    if (savedMoods) {
      try {
        activeLegendMoodsState.value = JSON.parse(savedMoods);
      } catch (e) {
        console.error("Failed to parse legend states", e);
      }
    } else {
      activeLegendMoodsState.value = Object.entries(moodMatrixConfig).map(
        ([id, cfg]) => ({
          id,
          name: cfg.label,
          emoticon: cfg.emoticon,
          categoryId: null,
        }),
      );
    }
  });

  watch(
    dynamicCategories,
    (newVal) => {
      localStorage.setItem("mimic_dynamic_categories", JSON.stringify(newVal));
      localStorage.setItem("mimic_custom_categories", JSON.stringify(newVal));
    },
    { deep: true },
  );

  watch(
    activeLegendMoodsState,
    (newVal) => {
      localStorage.setItem("mimic_active_moods_state", JSON.stringify(newVal));
      localStorage.setItem("mimic_active_legend_state", JSON.stringify(newVal));
    },
    { deep: true },
  );

  const addNewCategory = (name) => {
    const newCat = {
      id: `cat-${Date.now()}`,
      name: name || "New Vibe Cluster",
      targets: [],
    };
    dynamicCategories.value.push(newCat);
  };

  // Delete
  const deleteCategory = (categoryId) => {
    if (!categoryId) return;

    dynamicCategories.value = dynamicCategories.value.filter(
      (cat) => cat && cat.id !== categoryId,
    );

    if (activeLegendMoodsState.value) {
      activeLegendMoodsState.value.forEach((moodItem) => {
        if (moodItem && moodItem.categoryId === categoryId) {
          moodItem.categoryId = null;
        }
      });
    }
  };

  // Cat Changes
  const moveMoodToCategory = (moodId, targetCategoryId) => {
    if (!moodId) return;
    const lowerId = moodId.toLowerCase().trim();

    let mood = activeLegendMoodsState.value.find((m) => m && m.id === lowerId);
    if (mood) {
      mood.categoryId = targetCategoryId;
    } else {
      const aiMatch = permanentCustomMoods.value?.find(
        (m) => m && m.id === lowerId,
      );
      activeLegendMoodsState.value.push({
        id: lowerId,
        name: aiMatch ? aiMatch.name : moodId,
        emoticon: aiMatch ? aiMatch.emoticon : "🎵",
        categoryId: targetCategoryId,
      });
    }
  };

  // Update
  const updateMoodDetails = (moodId, updatedName, updatedEmoticon) => {
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
        categoryId: "misc",
      });
    }

    if (permanentCustomMoods.value) {
      const aiMatch = permanentCustomMoods.value.find(
        (m) => m && m.id === lowerId,
      );
      if (aiMatch) {
        if (updatedName) aiMatch.name = updatedName;
        if (updatedEmoticon) aiMatch.emoticon = updatedEmoticon;
        localStorage.setItem(
          "mimic_permanent_ai_moods",
          JSON.stringify(permanentCustomMoods.value),
        );
      }
    }
  };

  // Mood Timeframes
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
          item.isDailyEligible &&
          (!item.timestamp || item.timestamp >= oneDayAgo),
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
          item.isWeeklyEligible &&
          (!item.timestamp || item.timestamp >= oneWeekAgo),
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
          item.isMonthlyEligible &&
          (!item.timestamp || item.timestamp >= oneMonthAgo),
      ),
    );
  });

  const currentSelectedMood = computed(() => {
    if (activeRingTab.value === "weekly") return weeklyMood.value;
    if (activeRingTab.value === "monthly") return monthlyMood.value;
    return dominantMood.value;
  });

  const purgeClickHistory = () => {
    isSpyingStopped.value = true;
    isSpyingStoppedOnce.value = true;
    localStorage.setItem("mimic_privacy_shield", "true");
    clickedMoodsHistory.value = (clickedMoodsHistory.value || []).map(
      (item) => ({ ...item, isDailyEligible: false }),
    );
    localStorage.setItem(
      "mimic_daily_mood_clicks",
      JSON.stringify(clickedMoodsHistory.value),
    );
  };

  // Helper Opposites
  const moodOppositesMap = {
    chill: { label: "Energetic", query: "fast high energy party electronic" },
    energetic: {
      label: "Chill",
      query: "lofi lofi-chill relaxation calm ambient",
    },
    angry: {
      label: "Happy",
      query: "happy acoustic cheerful uplifting bright",
    },
    happy: {
      label: "Sad",
      query: "sad melancholic cinematic slow deep",
    },
    melancholic: {
      label: "Upbeat",
      query: "dance pop disco joyful celebratory",
    },
    romantic: {
      label: "Bitter",
      query: "resentful bitter acoustic conflict independent",
    },
    mysterious: {
      label: "Ethereal",
      query: "dreamy ambient atmospheric celestial",
    },
    ethereal: {
      label: "Grounded",
      query: "indie rock folk standard classic acoustic",
    },
    upbeat: {
      label: "Chill",
      query: "fast high energy party electronic",
    },
    grounded: {
      label: "Energetic",
      query: "skate-punk synthesizer power upbeat",
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
    moveMoodToCategory,
    updateMoodDetails,
    purgeClickHistory,
    restoreMoodRingFeature: () => {
      isSpyingStopped.value = false;
      localStorage.setItem("mimic_privacy_shield", "false");
    },
  };
}
