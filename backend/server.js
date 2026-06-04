require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./models");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/search', searchRoutes);

// Database sync and server initialization
db.sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database tables synced successfully.");
    app.listen(PORT, "127.0.0.1", () => {
      console.log(`Server successfully spinning on http://127.0.0.1:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to sync database:", err);
  });
