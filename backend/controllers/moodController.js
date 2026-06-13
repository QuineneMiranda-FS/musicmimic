"use strict";

const axios = require("axios");
const { TrackMood } = require("../models/trackmood");

/* Valence/Energy to Mood */
function calculateMood(valence, energy) {
  if (valence >= 0.5 && energy >= 0.5)
    return { emoji: "🥳", label: "Happy/Hype" };
  if (valence >= 0.5 && energy < 0.5)
    return { emoji: "😌", label: "Chill/Peaceful" };
  if (valence < 0.5 && energy >= 0.5)
    return { emoji: "😤", label: "Angry/Intense" };
  return { emoji: "😢", label: "Sad/Melancholic" };
}

// GET: Track Mood
exports.getTrackMood = async (req, res) => {
  try {
    const { trackId } = req.params;
    const spotifyToken = req.headers.authorization;

    if (!spotifyToken) {
      return res.status(401).json({ error: "Missing authorization token" });
    }

    // DB Lookup
    const cachedMood = await TrackMood.findByPk(trackId);
    if (cachedMood) {
      return res.json(cachedMood);
    }

    // Fetch Audio
    const spotifyResponse = await axios.get(`https://spotify.com${trackId}`, {
      headers: { Authorization: spotifyToken },
    });

    // Fallback
    const { valence = 0.5, energy = 0.5 } = spotifyResponse.data || {};
    const { emoji, label } = calculateMood(valence, energy);

    // Analysis to DB
    const newMoodRecord = await TrackMood.create({
      spotifyTrackId: trackId,
      valence,
      energy,
      emoji,
      moodLabel: label,
    });

    return res.status(201).json(newMoodRecord);
  } catch (error) {
    console.error("[getTrackMood Error]:", error.message);
    return res.status(500).json({ error: "Failed to analyze song mood" });
  }
};

// GET: Recs
exports.getMoodRecommendations = async (req, res) => {
  try {
    const { trackId } = req.params;
    const spotifyToken = req.headers.authorization;

    if (!spotifyToken) {
      return res.status(401).json({ error: "Missing authorization token" });
    }

    // Fm Local DB
    const moodData = await TrackMood.findByPk(trackId);
    if (!moodData) {
      return res.status(404).json({
        error: "Analyze track mood first before requesting mix recommendations",
      });
    }

    // Rec Response
    const recommendationsResponse = await axios.get("https://spotify.com", {
      headers: { Authorization: spotifyToken },
      params: {
        seed_tracks: trackId,
        target_valence: moodData.valence,
        target_energy: moodData.energy,
        limit: 15,
      },
    });

    const recommendedTracks = recommendationsResponse.data?.tracks || [];
    return res.json(recommendedTracks);
  } catch (error) {
    console.error("[getMoodRecommendations Error]:", error.message);
    return res.status(500).json({ error: "Failed to generate playlist mix" });
  }
};
