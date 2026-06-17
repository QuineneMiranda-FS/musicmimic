module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
    spotifyTokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    moodSettings: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  });

  User.associate = (models) => {
    User.hasMany(models.History, { foreignKey: "userId", onDelete: "CASCADE" });
  };

  return User;
};
