const jwt = require("jsonwebtoken");
const Manager = require("../models/Manager.model");
const User = require("../models/User.model");

module.exports = (roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log("decoded",token, roles, decoded);

      let auth;
      if (["ADMIN", "MANAGER"].includes(decoded?.role)) {
        auth = await Manager.findById(decoded?._id).select(
          "_id  managerId name email userName role status isVerified"
        );
      }
      if (decoded?.role === "USER") {
        auth = await User.findById(decoded?._id).select(
          "_id userId name email userName role status isVerified manager"
        );
      }

      if (!auth) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (!roles?.includes(auth?.role) || auth?.status !== "active") {
        return res.status(403).json({ message: "Access denied" });
      }

      req.user = auth;
      next();
    } catch (error) {
      res.status(401).json({ message: "Invalid or expired token" });
    }
  };
};
