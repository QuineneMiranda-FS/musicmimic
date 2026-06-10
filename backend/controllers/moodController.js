const { TrackMood } = require("../models/trackmood");
const axios = require("axios");

// Helper - Energy to Emoticons
function calculateMood(valence, energy) {
  if (valence >= 0.5 && energy >= 0.5)
    return { emoji: "🥳", label: "Happy/Hype" };
  if (valence >= 0.5 && energy < 0.5)
    return { emoji: "😌", label: "Chill/Peaceful" };
  if (valence < 0.5 && energy >= 0.5)
    return { emoji: "😤", label: "Angry/Intense" };
  return { emoji: "😢", label: "Sad/Melancholic" };
}

exports.getTrackMood = async (req, res) => {
  try {
    const { trackId } = req.params;
    const spotifyToken = req.headers.authorization;

    // Check db
    let cachedMood = await TrackMood.findByPk(trackId);
    if (cachedMood) {
      return res.json(cachedMood);
    }

    // Fetch if not in db
    const spotifyResponse = await axios.get(`https://spotify.com{trackId}`, {
      headers: { Authorization: spotifyToken },
    });

    const { valence, energy } = spotifyResponse.data;
    const { emoji, label } = calculateMood(valence, energy);

    // Save to db
    const newMoodRecord = await TrackMood.create({
      spotifyTrackId: trackId,
      valence,
      energy,
      emoji,
      moodLabel: label,
    });

    return res.json(newMoodRecord);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to analyze song mood" });
  }
};

exports.getMoodRecommendations = async (req, res) => {
  try {
    const { trackId } = req.params;
    const spotifyToken = req.headers.authorization;

    // Pull from db
    const moodData = await TrackMood.findByPk(trackId);
    if (!moodData)
      return res.status(404).json({ error: "Analyze track mood first" });

    // Query Spotify
    const recommendations = await axios.get(`https://spotify.com`, {
      headers: { Authorization: spotifyToken },
      params: {
        seed_tracks: trackId,
        target_valence: moodData.valence,
        target_energy: moodData.energy,
        limit: 15,
      },
    });

    res.json(recommendations.data.tracks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate playlist mix" });
  }
};
