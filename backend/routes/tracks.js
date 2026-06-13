"use strict";

const express = require("express");
const router = express.Router();
const { User } = require("../models");
const spotifyService = require("../services/spotifyService");
const geniusService = require("../services/geniusService");
const aiService = require("../services/aiService");

const getUserIdFromReq = (req) => req.user?.userId || 1;

// POST: Fetch & Analyze Track
router.post("/analyze", async (req, res) => {
  const { spotifyId, title, artist } = req.body;
  const userId = getUserIdFromReq(req);

  try {
    const dbUser = await User.findByPk(userId);

    // Genius w/ Spotify
    const [spotifyMeta, geniusMeta] = await Promise.all([
      spotifyService.getTrackMetadata(spotifyId, dbUser?.spotifyAccessToken),
      geniusService.getLyrics(title, artist),
    ]);

    // Analyze mood
    const aiMood = await aiService.analyzeTrackMood(
      title,
      artist,
      geniusMeta.lyricsText,
    );

    return res.json({
      spotifyId,
      title,
      artist,
      mood: aiMood.label,
      emoticon: aiMood.emoji,
      legendGroup: aiMood.legendGroup,
      lyricsText: geniusMeta.lyricsText,
      geniusUrl: geniusMeta.geniusUrl,
      previewUrl: spotifyMeta.previewUrl,
      albumImage: spotifyMeta.albumImage,
    });
  } catch (error) {
    console.error("Analysis Error:", error);
    return res.status(500).json({ error: "Epic Failure!" });
  }
});

// GET: AI Recommendations
router.get("/recommendations", async (req, res) => {
  const { mood, title, artist } = req.query;
  const userId = getUserIdFromReq(req);

  try {
    const dbUser = await User.findByPk(userId);
    if (!dbUser || !dbUser.spotifyAccessToken) {
      return res
        .status(401)
        .json({ error: "Unauthorized. Missing Spotify token." });
    }

    const aiTracks = await aiService.generateRecommendations(
      title,
      artist,
      mood,
    );

    // Get Spotify Data for Merge
    const mergedTracks = await Promise.all(
      aiTracks.map(async (track, index) => {
        const spotifyTrack = await spotifyService.searchTrack(
          track.title,
          track.artist,
          dbUser.spotifyAccessToken,
        );

        if (spotifyTrack) {
          return {
            spotifyId: spotifyTrack.id,
            title: spotifyTrack.name,
            artist: spotifyTrack.artists
              ? spotifyTrack.artists.map((a) => a.name).join(", ")
              : track.artist,
            image: spotifyTrack.album?.images?.[0]?.url || "fallback.jpg",
            previewUrl: spotifyTrack.preview_url || null,
          };
        }

        return {
          spotifyId: `ai-fallback-${index}-${Date.now()}`,
          title: track.title,
          artist: track.artist,
          image: "fallback.jpg",
          previewUrl: null,
        };
      }),
    );

    return res.json(mergedTracks);
  } catch (error) {
    console.error("AI Recommendation Generation Error:", error.message);
    return res
      .status(500)
      .json({ error: "Failed to generate AI recommendations." });
  }
});

module.exports = router;
