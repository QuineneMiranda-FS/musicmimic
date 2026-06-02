// Import app.js
const app = require("./app");

// Set app to listen on port 3001
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Music Mimic running on port ${PORT}`);
});
