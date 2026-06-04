const express = require("express");
const router = express.Router();
const axios = require("axios");

// Import the Sequelize User model
const { User } = require("../models");

// Import auth sub-routers
const authRoutes = require("./auth");
const authCallbackRoutes = require("./auth-callback");

// Import custom JWT middleware
const { authenticateJWT } = require("../middleware/auth");

// Test API Endpoint
router.get("/status", (req, res) => {
  res.json({ status: "success", message: "API is online" });
});

// Auth routers
router.use("/", authRoutes);
router.use("/", authCallbackRoutes);

router.get("/search", authenticateJWT, async (req, res, next) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res
        .status(400)
        .json({ error: "Query parameter 'q' is required." });
    }

    // Fetch user record from db
    const dbUser = await User.findByPk(req.user.userId);
    if (!dbUser || !dbUser.spotifyAccessToken) {
      return res
        .status(401)
        .json({ error: "Spotify credentials missing. Please log in again." });
    }

    const spotifyUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,artist,album&limit=10`;

    // Query Spotify
    const searchResponse = await axios.get(spotifyUrl, {
      headers: {
        Authorization: `Bearer ${dbUser.spotifyAccessToken}`,
        Accept: "application/json",
      },
    });

    const tracks =
      searchResponse.data.tracks?.items.map((track) => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map((a) => a.name).join(", "),
        album: track.album.name,
        image:
          track.album.images && track.album.images.length > 0
            ? track.album.images[0].url
            : null,
      })) || [];

    const artists =
      searchResponse.data.artists?.items.map((artist) => ({
        id: artist.id,
        name: artist.name,
        image:
          artist.images && artist.images.length > 0
            ? artist.images[0].url
            : null,
        genres: artist.genres,
      })) || [];

    const albums =
      searchResponse.data.albums?.items.map((album) => ({
        id: album.id,
        name: album.name,
        artist: album.artists.map((a) => a.name).join(", "),
        image:
          album.images && album.images.length > 0 ? album.images[0].url : null,
      })) || [];

    res.json({
      success: true,
      results: { tracks, artists, albums },
    });
  } catch (error) {
    if (error.response) {
      console.error("--- SPOTIFY API ERROR ---");
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    next(error);
  }
});

module.exports = router;
