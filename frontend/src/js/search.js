import { ref, onMounted } from "vue";
import { useRouter } from "vue-router"; // Ensure this is imported
import axios from "axios";

const username = ref("Authenticated Listener");
const searchQuery = ref("");
const hasSearched = ref(false);
const results = ref({ tracks: [], artists: [], albums: [] });
const loadingTrackId = ref(null);

export function useSearchLogic() {
  const router = useRouter();

  // Ensure user has valid JWT token on page load
  onMounted(() => {
    const token = localStorage.getItem("app_jwt");
    if (!token) {
      router.push("/");
    }
  });

  // Search async function
  async function executeSearch() {
    if (!searchQuery.value.trim()) return;
    const token = localStorage.getItem("app_jwt");
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery.value)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.status === 401 || response.status === 403) {
        logout();
        return;
      }
      const data = await response.json();
      if (data.success) {
        results.value = data.results;
        hasSearched.value = true;
      }
    } catch (error) {
      console.error("Search request operation failed:", error);
    }
  }

  async function analyzeMoodInline(track) {
    if (loadingTrackId.value) return;
    loadingTrackId.value = track.id;
    try {
      const response = await axios.post("/api/tracks/analyze", {
        spotifyId: track.id,
        title: track.name,
        artist: track.artist,
      });
      track.mood = response.data.mood;
      track.emoticon = response.data.emoticon;
    } catch (error) {
      console.error("Error running local Ollama:", error);
      alert("Could not process this track's mood.");
    } finally {
      loadingTrackId.value = null;
    }
  }

  // Redirection router push function
  function goToSongDetailsPage(track) {
    router.push({
      name: "SongDetails",
      query: {
        id: track.id,
        title: track.name || track.title,
        artist: track.artist,
        mood: track.mood || "Analyzing...",
        emoticon: track.emoticon || "🎵",
        image: track.image || "",
        preview_url: track.previewUrl || "",
      },
    });
  }

  // Clear global tokens/send user back to login
  function logout() {
    localStorage.removeItem("app_jwt");
    const spotifyLogoutWindow = window.open(
      "https://spotify.com",
      "_blank",
      "width=500,height=400,top=100,left=100",
    );
    setTimeout(() => {
      if (spotifyLogoutWindow) {
        spotifyLogoutWindow.close();
      }

      hasSearched.value = false;
      results.value = { tracks: [], artists: [], albums: [] };
      searchQuery.value = "";
      router.push("/");
    }, 2000);
  }

  return {
    username,
    searchQuery,
    hasSearched,
    results,
    loadingTrackId,
    executeSearch,
    analyzeMoodInline,
    goToSongDetailsPage,
    logout,
  };
}
