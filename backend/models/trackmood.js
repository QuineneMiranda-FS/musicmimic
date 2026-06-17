const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("TrackMood", {
    spotifyTrackId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    // Fallback for legacy ..debating necessity
    valence: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    energy: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    emoji: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    moodLabel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
};
