const express = require("express");
const router = express.Router();
const querystring = require("querystring");
const axios = require("axios");

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
      show_dialog: true,
    });

  console.log("Redirecting browser to official URL:", spotifyAuthUrl);
  res.redirect(spotifyAuthUrl);
});

// Refresh Token
async function refreshSpotifyToken(refreshToken) {
  try {
    const response = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
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
      data: querystring.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    return response.data.access_token;
  } catch (error) {
    console.error(
      "Spotify token refresh utility failed:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

module.exports = {
  router,
  refreshSpotifyToken,
};
