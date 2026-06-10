"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "track_moods",
      {
        spotifyId: {
          type: Sequelize.STRING(50),
          primaryKey: true,
          allowNull: false,
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        artist: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        mood: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        emoticon: {
          type: Sequelize.STRING(10),
          allowNull: false,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal(
            "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
          ),
        },
      },
      {
        // table settings for emoticon
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("track_moods");
  },
};
