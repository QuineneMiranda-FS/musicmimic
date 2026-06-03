const express = require("express");
const router = express.Router();
const querystring = require("querystring");

router.get("/login/spotify", (req, res) => {
  const scopes = "user-read-private user-read-email";

  const clientId = process.env.SPOTIFY_CLIENT_ID
    ? process.env.SPOTIFY_CLIENT_ID.trim()
    : "";
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI
    ? process.env.SPOTIFY_REDIRECT_URI.trim()
    : "";

  const spotifyAuthUrl =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
    });

  // debug
  console.log("Redirecting browser to official URL:", spotifyAuthUrl);

  res.redirect(spotifyAuthUrl);
});

module.exports = router;
