const express = require("express");
const router = express.Router();

// Main landing hub router
router.get("/", (req, res) => {
  res.render("index", { title: "Welcome to MusicMimic" });
});

// Results dashboard view router
router.get("/results", (req, res) => {
  res.render("results", { title: "MusicMimic - Results" });
});

module.exports = router;
