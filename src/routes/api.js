const express = require("express");
const router = express.Router();
const axios = require("axios");

// Import the Sequelize User model
const { User } = require("../models");

// Import auth sub-routers
const authModule = require("./auth");
const authRoutes = authModule.router || authModule;
const { refreshSpotifyToken } = authModule;

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
    if (!dbUser.spotifyRefreshToken) {
      return res.status(401).json({
        error:
          "Spotify session cannot be refreshed automatically. Please log out and log back in to renew your permissions.",
      });
    }
    const spotifyClient = axios.create({
      baseURL: "https://api.spotify.com/v1",
      headers: {
        Authorization: `Bearer ${dbUser.spotifyAccessToken}`,
        Accept: "application/json",
      },
    });

    // Intercept Expired Tokens
    spotifyClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            console.log(
              `[Spotify Auth] Access token expired for user ${dbUser.id}. Refreshing...`,
            );

            const newAccessToken = await refreshSpotifyToken(
              dbUser.spotifyRefreshToken,
            );

            // Update db
            dbUser.spotifyAccessToken = newAccessToken;
            await dbUser.save();

            // New Token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            return axios(originalRequest);
          } catch (refreshError) {
            // Invalid token
            console.error(
              "[Spotify Auth] Critical: Refresh token failed.",
              refreshError.message,
            );
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      },
    );

    // Request
    const spotifyUrl = `/search?q=${encodeURIComponent(query)}&type=track,artist,album&limit=10`;
    const searchResponse = await spotifyClient.get(spotifyUrl);

    // Results (with external Spotify URLs)
    const tracks =
      searchResponse.data.tracks?.items.map((track) => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map((a) => a.name).join(", "),
        album: track.album.name,
        spotifyUrl: track.external_urls?.spotify || null,
        image:
          track.album.images && track.album.images.length > 0
            ? track.album.images[0].url
            : null,
      })) || [];

    const artists =
      searchResponse.data.artists?.items.map((artist) => ({
        id: artist.id,
        name: artist.name,
        spotifyUrl: artist.external_urls?.spotify || null,
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
        spotifyUrl: album.external_urls?.spotify || null,
        image:
          album.images && album.images.length > 0 ? album.images[0].url : null,
      })) || [];

    res.json({
      success: true,
      results: { tracks, artists, albums },
    });
  } catch (error) {
    if (error.response?.status === 401) {
      console.error("--- SPOTIFY AUTHENTICATION EXPIRED EPIC FAIL ---");
      return res.status(401).json({
        error: "Spotify re-authentication required. Please log in again.",
      });
    }

    if (error.response) {
      console.error("--- SPOTIFY API ERROR ---");
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    next(error);
  }
});

module.exports = router;
