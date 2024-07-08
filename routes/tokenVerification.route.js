// require
const express = require("express");
const User = require("../models/User.model");
const Manager = require("../models/Manager.model");
const jwt = require("jsonwebtoken");
const { cleanUrl } = require("../utilities/dataCleaning");
const router = express.Router();

// unexpected get api response
router.get("/", (req, res, next) => {
  if (!cleanUrl(req.originalUrl)) {
    return res.status(400).json({ success: false, message: "Bad request" });
  }
  return res.status(400).json({ success: false, message: "Not applicable" });
});

// new user registration
router.post("/", async (req, res) => {
  const token = req.body.token;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded);

    if (decoded?.role === "ADMIN" || decoded?.role === "MANAGER") {
      const user = await Manager.findById(decoded?._id).select("-password -__v");
      if (!user) {
        return res.status(404).json({ success: false, message: "manager not found" });
      }
      return res.status(200).json({ user, success: true });
    } else {
      const user = await User.findById(decoded?._id).select("-password -__v");
      if (!user) {
        return res.status(404).json({ success: false, message: "user not found" });
      }
      return res.status(200).json({ user, success: true });
    }
  } catch (error) {
    res.status(401).json({ success: false, message: "invalid or expired token!" });
  }
});

module.exports = router;
