const express = require("express");
const router = express.Router();
const querystring = require("querystring");

router.get("/login/spotify", (req, res) => {
  const scopes = "user-read-private user-read-email";

  // Spotify authorization URL
  res.redirect(
    "https://spotify.com?" +
      querystring.stringify({
        response_type: "code",
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope: scopes,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      }),
  );
});

module.exports = router;
