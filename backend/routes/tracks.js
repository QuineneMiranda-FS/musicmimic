const express = require("express");
const router = express.Router();
const axios = require("axios");
const cheerio = require("cheerio");
const { OpenAI } = require("openai");
const { User } = require("../models");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: "ollama", // **Note Ollama expects a non-empty string
  baseURL: "http://localhost:11434/v1",
});

// Helper function to extract user ID out of JWT
const getUserIdFromReq = (req) => {
  return req.user?.userId || 1;
};

// Live Fetch & Analyze
router.post("/analyze", async (req, res) => {
  const { spotifyId, title, artist } = req.body;
  try {
    console.log(`[Genius] Scraping live lyrics for: ${title} - ${artist}`);

    const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(`${title} ${artist}`)}&access_token=${process.env.GENIUS_ACCESS_TOKEN}`;
    const geniusSearch = await axios.get(searchUrl);

    const lyricPath = geniusSearch.data.response.hits[0]?.result?.path;
    let lyricsText = "No lyrics found on Genius for this track.";

    if (lyricPath) {
      const lyricPage = await axios.get(`https://genius.com${lyricPath}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      const $ = cheerio.load(lyricPage.data);
      let scrapedLyrics = "";

      $('[class^="Lyrics__Container"], [data-lyrics-container="true"]').each(
        (i, el) => {
          let htmlContent = $(el).html();
          if (htmlContent) {
            // Replace break tags w/ new lines
            htmlContent = htmlContent.replace(/<br\s*\/?>/gi, "\n");
            // Replace closing tags with new lines
            htmlContent = htmlContent.replace(/<\/p>|<\/div>/gi, "\n");
            // Load modified HTML into Cheerio to strip tags safely
            const cleanText = cheerio.load(htmlContent).text();
            scrapedLyrics += cleanText + "\n";
          }
        },
      );

      // Fallback fix for legacy Genius templates
      if (!scrapedLyrics.trim()) {
        $(".lyrics").each((i, el) => {
          let htmlContent = $(el).html() || "";
          htmlContent = htmlContent.replace(/<br\s*\/?>/gi, "\n");
          scrapedLyrics += cheerio.load(htmlContent).text() + "\n";
        });
      }

      // --- Don't show metadata ---
      scrapedLyrics = scrapedLyrics.replace(
        /^\d+\s+Contributors?[\s\S]*?(?=Lyrics)/gi,
        "",
      );
      scrapedLyrics = scrapedLyrics.replace(/^.*?\bLyrics\b\s*/i, "");

      scrapedLyrics = scrapedLyrics.replace(
        /You might also like[\s\S]*\$/gi,
        "",
      );

      scrapedLyrics = scrapedLyrics
        .replace(/\n{3,}/g, "\n\n") // spacing fix
        .trim();

      if (scrapedLyrics) {
        lyricsText = scrapedLyrics.substring(0, 1500);
      }
    }

    // AI Inference
    const freeModels = ["llama3"];
    let label = null;
    let emoji = null;

    for (const modelAttempt of freeModels) {
      try {
        const aiResponse = await openai.chat.completions.create({
          model: modelAttempt,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You analyze lyrics for emotional tone. Return a JSON object with keys 'mood' and 'emoticon'. Values must strictly be one pair from: [Energetic/⚡, Melancholic/🌧, Angry/🔥, Chill/🌊, Romantic/💖].",
            },
            {
              role: "user",
              content: `Analyze this song: ${title} by ${artist}. Lyrics: ${lyricsText}`,
            },
          ],
        });

        if (aiResponse) {
          let cleanContent = aiResponse.choices[0].message.content.trim();
          if (cleanContent.startsWith("```")) {
            cleanContent = cleanContent.replace(/^```json|```$/g, "").trim();
          }
          const parsed = JSON.parse(cleanContent);
          label = parsed.mood;
          emoji = parsed.emoticon ? decodeURIComponent(parsed.emoticon) : null;
          break;
        }
      } catch (err) {
        console.warn(`[AI] ${modelAttempt} failed, checking fallback model...`);
      }
    }

    // Static safety net if AI fails
    if (!label || !emoji) {
      const localMoodPool = [
        { moodLabel: "Energetic", emoji: "⚡" },
        { moodLabel: "Melancholic", emoji: "🌧" },
        { moodLabel: "Angry", emoji: "🔥" },
        { moodLabel: "Chill", emoji: "🌊" },
        { moodLabel: "Romantic", emoji: "💖" },
      ];
      const index = title.length % localMoodPool.length;
      label = localMoodPool[index].moodLabel;
      emoji = localMoodPool[index].emoji;
    }

    // Skip db, send live data
    return res.json({
      spotifyId,
      title,
      artist,
      mood: label,
      emoticon: emoji,
      lyricsText: lyricsText,
    });
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: "Failed to process live tracking metrics." });
  }
});

// Spotify recs
router.get("/recommendations", async (req, res) => {
  const { excludeId } = req.query;
  const userId = getUserIdFromReq(req);

  try {
    // Get user token
    const dbUser = await User.findByPk(userId);
    if (!dbUser || !dbUser.spotifyAccessToken) {
      return res
        .status(401)
        .json({ error: "Unauthorized. Missing Spotify token." });
    }

    console.log(
      `[Spotify] Fetching real live recommendations for track seed: ${excludeId}`,
    );

    const spotifyRes = await axios.get("https://spotify.com", {
      params: {
        seed_tracks: excludeId,
        limit: 9,
      },
      headers: {
        Authorization: `Bearer ${dbUser.spotifyAccessToken}`,
      },
    });

    const mappedTracks = spotifyRes.data.tracks.map((track) => ({
      spotifyId: track.id,
      title: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      image: track.album?.images?.[0]?.url || "",
    }));

    return res.json(mappedTracks);
  } catch (error) {
    console.error(
      "Spotify Recommendations Error:",
      error.response?.data || error.message,
    );
    return res
      .status(500)
      .json({ error: "Failed to pull live metrics from Spotify API." });
  }
});

module.exports = router;
