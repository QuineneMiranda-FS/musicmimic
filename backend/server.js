const app = require("../frontend/public/src/app");
const db = require("./models");
const PORT = process.env.PORT || 3001;

db.sequelize
  .sync({ alter: true })
  // await sequelize.sync({ force: false });
  .then(() => {
    console.log("Database tables synced successfully.");

    app.listen(PORT, "127.0.0.1", () => {
      console.log(`Server successfully spinning on http://127.0.0.1:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to sync database:", err);
  });
