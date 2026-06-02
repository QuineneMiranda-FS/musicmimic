module.exports = (sequelize, DataTypes) => {
  return sequelize.define("User", {
    spotifyId: { type: DataTypes.STRING, unique: true, allowNull: false },
    email: { type: DataTypes.STRING, unique: true },
    displayName: { type: DataTypes.STRING },
  });
};
