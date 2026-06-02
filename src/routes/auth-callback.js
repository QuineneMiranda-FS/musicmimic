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

    const tokenResponse = await axios.post(
      "https://spotify.com",
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

    const profileResponse = await axios.get("https://spotify.com", {
      headers: { Authorization: `Bearer ${spotifyAccessToken}` },
    });

    // Sync with Database via Sequelize
    const [user] = await User.findOrCreate({
      where: { spotifyId: profileResponse.data.id },
      defaults: {
        email: profileResponse.data.email,
        displayName: profileResponse.data.display_name,
      },
    });

    // Generate internal Application JWT
    const appToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    // Send token back to frontend
    res.json({ token: appToken });
  } catch (error) {
    // Passes errors to errorHandler middleware
    next(error);
  }
});

module.exports = router;
