const express = require("express");
const router = express.Router();
const axios = require("axios");
const cheerio = require("cheerio");
const { OpenAI } = require("openai");
const { User } = require("../models");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: "ollama", // **Note Ollama expects a non empty string
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
    console.log(`[Genius] getting lyrics for: ${title} - ${artist}`);

    const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(`${title} ${artist}`)}&access_token=${process.env.GENIUS_ACCESS_TOKEN}`;
    const geniusSearch = await axios.get(searchUrl);

    const lyricPath = geniusSearch.data?.response?.hits?.[0]?.result?.path;
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

      // Scrapes text where class starts w/ "Lyrics__Container" or uses data attribute
      $('[class^="Lyrics__Container"], [data-lyrics-container="true"]').each(
        (i, el) => {
          let htmlContent = $(el).html();
          // Convert line break & closing tags into new line
          if (htmlContent) {
            htmlContent = htmlContent.replace(/<br\s*\/?>/gi, "\n");
            htmlContent = htmlContent.replace(/<\/p>|<\/div>/gi, "\n");
            // Strip out remaining HTML tags so have text only lyrics
            const cleanText = cheerio.load(htmlContent).text();
            scrapedLyrics += cleanText + "\n";
          }
        },
      );

      // Fix: For Legacy classes if new class doesn't work
      if (!scrapedLyrics.trim()) {
        $(".lyrics").each((i, el) => {
          let htmlContent = $(el).html() || "";
          htmlContent = htmlContent.replace(/<br\s*\/?>/gi, "\n");
          scrapedLyrics += cheerio.load(htmlContent).text() + "\n";
        });
      }

      // Clean headers & footers metadata, contributors, embed etc
      scrapedLyrics = scrapedLyrics.replace(
        /^\d+\s+Contributors?[\s\S]*?(?=Lyrics)/gi,
        "",
      );
      // Deletes dup title
      scrapedLyrics = scrapedLyrics.replace(/^.*?\bLyrics\b\s*/i, "");
      // Removes widget text & trailing code/embeds at bottom
      scrapedLyrics = scrapedLyrics.replace(/You might also like[\s\S]*/gi, "");
      // Normalize Spacing
      scrapedLyrics = scrapedLyrics.replace(/\n{3,}/g, "\n\n").trim();
      // Final Text Limit ?? Adjust TBD
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
          let cleanContent = aiResponse.choices.message.content.trim();
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
    //MAKE MORE CUZ AI DOESN'T HAVE FEELINGS
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
    res.status(500).json({ error: "Failed to process." });
  }
});

// Spotify recs
router.get("/recommendations", async (req, res) => {
  const { mood } = req.query;
  const userId = getUserIdFromReq(req);

  try {
    const dbUser = await User.findByPk(userId);
    if (!dbUser || !dbUser.spotifyAccessToken) {
      return res
        .status(401)
        .json({ error: "Unauthorized. Missing Spotify token." });
    }
    //MORE HERE TOO
    // Genres & Descriptions of moods
    let trackSearchQuery = "genre:pop chill";
    if (mood === "Melancholic") {
      trackSearchQuery = "genre:ambient sad";
    } else if (mood === "Energetic") {
      trackSearchQuery = "genre:edm upbeat";
    } else if (mood === "Chill") {
      trackSearchQuery = "genre:lofi chill";
    } else if (mood === "Angry") {
      trackSearchQuery = "genre:rock aggressive";
    } else if (mood === "Romantic") {
      trackSearchQuery = "genre:r-n-b love";
    }

    console.log(
      `[Spotify] Querying catalog tracks matching mood: ${mood} using tag: ${trackSearchQuery}`,
    );

    const spotifySearchRes = await axios.get(
      "[https://api.spotify.com/v1/search](https://api.spotify.com/v1/search)",
      {
        params: {
          q: trackSearchQuery,
          type: "track",
          limit: 20,
        },
        headers: {
          Authorization: `Bearer ${dbUser.spotifyAccessToken}`,
        },
      },
    );

    const rawTracks = spotifySearchRes.data?.tracks?.items || [];

    // Filter objects
    const mappedTracks = rawTracks
      .filter((track) => track && track.id)
      .map((track) => {
        let albumImage = "fallback.jpg";
        if (
          track.album &&
          track.album.images &&
          track.album.images.length > 0
        ) {
          albumImage = track.album.images[0].url;
        }

        return {
          spotifyId: track.id,
          title: track.name,
          artist: track.artists
            ? track.artists.map((a) => a.name).join(", ")
            : "Unknown Artist",
          image: albumImage,
          previewUrl: track.preview_url,
        };
      });

    // Shuffle
    const randomizedTracks = mappedTracks
      .sort(() => 0.5 - Math.random())
      .slice(0, 9);

    return res.json(randomizedTracks);
  } catch (error) {
    console.error(
      "Spotify Mood Track Search Error:",
      error.response?.data || error.message,
    );
    return res
      .status(500)
      .json({ error: "Failed to pull live metrics from Spotify API." });
  }
});

module.exports = router;
