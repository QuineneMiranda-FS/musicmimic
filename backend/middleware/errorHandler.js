function errorHandler(err, req, res, next) {
  // Logs to backend for debugging
  console.error("--- API ERROR LOG ---");
  console.error(err.stack);
  console.error("---------------------");

  let statusCode = err.statusCode || 500;
  let errorMessage = err.message || "Internal Server Error";

  // Handle Axios network failures
  if (err.isAxiosError && err.response) {
    statusCode = err.response.status;
    // What Spotify says is reason for error
    errorMessage =
      err.response.data?.error_description ||
      err.response.data?.error?.message ||
      `External API Error: ${err.response.statusText}`;
  }

  // Handle Sequelize DB Constraints -unique emails, missing id's
  if (
    err.name === "SequelizeValidationError" ||
    err.name === "SequelizeUniqueConstraintError"
  ) {
    statusCode = 400;
    errorMessage = err.errors.map((e) => e.message).join(", ");
  }

  // Send error to frontend (JSON)
  res.status(statusCode).json({
    status: "error",
    message: errorMessage,
    // Only during dev
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
}

module.exports = errorHandler;
