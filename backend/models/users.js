module.exports = (sequelize, DataTypes) => {
  return sequelize.define("User", {
    email: {
      type: DataTypes.STRING(255),
      allowNull: true, // **Keep true: Spotify privacy settings can hide emails
      unique: "unique_user_email",
    },
    spotifyId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "unique_user_spotifyId",
    },
    displayName: {
      type: DataTypes.STRING,
    },
    spotifyAccessToken: {
      type: DataTypes.TEXT,
    },
    spotifyRefreshToken: {
      type: DataTypes.TEXT,
    },
    // Track when tokens expire
    spotifyTokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });
};
