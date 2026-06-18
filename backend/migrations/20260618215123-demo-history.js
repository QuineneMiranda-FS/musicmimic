"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Query DB for user so attach seed of history to actual auth
    const users = await queryInterface.sequelize.query(
      `SELECT id FROM Users ORDER BY createdAt DESC LIMIT 1;`,
      { type: Sequelize.QueryTypes.SELECT },
    );

    if (!users || users.length === 0) {
      throw new Error(
        "❌ No user found in the database. Please log into the application via Spotify first so your user account is created, then run the seeder.",
      );
    }

    const targetUserId = users[0].id;

    // Mock Tracks
    const mockTracks = [
      {
        title: "Blinding Lights",
        artist: "The Weeknd",
        mood: "Energetic",
        emoticon: "⚡",
      },
      {
        title: "Bad Habits",
        artist: "Ed Sheeran",
        mood: "Upbeat",
        emoticon: "🕺",
      },
      {
        title: "Stay",
        artist: "The Kid LAROI & Justin Bieber",
        mood: "Anxious",
        emoticon: "😰",
      },
      {
        title: "Good 4 U",
        artist: "Olivia Rodrigo",
        mood: "Angry",
        emoticon: "🤬",
      },
      {
        title: "Levitating",
        artist: "Dua Lipa",
        mood: "Happy",
        emoticon: "😊",
      },
      {
        title: "Melancholy Hill",
        artist: "Gorillaz",
        mood: "Melancholy",
        emoticon: "🌧️",
      },
      {
        title: "Weightless",
        artist: "Marconi Union",
        mood: "Chill",
        emoticon: "🧘",
      },
      { title: "Midnight City", artist: "M83", mood: "Dreamy", emoticon: "✨" },
    ];

    const historyRecords = [];
    const now = new Date();

    // 35 Day History
    for (let i = 0; i < 35; i++) {
      const dailySongsCount = Math.floor(Math.random() * 4) + 2; // 2 to 5 songs per day

      for (let j = 0; j < dailySongsCount; j++) {
        const randomTrack =
          mockTracks[Math.floor(Math.random() * mockTracks.length)];

        const timestamp = new Date(now);
        timestamp.setDate(now.getDate() - i);
        timestamp.setHours(
          Math.floor(Math.random() * 24),
          Math.floor(Math.random() * 60),
        );

        historyRecords.push({
          userId: targetUserId,
          spotifyId: `spotify_track_${Math.random().toString(36).substr(2, 9)}`,
          title: randomTrack.title,
          artist: randomTrack.artist,
          image: "https://picsum.photos/200",
          mood: randomTrack.mood,
          emoticon: randomTrack.emoticon,
          timestamp: timestamp,
          isDailyEligible: i === 0,
          isWeeklyEligible: i <= 7,
          isMonthlyEligible: i <= 30,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return queryInterface.bulkInsert("Histories", historyRecords, {});
  },

  async down(queryInterface, Sequelize) {
    // Clears history/Doesn't touch User Acct
    return queryInterface.bulkDelete("Histories", null, {});
  },
};
