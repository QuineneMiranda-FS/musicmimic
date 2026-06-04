const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
  // Look for token in headers
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden access. Token signature is expired or invalid.",
      });
    }
  }

  // If no token
  return res.status(401).json({
    status: "error",
    message: "Unauthorized access. Missing authentication token.",
  });
};

module.exports = { authenticateJWT };
