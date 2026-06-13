"use strict";

const express = require("express");
const router = express.Router();
const axios = require("axios");

const SCOPES = "user-read-private user-read-email user-library-read";
const SPOTIFY_CLIENT_ID = (process.env.SPOTIFY_CLIENT_ID || "").trim();
const SPOTIFY_CLIENT_SECRET = (process.env.SPOTIFY_CLIENT_SECRET || "").trim();
const REDIRECT_URI = (process.env.SPOTIFY_REDIRECT_URI || "").trim();

// Auth Header
const BASIC_AUTH_HEADER = `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`;

// GET: Spotify Login
router.get("/login/spotify", (req, res) => {
  if (!SPOTIFY_CLIENT_ID || !REDIRECT_URI) {
    console.error(
      "[Auth Error] Missing Spotify Client ID or Redirect URI in environment variables.",
    );
    return res
      .status(500)
      .json({ error: "Authentication service misconfigured" });
  }

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("client_id", SPOTIFY_CLIENT_ID);
  authUrl.searchParams.append("scope", SCOPES);
  authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.append("show_dialog", "true");

  console.log("Redirecting browser to official URL:", authUrl.toString());
  return res.redirect(authUrl.toString());
});

// Refresh Token
async function refreshSpotifyToken(refreshToken) {
  try {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: BASIC_AUTH_HEADER,
        },
      },
    );

    return response.data.access_token;
  } catch (error) {
    console.error(
      "Spotify token refresh utility failed:",
      error.response?.data || error.message,
    );
    throw new Error("Failed to refresh Spotify credentials");
  }
}

module.exports = {
  router,
  refreshSpotifyToken,
};
