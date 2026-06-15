import { ref, computed, onMounted } from "vue";

export function useHistoryLogic(goToSongDetailsPage) {
  const clickedTracks = ref([]);

  const loadHistory = () => {
    const savedHistory = localStorage.getItem("mimic_daily_mood_clicks");
    if (savedHistory) {
      try {
        clickedTracks.value = JSON.parse(savedHistory);
      } catch (e) {
        console.error("Failed to process history tracking logs", e);
      }
    }
  };

  onMounted(loadHistory);

  const historyTracks = computed(() => {
    return [...clickedTracks.value].reverse();
  });

  const logTrackInteraction = (track) => {
    const privacyShield =
      localStorage.getItem("mimic_privacy_shield") === "true";
    if (privacyShield) {
      if (goToSongDetailsPage) goToSongDetailsPage(track);
      return;
    }

    const now = Date.now();
    const interactedTrack = {
      id: track.id || now.toString(),
      name: track.name,
      artist: track.artist || "Unknown Artist",
      image: track.image || "",
      mood: track.mood || null,
      emoticon: track.emoticon || "🎵",
      timestamp: now,
      isDailyEligible: true,
      isWeeklyEligible: true,
      isMonthlyEligible: true,
    };

    clickedTracks.value.push(interactedTrack);
    localStorage.setItem(
      "mimic_daily_mood_clicks",
      JSON.stringify(clickedTracks.value),
    );

    if (goToSongDetailsPage) {
      goToSongDetailsPage(track);
    }
  };

  const clearAllHistory = () => {
    clickedTracks.value = [];
    localStorage.removeItem("mimic_daily_mood_clicks");
  };

  return {
    historyTracks,
    logTrackInteraction,
    clearAllHistory,
    refreshHistory: loadHistory,
  };
}
