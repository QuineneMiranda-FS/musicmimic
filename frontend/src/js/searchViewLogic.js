import { ref, computed, nextTick, onMounted } from "vue";
import { useSearchLogic } from "../js/search";

export function useSearchViewLogic() {
  const activeTab = ref("tracks");
  const activeRingTab = ref("daily");
  const selectedMoodFilter = ref(null);
  const clickedMoodsHistory = ref([]);
  const isSpyingStopped = ref(false);
  const isRingSearching = ref(false);
  const permanentCustomMoods = ref([]);

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
  };

  const moodOppositesMap = {
    chill: { label: "Energized", query: "Energetic edm rock" },
    energetic: { label: "Chill", query: "Chill ambient lo-fi" },
    upbeat: { label: "Chill", query: "Chill ambient lo-fi" },
    happy: { label: "Sad", query: "Melancholic somber sad blues" },
    joyful: { label: "Melancholic", query: "Melancholic somber sad blues" },
    melancholic: { label: "Happy", query: "Happy cheerful pop disco" },
    sad: { label: "Happy", query: "Happy cheerful pop disco" },
    angry: { label: "Peaceful", query: "Chill peaceful acoustic meditative" },
    romantic: { label: "Mysterious", query: "Dark mysterious gothic" },
    mysterious: { label: "Romantic", query: "Romantic bright pop" },
    ethereal: {
      label: "Grounded",
      query: "Acoustic indie folk structural roots",
    },
    grounded: { label: "Ethereal", query: "Ambient synth dream pop" },
  };

  const {
    searchQuery,
    hasSearched,
    results,
    executeSearch,
    analyzeMoodInline,
    goToSongDetailsPage,
    logout,
  } = useSearchLogic();

  onMounted(() => {
    const savedHistory = localStorage.getItem("mimic_daily_mood_clicks");
    if (savedHistory) {
      try {
        clickedMoodsHistory.value = JSON.parse(savedHistory);
      } catch (e) {
        console.error("Failed to parse mood history", e);
      }
    }

    if (localStorage.getItem("mimic_privacy_shield") === "true") {
      isSpyingStopped.value = true;
    }

    const savedCustomMoods = localStorage.getItem("mimic_permanent_ai_moods");
    if (savedCustomMoods) {
      try {
        permanentCustomMoods.value = JSON.parse(savedCustomMoods);
      } catch (e) {
        console.error("Failed to parse custom moods", e);
      }
    }
  });

  const saveNewAImoodPermanently = (normalizedName, emoticon, legendGroup) => {
    const lowerName = normalizedName.toLowerCase();
    if (moodMatrixConfig[lowerName]) return;

    const alreadySaved = permanentCustomMoods.value.some(
      (item) => item.id === lowerName,
    );
    if (!alreadySaved) {
      const newMoodObj = {
        id: lowerName,
        name: normalizedName,
        emoticon: emoticon || "🎵",
        legendGroup: legendGroup ? legendGroup.toLowerCase() : "chill",
      };
      permanentCustomMoods.value.push(newMoodObj);
      localStorage.setItem(
        "mimic_permanent_ai_moods",
        JSON.stringify(permanentCustomMoods.value),
      );
    }
  };

  const activeLegendMoods = computed(() => {
    const baseLegend = [
      { id: "chill", name: "Chill", emoticon: "🌊", legendGroup: "chill" },
      {
        id: "energetic",
        name: "Energetic",
        emoticon: "⚡",
        legendGroup: "energetic",
      },
      { id: "angry", name: "Angry", emoticon: "🔥", legendGroup: "angry" },
      { id: "happy", name: "Happy", emoticon: "☀️", legendGroup: "happy" },
      {
        id: "melancholic",
        name: "Melancholic",
        emoticon: "🌧️",
        legendGroup: "melancholic",
      },
      {
        id: "romantic",
        name: "Romantic",
        emoticon: "💖",
        legendGroup: "romantic",
      },
      {
        id: "mysterious",
        name: "Mysterious",
        emoticon: "🔮",
        legendGroup: "mysterious",
      },
      {
        id: "ethereal",
        name: "Ethereal",
        emoticon: "✨",
        legendGroup: "ethereal",
      },
      { id: "upbeat", name: "Upbeat", emoticon: "🕺", legendGroup: "upbeat" },
      {
        id: "grounded",
        name: "Grounded",
        emoticon: "🪵",
        legendGroup: "grounded",
      },
    ];

    permanentCustomMoods.value.forEach((customMood) => {
      if (!baseLegend.some((item) => item.id === customMood.id)) {
        baseLegend.push(customMood);
      }
    });

    const allAvailableSongs = [
      ...(results.value?.tracks || []),
      ...(clickedMoodsHistory.value || []),
    ];
    allAvailableSongs.forEach((track) => {
      if (track.mood) {
        const normalizedName = track.mood.trim();
        const lowerName = normalizedName.toLowerCase();
        saveNewAImoodPermanently(
          normalizedName,
          track.emoticon,
          track.legendGroup,
        );

        if (!baseLegend.some((item) => item.id === lowerName)) {
          baseLegend.push({
            id: lowerName,
            name: normalizedName,
            emoticon: track.emoticon || "🎵",
            legendGroup: track.legendGroup
              ? track.legendGroup.toLowerCase()
              : "chill",
          });
        }
      }
    });
    return baseLegend;
  });

  const handleTrackClick = (track) => {
    if (!isSpyingStopped.value) {
      clickedMoodsHistory.value.push({
        id: track.id || Date.now().toString(),
        name: track.name || "Unknown Title",
        artist: track.artist || "Unknown Artist",
        image: track.image || "fallback.jpg",
        mood: track.mood || null,
        emoticon: track.emoticon || "🎵",
        timestamp: Date.now(),
      });
      localStorage.setItem(
        "mimic_daily_mood_clicks",
        JSON.stringify(clickedMoodsHistory.value),
      );
    }
    goToSongDetailsPage(track);
  };

  const reversedHistory = computed(() => {
    const history = clickedMoodsHistory.value;
    if (!history || !Array.isArray(history) || history.length === 0) {
      return [];
    }
    return [...history].reverse();
  });
  const clearOnlyVisualHistory = () => {
    clickedMoodsHistory.value = [];
    localStorage.removeItem("mimic_daily_mood_clicks");
  };

  const purgeClickHistory = () => {
    clickedMoodsHistory.value = [];
    localStorage.removeItem("mimic_daily_mood_clicks");
    isSpyingStopped.value = true;
    localStorage.setItem("mimic_privacy_shield", "true");
  };

  const restoreMoodRingFeature = () => {
    isSpyingStopped.value = false;
    localStorage.setItem("mimic_privacy_shield", "false");
  };

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

    let moodConfig = moodMatrixConfig[topMoodKey];
    if (!moodConfig) {
      const foundCustom = permanentCustomMoods.value.find(
        (item) => item.id === topMoodKey,
      );
      if (foundCustom) {
        moodConfig = {
          label: foundCustom.name,
          emoticon: foundCustom.emoticon,
        };
      }
    }

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
      history.filter((item) => !item.timestamp || item.timestamp >= oneDayAgo),
    );
  });

  const weeklyMood = computed(() => {
    const history = clickedMoodsHistory.value || [];
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return getAggregateMood(
      history.filter((item) => !item.timestamp || item.timestamp >= oneWeekAgo),
    );
  });

  const monthlyMood = computed(() => {
    const history = clickedMoodsHistory.value || [];
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return getAggregateMood(
      history.filter(
        (item) => !item.timestamp || item.timestamp >= oneMonthAgo,
      ),
    );
  });

  const currentSelectedMood = computed(() => {
    if (activeRingTab.value === "weekly") return weeklyMood.value;
    if (activeRingTab.value === "monthly") return monthlyMood.value;
    return dominantMood.value;
  });

  const oppositeMoodButtonText = computed(() => {
    if (!currentSelectedMood.value) return "I'd rather be Alternative";
    const oppositeData = moodOppositesMap[currentSelectedMood.value.id];
    return oppositeData
      ? `I'd rather be ${oppositeData.label}`
      : "I'd rather be Alternative";
  });

  const handleSearchSubmit = async () => {
    try {
      selectedMoodFilter.value = null;
      await executeSearch();
      await nextTick();

      if (results.value?.tracks?.length) {
        for (const track of results.value.tracks) {
          if (track.mood) continue;
          track.isAnalyzing = true;
          try {
            await analyzeMoodInline(track);
          } catch (err) {
            console.error("Failed to fetch mood for:", track.name, err);
          } finally {
            track.isAnalyzing = false;
          }
        }
      }
    } catch (error) {
      console.error("Search submittal context failure:", error);
    }
  };

  const filteredTracks = computed(() => {
    if (!results.value?.tracks) return [];
    if (!selectedMoodFilter.value) return results.value.tracks;
    return results.value.tracks.filter(
      (t) => t.mood?.trim().toLowerCase() === selectedMoodFilter.value,
    );
  });

  const triggerAlternativeSearch = async (type) => {
    if (!currentSelectedMood.value) return;
    if (type === "same") {
      selectedMoodFilter.value = currentSelectedMood.value.id;
    } else {
      selectedMoodFilter.value = null;
      isRingSearching.value = true;
      searchQuery.value =
        moodOppositesMap[currentSelectedMood.value.id]?.query ||
        "new alternative music";
      try {
        await handleSearchSubmit();
      } finally {
        isRingSearching.value = false;
      }
    }
  };

  return {
    activeTab,
    activeRingTab,
    selectedMoodFilter,
    clickedMoodsHistory,
    isSpyingStopped,
    isRingSearching,
    activeLegendMoods,
    searchQuery,
    hasSearched,
    results,
    filteredTracks,
    reversedHistory,
    currentSelectedMood,
    oppositeMoodButtonText,
    handleSearchSubmit,
    handleTrackClick,
    clearOnlyVisualHistory,
    purgeClickHistory,
    restoreMoodRingFeature,
    triggerAlternativeSearch,
    goToSongDetailsPage,
    logout,
  };
}
