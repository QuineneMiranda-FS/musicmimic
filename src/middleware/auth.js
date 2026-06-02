const { verifyToken } = require("../utils/jwt");

const authenticateJWT = (req, res, next) => {
  // Look for token in HTTP headers
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (decoded) {
      req.user = decoded; // Attach user payload to request object
      return next();
    }
  }

  // If no token or invalid token, reject access
  return res.status(401).json({
    status: "error",
    message: "Unauthorized access. Missing or invalid token.",
  });
};

module.exports = { authenticateJWT };
