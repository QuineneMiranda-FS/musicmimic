import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

export function useSearchLogic() {
  const router = useRouter();

  // Reactive form state tracking
  const username = ref("Authenticated Listener");
  const searchQuery = ref("");
  const hasSearched = ref(false);
  const results = ref({ tracks: [], artists: [], albums: [] });

  // Ensure user has valid JWT token on page load
  onMounted(() => {
    const token = localStorage.getItem("app_jwt");
    if (!token) {
      router.push("/");
    }
  });

  // Search
  async function executeSearch() {
    // Prevent empty spaces
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

      // Handle expire auth
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

  // Clear global tokens/send user back to login
  function logout() {
    // Clear local JWT
    localStorage.removeItem("app_jwt");

    // Pop Up Spotify Cookie clearing
    const spotifyLogoutWindow = window.open(
      "https://spotify.com",
      "_blank",
      "width=500,height=400,top=100,left=100",
    );

    // Close Pop Up
    setTimeout(() => {
      if (spotifyLogoutWindow) {
        spotifyLogoutWindow.close();
      }

      // Reset local state
      hasSearched.value = false;
      results.value = { tracks: [], artists: [], albums: [] };
      searchQuery.value = "";

      // Force to LoginView screen
      router.push("/");
    }, 2000);
  }

  return {
    username,
    searchQuery,
    hasSearched,
    results,
    executeSearch,
    logout,
  };
}
