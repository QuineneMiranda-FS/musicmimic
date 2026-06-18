import { ref, computed, onMounted } from "vue";
import axios from "axios";

const activeRingTab = ref("daily");
const clickedMoodsHistory = ref([]);
const isSpyingStopped = ref(false);
const isSpyingStoppedOnce = ref(false);

const dynamicCategories = ref([]);
const activeLegendMoodsState = ref([]);
const permanentCustomMoods = ref([]);

export function useMoodLogic() {
  const moodMatrixConfig = {
    energetic: { label: "Energetic", emoticon: "⚡" },
    upbeat: { label: "Upbeat", emoticon: "🕺" },
    funky: { label: "Funky", emoticon: "🍄" },
    happy: { label: "Happy", emoticon: "☀️" },
    igniting: { label: "Igniting", emoticon: "🧨" },
    uplifting: { label: "Uplifting", emoticon: "🙌" },
    heroic: { label: "Heroic", emoticon: "🏆" },
    euphoric: { label: "Euphoric", emoticon: "🤪" },
    chill: { label: "Chill", emoticon: "🌊" },
    grounded: { label: "Grounded", emoticon: "🪵" },
    nostalgic: { label: "Nostalgic", emoticon: "📼" },
    disoriented: { label: "Disoriented", emoticon: "😕" },
    conscious: { label: "Conscious", emoticon: "🧐" },
    hypnotic: { label: "Hypnotic", emoticon: "🌀" },
    reflective: { label: "Reflective", emoticon: "🪞" },
    melancholic: { label: "Melancholic", emoticon: "🌧️" },
    sad: { label: "Sad", emoticon: "😥" },
    harrowing: { label: "Harrowing", emoticon: "😱" },
    tormented: { label: "Tormented", emoticon: "😩" },
    pleading: { label: "Pleading", emoticon: "🥺" },
    nervous: { label: "Nervous", emoticon: "😬" },
    angry: { label: "Angry", emoticon: "😡" },
    fiery: { label: "Fiery", emoticon: "🔥" },
    empowered: { label: "Empowered", emoticon: "💪" },
    agitated: { label: "Agitated", emoticon: "😤" },
    furious: { label: "Furious", emoticon: "🤬" },
    reckless: { label: "Reckless", emoticon: "😈" },
    rebellious: { label: "Rebellious", emoticon: "🏴‍☠️" },
    vindictive: { label: "Vindictive", emoticon: "😼" },
    apocalyptic: { label: "Apocalyptic", emoticon: "🧟" },
    romantic: { label: "Romantic", emoticon: "💖" },
    objectifying: { label: "Objectifying", emoticon: "🔍" },
    lonely: { label: "Lonely", emoticon: "😔" },
    infatuated: { label: "Infatuated", emoticon: "🥰" },
    obsessive: { label: "Obsessive", emoticon: "😍" },
    flirtatious: { label: "Flirtatious", emoticon: "😉" },
    passionate: { label: "Passionate", emoticon: "💋" },
    mysterious: { label: "Mysterious", emoticon: "🔮" },
    ethereal: { label: "Ethereal", emoticon: "✨" },
    whimsical: { label: "Whimsical", emoticon: "🧚" },
    wistful: { label: "Wistful", emoticon: "🧞" },
    cosmic: { label: "Cosmic", emoticon: "🌌" },
    celestial: { label: "Celestial", emoticon: "🪐" },
    mystical: { label: "Mystical", emoticon: "👁️" },
    restrictive: { label: "Restrictive", emoticon: "🔒" },
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem("app_jwt");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Get fm DB
  onMounted(async () => {
    try {
      const response = await axios.get("/api/users/profile/mood-settings", {
        headers: getAuthHeader(),
      });
      const data = response.data;

      isSpyingStopped.value = data.privacyShield ?? false;
      isSpyingStoppedOnce.value = data.privacyShieldOnce ?? false;
      permanentCustomMoods.value = data.permanentCustomMoods || [];
      dynamicCategories.value = data.customCategories || [];
      activeLegendMoodsState.value = data.activeLegendMoodsState || [];

      // Fallback defaults
      if (!dynamicCategories.value.length) {
        dynamicCategories.value = [
          {
            id: "cat-hype",
            name: "✨ Hype & High Energy",
            targets: ["energetic", "upbeat", "flashy", "funky", "Rambunctious"],
          },
          {
            id: "cat-happy",
            name: "☀️ Happy & Positivity",
            targets: [
              "happy",
              "joyful",
              "vibrant",
              "igniting",
              "boastful",
              "uplifting",
              "heroic",
              "euphoric",
              "hopeful",
            ],
          },
          {
            id: "cat-chill",
            name: "🌊 Chill & Relaxation",
            targets: [
              "chill",
              "relaxed",
              "grounded",
              "nostalgic",
              "vintage",
              "retro",
            ],
          },
          {
            id: "cat-mind",
            name: "🧠 Mind & Cerebral",
            targets: [
              "pensive",
              "hindsight",
              "restrictive",
              "disoriented",
              "conscious",
              "hypnotic",
              "reflective",
              "contemplative",
            ],
          },
          {
            id: "cat-melancholy",
            name: "🌧️ Melancholy & Deep",
            targets: [
              "melancholic",
              "sad",
              "inadequate",
              "remorseful",
              "tormented",
              "lamenting",
              "harrowing",
              "nervous",
              "pleading",
              "disheartening",
            ],
          },
          {
            id: "cat-aggressive",
            name: "🔥 Aggressive & Fierce",
            targets: [
              "angry",
              "aggressive",
              "reckoning",
              "rebellious",
              "sarcastic",
              "reckless",
              "empowered",
              "rebellious",
              "vindictive",
              "apocalyptic",
              "agitated",
              "fiery",
              "furious",
            ],
          },
          {
            id: "cat-mystical",
            name: "🔮 Mystical & Cosmic",
            targets: [
              "mysterious",
              "ethereal",
              "whimsy",
              "cosmic",
              "celestial",
              "mystical",
              "wistful",
            ],
          },
          {
            id: "cat-relation",
            name: "💖 Romance & Relationships",
            targets: [
              "romantic",
              "obsessive",
              "hurtful",
              "longing",
              "sweet",
              "lonely",
              "infatuated",
              "flirtatious",
              "passionate",
              "bittersweet",
              "objectifying",
              "avaracious",
            ],
          },
        ];
      }

      if (!activeLegendMoodsState.value.length) {
        activeLegendMoodsState.value = Object.entries(moodMatrixConfig).map(
          ([id, cfg]) => ({
            id,
            name: cfg.label,
            emoticon: cfg.emoticon,
            categoryId: null,
          }),
        );
      }
    } catch (e) {
      console.error("Failed to recover user mood preferences from backend.", e);
    }
  });

  // Helper Update DB
  const syncSettingsToBackend = async () => {
    try {
      await axios.put(
        "/api/users/profile/mood-settings",
        {
          privacyShield: isSpyingStopped.value,
          privacyShieldOnce: isSpyingStoppedOnce.value,
          permanentCustomMoods: permanentCustomMoods.value,
          customCategories: dynamicCategories.value,
          activeLegendMoodsState: activeLegendMoodsState.value,
        },
        {
          headers: getAuthHeader(),
        },
      );
    } catch (err) {
      console.error(
        "Failed to commit updated mood parameters to backend:",
        err,
      );
    }
  };

  // CRUD
  const addNewCategory = async (name) => {
    const newCat = {
      id: `cat-${Date.now()}`,
      name: name || "New Vibe Cluster",
      targets: [],
    };
    dynamicCategories.value.push(newCat);
    await syncSettingsToBackend();
  };

  const updateCategoryDetails = async (categoryId, updatedName) => {
    const category = dynamicCategories.value.find(
      (cat) => cat && cat.id === categoryId,
    );
    if (category && updatedName) {
      category.name = updatedName;
      await syncSettingsToBackend();
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!categoryId) return;
    dynamicCategories.value = dynamicCategories.value.filter(
      (cat) => cat && cat.id !== categoryId,
    );
    activeLegendMoodsState.value.forEach((moodItem) => {
      if (moodItem && moodItem.categoryId === categoryId) {
        moodItem.categoryId = null;
      }
    });
    await syncSettingsToBackend();
  };

  const moveMoodToCategory = async (moodId, targetCategoryId) => {
    if (!moodId) return;
    const lowerId = moodId.toLowerCase().trim();
    let mood = activeLegendMoodsState.value.find((m) => m && m.id === lowerId);

    if (mood) {
      mood.categoryId =
        targetCategoryId === "cat-misc" ? null : targetCategoryId;
    } else {
      const aiMatch = permanentCustomMoods.value?.find(
        (m) => m && m.id === lowerId,
      );
      activeLegendMoodsState.value.push({
        id: lowerId,
        name: aiMatch ? aiMatch.name : moodId,
        emoticon: aiMatch ? aiMatch.emoticon : "🎵",
        categoryId: targetCategoryId === "cat-misc" ? null : targetCategoryId,
      });
    }
    await syncSettingsToBackend();
  };

  const updateMoodDetails = async (moodId, updatedName, updatedEmoticon) => {
    if (!moodId) return;
    const lowerId = moodId.toLowerCase().trim();
    const mood = activeLegendMoodsState.value.find(
      (m) => m && m.id === lowerId,
    );

    if (mood) {
      if (updatedName) mood.name = updatedName;
      if (updatedEmoticon) mood.emoticon = updatedEmoticon;
    } else {
      activeLegendMoodsState.value.push({
        id: lowerId,
        name: updatedName || moodId,
        emoticon: updatedEmoticon || "🎵",
        categoryId: null,
      });
    }

    if (permanentCustomMoods.value) {
      const aiMatch = permanentCustomMoods.value.find(
        (m) => m && m.id === lowerId,
      );
      if (aiMatch) {
        if (updatedName) aiMatch.name = updatedName;
        if (updatedEmoticon) aiMatch.emoticon = updatedEmoticon;
      }
    }
    await syncSettingsToBackend();
  };

  const deleteMoodFromState = async (moodId) => {
    if (!moodId) return;
    const lowerId = moodId.toLowerCase().trim();

    activeLegendMoodsState.value = activeLegendMoodsState.value.filter(
      (m) => m && m.id !== lowerId,
    );
    if (permanentCustomMoods.value) {
      permanentCustomMoods.value = permanentCustomMoods.value.filter(
        (m) => m && m.id !== lowerId,
      );
    }
    await syncSettingsToBackend();
  };

  // Mood Prediction via Counts
  const getAggregateMood = (sourceArray) => {
    if (!sourceArray || !sourceArray.length) return null;
    const counts = {};
    sourceArray.forEach((item) => {
      if (item.mood) {
        const normalizedMood = item.mood.trim().toLowerCase();
        counts[normalizedMood] = (counts[normalizedMood] || 0) + 1;
      }
    });
    const topMoodKey = Object.keys(counts).reduce(
      (a, b) => (counts[a] > counts[b] ? a : b),
      "",
    );
    if (!topMoodKey) return null;

    const moodConfig =
      activeLegendMoodsState.value.find((m) => m && m.id === topMoodKey) ||
      moodMatrixConfig[topMoodKey];
    return {
      id: topMoodKey,
      label: moodConfig ? moodConfig.name || moodConfig.label : "Alternative",
      emoticon: moodConfig ? moodConfig.emoticon : "🎵",
    };
  };

  const dominantMood = computed(() => {
    const history = clickedMoodsHistory.value || [];
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return getAggregateMood(
      history.filter(
        (item) =>
          item &&
          item.isDailyEligible !== false &&
          item.isDailyEligible !== 0 &&
          (!item.timestamp || Number(item.timestamp) >= oneDayAgo),
      ),
    );
  });

  const weeklyMood = computed(() => {
    const history = clickedMoodsHistory.value || [];
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return getAggregateMood(
      history.filter(
        (item) =>
          item &&
          item.isWeeklyEligible !== false &&
          item.isWeeklyEligible !== 0 &&
          (!item.timestamp || Number(item.timestamp) >= oneWeekAgo),
      ),
    );
  });

  const monthlyMood = computed(() => {
    const history = clickedMoodsHistory.value || [];
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return getAggregateMood(
      history.filter(
        (item) =>
          item &&
          item.isMonthlyEligible !== false &&
          item.isMonthlyEligible !== 0 &&
          (!item.timestamp || Number(item.timestamp) >= oneMonthAgo),
      ),
    );
  });

  const currentSelectedMood = computed(() => {
    if (activeRingTab.value === "weekly") return weeklyMood.value;
    if (activeRingTab.value === "monthly") return monthlyMood.value;
    return dominantMood.value;
  });

  // Privacy controls
  const purgeClickHistory = async () => {
    isSpyingStopped.value = true;
    isSpyingStoppedOnce.value = true;

    // Clear
    clickedMoodsHistory.value = (clickedMoodsHistory.value || []).map(
      (item) => ({
        ...item,
        isDailyEligible: false,
      }),
    );

    // Delete/Update DB
    try {
      await axios.post(
        "/api/history/purge-privacy",
        {},
        { headers: getAuthHeader() },
      );
      await syncSettingsToBackend();
    } catch (e) {
      console.error("Failed to complete privacy purge on server:", e);
    }
  };

  const restoreMoodRingFeature = async () => {
    isSpyingStopped.value = false;
    await syncSettingsToBackend();
  };

  const moodOppositesMap = {
    // --- Energy & Intensity ---
    chill: {
      label: "Energetic",
      query: "fast high-energy party electronic dance hyperpop upbeat",
    },
    energetic: {
      label: "Chill",
      query: "lofi relaxation calm ambient slow-tempo minimalist",
    },
    upbeat: {
      label: "Melancholic",
      query: "melancholic downtempo somber moody dark-pop sad",
    },
    melancholic: {
      label: "Upbeat",
      query: "upbeat dance pop disco joyful celebratory synthpop",
    },

    // --- Core Emotions ---
    happy: {
      label: "Sad",
      query: "sad melancholic cinematic slow weeping acoustic-ballad",
    },
    sad: {
      label: "Happy",
      query: "happy cheerful uplifting bright joyful feel-good pop",
    },
    igniting: {
      label: "Pleading",
      query: "pleading desperate vulnerable raw emotional slow ballad",
    },
    pleading: {
      label: "Igniting",
      query: "igniting anthem festival house mainstage crowd-pleaser hype",
    },
    uplifting: {
      label: "Harrowing",
      query: "harrowing creepy dread terrifying noise-rock experimental horror",
    },
    harrowing: {
      label: "Uplifting",
      query: "uplifting cinematic epic soaring inspiring triumphant",
    },
    euphoric: {
      label: "Tormented",
      query: "tormented angsty heavy metal dark depressive doom-metal grunge",
    },
    tormented: {
      label: "Euphoric",
      query: "euphoric trance progressive-house uplifting-dance bliss pop",
    },
    heroic: {
      label: "Lonely",
      query: "lonely isolated minimalist quiet slow acoustic indie-folk",
    },
    lonely: {
      label: "Heroic",
      query: "heroic orchestral epic cinematic brass triumphant powerful",
    },

    // --- Aggression & Rebellion vs. Peace & Control ---
    angry: {
      label: "Peaceful",
      query: "peaceful serene meditative gentle acoustic soft-piano",
    },
    fiery: {
      label: "Chill",
      query: "lofi chillout relaxed calm lazy-afternoon smooth-jazz",
    },
    furious: {
      label: "Chill",
      query: "ambient relaxation meditative peaceful healing-tones",
    },
    agitated: {
      label: "Grounded",
      query: "grounded deep-bass slow-groove lo-fi roots acoustic",
    },
    empowered: {
      label: "Nervous",
      query: "nervous twitchy anxious lo-fi experimental glitch jittery",
    },
    nervous: {
      label: "Empowered",
      query: "empowered confident bold stadium-rock hip-hop anthem brass",
    },
    reckless: {
      label: "Conscious",
      query:
        "conscious conscious-hip-hop lyrical jazzy neo-soul thought-provoking",
    },
    conscious: {
      label: "Reckless",
      query: "reckless punk-rock garage-rock trashy wild party house",
    },
    rebellious: {
      label: "Restrictive",
      query:
        "restrictive clinical dark-techno minimalist industrial metronomic",
    },
    restrictive: {
      label: "Rebellious",
      query: "rebellious punk grunge anti-establishment riot-grrrl anarchic",
    },
    vindictive: {
      label: "Romantic",
      query: "romantic love-song sensual passionate sweet intimate r&b",
    },

    // --- Vibe, Texture & State of Mind ---
    funky: {
      label: "Apocalyptic",
      query: "apocalyptic dark-ambient industrial drone wasteland doomsday",
    },
    apocalyptic: {
      label: "Funky",
      query: "funky groove bass-heavy disco retro slap-bass danceable",
    },
    disoriented: {
      label: "Grounded",
      query: "grounded roots folk blues standard classic-rock raw-acoustic",
    },
    grounded: {
      label: "Disoriented",
      query:
        "disoriented psychedelic acid-rock phaser glitch experimental trippy",
    },
    hypnotic: {
      label: "Funky",
      query: "funky upbeat dynamic unpredictable syncopated breaks",
    },
    reflective: {
      label: "Energetic",
      query: "fast high-energy party electronic dance hyperpop",
    },

    // --- Space, Fantasy & Mysticism ---
    mysterious: {
      label: "Clear & Direct",
      query: "pop straightforward acoustic singer-songwriter classic-rock",
    },
    ethereal: {
      label: "Grounded",
      query: "grounded roots folk blues standard classic-rock raw-acoustic",
    },
    whimsical: {
      label: "Apocalyptic",
      query: "apocalyptic heavy-industrial grim dark-techno noise",
    },
    wistful: {
      label: "Fiery",
      query: "fiery aggressive high-octane rock hard-hitting trap fast",
    },
    cosmic: {
      label: "Grounded",
      query:
        "grounded organic acoustic-folk country blues roots-rock earth-tones",
    },
    celestial: {
      label: "Grounded",
      query: "grounded organic raw-acoustic field-recordings dusty-blues",
    },
    mystical: {
      label: "Clear & Direct",
      query: "clean pop clear acoustic standard simple singer-songwriter",
    },

    // --- Social, Relational & Obsession ---
    romantic: {
      label: "Vindictive",
      query:
        "vindictive bitter resentful heartbreak angst aggressive-breakup dark",
    },
    objectifying: {
      label: "Infatuated",
      query: "infatuated sweet dreamy indie-pop cute bubbly love-song",
    },
    infatuated: {
      label: "Objectifying",
      query: "objectifying club hip-hop heavy-bass sleek dark-pop gritty-r&b",
    },
    obsessive: {
      label: "Chill",
      query: "chill relaxed laid-back carefree breezy instrumental-lofi",
    },
    flirtatious: {
      label: "Melancholic",
      query: "melancholic sad somber lonely downcast grey",
    },
    passionate: {
      label: "Chill",
      query: "ambient quiet-storm minimalist calm relaxed cold-ambient",
    },
    nostalgic: {
      label: "Apocalyptic",
      query: "apocalyptic futuristic cyberpunk industrial dystopia sci-fi",
    },
  };

  return {
    activeRingTab,
    clickedMoodsHistory,
    isSpyingStopped,
    isSpyingStoppedOnce,
    currentSelectedMood,
    dominantMood,
    weeklyMood,
    monthlyMood,
    dynamicCategories,
    activeLegendMoodsState,
    permanentCustomMoods,
    moodOppositesMap,
    addNewCategory,
    deleteCategory,
    updateCategoryDetails,
    moveMoodToCategory,
    updateMoodDetails,
    deleteMoodFromState,
    purgeClickHistory,
    restoreMoodRingFeature,
  };
}
