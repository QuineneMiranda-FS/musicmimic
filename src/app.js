// Load environment variables immediately at startup
require("dotenv").config();

// Load in Express framework
const express = require("express");

// Import 'path' so directories join correctly
const path = require("path");

// Load global error handler
const { errorHandler } = require("./middleware/errorHandler");

// Create a new Express instance called "app"
const app = express();

// Middleware to parse incoming requests (For forms/APIs)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Tell Express to use EJS as the template engine
app.set("view engine", "ejs");

// Tell Express where templates are (inside src/views)
app.set("views", path.join(__dirname, "views"));

// Automatically load files in public folder (pointing back to root /public)
app.use(express.static(path.join(__dirname, "..", "public")));

// View Routers (Handles rendering HTML/EJS pages)
const viewRouters = require("./routes/views");
app.use("/", viewRouters);

// JSON API Routers (Handles data requests, forms, or AJAX)
const apiRouters = require("./routes/api");
app.use("/api", apiRouters);

// Global Error Handler
app.use(errorHandler);

// EXPORT the app instance so both the server launcher and Jest can use it
module.exports = app;
