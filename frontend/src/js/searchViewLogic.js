import { ref, computed, nextTick, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useSearchLogic } from "./search.js";
import { useMoodLogic } from "./mood.js";
import { useHistoryLogic } from "./history.js";

export function useSearchViewLogic() {
  const activeTab = ref("tracks");
  const selectedMoodFilter = ref(null);
  const isRingSearching = ref(false);

  const searchLogic = useSearchLogic();
  const moodLogic = useMoodLogic();
  const historyLogic = useHistoryLogic(searchLogic.goToSongDetailsPage);

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

  onMounted(() => {
    const savedCustomMoods = localStorage.getItem("mimic_permanent_ai_moods");
    if (savedCustomMoods) {
      try {
        moodLogic.permanentCustomMoods.value = JSON.parse(savedCustomMoods);
      } catch (e) {
        console.error("Failed to parse custom moods", e);
      }
    }
    const savedHistory = localStorage.getItem("mimic_daily_mood_clicks");
    if (savedHistory && moodLogic.clickedMoodsHistory) {
      try {
        moodLogic.clickedMoodsHistory.value = JSON.parse(savedHistory);
      } catch (e) {
        console.error("Failed to parse history ", e);
      }
    }
  });

  const saveNewAImoodPermanently = (normalizedName, emoticon, legendGroup) => {
    const lowerName = normalizedName.toLowerCase();
    if (moodMatrixConfig[lowerName]) return;

    const alreadySaved = moodLogic.permanentCustomMoods.value.some(
      (item) => item.id === lowerName,
    );
    if (!alreadySaved) {
      const newMoodObj = {
        id: lowerName,
        name: normalizedName,
        emoticon: emoticon || "🎵",
        legendGroup: legendGroup ? legendGroup.toLowerCase() : "chill",
      };
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
    ];

    (moodLogic.permanentCustomMoods.value || []).forEach((customMood) => {
      if (!baseLegend.some((item) => item.id === customMood.id)) {
        baseLegend.push(customMood);
      }
    });

    const allAvailableSongs = [
      ...(searchLogic.results.value?.tracks || []),
      ...(moodLogic.clickedMoodsHistory.value || []),
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
    if (!moodLogic.isSpyingStopped.value) {
      const now = Date.now();

      const isAlreadyInHistory = moodLogic.clickedMoodsHistory.value.some(
        (t) => t.id === track.id,
      );

      if (!isAlreadyInHistory) {
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

    searchLogic.goToSongDetailsPage(track);
  };

  const deleteSongFromHistory = (trackId) => {
    if (!moodLogic.clickedMoodsHistory.value) return;

    moodLogic.clickedMoodsHistory.value =
      moodLogic.clickedMoodsHistory.value.filter(
        (track) => track.id !== trackId,
      );

    localStorage.setItem(
      "mimic_daily_mood_clicks",
      JSON.stringify(moodLogic.clickedMoodsHistory.value),
    );
  };

  const reversedHistory = computed(() => {
    const history = moodLogic.clickedMoodsHistory.value;
    if (!history || !Array.isArray(history) || history.length === 0) return [];
    return [...history].reverse();
  });

  const clearOnlyVisualHistory = () => {
    moodLogic.clickedMoodsHistory.value = [];
    localStorage.removeItem("mimic_daily_mood_clicks");
  };

  const handleQuestionMarkClick = () => {
    if (
      moodLogic.isSpyingStoppedOnce.value &&
      moodLogic.activeRingTab.value === "daily"
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
          if (track.mood) continue;
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
      (t) => t.mood?.trim().toLowerCase() === selectedMoodFilter.value,
    );
  });

  const oppositeMoodButtonText = computed(() => {
    if (!moodLogic.currentSelectedMood.value)
      return "I'd rather be Alternative";
    const oppositeData =
      moodLogic.moodOppositesMap[moodLogic.currentSelectedMood.value.id];
    return oppositeData
      ? `I'd rather be ${oppositeData.label}`
      : "I'd rather be Alternative";
  });

  const triggerAlternativeSearch = async (type) => {
    if (!moodLogic.currentSelectedMood.value) return;
    if (type === "same") {
      selectedMoodFilter.value = moodLogic.currentSelectedMood.value.id;
    } else {
      selectedMoodFilter.value = null;
      isRingSearching.value = true;
      searchLogic.searchQuery.value =
        moodLogic.moodOppositesMap[moodLogic.currentSelectedMood.value.id]
          ?.query || "new alternative music";
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

    ...searchLogic,
    ...moodLogic,
    ...historyLogic,
  };
}
