import { ref, computed, onMounted } from "vue";

const activeRingTab = ref("daily");
const clickedMoodsHistory = ref([]);
const isSpyingStopped = ref(false);
const isSpyingStoppedOnce = ref(false);
const permanentCustomMoods = ref([]);

export function useMoodLogic() {
  const moodMatrixConfig = {
    energetic: { label: "Energetic", emoticon: "⚡" },
    angry: { label: "Angry", emoticon: "🔥" },
    happy: { label: "Happy", emoticon: "☀%EF%B8%8F" },
    upbeat: { label: "Upbeat", emoticon: "🕺" },
    chill: { label: "Chill", emoticon: "🌊" },
    melancholic: { label: "Melancholic", emoticon: "🌧%EF%B8%8F" },
    romantic: { label: "Romantic", emoticon: "💖" },
    mysterious: { label: "Mysterious", emoticon: "🔮" },
    ethereal: { label: "Ethereal", emoticon: "✨" },
    grounded: { label: "Grounded", emoticon: "🪵" },
  };

  const moodOppositesMap = {
    chill: { label: "Energized", query: "Energetic edm rock" },
    energetic: { label: "Chill", query: "Chill ambient lo-fi" },
    upbeat: { label: "Chill", query: "Chill ambient lo-fi" },
    happy: { label: "Sad", query: "Melancholic somber sad blues" },
    melancholic: { label: "Happy", query: "Happy cheerful pop disco" },
    angry: { label: "Peaceful", query: "Chill peaceful acoustic meditative" },
    romantic: { label: "Mysterious", query: "Dark mysterious gothic" },
    mysterious: { label: "Romantic", query: "Romantic bright pop" },
    ethereal: {
      label: "Grounded",
      query: "Acoustic indie folk structural roots",
    },
    grounded: { label: "Ethereal", query: "Ambient synth dream pop" },
  };

  onMounted(() => {
    const savedHistory = localStorage.getItem("mimic_daily_mood_clicks");
    if (savedHistory) {
      try {
        clickedMoodsHistory.value = JSON.parse(savedHistory) || [];
      } catch (e) {
        console.error("Failed to parse mood history", e);
        clickedMoodsHistory.value = [];
      }
    }

    if (localStorage.getItem("mimic_privacy_shield") === "true") {
      isSpyingStopped.value = true;
      isSpyingStoppedOnce.value = true;
    }
  });

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
    const moodConfig = moodMatrixConfig[topMoodKey];
    return {
      id: topMoodKey,
      label: moodConfig ? moodConfig.label : "Alternative",
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

  const restoreMoodRingFeature = () => {
    isSpyingStopped.value = false;
    localStorage.setItem("mimic_privacy_shield", "false");
  };

  return {
    activeRingTab,
    clickedMoodsHistory,
    isSpyingStopped,
    isSpyingStoppedOnce,
    permanentCustomMoods,
    currentSelectedMood,
    dominantMood,
    weeklyMood,
    monthlyMood,
    moodOppositesMap,
    purgeClickHistory,
    restoreMoodRingFeature,
  };
}
