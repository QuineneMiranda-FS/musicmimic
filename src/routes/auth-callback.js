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

    //Spotify Account Token Gateway
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
          // Spotify wants authorization credentials passed via Auth header
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

    //Spotify Web API user profile endpoint
    const profileResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${spotifyAccessToken}` },
    });

    // Debug
    console.log("Spotify Profile Data Object:", profileResponse.data);

    const [user] = await User.findOrCreate({
      where: { spotifyId: profileResponse.data.id },
      defaults: {
        email: profileResponse.data.email,
        displayName: profileResponse.data.display_name,
        spotifyAccessToken: spotifyAccessToken, // Save token
      },
    });

    // If user exists, update access token to newest
    if (!user._strong_hint_was_created) {
      user.spotifyAccessToken = spotifyAccessToken;
      await user.save();
    }

    // Generate internal Application JWT
    const appToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    // Send token back to frontend
    res.redirect(`http://127.0.0.1:3001/?token=${appToken}`);
  } catch (error) {
    // Passes errors to errorHandler middleware
    next(error);
  }
});

module.exports = router;
