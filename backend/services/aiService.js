"use strict";

const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: "ollama",
  baseURL: "http://localhost:11434/v1",
});

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

function cleanEmojiEncoding(emojiStr) {
  if (!emojiStr) return "🎵";

  let clean = "";
  if (typeof emojiStr === "object") {
    const possibleValue = Object.values(emojiStr).find(
      (val) => typeof val === "string",
    );
    clean = possibleValue ? possibleValue.trim() : "🎵";
  } else {
    clean = String(emojiStr).trim();
  }

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

function findCloseDefaultMatch(label) {
  const lowerLabel = label.toLowerCase().trim();

  // Similar Match to Defaults
  const customSynonyms = {
    // Energy & Intensity
    energy: "Energetic",
    energized: "Energetic",
    hyper: "Energetic",
    upbeatness: "Upbeat",
    bouncy: "Upbeat",
    funk: "Funky",
    groovish: "Funky",
    groovy: "Funky",
    happiness: "Happy",
    cheerful: "Happy",
    joyful: "Happy",
    glad: "Happy",
    ignite: "Igniting",
    hype: "Igniting",
    exciting: "Igniting",
    pumped: "Igniting",
    uplift: "Uplifting",
    inspiring: "Uplifting",
    inspirational: "Uplifting",
    hero: "Heroic",
    epic: "Heroic",
    triumphant: "Heroic",
    cinematic: "Heroic",
    euphoria: "Euphoric",
    ecstatic: "Euphoric",
    blissful: "Euphoric",
    chilled: "Chill",
    calm: "Chill",
    relaxed: "Chill",
    mellow: "Chill",
    ground: "Grounded",
    earthy: "Grounded",
    rooted: "Grounded",
    raw: "Grounded",

    // Mind & Reflection
    nostalgia: "Nostalgic",
    retro: "Nostalgic",
    throwback: "Nostalgic",
    disorient: "Disoriented",
    confused: "Disoriented",
    dazed: "Disoriented",
    blurry: "Disoriented",
    "conscious-hip-hop": "Conscious",
    woke: "Conscious",
    aware: "Conscious",
    mindful: "Conscious",
    hypnotized: "Hypnotic",
    trance: "Hypnotic",
    mesmerizing: "Hypnotic",
    psychedelic: "Hypnotic",
    reflection: "Reflective",
    thoughtful: "Reflective",
    pensive: "Reflective",

    // Melancholy, Sadness & Fear
    melancholy: "Melancholic",
    melancholious: "Melancholic",
    somber: "Melancholic",
    sadness: "Sad",
    gloomy: "Sad",
    depressed: "Sad",
    weeping: "Sad",
    heartbroken: "Sad",
    harrow: "Harrowing",
    terrifying: "Harrowing",
    frightening: "Harrowing",
    creepy: "Harrowing",
    scary: "Harrowing",
    torment: "Tormented",
    agonized: "Tormented",
    tortured: "Tormented",
    anguished: "Tormented",
    plead: "Pleading",
    begging: "Pleading",
    desperate: "Pleading",
    vulnerable: "Pleading",
    anxious: "Nervous",
    anxiety: "Nervous",
    jittery: "Nervous",
    tense: "Nervous",

    // Anger & Rebellion
    anger: "Angry",
    mad: "Angry",
    enraged: "Angry",
    fire: "Fiery",
    intense: "Fiery",
    aggressive: "Fiery",
    explosive: "Fiery",
    empower: "Empowered",
    confident: "Empowered",
    strong: "Empowered",
    bold: "Empowered",
    agitation: "Agitated",
    frustrated: "Agitated",
    irritated: "Agitated",
    fury: "Furious",
    livid: "Furious",
    wrathful: "Furious",
    wreckless: "Reckless",
    wild: "Reckless",
    carefree: "Reckless",
    dangerous: "Reckless",
    rebel: "Rebellious",
    defiant: "Rebellious",
    anarchic: "Rebellious",
    revenge: "Vindictive",
    vengeful: "Vindictive",
    spiteful: "Vindictive",
    bitter: "Vindictive",
    apocalypse: "Apocalyptic",
    dystopian: "Apocalyptic",
    doomsday: "Apocalyptic",
    ruined: "Apocalyptic",

    // Social & Relational
    romance: "Romantic",
    loving: "Romantic",
    sweet: "Romantic",
    objectify: "Objectifying",
    sensual: "Objectifying",
    lustful: "Objectifying",
    erotic: "Objectifying",
    lone: "Lonely",
    isolated: "Lonely",
    solitary: "Lonely",
    infatuation: "Infatuated",
    smitten: "Infatuated",
    crushing: "Infatuated",
    obsession: "Obsessive",
    fixated: "Obsessive",
    addicted: "Obsessive",
    flirt: "Flirtatious",
    teasing: "Flirtatious",
    coquettish: "Flirtatious",
    passion: "Passionate",
    ardent: "Passionate",
    "intense-love": "Passionate",

    // Space, Magic & Control
    mystery: "Mysterious",
    eerie: "Mysterious",
    dark: "Mysterious",
    dreamy: "Ethereal",
    "celestial-dream": "Ethereal",
    airy: "Ethereal",
    atmospheric: "Ethereal",
    whimsy: "Whimsical",
    playful: "Whimsical",
    fairytale: "Whimsical",
    wistfulness: "Wistful",
    yearning: "Wistful",
    longing: "Wistful",
    cosmos: "Cosmic",
    spacey: "Cosmic",
    galactic: "Cosmic",
    celestia: "Celestial",
    heavenly: "Celestial",
    astral: "Celestial",
    mystic: "Mystical",
    magical: "Mystical",
    occult: "Mystical",
    spiritual: "Mystical",
    restrict: "Restrictive",
    confined: "Restrictive",
    trapped: "Restrictive",
    clinical: "Restrictive",
  };

  if (customSynonyms[lowerLabel]) {
    return defaultMoodMatrix.find((m) => m.mood === customSynonyms[lowerLabel]);
  }

  // Fallback
  for (const matrixObj of defaultMoodMatrix) {
    const lowerDefault = matrixObj.mood.toLowerCase();
    if (
      lowerDefault.startsWith(lowerLabel) ||
      lowerLabel.startsWith(lowerDefault)
    ) {
      return matrixObj;
    }
  }
  return null;
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
          content: `You are an expert music curator. Provide an accurate, highly descriptive assessment of this song's unique emotional mood using its title, artist, and lyrics.
          
          DIRECTIONS:
          1. Create an highly accurate, single-word capitalized custom mood label capturing the track's core vibe (e.g., "Haunting", "Gothic", "Sensual", "Rebellious"). Keep it to exactly one word containing only letters.
          2. Pair this mood with an actual, highly expressive unicode emoji character symbol. Do not output raw code strings like "U+1F600".
          3. For the "baselineLegendMood" field:
             - Look at our master matrix list: [${baselineMoodNames.join(", ")}].
             - Choose whichever category is the closest overall thematic umbrella anchor fit for your custom mood. If your mood matches perfectly, use that. If it is a completely distinct new vibe, map it to "${MISC_GROUP}".
          
          Output a raw JSON object with exactly three keys:
          - "customMood": (The hyper-accurate creative mood label string)
          - "emoticon": (The corresponding emoji character symbol)
          - "baselineLegendMood": (Must perfectly match an entry from the master list OR be "${MISC_GROUP}")`,
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

        let finalEmoji = cleanEmojiEncoding(parsed.emoticon);
        let responseGroup = parsed.baselineLegendMood.trim();

        // AI Mood = Defaults ?
        const smartMatch = findCloseDefaultMatch(cleanedLabel);
        if (smartMatch) {
          cleanedLabel = smartMatch.mood;
          finalEmoji = smartMatch.emoticon;
          responseGroup = smartMatch.mood;
        }

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
