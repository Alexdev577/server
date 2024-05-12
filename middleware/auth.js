const jwt = require("jsonwebtoken");

module.exports = (roles) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      //   console.log(token);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // console.log(roles, decoded);

      if (!roles?.includes(decoded?.role) || decoded.status !== "active") {
        return res.status(403).json({ message: "Access denied" });
      }

      req.user = decoded;
      next();
    } catch (error) {
      // handle invalid or expired tokens
      res.status(401).json({ message: "Invalid or expired token" });
    }
  };
};
