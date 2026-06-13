"use strict";

const axios = require("axios");

async function getTrackMetadata(spotifyId, accessToken) {
  if (!accessToken) return { previewUrl: null, albumImage: null };

  try {
    const res = await axios.get(
      `https://api.spotify.com/v1/tracks/${spotifyId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    return {
      previewUrl: res.data?.preview_url || null,
      albumImage: res.data?.album?.images?.[0]?.url || null,
    };
  } catch (err) {
    console.warn("[Spotify API] Failed to fetch track metadata:", err.message);
    return { previewUrl: null, albumImage: null };
  }
}

async function searchTrack(title, artist, accessToken) {
  try {
    const searchQuery = `${title} ${artist}`;

    const res = await axios.get("https://api.spotify.com/v1/search", {
      params: { q: searchQuery, type: "track", limit: 1 },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data?.tracks?.items?.[0] || null;
  } catch (err) {
    console.warn(`[Spotify Search Failed] For track "${title}":`, err.message);
    return null;
  }
}

module.exports = { getTrackMetadata, searchTrack };
