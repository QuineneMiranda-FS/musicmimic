module.exports = (sequelize, DataTypes) => {
  return sequelize.define("User", {
    email: {
      type: DataTypes.STRING(255),
      allowNull: true, // maybe false
      unique: "unique_user_email",
    },
    spotifyId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "unique_user_spotifyId",
    },
    displayName: { type: DataTypes.STRING },
    spotifyAccessToken: {
      type: DataTypes.TEXT,
    },
  });
};
