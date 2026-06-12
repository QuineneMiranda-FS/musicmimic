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
  const userId = getUserIdFromReq(req);

  try {
    const dbUser = await User.findByPk(userId);
    let previewUrl = null;
    let albumImage = null;

    if (dbUser && dbUser.spotifyAccessToken) {
      try {
        const spotifyTrackRes = await axios.get(
          `https://api.spotify.com/v1/tracks/${spotifyId}`,
          {
            headers: { Authorization: `Bearer ${dbUser.spotifyAccessToken}` },
          },
        );

        previewUrl = spotifyTrackRes.data?.preview_url || null;
        if (spotifyTrackRes.data?.album?.images?.length > 0) {
          albumImage = spotifyTrackRes.data.album.images[0].url;
        }
      } catch (spotErr) {
        console.warn(
          "[Spotify] Could not fetch track metadata detail:",
          spotErr.message,
        );
      }
    }

    // Genius Lyrics Scraping
    console.log(`[Genius] getting lyrics for: ${title} - ${artist}`);
    const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(`${title} ${artist}`)}&access_token=${process.env.GENIUS_ACCESS_TOKEN}`;
    const geniusSearch = await axios.get(searchUrl);

    // Capture the primary hits from Genius
    const geniusHit = geniusSearch.data?.response?.hits?.[0]?.result;
    const lyricPath = geniusHit?.path;
    const geniusUrl = geniusHit?.url || null;

    let lyricsText = "No lyrics found on Genius for this track.";

    if (lyricPath) {
      const lyricPage = await axios.get(`https://genius.com${lyricPath}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      const $ = cheerio.load(lyricPage.data);

      // Scrap sidebar and blurbs
      $(".SongDescription__Content").remove();
      $(".HeaderBio__Description").remove();
      $('button[class*="ReadMore"]').remove();
      $('a[class*="ReadMore"]').remove();

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

      // Scrap Read More etc
      scrapedLyrics = scrapedLyrics.replace(/Read\s*More/gi, "");
      scrapedLyrics = scrapedLyrics.replace(/\n{3,}/g, "\n\n").trim();

      if (scrapedLyrics) {
        lyricsText = scrapedLyrics.substring(0, 1500);
      }
    }

    // AI Mood Analysis
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
            {
              role: "system",
              content: `You are an expert musical analysis engine. The output must be a valid RAW JSON object with keys 'mood' and 'emoticon'. Values must match from: [${moodListString}].`,
            },
            {
              role: "user",
              content: `Analyze: "${title}" by "${artist}". Lyrics: ${lyricsText}`,
            },
          ],
        });

        if (aiResponse) {
          let cleanContent = aiResponse.choices[0].message.content.trim();
          if (cleanContent.startsWith("```")) {
            cleanContent = cleanContent.replace(/^```json|```$/g, "").trim();
          }
          const parsed = JSON.parse(cleanContent);
          const match = validMoods.find(
            (m) => m.mood.toLowerCase() === parsed.mood?.trim().toLowerCase(),
          );

          if (match) {
            label = match.mood;
            emoji = match.emoticon;
            break;
          }
        }
      } catch (err) {
        console.warn(`[AI Parsing Error]:`, err.message);
      }
    }

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
      geniusUrl: geniusUrl,
      previewUrl: previewUrl,
      albumImage: albumImage,
    });
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: "Failed to process." });
  }
});

// AI-Generated Recs / Spotify Metadata for track data
router.get("/recommendations", async (req, res) => {
  const { mood, title, artist } = req.query;
  const userId = getUserIdFromReq(req);

  console.log(
    `[AI Recs] Compiling recommendation list for song "${title}" based on mood: ${mood}`,
  );

  try {
    const dbUser = await User.findByPk(userId);
    if (!dbUser || !dbUser.spotifyAccessToken) {
      return res
        .status(401)
        .json({ error: "Unauthorized. Missing Spotify token." });
    }

    const aiResponse = await openai.chat.completions.create({
      model: "llama3",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a music recommendation engine. Your task is to generate 9 real, well-known songs that perfectly match the requested mood vibe. 
          
          CRITICAL: You must return a RAW JSON object ONLY. 
          The JSON root must have a "tracks" key containing an array of 9 objects.
          Each object in the array must strictly have these fields:
          - "title": (The name of the recommended song)
          - "artist": (The artist name)
          
          Example structural shape:
          {
            "tracks": [
              { "title": "Song Name", "artist": "Artist Name" }
            ]
          }`,
        },
        {
          role: "user",
          content: `The user is listening to "${title}" by "${artist}", which has an analyzed mood of "${mood}". Suggest 9 alternative matching tracks.`,
        },
      ],
    });

    let cleanContent = aiResponse.choices[0].message.content.trim();
    if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/^```json|```$/g, "").trim();
    }

    const parsedData = JSON.parse(cleanContent);
    const aiTracks = parsedData.tracks || [];

    const mergedTracks = await Promise.all(
      aiTracks.map(async (track, index) => {
        try {
          const searchQuery = `${track.title} ${track.artist}`;
          const spotifySearchRes = await axios.get(
            "https://api.spotify.com/v1/search",
            {
              params: {
                q: searchQuery,
                type: "track",
                limit: 1,
              },
              headers: { Authorization: `Bearer ${dbUser.spotifyAccessToken}` },
            },
          );

          const spotifyTrack = spotifySearchRes.data?.tracks?.items?.[0];

          if (spotifyTrack) {
            let albumImage = "fallback.jpg";
            if (spotifyTrack.album?.images?.length > 0) {
              albumImage = spotifyTrack.album.images[0].url;
            }

            return {
              spotifyId: spotifyTrack.id,
              title: spotifyTrack.name,
              artist: spotifyTrack.artists
                ? spotifyTrack.artists.map((a) => a.name).join(", ")
                : track.artist,
              image: albumImage,
              previewUrl: spotifyTrack.preview_url || null,
            };
          }
        } catch (spotErr) {
          console.warn(
            `[Spotify Merge Failed] For track "${track.title}":`,
            spotErr.message,
          );
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
