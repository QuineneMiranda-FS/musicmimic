import { ref, computed, onMounted } from "vue";
import axios from "axios";

export function useHistoryLogic(goToSongDetailsPage) {
  const clickedTracks = ref([]);

  // Helper Get User JWT
  const getAuthHeader = () => {
    const token = localStorage.getItem("app_jwt");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch History fm DB
  const loadHistory = async () => {
    try {
      const response = await axios.get("/api/history", {
        headers: getAuthHeader(),
      });
      clickedTracks.value = response.data.history || response.data;
    } catch (e) {
      console.error("Failed to process history from backend:", e);
      if (
        e.response &&
        (e.response.status === 401 || e.response.status === 403)
      ) {
        // ? Need session expiration handler
      }
    }
  };

  onMounted(loadHistory);

  const historyTracks = computed(() => {
    return [...clickedTracks.value].reverse();
  });

  // Tracking Persist
  const logTrackInteraction = async (track) => {
    const privacyShield =
      localStorage.getItem("mimic_privacy_shield") === "true";

    if (privacyShield) {
      if (goToSongDetailsPage) goToSongDetailsPage(track);
      return;
    }

    try {
      // Send to Backend
      const response = await axios.post(
        "/api/history",
        {
          spotifyId: track.id,
          name: track.name,
          artist: track.artist || "Unknown Artist",
          image: track.image || "",
          mood: track.mood || null,
          emoticon: track.emoticon || "🎵",
        },
        {
          headers: getAuthHeader(),
        },
      );

      // Update State
      if (response.data.success || response.data) {
        const savedTrack = response.data.track || response.data;
        clickedTracks.value.push(savedTrack);
      }
    } catch (e) {
      console.error("Failed to log interaction to backend:", e);
    } finally {
      if (goToSongDetailsPage) {
        goToSongDetailsPage(track);
      }
    }
  };

  // Clear History
  const clearAllHistory = async () => {
    try {
      await axios.delete("/api/history", {
        headers: getAuthHeader(),
      });

      clickedTracks.value = clickedTracks.value.map((track) => ({
        ...track,
        isDailyEligible: false,
      }));
    } catch (e) {
      console.error("Failed to wipe history on backend:", e);
    }
  };

  // Delete Song
  const deleteSingleTrackFromHistory = async (trackId) => {
    try {
      await axios.delete(`/api/history/${trackId}`, {
        headers: getAuthHeader(),
      });
      clickedTracks.value = clickedTracks.value.filter((t) => t.id !== trackId);
    } catch (e) {
      console.error(
        `Failed to remove item ${trackId} from backend history:`,
        e,
      );
    }
  };

  return {
    historyTracks,
    logTrackInteraction,
    clearAllHistory,
    deleteSingleTrackFromHistory,
    refreshHistory: loadHistory,
  };
}
