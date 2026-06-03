document.addEventListener("DOMContentLoaded", () => {
  // Callback tokens intercept
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get("token");

  if (tokenFromUrl) {
    localStorage.setItem("app_jwt", tokenFromUrl);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const jwt = localStorage.getItem("app_jwt");

  // Visibility
  const headerSearchForm = document.getElementById("header-search-form");
  const loggedOutCard = document.getElementById("logged-out-card");
  const loggedInCard = document.getElementById("logged-in-card");

  if (jwt) {
    headerSearchForm?.classList.remove("hidden");
    loggedInCard?.classList.remove("hidden");
    loggedOutCard?.classList.add("hidden");
  } else {
    headerSearchForm?.classList.add("hidden");
    loggedOutCard?.classList.remove("hidden");
    loggedInCard?.classList.add("hidden");
  }

  // From Submission Handler
  headerSearchForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const searchInput = document.getElementById("header-search-input");
    const query = searchInput?.value.trim();

    if (!query) return;

    // Results based on search
    window.location.href = `/results?q=${encodeURIComponent(query)}`;
  });

  // Spotify Fetch
  if (window.location.pathname === "/results" && jwt) {
    executeMusicSearch(jwt);
  }
});

async function executeMusicSearch(token) {
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get("q");

  if (!searchQuery) return;

  const songsContainer = document.getElementById("songs-list-container");
  if (songsContainer) {
    songsContainer.innerHTML =
      "<p class='no-results'>Searching MusicMimic...</p>";
  }

  try {
    const response = await fetch(
      `/api/search?q=${encodeURIComponent(searchQuery)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();
    if (!response.ok || data.status === "error") throw new Error(data.message);

    renderSongs(data.results.tracks || []);
    renderArtists(data.results.artists || []);
    renderAlbums(data.results.albums || []);
  } catch (error) {
    console.error("MusicMimic Search Failed:", error.message);
    if (songsContainer) {
      songsContainer.innerHTML = `<p class="no-results" style="color: red;">Error: ${error.message}</p>`;
    }
  }
}

function renderSongs(tracks) {
  const container = document.getElementById("songs-list-container");
  const badge = document.getElementById("songs-count-badge");

  if (!container) return;

  // Update badge number
  if (badge) badge.innerText = tracks.length;

  if (!tracks || tracks.length === 0) {
    container.innerHTML = '<p class="no-results">No songs found.</p>';
    return;
  }

  container.innerHTML = tracks
    .map(
      (song) => `
    <div class="result-item">
      <img src="${song.image ? song.image : "/placeholder-track.png"}" class="result-img" alt="">
      <div class="result-meta">
        <span class="result-title">${escapeHTML(song.name)}</span>
        <span class="result-subtext">${escapeHTML(song.artist)}</span>
      </div>
    </div>
  `,
    )
    .join("");
}

// **Fix Helper for XSS issues when inserting string variables into HTML
function escapeHTML(str) {
  return str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        tag
      ] || tag,
  );
}
function renderArtists(artists) {
  const container = document.getElementById("artists-list-container");
  const badge = document.getElementById("artists-count-badge");
  if (!container) return;

  if (badge) badge.innerText = artists ? artists.length : 0;
  if (!artists || artists.length === 0) {
    container.innerHTML = '<p class="no-results">No artists found.</p>';
    return;
  }

  container.innerHTML = artists
    .map(
      (artist) => `
    <div class="result-item">
      <img src="${artist.image ? artist.image : "/placeholder-artist.png"}" class="result-img" alt="">
      <div class="result-meta">
        <span class="result-title">${escapeHTML(artist.name)}</span>
        <span class="result-subtext">${artist.genres ? escapeHTML(artist.genres.join(", ")) : "Artist"}</span>
      </div>
    </div>
  `,
    )
    .join("");
}

function renderAlbums(albums) {
  const container = document.getElementById("albums-list-container");
  const badge = document.getElementById("albums-count-badge");
  if (!container) return;

  if (badge) badge.innerText = albums ? albums.length : 0;
  if (!albums || albums.length === 0) {
    container.innerHTML = '<p class="no-results">No albums found.</p>';
    return;
  }

  container.innerHTML = albums
    .map(
      (album) => `
    <div class="result-item">
      <img src="${album.image ? album.image : "/placeholder-album.png"}" class="result-img" alt="">
      <div class="result-meta">
        <span class="result-title">${escapeHTML(album.name)}</span>
        <span class="result-subtext">${escapeHTML(album.artist)}</span>
      </div>
    </div>
  `,
    )
    .join("");
}
