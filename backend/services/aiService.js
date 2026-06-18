"use strict";

const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: "ollama",
  baseURL: "http://localhost:11434/v1",
});

// Fallback Custom Mood = Misc
const MISC_GROUP = "Miscellaneous Vibes";

const defaultMoodMatrix = [
  { mood: "Energetic", emoticon: "🕺" },
  { mood: "Upbeat", emoticon: "⚡" },
  { mood: "Funky", emoticon: "🍄" },
  { mood: "Happy", emoticon: "☀️" },
  { mood: "Igniting", emoticon: "🙌" },
  { mood: "Uplifting", emoticon: "🌊" },
  { mood: "Heroic", emoticon: "🏆" },
  { mood: "Euphoric", emoticon: "🤪" },
  { mood: "Chill", emoticon: "🌊" },
  { mood: "Grounded", emoticon: "🪵" },
  { mood: "Nostalgic", emoticon: "📼" },
  { mood: "Disoriented", emoticon: "😕" },
  { mood: "Conscious", emoticon: "🧐" },
  { mood: "Hypnotic", emoticon: "🌀" },
  { mood: "Reflective", emoticon: "🪞" },
  { mood: "Melancholic", emoticon: "🌧️" },
  { mood: "Sad", emoticon: "😥" },
  { mood: "Harrowing", emoticon: "😱" },
  { mood: "Tormented", emoticon: "😩" },
  { mood: "Pleading", emoticon: "🥺" },
  { mood: "Nervous", emoticon: "😬" },
  { mood: "Angry", emoticon: "😡" },
  { mood: "Fiery", emoticon: "🔥" },
  { mood: "Empowered", emoticon: "💪" },
  { mood: "Agitated", emoticon: "😤" },
  { mood: "Furious", emoticon: "🤬" },
  { mood: "Reckless", emoticon: "😈" },
  { mood: "Rebellious", emoticon: "🏴‍☠️" },
  { mood: "Vindictive", emoticon: "😼" },
  { mood: "Apocalyptic", emoticon: "🧟" },
  { mood: "Romantic", emoticon: "💖" },
  { mood: "Objectifying", emoticon: "🔍" },
  { mood: "Lonely", emoticon: "😔" },
  { mood: "Infatuated", emoticon: "🥰" },
  { mood: "Obsessive", emoticon: "😍" },
  { mood: "Flirtatious", emoticon: "😉" },
  { mood: "Passionate", emoticon: "💋" },
  { mood: "Mysterious", emoticon: "🔮" },
  { mood: "Ethereal", emoticon: "✨" },
  { mood: "Whimsical", emoticon: "🧚" },
  { mood: "Wistful", emoticon: "🧞" },
  { mood: "Cosmic", emoticon: "🌌" },
  { mood: "Celestial", emoticon: "🪐" },
  { mood: "Mystical", emoticon: "👁️" },
  { mood: "Restrictive", emoticon: "🔒" },
];

function parseAIJsonResponse(content) {
  let cleanContent = content.trim();
  if (cleanContent.startsWith("```")) {
    cleanContent = cleanContent.replace(/^```json|```$/g, "").trim();
  }
  return JSON.parse(cleanContent);
}

// Helper for uni strings
function cleanEmojiEncoding(emojiStr) {
  if (!emojiStr) return "🎵";

  let clean = emojiStr.trim();

  // ** Matches U+1FXXX or \u1FXXX formats
  const unicodeRegex = /(?:U\+|\u|\\u)([0-9A-Fa-f]{4,6})/i;
  const match = clean.match(unicodeRegex);

  if (match && match[1]) {
    try {
      return String.fromCodePoint(parseInt(match[1], 16));
    } catch (e) {
      console.warn("[Unicode Conversion Error]:", e.message);
    }
  }

  return clean;
}

