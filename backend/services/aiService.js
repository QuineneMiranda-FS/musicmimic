"use strict";

const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: "ollama",
  baseURL: "http://localhost:11434/v1",
});

const defaultMoodMatrix = [
  { mood: "Energetic", emoticon: "⚡" },
  { mood: "Angry", emoticon: "🔥" },
  { mood: "Happy", emoticon: "☀️" },
  { mood: "Upbeat", emoticon: "🕺" },
  { mood: "Chill", emoticon: "🌊" },
  { mood: "Melancholic", emoticon: "🌧️" },
  { mood: "Romantic", emoticon: "💖" },
  { mood: "Mysterious", emoticon: "🔮" },
  { mood: "Ethereal", emoticon: "✨" },
  { mood: "Grounded", emoticon: "🪵" },
];

function parseAIJsonResponse(content) {
  let cleanContent = content.trim();
  if (cleanContent.startsWith("```")) {
    cleanContent = cleanContent.replace(/^```json|```$/g, "").trim();
  }
  return JSON.parse(cleanContent);
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
      //Heh Ask AI how to ask AI
      messages: [
        {
          role: "system",
          content: `You are an expert music curator. Analyze the emotional depth, tone, and cultural context of this song using its title, artist, and lyrics.
          Our application uses a set of baseline legend categories: [${baselineOptions}]. 
          
          CRITICAL DIRECTIONS:
          1. Create a descriptive custom mood category representing the song's exact unique nuance (e.g., "Nostalgic", "Rebellious", "Spooky"). Keep this label to exactly one capitalized word containing only letters.
          2. Match your custom mood with a single highly relevant unicode emoji.
          3. Map this custom mood back to one of our core baseline legend categories: [${baselineMoodNames.join(", ")}]. Choose the baseline that is the closest emotional fit.
          
          Output a raw JSON object with exactly three keys:
          - "customMood": (The unique capitalized string name, letters only)
          - "emoticon": (The chosen emoji symbol)
          - "baselineLegendMood": (Must perfectly match one of the strings in the baseline legend list)`,
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

        const validatedBaseline = baselineMoodNames.includes(
          parsed.baselineLegendMood.trim(),
        )
          ? parsed.baselineLegendMood.trim()
          : null;

        if (cleanedLabel && validatedBaseline) {
          console.log(
            `[Ollama] Successfully tagged mood [${cleanedLabel} ${parsed.emoticon.trim()}] -> Mapped to: ${validatedBaseline}`,
          );
          return {
            label: cleanedLabel,
            emoji: parsed.emoticon.trim(),
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
