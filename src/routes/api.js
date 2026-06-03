// routes/api.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const querystring = require("querystring");

// Import auth sub-routers
const authRoutes = require("./auth");
const authCallbackRoutes = require("./auth-callback");

// Import custom JWT middleware
const { authenticateJWT } = require("../middleware/auth");

// Test API Endpoint (At http://localhost:3001/api/status)
router.get("/status", (req, res) => {
  res.json({ status: "success", message: "API is online" });
});

// Auth routes under /api: http://localhost:3001/api/login/spotify
router.use("/", authRoutes);

// Callback url: http://localhost:3001/api/callback/spotify
router.use("/", authCallbackRoutes);

/**
 * SECURE SEARCH ENDPOINT
 * Accessible via: GET http://localhost:3001/api/search?q=YourSongName
 * Requires Header: Authorization Bearer <YOUR_INTERNAL_JWT>
 */
router.get("/search", authenticateJWT, async (req, res, next) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res
        .status(400)
        .json({ error: "Query parameter 'q' is required." });
    }

    // Request a backend-to-backend Access Token from Spotify
    const tokenResponse = await axios.post(
      "https://spotify.com",
      querystring.stringify({ grant_type: "client_credentials" }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.SPOTIFY_CLIENT_ID +
                ":" +
                process.env.SPOTIFY_CLIENT_SECRET,
            ).toString("base64"),
        },
      },
    );

    const spotifyServerToken = tokenResponse.data.access_token;

    // Call Spotify Track Search API with the server token
    const searchResponse = await axios.get("https://spotify.com", {
      headers: { Authorization: `Bearer ${spotifyServerToken}` },
      params: {
        q: query,
        type: "track,artist,album", // FIXED: Telling Spotify to pull all data segments
        limit: 10,
      },
    });

    // Songs aka tracks
    const tracks =
      searchResponse.data.tracks?.items.map((track) => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map((a) => a.name).join(", "),
        album: track.album.name,
        image:
          track.album.images && track.album.images[0]
            ? track.album.images[0].url
            : null,
      })) || [];

    // Artists
    const artists =
      searchResponse.data.artists?.items.map((artist) => ({
        id: artist.id,
        name: artist.name,
        image: artist.images && artist.images[0] ? artist.images[0].url : null,
        genres: artist.genres, // Array of string genres
      })) || [];

    // Albums
    const albums =
      searchResponse.data.albums?.items.map((album) => ({
        id: album.id,
        name: album.name,
        artist: album.artists.map((a) => a.name).join(", "),
        image: album.images && album.images[0] ? album.images[0].url : null,
      })) || [];

    res.json({
      success: true,
      results: {
        tracks: tracks,
        artists: artists,
        albums: albums,
      },
    });
  } catch (error) {
    // Passes errors to errorHandler middleware
    next(error);
  }
});

module.exports = router;
