import { ref } from "vue";
import axios from "axios";

export function useCardLogic(props, router) {
  const aiData = ref(null);
  const isLoading = ref(false);
  const showTooltip = ref(false);

  // Helpers for Fallbacks
  const getTrackArtist = () => {
    return (
      props.track.artist || props.track.artists?.[0]?.name || "Unknown Artist"
    );
  };

  const getTrackImage = () => {
    return props.track.image || props.track.album?.images?.[0]?.url || "";
  };

  const getTrackMood = async () => {
    isLoading.value = true;
    try {
      const res = await axios.post("http://localhost:3000/api/tracks/analyze", {
        spotifyId: props.track.id,
        title: props.track.name,
        artist: getTrackArtist(),
      });
      aiData.value = res.data;
    } catch (err) {
      console.error("Error loading mood", err);
    } finally {
      isLoading.value = false;
    }
  };

  const goToSongDetailsPage = () => {
    if (isLoading.value || !aiData.value) return;
    router.push({
      name: "MoodSearch",
      query: {
        id: props.track.id,
        title: props.track.name,
        artist: getTrackArtist(),
        mood: aiData.value.mood,
        emoticon: aiData.value.emoticon,
        image: getTrackImage(),
      },
    });
  };

  getTrackMood();

  return {
    aiData,
    isLoading,
    showTooltip,
    goToSongDetailsPage,
  };
}
