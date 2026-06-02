// Load in Express framework
const express = require("express");

// Import 'path' so the template directory joins correctly
const path = require("path");

// Load global error handler
const { errorHandler } = require("./middleware/errorHandler");

// Create a new Express instance called "app"
const app = express();

// Tell Express to use EJS as the template engine
app.set("view engine", "ejs");

// Automatically load files in public folder
app.use(express.static("public"));

// Tell Express where templates are
app.set("views", path.join(__dirname, "views"));

// View Routers
const viewRouters = require("./routers/views");
app.use("/", viewRouters);

// JSON API Routers
const apiRouters = require("./routers/api");

app.use("xxx", apiRouters.xxx);

// Global Error Handler
app.use(errorHandler);

// EXPORT the app instance so both the server launcher and Jest can use
module.exports = app;
