const express = require("express");
const router = express.Router();

// Test API Endpoint
router.get("/status", (req, res) => {
  res.json({ status: "success", message: "API is online" });
});

module.exports = router;
