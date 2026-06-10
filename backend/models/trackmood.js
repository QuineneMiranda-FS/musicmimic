const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("TrackMood", {
    spotifyTrackId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    //Musical Positiveness: High=cheerful, euphoric; Low= sad, depressed, angry
    valence: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    //Intensity: Fast/loud/noisy=high energy; Quiet=low energy
    energy: {
      type: DataTypes.FLOAT,
      allowNull: false,
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
