import axios from "axios";
import { ref, computed, nextTick, onMounted } from "vue";
import { useSearchLogic } from "./search.js";
import { useMoodLogic } from "./mood.js";
import { useHistoryLogic } from "./history.js";

export function useSearchViewLogic() {
  const activeTab = ref("tracks");
  const activeHistoryTab = ref("daily");
  const selectedMoodFilter = ref(null);
  const isRingSearching = ref(false);

  const searchLogic = useSearchLogic();
  const moodLogic = useMoodLogic();

  const {
    historyTracks,
    logTrackInteraction,
    clearAllHistory,
    deleteSingleTrackFromHistory,
    refreshHistory,
  } = useHistoryLogic((track) => searchLogic?.goToSongDetailsPage(track));

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

  onMounted(async () => {
    const savedCustomMoods = localStorage.getItem("mimic_permanent_ai_moods");
    if (savedCustomMoods && moodLogic?.permanentCustomMoods) {
      try {
        moodLogic.permanentCustomMoods.value = JSON.parse(savedCustomMoods);
      } catch (e) {
        console.error("Failed to parse custom moods", e);
      }
    }

    await refreshHistory();

    if (moodLogic?.clickedMoodsHistory) {
      moodLogic.clickedMoodsHistory.value = [...historyTracks.value];
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
      { id: "sad", name: "Sad", emoticon: "😥", legendGroup: "sad" },
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

  const handleTrackClick = async (track) => {
    if (moodLogic?.isSpyingStopped && !moodLogic.isSpyingStopped.value) {
      await logTrackInteraction(track);

      await refreshHistory();
      if (moodLogic.clickedMoodsHistory) {
        moodLogic.clickedMoodsHistory.value = [...historyTracks.value];
      }
    }
    goToSongDetailsPage(track);
  };

  const goToSongDetailsPage = (track) => {
    if (searchLogic && typeof searchLogic.goToSongDetailsPage === "function") {
      searchLogic.goToSongDetailsPage(track);
    }
  };

  const deleteSongFromHistory = async (trackId) => {
    await deleteSingleTrackFromHistory(trackId);

    await refreshHistory();
    if (moodLogic?.clickedMoodsHistory) {
      moodLogic.clickedMoodsHistory.value = [...historyTracks.value];
    }
  };

  const reversedHistory = computed(() => {
    const history = moodLogic?.clickedMoodsHistory?.value;
    // ** No null or empty arrays **
    if (!history || !Array.isArray(history) || history.length === 0) return [];

    return history
      .filter((track) => track !== null && track !== undefined)
      .sort((a, b) => {
        if (a.id && b.id && !isNaN(a.id) && !isNaN(b.id)) {
          return Number(b.id) - Number(a.id);
        }
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA;
      });
  });

  const tabbedHistory = computed(() => {
    const sortedList = reversedHistory.value || [];

    const cleanList = sortedList.filter(
      (track) => track && typeof track === "object",
    );

    if (activeHistoryTab.value === "daily") {
      return cleanList.filter((track) => track.isDailyEligible);
    } else if (activeHistoryTab.value === "weekly") {
      return cleanList.filter((track) => track.isWeeklyEligible);
    } else if (activeHistoryTab.value === "monthly") {
      return cleanList.filter((track) => track.isMonthlyEligible);
    }
    return cleanList;
  });

  const handleClearHistoryAction = async () => {
    try {
      await clearAllHistory();

      if (moodLogic?.clickedMoodsHistory?.value) {
        moodLogic.clickedMoodsHistory.value =
          moodLogic.clickedMoodsHistory.value.map((track) => {
            if (track) {
              return {
                ...track,
                isDailyEligible: false,
              };
            }
            return track;
          });
      }
    } catch (error) {
      console.error(
        "Failed to gracefully execute daily evaluation clear:",
        error,
      );
    }
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
    const tracks = searchLogic?.results?.value?.tracks || [];
    if (!selectedMoodFilter.value) return tracks;

    return tracks.filter(
      (t) => t && t.mood?.trim().toLowerCase() === selectedMoodFilter.value,
    );
  });

  const oppositeMoodButtonText = computed(() => {
    const currentId = moodLogic?.currentSelectedMood?.value?.id;
    if (!currentId || !moodLogic?.moodOppositesMap)
      return "I'd rather be Alternative";

    const oppositeData = moodLogic.moodOppositesMap[currentId];
    if (oppositeData) {
      return `I'd rather be ${oppositeData.label}`;
    }

    const cleanLabel = moodLogic.currentSelectedMood.value.label;
    return `I'd rather flip ${cleanLabel}`;
  });

  const triggerAlternativeSearch = async (type) => {
    const currentMoodObj = moodLogic?.currentSelectedMood?.value;
    if (!currentMoodObj || !currentMoodObj.id) return;

    const currentId = currentMoodObj.id;
    const currentLabel = currentMoodObj.label;

    if (searchLogic?.searchQuery) {
      searchLogic.searchQuery.value = "";
    }

    if (searchLogic?.results?.value) {
      searchLogic.results.value.tracks = [];
    }

    if (type === "same") {
      selectedMoodFilter.value = null;
      isRingSearching.value = true;
      if (searchLogic?.hasSearched) searchLogic.hasSearched.value = true;

      try {
        const response = await axios.get("/api/tracks/recommendations", {
          params: {
            mood: currentLabel,
            title: "Seed Focus",
            artist: "Current Rotation",
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("app_jwt")}`,
          },
        });

        if (searchLogic?.results?.value && response.data) {
          searchLogic.results.value.tracks = response.data.map((track) => ({
            id: track.spotifyId,
            name: track.title,
            artist: track.artist,
            image: track.image || "fallback.jpg",
            mood: currentId,
            emoticon: currentMoodObj.emoticon,
          }));
        }
      } catch (err) {
        console.error(
          "Failed to fetch similar mood tracks over the network:",
          err,
        );
      } finally {
        isRingSearching.value = false;
      }
    } else {
      selectedMoodFilter.value = null;
      isRingSearching.value = true;

      if (searchLogic?.searchQuery && moodLogic?.moodOppositesMap) {
        const mappedOpposite = moodLogic.moodOppositesMap[currentId];
        if (mappedOpposite) {
          searchLogic.searchQuery.value = mappedOpposite.query;
        } else {
          searchLogic.searchQuery.value = `${currentLabel} alternative radical shift flip mood`;
        }
      }

      try {
        await handleSearchSubmit();
      } catch (err) {
        console.error("Failed executing mood ring alternative shift:", err);
      } finally {
        isRingSearching.value = false;
        if (searchLogic?.searchQuery) {
          searchLogic.searchQuery.value = "";
        }
      }
    }
  };

  return {
    activeTab,
    activeHistoryTab,
    tabbedHistory,
    selectedMoodFilter,
    isRingSearching,
    activeLegendMoods,
    filteredTracks,
    reversedHistory,
    oppositeMoodButtonText,
    handleSearchSubmit,
    handleTrackClick,
    clearOnlyVisualHistory: handleClearHistoryAction,
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
