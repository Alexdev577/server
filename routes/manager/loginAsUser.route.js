const express = require("express");
const router = express.Router();
const User = require("../../models/User.model");
const jwt = require("jsonwebtoken");
const auth = require("../../middleware/auth");

// manager login as user
router.post("/", auth(["ADMIN", "MANAGER"]), async (req, res) => {
  const { userOid } = req.body;
  try {
    const user = await User.findById(userOid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const access_token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        userName: user.userName,
        name: user.name,
        role: user.role,
        status: user.status,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({ token: access_token });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;