async function analyzeTrackMood(title, artist, lyricsText) {
  const baselineMoodNames = defaultMoodMatrix.map((m) => m.mood);
  const baselineOptions = defaultMoodMatrix
    .map((m) => `${m.mood} ${m.emoticon}`)
    .join(", ");

  console.log(
    `[Ollama] Analyzing lyric emotional tone and mood for: ${title} - ${artist}`,
  );

  try {
    const aiResponse = await openai.chat.completions.create({
      model: "llama3",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert music curator. Analyze the emotional depth, tone, and cultural context of this song using its title, artist, and lyrics.
          Our application uses a detailed matrix of baseline mood categories: [${baselineOptions}]. 
          
          CRITICAL SELECTION PROCESS:
          1. Check if the track's mood directly aligns with any existing category in our baseline matrix list: [${baselineMoodNames.join(", ")}]. If an existing mood fits well, select it as your "customMood" and use its exact baseline emoticon character.
          2. Only if the track has a highly specific nuance that is *completely missing* from the matrix list, you may invent a brand-new custom mood label. It must be exactly one capitalized word containing only letters, paired with a highly relevant, actual visual emoji symbol character. Do not output text like "U+1F600".
          3. For the "baselineLegendMood" field: 
             - If you reused an existing mood from step 1, "baselineLegendMood" MUST match that exact string.
             - If you created a brand-new mood in step 2, you MUST set "baselineLegendMood" to exactly "${MISC_GROUP}".
          
          Output a raw JSON object with exactly three keys:
          - "customMood": (The chosen mood name string; prioritize reusing one from the baseline list if it fits)
          - "emoticon": (The corresponding emoji character symbol)
          - "baselineLegendMood": (Must perfectly match one of the exact strings in the baseline list OR be "${MISC_GROUP}")`,
        },
        {
          role: "user",
          content: `Analyze this track:\nTitle: "${title}"\nArtist: "${artist}"\nLyrics: ${lyricsText}`,
        },
      ],
    });

    if (aiResponse?.choices?.[0]?.message?.content) {
      const parsed = parseAIJsonResponse(aiResponse.choices[0].message.content);

      if (parsed.customMood && parsed.emoticon && parsed.baselineLegendMood) {
        let cleanedLabel = parsed.customMood.replace(/[^a-zA-Z]/g, "").trim();
        cleanedLabel =
          cleanedLabel.charAt(0).toUpperCase() +
          cleanedLabel.slice(1).toLowerCase();

        const finalEmoji = cleanEmojiEncoding(parsed.emoticon);

        const responseGroup = parsed.baselineLegendMood.trim();
        const validatedBaseline =
          baselineMoodNames.includes(responseGroup) ||
          responseGroup === MISC_GROUP
            ? responseGroup
            : null;

        if (cleanedLabel && validatedBaseline) {
          console.log(
            `[Ollama] Successfully tagged mood [${cleanedLabel} ${finalEmoji}] -> Mapped to Legend Group: ${validatedBaseline}`,
          );
          return {
            label: cleanedLabel,
            emoji: finalEmoji,
            legendGroup: validatedBaseline,
          };
        }
      }
    }
  } catch (err) {
    console.warn("[AI Analysis Processing Error]:", err.message);
  }

  const fallbackIndex = title.length % defaultMoodMatrix.length;
  const fallbackObj = defaultMoodMatrix[fallbackIndex];
  console.log(
    `[Ollama] Processing issue or empty response. Defaulting fallback to: ${fallbackObj.mood}`,
  );

  return {
    label: fallbackObj.mood,
    emoji: fallbackObj.emoticon,
    legendGroup: fallbackObj.mood,
  };
}

async function generateRecommendations(title, artist, mood) {
  try {
    const aiResponse = await openai.chat.completions.create({
      model: "llama3",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a music recommendation engine. Your task is to generate 12 real, well-known songs that perfectly match the requested mood vibe. 
          
          CRITICAL: You must return a RAW JSON object ONLY. 
          The JSON root must have a "tracks" key containing an array of 12 objects.
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
          content: `The user is listening to "${title}" by "${artist}", which has an analyzed mood of "${mood}". Suggest 12 alternative matching tracks.`,
        },
      ],
    });

    const parsedData = parseAIJsonResponse(
      aiResponse.choices[0].message.content,
    );
    return parsedData.tracks || [];
  } catch (err) {
    console.warn("[AI Recommendations Error]:", err.message);
    return [];
  }
}

module.exports = { analyzeTrackMood, generateRecommendations };
