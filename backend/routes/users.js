"use strict";

const express = require("express");
const router = express.Router();
const { User, History } = require("../models");
const { Op } = require("sequelize");

// GET: Fetch User Cats/Moods/Privacy data
router.get("/profile/mood-settings", async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    // Default
    const settings = user.moodSettings || {};

    return res.json({
      privacyShield: settings.privacyShield ?? false,
      privacyShieldOnce: settings.privacyShieldOnce ?? false,
      permanentCustomMoods: settings.permanentCustomMoods || [],
      customCategories: settings.customCategories || [],
      activeLegendMoodsState: settings.activeLegendMoodsState || [],
    });
  } catch (error) {
    console.error("Error fetching mood settings:", error);
    next(error);
  }
});

// PUT: Sv User Changes
router.put("/profile/mood-settings", async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) return res.status(404).json({ error: "Profile not found." });

    user.moodSettings = {
      privacyShield: req.body.privacyShield,
      privacyShieldOnce: req.body.privacyShieldOnce,
      permanentCustomMoods: req.body.permanentCustomMoods || [],
      customCategories: req.body.customCategories || [],
      activeLegendMoodsState: req.body.activeLegendMoodsState || [],
    };

    user.changed("moodSettings", true);

    await user.save();
    return res.json({ success: true, moodSettings: user.moodSettings });
  } catch (error) {
    next(error);
  }
});

// GET: Fetch User History
router.get("/history", async (req, res, next) => {
  try {
    const historyItems = await History.findAll({
      where: { userId: req.user.userId },
      order: [["id", "DESC"]],
    });

    const formattedHistory = historyItems.map((item) => ({
      id: item.spotifyId,
      name: item.title,
      artist: item.artist,
      image: item.image,
      mood: item.mood,
      emoticon: item.emoticon,
      timestamp: item.timestamp
        ? new Date(item.timestamp).getTime()
        : Date.now(),
      isDailyEligible: item.isDailyEligible,
      isWeeklyEligible: item.isWeeklyEligible,
      isMonthlyEligible: item.isMonthlyEligible,
    }));

    return res.json(formattedHistory);
  } catch (error) {
    console.error("Error pulling song history log:", error);
    next(error);
  }
});

// POST: Add New
router.post("/history", async (req, res, next) => {
  try {
    const spotifyId = req.body.id || req.body.spotifyId;
    const title = req.body.name || req.body.title;
    const artist = req.body.artist;
    const image = req.body.image || req.body.albumImage;
    const mood = req.body.mood;
    const emoticon = req.body.emoticon || req.body.emoji;

    if (!spotifyId || !title || !artist) {
      return res
        .status(400)
        .json({ error: "Missing identity tags for tracking logs." });
    }

    const newHistoryEntry = await History.create({
      userId: req.user.userId,
      spotifyId,
      title,
      artist,
      image: image || "fallback.jpg",
      mood: mood || null,
      emoticon: emoticon || "🎵",
      timestamp: new Date(),
      isDailyEligible: true,
      isWeeklyEligible: true,
      isMonthlyEligible: true,
    });

    return res.status(201).json({
      success: true,
      track: {
        id: spotifyId,
        name: title,
        artist,
        image,
        mood,
        emoticon,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE: Delete Single Track in History
router.delete("/history/:trackId", async (req, res, next) => {
  try {
    const { trackId } = req.params;

    const rowsDeleted = await History.destroy({
      where: {
        userId: req.user.userId,
        spotifyId: trackId,
      },
    });

    if (!rowsDeleted) {
      return res
        .status(404)
        .json({ error: "Track interaction not found in history." });
    }

    return res.json({
      success: true,
      message: "Track purged from history log.",
    });
  } catch (error) {
    console.error("Error deleting individual history record:", error);
    next(error);
  }
});

// DELETE: Clear All History
router.delete("/history", async (req, res, next) => {
  try {
    await History.update(
      { isDailyEligible: false },
      { where: { userId: req.user.userId } },
    );

    return res.json({
      success: true,
      message: "Daily interaction history cleared.",
    });
  } catch (error) {
    console.error("Error clearing user history log:", error);
    next(error);
  }
});

// POST: Privacy
router.post("/history/purge-privacy", async (req, res, next) => {
  try {
    await History.update(
      { isDailyEligible: false },
      { where: { userId: req.user.userId } },
    );

    return res.json({
      success: true,
      message: "Privacy shield activated. History calculations suspended.",
    });
  } catch (error) {
    console.error("Error executing privacy purge update:", error);
    next(error);
  }
});

module.exports = router;
