"use strict";

const express = require("express");
const router = express.Router();
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

const SPOTIFY_CLIENT_ID = (process.env.SPOTIFY_CLIENT_ID || "").trim();
const SPOTIFY_CLIENT_SECRET = (process.env.SPOTIFY_CLIENT_SECRET || "").trim();
const REDIRECT_URI = (process.env.SPOTIFY_REDIRECT_URI || "").trim();

const BASIC_AUTH_HEADER = `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`;

// GET: Spotify Callback
router.get("/callback/spotify", async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: "No code provided from Spotify" });
    }

    // Exchange OAuth for Tokens
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: REDIRECT_URI,
    });

    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      tokenParams.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: BASIC_AUTH_HEADER,
        },
      },
    );

    const {
      access_token: spotifyAccessToken,
      refresh_token: spotifyRefreshToken,
    } = tokenResponse.data;

    // Fetch Spotify User Profile
    const profileResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${spotifyAccessToken}` },
    });

    console.log("Spotify Profile Data Object:", profileResponse.data);

    // DB Query (update or create)
    const userData = {
      email: profileResponse.data.email,
      displayName: profileResponse.data.display_name,
      spotifyAccessToken: spotifyAccessToken,
    };

    if (spotifyRefreshToken) {
      userData.spotifyRefreshToken = spotifyRefreshToken;
    }

    const [user] = await User.upsert({
      spotifyId: profileResponse.data.id,
      ...userData,
    });

    // Generate Session JWT
    const appToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });

    // Redirect to Frontend
    const frontendRedirect = new URL("http://127.0.0.1:5173/");
    frontendRedirect.searchParams.append("token", appToken);

    return res.redirect(frontendRedirect.toString());
  } catch (error) {
    // To errorHandler
    next(error);
  }
});

module.exports = router;
