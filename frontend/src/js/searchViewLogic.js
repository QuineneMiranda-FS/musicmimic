import { ref, computed, nextTick, onMounted } from "vue";
import { useSearchLogic } from "./search.js";
import { useMoodLogic } from "./mood.js";
import { useHistoryLogic } from "./history.js";

export function useSearchViewLogic() {
  const activeTab = ref("tracks");
  const selectedMoodFilter = ref(null);
  const isRingSearching = ref(false);

  const searchLogic = useSearchLogic();
  const moodLogic = useMoodLogic();
  const historyLogic = useHistoryLogic((track) =>
    searchLogic?.goToSongDetailsPage(track),
  );

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

  onMounted(() => {
    const savedCustomMoods = localStorage.getItem("mimic_permanent_ai_moods");
    if (savedCustomMoods && moodLogic?.permanentCustomMoods) {
      try {
        moodLogic.permanentCustomMoods.value = JSON.parse(savedCustomMoods);
      } catch (e) {
        console.error("Failed to parse custom moods", e);
      }
    }
    const savedHistory = localStorage.getItem("mimic_daily_mood_clicks");
    if (savedHistory && moodLogic?.clickedMoodsHistory) {
      try {
        moodLogic.clickedMoodsHistory.value = JSON.parse(savedHistory);
      } catch (e) {
        console.error("Failed to parse history ", e);
      }
    }
  });

  const saveNewAImoodPermanently = (normalizedName, emoticon, legendGroup) => {
    const lowerName = normalizedName?.toLowerCase().trim();
    if (!lowerName) return;
    if (moodMatrixConfig[lowerName]) return;
    if (!moodLogic || !moodLogic.permanentCustomMoods) return;

    const currentSaved = moodLogic.permanentCustomMoods.value || [];
    const alreadySaved = currentSaved.some(
      (item) => item && item.id === lowerName,
    );

    if (!alreadySaved) {
      const newMoodObj = {
        id: lowerName,
        name: normalizedName,
        emoticon: emoticon || "🎵",
        legendGroup: legendGroup ? legendGroup.toLowerCase() : "chill",
      };

      if (!moodLogic.permanentCustomMoods.value) {
        moodLogic.permanentCustomMoods.value = [];
      }

      moodLogic.permanentCustomMoods.value.push(newMoodObj);
      localStorage.setItem(
        "mimic_permanent_ai_moods",
        JSON.stringify(moodLogic.permanentCustomMoods.value),
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
      {
        id: "sad",
        name: "Sad",
        emoticon: "😥",
        legendGroup: "sad",
      },
      {
        id: "nostalgic",
        name: "Nostalgic",
        emoticon: "📼",
        legendGroup: "nostalgic",
      },
      {
        id: "objectifying",
        name: "Objectifying",
        emoticon: "🔍",
        legendGroup: "objectifying",
      },
    ];

    const customMoodsList = moodLogic?.permanentCustomMoods?.value || [];
    customMoodsList.forEach((customMood) => {
      if (customMood && !baseLegend.some((item) => item.id === customMood.id)) {
        baseLegend.push(customMood);
      }
    });

    const tracksResults = searchLogic?.results?.value?.tracks || [];
    const historyClicks = moodLogic?.clickedMoodsHistory?.value || [];
    const allAvailableSongs = [...tracksResults, ...historyClicks];

    allAvailableSongs.forEach((track) => {
      if (track && track.mood) {
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

    const savedStateList = moodLogic?.activeLegendMoodsState?.value || [];

    return baseLegend.map((moodItem) => {
      const stateMatch = savedStateList.find((m) => m && m.id === moodItem.id);
      return {
        ...moodItem,
        name: stateMatch?.name || moodItem.name,
        emoticon: stateMatch?.emoticon || moodItem.emoticon,
        categoryId:
          stateMatch?.categoryId ||
          moodItem.categoryId ||
          moodItem.legendGroup ||
          null,
      };
    });
  });

  const handleTrackClick = (track) => {
    if (moodLogic?.isSpyingStopped && !moodLogic.isSpyingStopped.value) {
      const now = Date.now();
      const historyList = moodLogic.clickedMoodsHistory.value || [];
      const isAlreadyInHistory = historyList.some(
        (t) => t && t.id === track.id,
      );

      if (!isAlreadyInHistory) {
        if (!moodLogic.clickedMoodsHistory.value) {
          moodLogic.clickedMoodsHistory.value = [];
        }
        moodLogic.clickedMoodsHistory.value.push({
          id: track.id || now.toString(),
          name: track.name || track.title || "Unknown Title",
          artist: track.artist || "Unknown Artist",
          image: track.image || "fallback.jpg",
          mood: track.mood || null,
          emoticon: track.emoticon || "🎵",
          timestamp: now,
          isDailyEligible: true,
          isWeeklyEligible: true,
          isMonthlyEligible: true,
        });

        localStorage.setItem(
          "mimic_daily_mood_clicks",
          JSON.stringify(moodLogic.clickedMoodsHistory.value),
        );
      }
    }
    goToSongDetailsPage(track);
  };

  const goToSongDetailsPage = (track) => {
    if (searchLogic && typeof searchLogic.goToSongDetailsPage === "function") {
      searchLogic.goToSongDetailsPage(track);
    }
  };

  const deleteSongFromHistory = (trackId) => {
    if (!moodLogic?.clickedMoodsHistory?.value) return;
    moodLogic.clickedMoodsHistory.value =
      moodLogic.clickedMoodsHistory.value.filter(
        (track) => track && track.id !== trackId,
      );
    localStorage.setItem(
      "mimic_daily_mood_clicks",
      JSON.stringify(moodLogic.clickedMoodsHistory.value),
    );
  };

  const reversedHistory = computed(() => {
    const history = moodLogic?.clickedMoodsHistory?.value;
    if (!history || !Array.isArray(history) || history.length === 0) return [];
    return [...history].reverse();
  });

  const clearOnlyVisualHistory = () => {
    if (moodLogic?.clickedMoodsHistory) {
      moodLogic.clickedMoodsHistory.value = [];
    }
    localStorage.removeItem("mimic_daily_mood_clicks");
  };

  const handleQuestionMarkClick = () => {
    if (
      moodLogic?.isSpyingStoppedOnce?.value &&
      moodLogic?.activeRingTab?.value === "daily"
    ) {
      alert(
        "You didn't want me following you around. You'll have to start over. Pick some songs and I'll figure out your mood.",
      );
    }
  };

  const handleSearchSubmit = async () => {
    try {
      selectedMoodFilter.value = null;
      await searchLogic.executeSearch();
      await nextTick();

      if (searchLogic.results.value?.tracks?.length) {
        for (const track of searchLogic.results.value.tracks) {
          if (!track || track.mood) continue;
          track.isAnalyzing = true;
          try {
            await searchLogic.analyzeMoodInline(track);
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
    if (!searchLogic.results.value?.tracks) return [];
    if (!selectedMoodFilter.value) return searchLogic.results.value.tracks;
    return searchLogic.results.value.tracks.filter(
      (t) => t && t.mood?.trim().toLowerCase() === selectedMoodFilter.value,
    );
  });

  const oppositeMoodButtonText = computed(() => {
    const currentId = moodLogic?.currentSelectedMood?.value?.id;
    if (!currentId || !moodLogic?.moodOppositesMap)
      return "I'd rather be Alternative";
    const oppositeData = moodLogic.moodOppositesMap[currentId];
    return oppositeData
      ? `I'd rather be ${oppositeData.label}`
      : "I'd rather be Alternative";
  });

  const triggerAlternativeSearch = async (type) => {
    const currentId = moodLogic?.currentSelectedMood?.value?.id;
    if (!currentId) return;
    if (type === "same") {
      selectedMoodFilter.value = currentId;
    } else {
      selectedMoodFilter.value = null;
      isRingSearching.value = true;
      if (searchLogic?.searchQuery && moodLogic?.moodOppositesMap) {
        searchLogic.searchQuery.value =
          moodLogic.moodOppositesMap[currentId]?.query ||
          "new alternative music";
      }
      try {
        await handleSearchSubmit();
      } finally {
        isRingSearching.value = false;
      }
    }
  };

  return {
    activeTab,
    selectedMoodFilter,
    isRingSearching,
    activeLegendMoods,
    filteredTracks,
    reversedHistory,
    oppositeMoodButtonText,
    handleSearchSubmit,
    handleTrackClick,
    clearOnlyVisualHistory,
    triggerAlternativeSearch,
    handleQuestionMarkClick,
    deleteSongFromHistory,
    goToSongDetailsPage,

    searchQuery: searchLogic?.searchQuery,
    hasSearched: searchLogic?.hasSearched,
    results: searchLogic?.results,

    activeRingTab: moodLogic?.activeRingTab,
    currentSelectedMood: moodLogic?.currentSelectedMood,
    isSpyingStopped: moodLogic?.isSpyingStopped,
    clickedMoodsHistory: moodLogic?.clickedMoodsHistory,
    purgeClickHistory: moodLogic?.purgeClickHistory,
    restoreMoodRingFeature: moodLogic?.restoreMoodRingFeature,

    dynamicCategories: moodLogic?.dynamicCategories,
    addNewCategory: moodLogic?.addNewCategory,
    updateCustomCategory: moodLogic?.updateCategoryDetails,
    deleteCustomCategory: moodLogic?.deleteCategory,
    moveMoodToCategory: moodLogic?.moveMoodToCategory,
    updateMoodDetails: moodLogic?.updateMoodDetails,
    deleteCustomMood: moodLogic?.deleteMoodFromState,
  };
}
