const express = require("express");
const router = express.Router();

// Home Page Route
router.get("/", (req, res) => {
  res.render("index", { title: "Welcome to MusicMimic" });
});

module.exports = router;
