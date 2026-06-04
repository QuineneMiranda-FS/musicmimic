const express = require("express");
const router = express.Router();
const axios = require("axios");
const jwt = require("jsonwebtoken");
const querystring = require("querystring");
const { User } = require("../models");

router.get("/callback/spotify", async (req, res, next) => {
  try {
    const code = req.query.code;
    if (!code)
      return res.status(400).json({ error: "No code provided from Spotify" });

    // Spotify Account Token Gateway
    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      }),
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

    const spotifyAccessToken = tokenResponse.data.access_token;
    const spotifyRefreshToken = tokenResponse.data.refresh_token;

    // Spotify Web API user profile endpoint
    const profileResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${spotifyAccessToken}` },
    });

    // Debug
    console.log("Spotify Profile Data Object:", profileResponse.data);

    const [user, created] = await User.findOrCreate({
      where: { spotifyId: profileResponse.data.id },
      defaults: {
        email: profileResponse.data.email,
        displayName: profileResponse.data.display_name,
        spotifyAccessToken: spotifyAccessToken,
        spotifyRefreshToken: spotifyRefreshToken,
      },
    });

    // If user exists update to newest token
    if (!created) {
      user.spotifyAccessToken = spotifyAccessToken;
      if (spotifyRefreshToken) {
        user.spotifyRefreshToken = spotifyRefreshToken;
      }
      await user.save();
    }

    // Generate token
    const appToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });

    // Send token back to frontend
    res.redirect(`http://127.0.0.1:5173/?token=${appToken}`);
  } catch (error) {
    // Passes errors to errorHandler middleware
    next(error);
  }
});

module.exports = router;
