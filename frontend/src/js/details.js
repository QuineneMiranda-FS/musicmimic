import { ref, onMounted, watch } from "vue";
import axios from "axios";

export function useDetailsLogic(route) {
  const trackId = ref(route.query.id);
  const title = ref(route.query.title);
  const artist = ref(route.query.artist);
  const mood = ref(route.query.mood);
  const emoticon = ref(route.query.emoticon);
  const albumImage = ref(route.query.image);

  const previewUrl = ref(route.query.previewUrl || null);

  const lyrics = ref("Getting Genius Live Data...");
  const recommendations = ref([]);
  const isLoadingRecs = ref(false);

  const loadPageData = async () => {
    if (!trackId.value) return;
    isLoadingRecs.value = true;
    lyrics.value = "Getting Genius Live Data...";

    // Lyrics & Mood fm Backend
    try {
      const analyzeRes = await axios.post(
        "http://localhost:3000/api/tracks/analyze",
        {
          spotifyId: trackId.value,
          title: title.value,
          artist: artist.value,
        },
      );
      lyrics.value = analyzeRes.data.lyricsText;

      // Only override if no mood already
      if (!mood.value && analyzeRes.data.mood) {
        mood.value = analyzeRes.data.mood;
      }
      if (!emoticon.value && analyzeRes.data.emoticon) {
        emoticon.value = analyzeRes.data.emoticon;
      }

      if (analyzeRes.data.previewUrl)
        previewUrl.value = analyzeRes.data.previewUrl;
      if (analyzeRes.data.albumImage)
        albumImage.value = analyzeRes.data.albumImage;
    } catch (err) {
      console.error("Genius Scraping Error:", err);
      lyrics.value = "Failed to sync song profile.";
    }

    // AI Recs
    try {
      const token = localStorage.getItem("app_jwt");
      const recsRes = await axios.get(
        "http://localhost:3000/api/tracks/recommendations",
        {
          params: {
            mood: mood.value,
            title: title.value,
            artist: artist.value,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      recommendations.value = recsRes.data;
    } catch (err) {
      console.error("AI Recommendations Subpage Error:", err);
      recommendations.value = [];
    } finally {
      isLoadingRecs.value = false;
    }
  };

  // Watch for parameter changes on clicks
  watch(
    () => route.query.id,
    (newId) => {
      if (!newId) return;
      trackId.value = route.query.id;
      title.value = route.query.title;
      artist.value = route.query.artist;
      mood.value = route.query.mood;
      emoticon.value = route.query.emoticon;
      albumImage.value = route.query.image;
      previewUrl.value = route.query.previewUrl || null;

      loadPageData();
    },
  );

  onMounted(loadPageData);

  return {
    trackId,
    title,
    artist,
    mood,
    emoticon,
    albumImage,
    previewUrl,
    lyrics,
    recommendations,
    isLoadingRecs,
    loadPageData,
  };
}
