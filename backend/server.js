require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./models");

const apiRouter = require("./routes/api");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api", apiRouter);

app.use(errorHandler);

db.sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
  });
});
