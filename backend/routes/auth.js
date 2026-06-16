"use strict";

const express = require("express");
const router = express.Router();
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

const SCOPES = "user-read-private user-read-email user-library-read";
const SPOTIFY_CLIENT_ID = (process.env.SPOTIFY_CLIENT_ID || "").trim();
const SPOTIFY_CLIENT_SECRET = (process.env.SPOTIFY_CLIENT_SECRET || "").trim();
const REDIRECT_URI = (process.env.SPOTIFY_REDIRECT_URI || "").trim();

// Auth Header
const BASIC_AUTH_HEADER = `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`;

// GET: Spotify Login Endpoint
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

// Refresh Spotify Tokens
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

// POST: Refresh App & Sync DB Creds
router.post("/refresh", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "No token authorization header provided" });
    }

    const tokenParts = authHeader.split(" ");
    const token = tokenParts[1];
    if (!token) {
      return res.status(401).json({ error: "Malformed token header layout" });
    }

    // Ignore Exp for Users to Refresh Late
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      ignoreExpiration: true,
    });

    // Fetch User
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.spotifyRefreshToken) {
      return res.status(401).json({ error: "Invalid user session profile" });
    }

    // Helper for New Creds
    const newSpotifyAccessToken = await refreshSpotifyToken(
      user.spotifyRefreshToken,
    );

    // Save to DB
    user.spotifyAccessToken = newSpotifyAccessToken;
    await user.save();

    // Extend Token Life
    const newAppToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });

    return res.json({ token: newAppToken });
  } catch (error) {
    console.error(
      "[Auth Route Error] Session token refresh pipeline failed:",
      error.message,
    );
    return res.status(500).json({ error: "Could not sync user credentials" });
  }
});

module.exports = {
  router,
  refreshSpotifyToken,
};
