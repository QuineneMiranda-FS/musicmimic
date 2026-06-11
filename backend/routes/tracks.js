const express = require("express");
const router = express.Router();
const axios = require("axios");
const cheerio = require("cheerio");
const { OpenAI } = require("openai");
const { User } = require("../models");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: "ollama",
  baseURL: "http://localhost:11434/v1",
});

const getUserIdFromReq = (req) => {
  return req.user?.userId || 1;
};

// Fetch & Analyze
router.post("/analyze", async (req, res) => {
  const { spotifyId, title, artist } = req.body;

  try {
    // Grr...Spotify blocks audio endpoint with a 403 for development apps now...

    // Genius Lyrics Scraping
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

      $('[class^="Lyrics__Container"], [data-lyrics-container="true"]').each(
        (i, el) => {
          let htmlContent = $(el).html();
          if (htmlContent) {
            htmlContent = htmlContent.replace(/<br\s*\/?>/gi, "\n");
            htmlContent = htmlContent.replace(/<\/p>|<\/div>/gi, "\n");
            const cleanText = cheerio.load(htmlContent).text();
            scrapedLyrics += cleanText + "\n";
          }
        },
      );

      if (!scrapedLyrics.trim()) {
        $(".lyrics").each((i, el) => {
          let htmlContent = $(el).html() || "";
          htmlContent = htmlContent.replace(/<br\s*\/?>/gi, "\n");
          scrapedLyrics += cheerio.load(htmlContent).text() + "\n";
        });
      }

      scrapedLyrics = scrapedLyrics.replace(
        /^\d+\s+Contributors?[\s\S]*?(?=Lyrics)/gi,
        "",
      );
      scrapedLyrics = scrapedLyrics.replace(/^.*?\bLyrics\b\s*/i, "");
      scrapedLyrics = scrapedLyrics.replace(/You might also like[\s\S]*/gi, "");
      scrapedLyrics = scrapedLyrics.replace(/\n{3,}/g, "\n\n").trim();

      if (scrapedLyrics) {
        lyricsText = scrapedLyrics.substring(0, 1500);
      }
    }

    // Workaround endpoint - AI for valence/energy analyzing
    const freeModels = ["llama3"];
    let label = null;
    let emoji = null;

    const validMoods = [
      { mood: "Energetic", emoticon: "⚡" },
      { mood: "Happy", emoticon: "☀️" },
      { mood: "Chill", emoticon: "🌊" },
      { mood: "Melancholic", emoticon: "🌧" },
      { mood: "Angry", emoticon: "🔥" },
      { mood: "Romantic", emoticon: "💖" },
      { mood: "Mysterious", emoticon: "🔮" },
      { mood: "Ethereal", emoticon: "✨" },
    ];

    const moodListString = validMoods
      .map((m) => `${m.mood}/${m.emoticon}`)
      .join(", ");

    for (const modelAttempt of freeModels) {
      let aiResponse = null;

      try {
        aiResponse = await openai.chat.completions.create({
          model: modelAttempt,
          response_format: { type: "json_object" },
          messages: [
            //heh asking AI how to ask AI properly so get better mood analyzing
            {
              role: "system",
              content: `You are an expert musical analysis engine. Your job is to read a song's metadata and lyrics and assign it a category.
              
              CRITICAL: You must return a RAW JSON object ONLY. Do not include any introductory or concluding text, markdown formatting, or explanations.
              
              The output must be a valid JSON object with keys 'mood' and 'emoticon'.
              Values must strictly match one exact pair from this list: [${moodListString}].
              
              Evaluation Guidelines:
              - High intensity, aggressive cadence, heavy genres -> Angry / Energetic
              - Bright themes, major keys, celebratory/joyous wording -> Happy
              - Laid-back rhythm, acoustic, ambient, soothing lyrics -> Chill
              - Somber, slow ballad, heartbreak, grief, loss themes -> Melancholic
              - Affectionate, love themes, sensual or deeply romantic text -> Romantic
              - Goth, dark textures, minor-key suspense, obscure lyrics -> Mysterious
              - Atmospheric, dream-pop soundscapes, abstract/spacey lyrics -> Ethereal`,
            },
            {
              role: "user",
              content: `Analyze this track context:
              Title: "${title}"
              Artist: "${artist}"
              
              Lyrics Context: 
              ${lyricsText}`,
            },
          ],
        });

        if (aiResponse) {
          let cleanContent = aiResponse.choices[0].message.content.trim();

          // Strip markdown
          if (cleanContent.startsWith("```")) {
            cleanContent = cleanContent.replace(/^```json|```$/g, "").trim();
          }

          // JSON Extraction
          const firstBrace = cleanContent.indexOf("{");
          const lastBrace = cleanContent.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace !== -1) {
            cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
          }

          const parsed = JSON.parse(cleanContent);

          const match = validMoods.find(
            (m) => m.mood.toLowerCase() === parsed.mood?.trim().toLowerCase(),
          );

          if (match) {
            label = match.mood;
            emoji = match.emoticon;

            console.log(
              `[AI SUCCESS] ${modelAttempt} determined mood for "${title}": ${label} ${emoji}`,
            );
            break;
          } else {
            console.warn(
              `[AI BAD DATA] Model returned unmapped mood: "${parsed.mood}"`,
            );
          }
        }
      } catch (err) {
        console.warn(`[AI Parsing Error]:`, err.message);
        console.warn(
          `[AI Raw Output Was]:`,
          aiResponse?.choices?.[0]?.message?.content ||
            "No response content gathered.",
        );
      }
    }

    // Fallback for another possible failure
    if (!label || !emoji) {
      const index = title.length % validMoods.length;
      label = validMoods[index].mood;
      emoji = validMoods[index].emoticon;

      console.log(
        `[AI FALLBACK] Used local matrix fallback for "${title}": ${label} ${emoji}`,
      );
    }

    // Fall fall fall fallback
    if (!label || !emoji) {
      const index = title.length % validMoods.length;
      label = validMoods[index].mood;
      emoji = validMoods[index].emoticon;
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

// Spotify Recs
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

    // Expanded Mood Categories
    let trackSearchQuery = "genre:pop chill";
    const normalMood = mood?.trim().toLowerCase();

    if (normalMood === "melancholic") {
      trackSearchQuery = "genre:ambient sad";
    } else if (normalMood === "energetic") {
      trackSearchQuery = "genre:edm upbeat"; //electronic dance music
    } else if (normalMood === "happy") {
      trackSearchQuery = "genre:pop cheerful";
    } else if (normalMood === "chill") {
      trackSearchQuery = "genre:lofi chill"; //low fidelity
    } else if (normalMood === "angry") {
      trackSearchQuery = "genre:rock aggressive";
    } else if (normalMood === "romantic") {
      trackSearchQuery = "genre:r-n-b love";
    } else if (normalMood === "mysterious") {
      trackSearchQuery = "genre:goth dark";
    } else if (normalMood === "ethereal") {
      trackSearchQuery = "genre:shoegaze dream-pop"; //indie alt rock
    }

    console.log(
      `[Spotify] Recommendations via: ${trackSearchQuery} for mood: ${mood}`,
    );

    const spotifySearchRes = await axios.get(
      "[https://api.spotify.com/v1/search](https://api.spotify.com/v1/search)",
      {
        params: {
          q: trackSearchQuery,
          type: "track",
          limit: 20,
        },
        headers: { Authorization: `Bearer ${dbUser.spotifyAccessToken}` },
      },
    );

    const rawTracks = spotifySearchRes.data?.tracks?.items || [];
    const mappedTracks = rawTracks
      .filter((track) => track && track.id)
      .map((track) => {
        let albumImage = "fallback.jpg";
        if (track.album?.images?.length > 0) {
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
